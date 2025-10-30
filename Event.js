const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  category: {
    type: String,
    required: true,
    enum: ['workshop', 'networking', 'padel', 'webinar', 'conference', 'mentorship']
  },
  type: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: 'offline'
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  location: {
    venue: String,
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  onlineDetails: {
    platform: String,
    meetingUrl: String,
    meetingId: String,
    password: String
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor'
  }],
  maxAttendees: {
    type: Number,
    required: true,
    min: 1
  },
  registeredAttendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'checked-in', 'cancelled'],
      default: 'registered'
    }
  }],
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  image: String,
  agenda: [{
    time: String,
    title: String,
    description: String,
    speaker: String
  }],
  requirements: [String],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  feedback: [{
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    wouldAttendAgain: Boolean
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);