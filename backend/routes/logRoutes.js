import express from 'express';
import { collection, addDoc, query, orderBy, getDocs, limit as fbLimit } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const logsRef = collection(db, 'systemLogs');

// @desc    Get system logs
// @route   GET /api/logs
router.get('/', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  try {
    const limitNum = parseInt(req.query.limit) || 50;
    const q = query(logsRef, orderBy('timestamp', 'desc'), fbLimit(limitNum));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
});

// @desc    Add a system log
// @route   POST /api/logs
router.post('/', async (req, res) => {
  try {
    const { action, message, level = 'info' } = req.body;
    
    // Use req.user if available (protect middleware must be used, or optional)
    // We'll make this route public or semi-public so the client can post logs easily 
    // without strict user objects (e.g., system auto-logs, alerts)
    
    const newDoc = {
      action,
      message,
      level,
      timestamp: Date.now()
    };

    const docRef = await addDoc(logsRef, newDoc);
    
    // Broadcast log to admins
    const io = req.app.get('io');
    if (io) {
       io.emit('new_log', { _id: docRef.id, ...newDoc });
    }

    res.status(201).json({ _id: docRef.id, ...newDoc });
  } catch (error) {
    console.error('Error adding log:', error);
    res.status(500).json({ message: 'Server error saving log' });
  }
});

export default router;
