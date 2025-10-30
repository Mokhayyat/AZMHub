const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth, studentAuth, mentorAuth } = require('../middleware/auth');
const router = express.Router();

// Create booking
router.post('/', studentAuth, async (req, res) => {
  try {
    const {
      mentorId,
      sessionType,
      title,
      description,
      scheduledDate,
      duration,
      timezone,
      hourlyRate,
      meetingType = 'video_call'
    } = req.body;

    // Validate mentor
    const mentor = await User.findOne({ 
      _id: mentorId, 
      isMentor: true, 
      isActive: true 
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Calculate total amount
    const totalAmount = (hourlyRate * duration) / 60;

    // Create booking
    const booking = new Booking({
      student: req.user.id,
      mentor: mentorId,
      sessionType,
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      duration,
      timezone,
      hourlyRate,
      totalAmount,
      meetingType
    });

    await booking.save();

    // Populate mentor and student info
    await booking.populate('student', 'firstName lastName avatar');
    await booking.populate('mentor', 'firstName lastName avatar mentorProfile');

    // Send notification to mentor
    const io = req.app.get('io');
    const mentorSocketId = getUserSocketId(mentorId);
    
    if (mentorSocketId) {
      io.to(mentorSocketId).emit('new-booking', {
        booking,
        student: req.user
      });
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {
      $or: [{ student: req.user.id }, { mentor: req.user.id }]
    };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('student', 'firstName lastName avatar')
      .populate('mentor', 'firstName lastName avatar mentorProfile')
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalCount = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get specific booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('student', 'firstName lastName avatar')
      .populate('mentor', 'firstName lastName avatar mentorProfile');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (booking.student._id.toString() !== req.user.id && 
        booking.mentor._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Update booking (mentor only for confirmation)
router.put('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.mentor.toString() !== req.user.id && 
        booking.student.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this booking' });
    }

    const updates = req.body;
    const allowedUpdates = [
      'status', 'preSessionNotes', 'agenda', 'goals', 'meetingUrl', 'meetingId'
    ];

    // Filter allowed updates
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Special handling for status updates
    if (updates.status) {
      if (updates.status === 'confirmed' && booking.mentor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Only mentor can confirm bookings' });
      }
      
      booking.status = updates.status;
      
      // Set meeting URL for confirmed bookings
      if (updates.status === 'confirmed' && !booking.meetingUrl) {
        booking.meetingUrl = generateMeetingUrl(booking._id);
        booking.meetingId = generateMeetingId(booking._id);
      }
    }

    // Update other fields
    Object.assign(booking, filteredUpdates);
    await booking.save();

    // Populate for response
    await booking.populate('student', 'firstName lastName avatar');
    await booking.populate('mentor', 'firstName lastName avatar mentorProfile');

    // Send notification
    const io = req.app.get('io');
    const otherUserId = booking.student.toString() === req.user.id ? booking.mentor : booking.student;
    const otherUserSocketId = getUserSocketId(otherUserId);
    
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('booking-updated', {
        booking,
        updatedBy: req.user
      });
    }

    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.student.toString() !== req.user.id && 
        booking.mentor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }

    // Check if booking can be cancelled (at least 24 hours before)
    const timeDiff = booking.scheduledDate.getTime() - Date.now();
    if (timeDiff < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ 
        error: 'Bookings can only be cancelled at least 24 hours before the scheduled time' 
      });
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: req.user.id,
      reason,
      cancelledAt: new Date()
    };

    await booking.save();

    // Process refund if payment was completed
    if (booking.paymentStatus === 'completed') {
      // Trigger refund process
      booking.cancellation.refundAmount = booking.totalAmount;
      booking.cancellation.refundStatus = 'pending';
      await booking.save();
    }

    // Send notification
    const io = req.app.get('io');
    const otherUserId = booking.student.toString() === req.user.id ? booking.mentor : booking.student;
    const otherUserSocketId = getUserSocketId(otherUserId);
    
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('booking-cancelled', {
        booking,
        cancelledBy: req.user
      });
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Reschedule booking
router.put('/:id/reschedule', auth, async (req, res) => {
  try {
    const { newDate, reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.student.toString() !== req.user.id && 
        booking.mentor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to reschedule this booking' });
    }

    // Check if booking can be rescheduled (at least 24 hours before)
    const timeDiff = booking.scheduledDate.getTime() - Date.now();
    if (timeDiff < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ 
        error: 'Bookings can only be rescheduled at least 24 hours before the scheduled time' 
      });
    }

    // Store original date
    booking.rescheduling = {
      originalDate: booking.scheduledDate,
      rescheduledBy: req.user.id,
      reason,
      rescheduledAt: new Date()
    };

    // Update scheduled date
    booking.scheduledDate = new Date(newDate);
    await booking.save();

    // Send notification
    const io = req.app.get('io');
    const otherUserId = booking.student.toString() === req.user.id ? booking.mentor : booking.student;
    const otherUserSocketId = getUserSocketId(otherUserId);
    
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('booking-rescheduled', {
        booking,
        rescheduledBy: req.user
      });
    }

    res.json({
      message: 'Booking rescheduled successfully',
      booking
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
});

// Add feedback
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is authorized to add feedback
    if (booking.student.toString() !== req.user.id && 
        booking.mentor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to add feedback for this booking' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only add feedback for completed sessions' });
    }

    const feedbackType = booking.student.toString() === req.user.id ? 'student' : 'mentor';
    const feedback = req.body;

    await booking.addFeedback(feedbackType, feedback);

    res.json({
      message: 'Feedback added successfully',
      feedback: booking.feedback
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  }
});

// Start session
router.put('/:id/start-session', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.mentor.toString() !== req.user.id && 
        booking.student.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to start this session' });
    }

    // Check if session can be started (within 15 minutes of scheduled time)
    const timeDiff = Math.abs(booking.scheduledDate.getTime() - Date.now());
    if (timeDiff > 15 * 60 * 1000) {
      return res.status(400).json({ 
        error: 'Session can only be started within 15 minutes of the scheduled time' 
      });
    }

    booking.status = 'in_progress';
    await booking.save();

    // Generate meeting URL if not exists
    if (!booking.meetingUrl) {
      booking.meetingUrl = generateMeetingUrl(booking._id);
      booking.meetingId = generateMeetingId(booking._id);
      await booking.save();
    }

    res.json({
      message: 'Session started successfully',
      meetingUrl: booking.meetingUrl,
      meetingId: booking.meetingId
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End session
router.put('/:id/end-session', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.mentor.toString() !== req.user.id && 
        booking.student.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to end this session' });
    }

    // Check if session is in progress
    if (booking.status !== 'in_progress') {
      return res.status(400).json({ error: 'Session is not in progress' });
    }

    booking.status = 'completed';
    await booking.save();

    // Send notification
    const io = req.app.get('io');
    const otherUserId = booking.student.toString() === req.user.id ? booking.mentor : booking.student;
    const otherUserSocketId = getUserSocketId(otherUserId);
    
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('session-ended', {
        booking,
        endedBy: req.user
      });
    }

    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Helper functions
function generateMeetingUrl(bookingId) {
  return `${process.env.FRONTEND_URL}/session/${bookingId}`;
}

function generateMeetingId(bookingId) {
  return `AZM-${bookingId.toString().slice(-6).toUpperCase()}`;
}

// Helper functions for socket notifications
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

module.exports = router;
module.exports.getUserSocketId = getUserSocketId;
module.exports.setUserSocketId = setUserSocketId;
module.exports.removeUserSocketId = removeUserSocketId;