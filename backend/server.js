import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import logRoutes from './routes/logRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow frontend to connect
    methods: ["GET", "POST"]
  }
});

// Make io accessible to our router
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

console.log('Using Firebase Firestore for database.');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sensor', sensorRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', logRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('CrowdPulse API is running');
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`Client connected via socket: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server (use httpServer instead of app)
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
