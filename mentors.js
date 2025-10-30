const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all mentors with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      expertise,
      industry,
      minRating,
      maxPrice,
      availability,
      search,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { isMentor: true, isActive: true };

    // Expertise filter
    if (expertise) {
      const expertiseArray = expertise.split(',');
      query['mentorProfile.expertise'] = { $in: expertiseArray };
    }

    // Industry filter
    if (industry) {
      query['mentorProfile.industry'] = industry;
    }

    // Rating filter
    if (minRating) {
      query['mentorProfile.rating.average'] = { $gte: parseFloat(minRating) };
    }

    // Price filter
    if (maxPrice) {
      query['mentorProfile.hourlyRate'] = { $lte: parseFloat(maxPrice) };
    }

    // Availability filter
    if (availability === 'online') {
      query['activity.onlineStatus'] = { $in: ['online', 'away'] };
    }

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'mentorProfile.title': { $regex: search, $options: 'i' } },
        { 'mentorProfile.company': { $regex: search, $options: 'i' } },
        { 'mentorProfile.expertise': { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    let sortConfig = {};
    switch (sortBy) {
      case 'rating':
        sortConfig['mentorProfile.rating.average'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'price':
        sortConfig['mentorProfile.hourlyRate'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'experience':
        sortConfig['mentorProfile.experienceYears'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'name':
        sortConfig.firstName = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortConfig['mentorProfile.rating.average'] = -1;
    }

    // Execute query
    const mentors = await User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const totalCount = await User.countDocuments(query);

    res.json({
      mentors,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

// Get mentor by ID
router.get('/:id', async (req, res) => {
  try {
    const mentor = await User.findOne({ 
      _id: req.params.id, 
      isMentor: true, 
      isActive: true 
    })
    .select('-password -emailVerificationToken -passwordResetToken')
    .populate('content.blogPosts', 'title slug createdAt')
    .populate('content.podcasts', 'title slug duration createdAt')
    .populate('content.resources', 'title type createdAt');

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Get recent reviews
    const recentReviews = await Booking.find({
      mentor: mentor._id,
      'feedback.student.review': { $exists: true, $ne: '' }
    })
    .populate('student', 'firstName lastName avatar')
    .select('feedback.student createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

    // Get session statistics
    const sessionStats = await Booking.getSessionStats(mentor._id, 'mentor');

    res.json({
      mentor,
      recentReviews,
      sessionStats
    });
  } catch (error) {
    console.error('Get mentor error:', error);
    res.status(500).json({ error: 'Failed to fetch mentor' });
  }
});

// Get mentor availability
router.get('/:id/availability', async (req, res) => {
  try {
    const mentor = await User.findOne({ 
      _id: req.params.id, 
      isMentor: true, 
      isActive: true 
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Get existing bookings for the date
    const existingBookings = await Booking.find({
      mentor: mentor._id,
      scheduledDate: {
        $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    const bookedSlots = existingBookings.map(booking => ({
      startTime: booking.scheduledDate,
      endTime: new Date(booking.scheduledDate.getTime() + booking.duration * 60 * 1000)
    }));

    res.json({
      mentorId: mentor._id,
      availability: mentor.mentorProfile.availability,
      bookedSlots,
      timezone: mentor.preferences.timezone
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update mentor profile (mentor only)
router.put('/profile', auth, [
  body('title').optional().trim(),
  body('company').optional().trim(),
  body('industry').optional().trim(),
  body('experienceYears').optional().isNumeric(),
  body('hourlyRate').optional().isNumeric(),
  body('bio').optional().trim().isLength({ max: 2000 }),
  body('expertise').optional().isArray(),
  body('languages').optional().isArray(),
  body('sessionTypes').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is a mentor
    if (!req.user.isMentor && req.user.userType !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can update mentor profiles' });
    }

    const updates = req.body;
    const user = await User.findById(req.user.id);

    // Update mentor profile fields
    if (updates.title) user.mentorProfile.title = updates.title;
    if (updates.company) user.mentorProfile.company = updates.company;
    if (updates.industry) user.mentorProfile.industry = updates.industry;
    if (updates.experienceYears) user.mentorProfile.experienceYears = updates.experienceYears;
    if (updates.hourlyRate) user.mentorProfile.hourlyRate = updates.hourlyRate;
    if (updates.bio) user.mentorProfile.bio = updates.bio;
    if (updates.expertise) user.mentorProfile.expertise = updates.expertise;
    if (updates.languages) user.mentorProfile.languages = updates.languages;
    if (updates.sessionTypes) user.mentorProfile.sessionTypes = updates.sessionTypes;
    if (updates.linkedinUrl) user.mentorProfile.linkedinUrl = updates.linkedinUrl;
    if (updates.website) user.mentorProfile.website = updates.website;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      mentor: {
        id: user._id,
        mentorProfile: user.mentorProfile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update mentor availability (mentor only)
router.put('/availability', auth, async (req, res) => {
  try {
    // Check if user is a mentor
    if (!req.user.isMentor && req.user.userType !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can update availability' });
    }

    const { availability } = req.body;
    
    const user = await User.findById(req.user.id);
    user.mentorProfile.availability = availability;
    await user.save();

    res.json({
      message: 'Availability updated successfully',
      availability: user.mentorProfile.availability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Get mentor dashboard data (mentor only)
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (!req.user.isMentor && req.user.userType !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can access dashboard' });
    }

    const userId = req.user.id;

    // Get session statistics
    const sessionStats = await Booking.getSessionStats(userId, 'mentor');

    // Get upcoming sessions
    const upcomingSessions = await Booking.findUpcomingSessions(userId, 'mentor', 5);

    // Get recent bookings
    const recentBookings = await Booking.find({
      mentor: userId,
      status: { $in: ['scheduled', 'confirmed', 'completed'] }
    })
    .populate('student', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get monthly earnings
    const monthlyEarnings = await Booking.aggregate([
      {
        $match: {
          mentor: mongoose.Types.ObjectId(userId),
          paymentStatus: 'completed',
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalEarnings: { $sum: '$totalAmount' },
          sessionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    // Get rating trends
    const ratingTrends = await Booking.aggregate([
      {
        $match: {
          mentor: mongoose.Types.ObjectId(userId),
          'feedback.student.rating': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          averageRating: { $avg: '$feedback.student.rating' },
          ratingCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    res.json({
      sessionStats,
      upcomingSessions,
      recentBookings,
      monthlyEarnings,
      ratingTrends
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get mentor reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Booking.find({
      mentor: req.params.id,
      'feedback.student.review': { $exists: true, $ne: '' },
      status: 'completed'
    })
    .populate('student', 'firstName lastName avatar')
    .select('feedback.student createdAt sessionType')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalCount = await Booking.countDocuments({
      mentor: req.params.id,
      'feedback.student.review': { $exists: true, $ne: '' },
      status: 'completed'
    });

    res.json({
      reviews,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Toggle mentor favorite (student only)
router.post('/:id/toggle-favorite', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({ error: 'Only students can favorite mentors' });
    }

    const mentorId = req.params.id;
    const user = await User.findById(req.user.id);

    // Check if mentor exists and is active
    const mentor = await User.findOne({ _id: mentorId, isMentor: true, isActive: true });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const isFavorited = user.favorites.includes(mentorId);

    if (isFavorited) {
      await user.removeFavorite(mentorId);
      res.json({ message: 'Mentor removed from favorites', isFavorited: false });
    } else {
      await user.addFavorite(mentorId);
      res.json({ message: 'Mentor added to favorites', isFavorited: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Get student's favorite mentors (student only)
router.get('/favorites', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({ error: 'Only students can view favorites' });
    }

    const user = await User.findById(req.user.id)
      .populate({
        path: 'favorites',
        select: '-password -emailVerificationToken -passwordResetToken',
        match: { isActive: true, isMentor: true }
      });

    res.json({ favorites: user.favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

module.exports = router;