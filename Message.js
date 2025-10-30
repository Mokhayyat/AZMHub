const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Participants
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message Content
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'video', 'audio', 'system'],
    default: 'text'
  },
  
  // File Attachments
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    contentType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: Date,
  deliveredAt: Date,
  
  // Reply Functionality
  isReply: {
    type: Boolean,
    default: false
  },
  repliedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Edited Messages
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  originalContent: String,
  
  // Deleted Messages
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Forwarding
  isForwarded: {
    type: Boolean,
    default: false
  },
  originalSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Hashtags
  hashtags: [String],
  
  // Encryption
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionKey: String,
  
  // System Messages
  systemMessageType: {
    type: String,
    enum: ['booking_created', 'booking_confirmed', 'booking_cancelled', 'session_started', 'session_ended', 'user_joined', 'user_left', 'payment_completed', 'feedback_submitted'],
    required: function() {
      return this.messageType === 'system';
    }
  },
  systemMessageData: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update updatedAt
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if message is recent (within last 24 hours)
messageSchema.virtual('isRecent').get(function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > twentyFourHoursAgo;
});

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId) {
  if (this.receiver.toString() === userId.toString() && this.status !== 'read') {
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark message as delivered
messageSchema.methods.markAsDelivered = function(userId) {
  if (this.receiver.toString() === userId.toString() && this.status === 'sent') {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from same user
  this.reactions = this.reactions.filter(reaction => reaction.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji,
    reactedAt: new Date()
  });
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => reaction.user.toString() !== userId.toString());
  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent, userId) {
  if (this.sender.toString() !== userId.toString()) {
    throw new Error('Only the sender can edit this message');
  }
  
  this.originalContent = this.content;
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  
  return this.save();
};

// Method to delete message
messageSchema.methods.deleteMessage = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.content = 'This message has been deleted';
  
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50, offset = 0) {
  return this.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ],
    isDeleted: false
  })
  .populate('sender', 'firstName lastName avatar')
  .populate('receiver', 'firstName lastName avatar')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset);
};

// Static method to get unread messages count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiver: userId,
    status: { $in: ['sent', 'delivered'] },
    isDeleted: false
  });
};

// Static method to get recent conversations
messageSchema.statics.getRecentConversations = function(userId, limit = 20) {
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
        isDeleted: false
      }
    },
    {
      $addFields: {
        otherUser: {
          $cond: {
            if: { $eq: ['$sender', userId] },
            then: '$receiver',
            else: '$sender'
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$otherUser',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', userId] },
                  { $eq: ['$status', 'sent'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $project: {
        otherUser: 1,
        lastMessage: 1,
        unreadCount: 1,
        lastMessageTime: '$lastMessage.createdAt'
      }
    },
    {
      $sort: { lastMessageTime: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Index for query performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);