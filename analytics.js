const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Message = require('../models/Message');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get platform overview analytics (admin only)
router.get('/platform-overview', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const periodInDays = parseInt(period.replace('d', ''));
    const startDate = new Date(Date.now() - periodInDays * 24 * 60 * 60 * 1000);

    // User statistics
    const userStats = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ userType: 'student' });
    const totalMentors = await User.countDocuments({ userType: 'mentor', isMentor: true });
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });

    // Booking statistics
    const bookingStats = await Booking.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const totalRevenue = await Booking.aggregate([
      {
        $match: { paymentStatus: 'completed' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Revenue for the period
    const periodRevenue = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Message statistics
    const totalMessages = await Message.countDocuments();
    const periodMessages = await Message.countDocuments({ createdAt: { $gte: startDate } });

    // Top mentors by earnings
    const topMentors = await Booking.aggregate([
      {
        $match: { paymentStatus: 'completed' }
      },
      {
        $group: {
          _id: '$mentor',
          totalEarnings: { $sum: '$totalAmount' },
          sessionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'mentor'
        }
      },
      {
        $unwind: '$mentor'
      },
      {
        $project: {
          mentor: {
            firstName: 1,
            lastName: 1,
            email: 1,
            mentorProfile: 1
          },
          totalEarnings: 1,
          sessionCount: 1
        }
      },
      {
        $sort: { totalEarnings: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Daily activity
    const dailyActivity = await Booking.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'completed'] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalStudents,
        totalMentors,
        newUsers,
        totalBookings,
        completedBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        periodRevenue: periodRevenue[0]?.total || 0,
        totalMessages,
        periodMessages
      },
      userStats: userStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      bookingStats: bookingStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      topMentors,
      dailyActivity
    });
  } catch (error) {
    console.error('Platform overview error:', error);
    res.status(500).json({ error: 'Failed to fetch platform overview' });
  }
});

// Get user analytics (admin or user themselves)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30d' } = req.query;
    
    // Check authorization
    if (req.user.userType !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view these analytics' });
    }

    const periodInDays = parseInt(period.replace('d', ''));
    const startDate = new Date(Date.now() - periodInDays * 24 * 60 * 60 * 1000);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let analytics = {};

    if (user.userType === 'student') {
      // Student analytics
      const bookings = await Booking.find({
        student: userId,
        createdAt: { $gte: startDate }
      });

      const totalSessions = await Booking.countDocuments({
        student: userId,
        status: 'completed'
      });

      const totalSpent = await Booking.aggregate([
        {
          $match: {
            student: mongoose.Types.ObjectId(userId),
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      const averageRating = await Booking.aggregate([
        {
          $match: {
            student: mongoose.Types.ObjectId(userId),
            'feedback.student.rating': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$feedback.student.rating' }
          }
        }
      ]);

      const topMentors = await Booking.aggregate([
        {
          $match: {
            student: mongoose.Types.ObjectId(userId),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$mentor',
            sessionCount: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'mentor'
          }
        },
        {
          $unwind: '$mentor'
        },
        {
          $sort: { sessionCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      analytics = {
        userType: 'student',
        totalSessions,
        totalSpent: totalSpent[0]?.total || 0,
        averageRating: averageRating[0]?.average || 0,
        topMentors,
        recentBookings: bookings.slice(0, 10)
      };
    } else if (user.userType === 'mentor' || user.isMentor) {
      // Mentor analytics
      const sessionStats = await Booking.getSessionStats(userId, 'mentor');

      const totalEarnings = await Booking.aggregate([
        {
          $match: {
            mentor: mongoose.Types.ObjectId(userId),
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      const monthlyEarnings = await Booking.aggregate([
        {
          $match: {
            mentor: mongoose.Types.ObjectId(userId),
            paymentStatus: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            earnings: { $sum: '$totalAmount' },
            sessions: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      const topStudents = await Booking.aggregate([
        {
          $match: {
            mentor: mongoose.Types.ObjectId(userId),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$student',
            sessionCount: { $sum: 1 },
            totalEarnings: { $sum: '$totalAmount' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $unwind: '$student'
        },
        {
          $sort: { sessionCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      analytics = {
        userType: 'mentor',
        sessionStats,
        totalEarnings: totalEarnings[0]?.total || 0,
        monthlyEarnings,
        topStudents
      };
    }

    // Common analytics
    const messagesSent = await Message.countDocuments({
      sender: userId,
      createdAt: { $gte: startDate }
    });

    const messagesReceived = await Message.countDocuments({
      receiver: userId,
      createdAt: { $gte: startDate }
    });

    const loginActivity = await User.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(userId) }
      },
      {
        $project: {
          loginCount: '$activity.loginCount',
          lastLogin: '$activity.lastLogin',
          lastActive: '$activity.lastActive'
        }
      }
    ]);

    res.json({
      ...analytics,
      messagesSent,
      messagesReceived,
      loginActivity: loginActivity[0] || {},
      profileCompletion: user.profileCompletion,
      accountCreated: user.createdAt
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get engagement analytics (admin only)
router.get('/engagement', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const periodInDays = parseInt(period.replace('d', ''));
    const startDate = new Date(Date.now() - periodInDays * 24 * 60 * 60 * 1000);

    // Daily active users
    const dailyActiveUsers = await User.aggregate([
      {
        $match: {
          'activity.lastActive': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$activity.lastActive' },
            month: { $month: '$activity.lastActive' },
            day: { $dayOfMonth: '$activity.lastActive' }
          },
          activeUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Session duration analytics
    const sessionDurations = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$duration',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Most active hours
    const activeHours = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$scheduledDate' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // User retention (simplified calculation)
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    const returningUsers = await User.countDocuments({
      'activity.lastActive': { $gte: startDate },
      createdAt: { $lt: startDate }
    });

    // Feature usage
    const featureUsage = {
      videoCalls: await Booking.countDocuments({
        meetingType: 'video_call',
        createdAt: { $gte: startDate }
      }),
      chatMessages: await Message.countDocuments({
        createdAt: { $gte: startDate }
      }),
      fileShares: await Message.countDocuments({
        messageType: 'file',
        createdAt: { $gte: startDate }
      })
    };

    res.json({
      dailyActiveUsers,
      sessionDurations,
      activeHours,
      userRetention: {
        newUsers,
        returningUsers,
        retentionRate: newUsers > 0 ? (returningUsers / (newUsers + returningUsers)) * 100 : 0
      },
      featureUsage
    });
  } catch (error) {
    console.error('Engagement analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement analytics' });
  }
});

// Get financial analytics (admin only)
router.get('/financial', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const periodInDays = parseInt(period.replace('d', ''));
    const startDate = new Date(Date.now() - periodInDays * 24 * 60 * 60 * 1000);

    // Revenue by month
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          commission: {
            $sum: { $multiply: ['$totalAmount', 0.15] }
          },
          sessionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Revenue by mentor
    const mentorRevenue = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$mentor',
          totalRevenue: { $sum: '$totalAmount' },
          mentorEarnings: {
            $sum: { $multiply: ['$totalAmount', 0.85] }
          },
          platformCommission: {
            $sum: { $multiply: ['$totalAmount', 0.15] }
          },
          sessionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'mentor'
        }
      },
      {
        $unwind: '$mentor'
      },
      {
        $project: {
          mentor: {
            firstName: 1,
            lastName: 1,
            email: 1,
            mentorProfile: 1
          },
          totalRevenue: 1,
          mentorEarnings: 1,
          platformCommission: 1,
          sessionCount: 1
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Payment method distribution
    const paymentMethods = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Subscription revenue
    const subscriptionRevenue = await User.aggregate([
      {
        $match: {
          'subscription.status': 'active',
          'subscription.plan': { $ne: 'free' }
        }
      },
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average session value
    const avgSessionValue = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgValue: { $avg: '$totalAmount' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json({
      monthlyRevenue,
      mentorRevenue,
      paymentMethods,
      subscriptionRevenue,
      avgSessionValue: avgSessionValue[0] || { avgValue: 0, avgDuration: 0 },
      totalCommission: mentorRevenue.reduce((sum, mentor) => sum + mentor.platformCommission, 0),
      totalMentorEarnings: mentorRevenue.reduce((sum, mentor) => sum + mentor.mentorEarnings, 0)
    });
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
});

// Export analytics data (admin only)
router.get('/export', adminAuth, async (req, res) => {
  try {
    const { type = 'users', format = 'json' } = req.query;
    
    let data;
    let filename;

    switch (type) {
      case 'users':
        data = await User.find({}).select('-password -emailVerificationToken -passwordResetToken');
        filename = 'users-export.json';
        break;
      
      case 'bookings':
        data = await Booking.find({})
          .populate('student', 'firstName lastName email')
          .populate('mentor', 'firstName lastName email mentorProfile.title');
        filename = 'bookings-export.json';
        break;
      
      case 'messages':
        data = await Message.find({})
          .populate('sender', 'firstName lastName email')
          .populate('receiver', 'firstName lastName email');
        filename = 'messages-export.json';
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Convert to CSV (simplified implementation)
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.json(data);
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;