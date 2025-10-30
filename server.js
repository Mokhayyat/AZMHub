const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Basic middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/azm-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const mentorRoutes = require('./routes/mentors');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');
const contentRoutes = require('./routes/content');
const eventRoutes = require('./routes/events');
const podcastRoutes = require('./routes/podcasts');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/podcasts', podcastRoutes);

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join chat room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  // Send message
  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('new-message', data);
  });
  
  // Video call signaling
  socket.on('video-offer', (data) => {
    socket.to(data.roomId).emit('video-offer', data);
  });
  
  socket.on('video-answer', (data) => {
    socket.to(data.roomId).emit('video-answer', data);
  });
  
  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });
  
  // Online status
  socket.on('user-online', (userId) => {
    socket.broadcast.emit('user-status-change', { userId, status: 'online' });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// AI-powered mentor matching
const { OpenAI } = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

app.post('/api/match-mentors', async (req, res) => {
  try {
    const { studentProfile, preferences } = req.body;
    
    const prompt = `
    Based on the following student profile and preferences, recommend the top 5 most suitable mentors:
    
    Student Profile:
    - Career Goals: ${studentProfile.careerGoals}
    - Current Skills: ${studentProfile.skills}
    - Industry Interest: ${studentProfile.industry}
    - Learning Style: ${studentProfile.learningStyle}
    - Availability: ${studentProfile.availability}
    
    Preferences:
    - Price Range: $${preferences.minPrice} - $${preferences.maxPrice}
    - Session Type: ${preferences.sessionType}
    - Experience Level: ${preferences.experienceLevel}
    
    Please provide recommendations with reasoning for each match.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000
    });
    
    res.json({ recommendations: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI matching error:', error);
    res.status(500).json({ error: 'AI matching failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// SPA fallback for React routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`AZM Platform server running on port ${PORT}`);
});

module.exports = app;