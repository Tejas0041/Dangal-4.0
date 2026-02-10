import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';

// Load environment variables FIRST
dotenv.config();

// Now import passport (which needs env vars)
import passport from './config/passport.js';
import { connectDB } from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import eventRoutes from './routes/event.js';
import hallRoutes from './routes/hall.js';
import uploadRoutes from './routes/upload.js';
import gameRoutes from './routes/game.js';
import teamRoutes from './routes/team.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/halls', hallRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/teams', teamRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dangal 2k26 Backend is running' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for live scores
  socket.on('join-scores', () => {
    socket.join('live-scores');
    console.log(`Socket ${socket.id} joined live-scores room`);
  });

  // Leave room
  socket.on('leave-scores', () => {
    socket.leave('live-scores');
    console.log(`Socket ${socket.id} left live-scores room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export { io };
