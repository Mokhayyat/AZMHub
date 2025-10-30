const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Basic Information
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Session Details
  sessionType: {
    type: String,
    required: true,
    enum: ['career_advice', 'skill_development', 'portfolio_review', 'interview_prep', 'business_strategy', 'leadership', 'technical_mentoring', 'other']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Timing
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    enum: [30, 45, 60, 90, 120], // minutes
    default: 60
  },
  timezone: {
    type: String,
    required: true
  },
  
  // Pricing
  hourlyRate: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'apple_pay', 'google_pay']
  },
  paymentIntentId: String, // Stripe payment intent ID
  
  // Session Status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    default: 'scheduled'
  },
  
  // Meeting Details
  meetingType: {
    type: String,
    enum: ['video_call', 'phone_call', 'in_person', 'chat'],
    default: 'video_call'
  },
  meetingUrl: String, // For video calls
  meetingId: String, // Unique meeting ID
  
  // Pre-session
  preSessionNotes: {
    student: String,
    mentor: String
  },
  agenda: [String],
  goals: [String],
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Session Recording
  isRecorded: {
    type: Boolean,
    default: false
  },
  recordingUrl: String,
  recordingDuration: Number,
  
  // Post-session
  feedback: {
    student: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      wouldRecommend: Boolean,
      skillsImproved: [String],
      overallSatisfaction: {
        type: Number,
        min: 1,
        max: 10
      }
    },
    mentor: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      studentEngagement: {
        type: Number,
        min: 1,
        max: 10
      },
      preparedness: {
        type: Number,
        min: 1,
        max: 10
      }
    }
  },
  
  sessionNotes: {
    type: String,
    maxlength: 5000
  },
  
  actionItems: [{
    description: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  
  followUpScheduled: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  
  // Cancellation/Rescheduling
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    cancelledAt: Date,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    }
  },
  
  rescheduling: {
    originalDate: Date,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    rescheduledAt: Date
  },
  
  // System Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  remindersSent: {
    twentyFourHours: {
      type: Boolean,
      default: false
    },
    oneHour: {
      type: Boolean,
      default: false
    },
    fifteenMinutes: {
      type: Boolean,
      default: false
    }
  }
});

// Pre-save middleware to update updatedAt
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if session is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
  return this.scheduledDate > new Date() && this.status === 'confirmed';
});

// Virtual for checking if session is past
bookingSchema.virtual('isPast').get(function() {
  return this.scheduledDate < new Date();
});

// Virtual for session start and end times
bookingSchema.virtual('startTime').get(function() {
  return this.scheduledDate;
});

bookingSchema.virtual('endTime').get(function() {
  return new Date(this.scheduledDate.getTime() + (this.duration * 60 * 1000));
});

// Method to update status
bookingSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  
  // Log status change
  if (!this.statusHistory) {
    this.statusHistory = [];
  }
  
  this.statusHistory.push({
    status: newStatus,
    updatedBy: updatedBy,
    updatedAt: new Date()
  });
  
  return this.save();
};

// Method to add feedback
bookingSchema.methods.addFeedback = function(feedbackType, feedbackData) {
  this.feedback[feedbackType] = { ...this.feedback[feedbackType], ...feedbackData };
  
  // Update mentor rating if student feedback
  if (feedbackType === 'student' && feedbackData.rating) {
    this.updateMentorRating(feedbackData.rating);
  }
  
  return this.save();
};

// Method to update mentor rating
bookingSchema.methods.updateMentorRating = async function(rating) {
  try {
    const Mentor = mongoose.model('User');
    const mentor = await Mentor.findById(this.mentor);
    
    if (mentor && mentor.mentorProfile) {
      const currentRating = mentor.mentorProfile.rating;
      const newCount = currentRating.count + 1;
      const newAverage = ((currentRating.average * currentRating.count) + rating) / newCount;
      
      mentor.mentorProfile.rating = {
        average: Math.round(newAverage * 10) / 10,
        count: newCount
      };
      
      await mentor.save();
    }
  } catch (error) {
    console.error('Error updating mentor rating:', error);
  }
};

// Static method to find upcoming sessions
bookingSchema.statics.findUpcomingSessions = function(userId, limit = 10) {
  return this.find({
    $or: [{ student: userId }, { mentor: userId }],
    scheduledDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  })
  .populate('student', 'firstName lastName avatar')
  .populate('mentor', 'firstName lastName avatar mentorProfile.title mentorProfile.company')
  .sort({ scheduledDate: 1 })
  .limit(limit);
};

// Static method to find past sessions
bookingSchema.statics.findPastSessions = function(userId, limit = 10) {
  return this.find({
    $or: [{ student: userId }, { mentor: userId }],
    scheduledDate: { $lt: new Date() },
    status: 'completed'
  })
  .populate('student', 'firstName lastName avatar')
  .populate('mentor', 'firstName lastName avatar mentorProfile.title mentorProfile.company')
  .sort({ scheduledDate: -1 })
  .limit(limit);
};

// Static method to get session statistics
bookingSchema.statics.getSessionStats = async function(userId, userType) {
  const matchField = userType === 'student' ? 'student' : 'mentor';
  
  const stats = await this.aggregate([
    { $match: { [matchField]: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        upcomingSessions: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'confirmed'] },
                  { $gt: ['$scheduledDate', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalHours: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$duration', 0]
          }
        },
        averageRating: { $avg: '$feedback.student.rating' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalHours: 0,
    averageRating: 0
  };
};

// Index for query performance
bookingSchema.index({ student: 1, scheduledDate: 1 });
bookingSchema.index({ mentor: 1, scheduledDate: 1 });
bookingSchema.index({ scheduledDate: 1, status: 1 });
bookingSchema.index({ 'feedback.student.rating': 1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);