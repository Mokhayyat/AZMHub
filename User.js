const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.socialLogin;
    }
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  location: {
    city: String,
    country: String,
    timezone: String
  },
  
  // User Type & Role
  userType: {
    type: String,
    enum: ['student', 'mentor', 'admin'],
    default: 'student'
  },
  isMentor: {
    type: Boolean,
    default: false
  },
  
  // Social Login
  socialLogin: {
    provider: String, // 'google', 'linkedin', 'facebook'
    providerId: String
  },
  
  // Student Specific Fields
  studentProfile: {
    careerGoals: [String],
    skills: [String],
    industry: String,
    learningStyle: String,
    experienceLevel: String,
    education: {
      institution: String,
      degree: String,
      fieldOfStudy: String,
      graduationYear: Number
    },
    availability: [String],
    preferredSessionLength: Number,
    budgetRange: {
      min: Number,
      max: Number
    }
  },
  
  // Mentor Specific Fields
  mentorProfile: {
    title: String,
    company: String,
    industry: String,
    expertise: [String],
    experienceYears: Number,
    hourlyRate: Number,
    languages: [String],
    sessionTypes: [String],
    availability: {
      type: Map,
      of: [String]
    },
    bio: String,
    linkedinUrl: String,
    website: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDocuments: [String],
    rating: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  
  // Preferences & Settings
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      bookingReminders: {
        type: Boolean,
        default: true
      },
      messageNotifications: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'mentors_only', 'private'],
        default: 'public'
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      showLocation: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Activity & Analytics
  activity: {
    lastLogin: Date,
    lastActive: Date,
    onlineStatus: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'offline'
    },
    loginCount: {
      type: Number,
      default: 0
    },
    sessionCount: {
      type: Number,
      default: 0
    }
  },
  
  // Favorites & Connections
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  connections: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Content & Contributions
  content: {
    blogPosts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogPost'
    }],
    podcasts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Podcast'
    }],
    resources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    }]
  },
  
  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  const totalFields = 10;
  
  if (this.firstName && this.lastName) completion++;
  if (this.email) completion++;
  if (this.avatar) completion++;
  if (this.bio) completion++;
  if (this.location.city && this.location.country) completion++;
  
  if (this.userType === 'student') {
    if (this.studentProfile.careerGoals.length > 0) completion++;
    if (this.studentProfile.skills.length > 0) completion++;
    if (this.studentProfile.industry) completion++;
  }
  
  if (this.userType === 'mentor' || this.isMentor) {
    if (this.mentorProfile.title) completion++;
    if (this.mentorProfile.company) completion++;
    if (this.mentorProfile.expertise.length > 0) completion++;
    if (this.mentorProfile.bio) completion++;
  }
  
  return Math.round((completion / totalFields) * 100);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    userType: this.userType,
    isMentor: this.isMentor
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Method to update online status
userSchema.methods.updateOnlineStatus = function(status) {
  this.activity.onlineStatus = status;
  this.activity.lastActive = new Date();
  
  if (status === 'online') {
    this.activity.lastLogin = new Date();
    this.activity.loginCount += 1;
  }
  
  return this.save();
};

// Method to add favorite mentor
userSchema.methods.addFavorite = function(mentorId) {
  if (!this.favorites.includes(mentorId)) {
    this.favorites.push(mentorId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove favorite mentor
userSchema.methods.removeFavorite = function(mentorId) {
  this.favorites = this.favorites.filter(id => id.toString() !== mentorId.toString());
  return this.save();
};

// Static method to find mentors by expertise
userSchema.statics.findMentorsByExpertise = function(expertise) {
  return this.find({ 
    isMentor: true, 
    isActive: true,
    'mentorProfile.expertise': { $in: expertise }
  }).sort({ 'mentorProfile.rating.average': -1 });
};

// Static method to find available mentors
userSchema.statics.findAvailableMentors = function() {
  return this.find({ 
    isMentor: true, 
    isActive: true,
    'activity.onlineStatus': { $in: ['online', 'away'] }
  }).limit(20);
};

// Index for search performance
userSchema.index({ email: 1 });
userSchema.index({ 'mentorProfile.expertise': 1 });
userSchema.index({ 'mentorProfile.industry': 1 });
userSchema.index({ 'activity.onlineStatus': 1 });
userSchema.index({ 'mentorProfile.rating.average': -1 });

module.exports = mongoose.model('User', userSchema);