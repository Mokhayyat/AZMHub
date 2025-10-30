const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const conversations = await Message.getRecentConversations(
      req.user.id, 
      parseInt(limit)
    );

    res.json({
      conversations,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversation with specific user
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const { userId } = req.params;

    // Check if the other user exists
    const otherUser = await User.findById(userId).select('firstName lastName avatar activity.onlineStatus');
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get messages
    const messages = await Message.getConversation(
      req.user.id,
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user.id,
        status: { $in: ['sent', 'delivered'] }
      },
      { status: 'read', readAt: new Date() }
    );

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      otherUser,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', attachments } = req.body;

    // Validate input
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Check if receiver is active
    if (!receiver.isActive) {
      return res.status(400).json({ error: 'Cannot send message to inactive user' });
    }

    // Create message
    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      content,
      messageType,
      attachments: attachments || []
    });

    await message.save();

    // Populate sender and receiver info
    await message.populate('sender', 'firstName lastName avatar');
    await message.populate('receiver', 'firstName lastName avatar');

    // Send real-time notification if receiver is online
    const io = req.app.get('io');
    const receiverSocketId = getUserSocketId(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-message', {
        message,
        sender: req.user
      });

      // Send unread count update
      const unreadCount = await Message.getUnreadCount(receiverId);
      io.to(receiverSocketId).emit('unread-count-update', unreadCount);
    }

    res.json({
      message: 'Message sent successfully',
      message: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send system message (for bookings, etc.)
router.post('/system-message', auth, async (req, res) => {
  try {
    const { receiverId, systemMessageType, systemMessageData } = req.body;

    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      content: generateSystemMessageContent(systemMessageType, systemMessageData),
      messageType: 'system',
      systemMessageType,
      systemMessageData
    });

    await message.save();

    // Send real-time notification
    const io = req.app.get('io');
    const receiverSocketId = getUserSocketId(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-message', { message });
    }

    res.json({ message: 'System message sent successfully' });
  } catch (error) {
    console.error('Send system message error:', error);
    res.status(500).json({ error: 'Failed to send system message' });
  }
});

// Edit message
router.put('/edit/:messageId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the sender can edit this message' });
    }

    // Check if message is too old to edit (24 hours)
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Message is too old to edit' });
    }

    await message.editMessage(content, req.user.id);

    // Send real-time update
    const io = req.app.get('io');
    const receiverSocketId = getUserSocketId(message.receiver);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message-edited', { message });
    }

    res.json({ message: 'Message edited successfully', message });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete message
router.delete('/delete/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the sender can delete this message' });
    }

    await message.deleteMessage(req.user.id);

    // Send real-time update
    const io = req.app.get('io');
    const receiverSocketId = getUserSocketId(message.receiver);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message-deleted', { messageId: message._id });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Add reaction to message
router.post('/react/:messageId', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is a participant in the conversation
    if (message.sender.toString() !== req.user.id && message.receiver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only react to messages in your conversations' });
    }

    await message.addReaction(req.user.id, emoji);

    // Send real-time update
    const io = req.app.get('io');
    const otherUserId = message.sender.toString() === req.user.id ? message.receiver : message.sender;
    const otherUserSocketId = getUserSocketId(otherUserId);
    
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('reaction-added', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.json({ message: 'Reaction added successfully', reactions: message.reactions });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from message
router.delete('/react/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.removeReaction(req.user.id);

    // Send real-time update
    const io = req.app.get('io');
    const otherUserId = message.sender.toString() === req.user.id ? message.receiver : message.sender;
    const otherUserSocketId = getUserSocketId(otherUserId);
    
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('reaction-removed', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.json({ message: 'Reaction removed successfully', reactions: message.reactions });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Mark messages as read
router.post('/mark-as-read', auth, async (req, res) => {
  try {
    const { senderId } = req.body;

    const result = await Message.updateMany(
      {
        sender: senderId,
        receiver: req.user.id,
        status: { $in: ['sent', 'delivered'] }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread messages count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.getUnreadCount(req.user.id);
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Search messages
router.get('/search', auth, async (req, res) => {
  try {
    const { query, userId, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let searchQuery = {
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ],
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    };

    if (userId) {
      searchQuery.$or = [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ];
    }

    const messages = await Message.find(searchQuery)
      .populate('sender', 'firstName lastName avatar')
      .populate('receiver', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ messages, query });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// Upload file for chat
router.post('/upload-file', auth, async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size too large (max 10MB)' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Create message with file attachment
    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      content: `File: ${req.file.originalname}`,
      messageType: 'file',
      attachments: [{
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: req.file.path,
        size: req.file.size,
        contentType: req.file.mimetype
      }]
    });

    await message.save();

    // Populate sender and receiver info
    await message.populate('sender', 'firstName lastName avatar');
    await message.populate('receiver', 'firstName lastName avatar');

    // Send real-time notification
    const io = req.app.get('io');
    const receiverSocketId = getUserSocketId(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-message', {
        message,
        sender: req.user
      });
    }

    res.json({
      message: 'File uploaded and message sent successfully',
      message: message
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Helper functions
function generateSystemMessageContent(type, data) {
  switch (type) {
    case 'booking_created':
      return `New booking created for ${data.sessionType} session on ${data.date}`;
    case 'booking_confirmed':
      return `Booking confirmed for ${data.sessionType} session on ${data.date}`;
    case 'booking_cancelled':
      return `Booking cancelled for ${data.sessionType} session on ${data.date}`;
    case 'session_started':
      return 'Session has started';
    case 'session_ended':
      return 'Session has ended';
    case 'payment_completed':
      return `Payment of $${data.amount} completed successfully`;
    case 'feedback_submitted':
      return 'Feedback has been submitted for the session';
    default:
      return 'System notification';
  }
}

// In-memory store for user socket IDs (in production, use Redis)
const userSocketMap = new Map();

function getUserSocketId(userId) {
  return userSocketMap.get(userId.toString());
}

function setUserSocketId(userId, socketId) {
  userSocketMap.set(userId.toString(), socketId);
}

function removeUserSocketId(userId) {
  userSocketMap.delete(userId.toString());
}

// Export functions for use in socket handlers
module.exports = router;
module.exports.getUserSocketId = getUserSocketId;
module.exports.setUserSocketId = setUserSocketId;
module.exports.removeUserSocketId = removeUserSocketId;