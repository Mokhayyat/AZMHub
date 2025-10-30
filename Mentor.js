const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Professional title is required']
  },
  company: {
    type: String,
    required: [true, 'Company is required']
  },
  expertise: {
    type: [String],
    required: [true, 'Areas of expertise are required'],
    enum: ['tech', 'business', 'design', 'marketing', 'finance', 'entrepreneurship', 'leadership']
  },
  experience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [1, 'Experience must be at least 1 year']
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'Session price is required'],
    min: [0, 'Price cannot be negative']
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  languages: [String],
  sessionTypes: [String],
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  responseTime: String,
  calendar: [{
    date: Date,
    slots: [{
      time: String,
      available: Boolean,
      bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Mentor', mentorSchema);