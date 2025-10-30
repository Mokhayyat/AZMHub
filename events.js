const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// In-memory events storage (in production, use database)
let events = [
  {
    id: '1',
    title: 'Padel Tournament - Beginner Level',
    description: 'Join our monthly padel tournament for beginners. Great opportunity to network and have fun!',
    type: 'tournament',
    date: '2024-12-15',
    time: '14:00',
    duration: 180,
    location: 'Downtown Padel Courts',
    maxParticipants: 16,
    currentParticipants: 12,
    price: 25,
    image: 'resources/event-padel.jpg',
    mentors: ['Sarah Chen', 'Marcus Rodriguez'],
    tags: ['padel', 'sports', 'networking', 'beginner'],
    requirements: ['Basic padel experience', 'Sportswear', 'Water bottle'],
    status: 'open'
  },
  {
    id: '2',
    title: 'Startup Pitch Workshop',
    description: 'Learn how to perfect your startup pitch from experienced entrepreneurs and investors.',
    type: 'workshop',
    date: '2024-12-18',
    time: '10:00',
    duration: 240,
    location: 'Innovation Hub',
    maxParticipants: 30,
    currentParticipants: 18,
    price: 75,
    image: 'resources/event-workshop.jpg',
    mentors: ['Lisa Thompson', 'James Wilson'],
    tags: ['startup', 'pitch', 'entrepreneurship', 'funding'],
    requirements: ['Business idea or existing startup', 'Laptop'],
    status: 'open'
  },
  {
    id: '3',
    title: 'Tech Industry Networking Night',
    description: 'Connect with tech professionals, learn about industry trends, and expand your network.',
    type: 'networking',
    date: '2024-12-20',
    time: '18:00',
    duration: 180,
    location: 'Tech Campus Auditorium',
    maxParticipants: 100,
    currentParticipants: 45,
    price: 35,
    image: 'resources/event-networking.jpg',
    mentors: ['Alex Johnson', 'Sophia Martinez', 'Kevin Zhang'],
    tags: ['tech', 'networking', 'career', 'industry'],
    requirements: ['Business cards', 'Professional attire'],
    status: 'open'
  },
  {
    id: '4',
    title: 'AI/ML Career Development Workshop',
    description: 'Deep dive into AI/ML career paths with industry experts from top tech companies.',
    type: 'workshop',
    date: '2024-12-22',
    time: '09:00',
    duration: 360,
    location: 'University Tech Center',
    maxParticipants: 25,
    currentParticipants: 22,
    price: 120,
    image: 'resources/event-ai-workshop.jpg',
    mentors: ['Kevin Zhang', 'Sophia Martinez'],
    tags: ['AI', 'machine learning', 'career', 'development'],
    requirements: ['Basic programming knowledge', 'Laptop with Python installed'],
    status: 'open'
  },
  {
    id: '5',
    title: 'Holiday Networking Mixer',
    description: 'End-of-year celebration with mentors and students. Great food, drinks, and networking!',
    type: 'networking',
    date: '2024-12-28',
    time: '19:00',
    duration: 240,
    location: 'Riverside Event Center',
    maxParticipants: 80,
    currentParticipants: 35,
    price: 50,
    image: 'resources/event-celebration.jpg',
    mentors: ['Emily Watson', 'David Kim', 'Rachel Green'],
    tags: ['celebration', 'networking', 'holiday', 'social'],
    requirements: ['Festive attire', 'Holiday spirit!'],
    status: 'open'
  }
];

// Get all events
router.get('/', async (req, res) => {
  try {
    const { type, date, page = 1, limit = 10 } = req.query;
    
    let filteredEvents = events;

    // Filter by type
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }

    // Filter by date
    if (date) {
      filteredEvents = filteredEvents.filter(event => event.date === date);
    }

    // Pagination
    const totalCount = filteredEvents.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    res.json({
      events: paginatedEvents,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalCount
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = events.find(e => e.id === req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event (admin only)
router.post('/', adminAuth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('type').isIn(['tournament', 'workshop', 'networking', 'other']).withMessage('Invalid event type'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
  body('duration').isNumeric().withMessage('Duration must be a number'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('maxParticipants').isNumeric().withMessage('Max participants must be a number'),
  body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newEvent = {
      id: Date.now().toString(),
      ...req.body,
      currentParticipants: 0,
      status: 'open',
      createdAt: new Date()
    };

    events.push(newEvent);

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const eventIndex = events.findIndex(e => e.id === req.params.id);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    events[eventIndex] = {
      ...events[eventIndex],
      ...req.body,
      updatedAt: new Date()
    };

    res.json({
      message: 'Event updated successfully',
      event: events[eventIndex]
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const eventIndex = events.findIndex(e => e.id === req.params.id);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    events.splice(eventIndex, 1);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Register for event
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = events.find(e => e.id === req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is open
    if (event.status !== 'open') {
      return res.status(400).json({ error: 'Event registration is closed' });
    }

    // Check if already registered
    // In a real implementation, you'd check a registrations collection
    
    // Check capacity
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Register user (in memory for now)
    event.currentParticipants += 1;
    
    // In a real implementation, you'd create a registration record
    // and process payment if required

    res.json({
      message: 'Successfully registered for event',
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location
      }
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Get user's event registrations
router.get('/registrations/me', auth, async (req, res) => {
  try {
    // In a real implementation, you'd query a registrations collection
    // For now, return empty array
    res.json({
      registrations: [],
      totalCount: 0
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Cancel event registration
router.delete('/:id/register', auth, async (req, res) => {
  try {
    const event = events.find(e => e.id === req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Cancel registration (in memory for now)
    if (event.currentParticipants > 0) {
      event.currentParticipants -= 1;
    }

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

// Get event analytics (admin only)
router.get('/analytics/overview', adminAuth, async (req, res) => {
  try {
    const totalEvents = events.length;
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    const totalRegistrations = events.reduce((sum, event) => sum + event.currentParticipants, 0);
    const totalRevenue = events.reduce((sum, event) => sum + (event.currentParticipants * event.price), 0);

    const upcomingEvents = events.filter(event => new Date(event.date) > new Date()).length;
    const pastEvents = events.filter(event => new Date(event.date) <= new Date()).length;

    res.json({
      totalEvents,
      eventsByType,
      totalRegistrations,
      totalRevenue,
      upcomingEvents,
      pastEvents
    });
  } catch (error) {
    console.error('Event analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch event analytics' });
  }
});

module.exports = router;