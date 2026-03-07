import express from 'express';
import { collection, addDoc, query, orderBy, limit as fbLimit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const sensorRef = collection(db, 'sensorData');
const settingsRef = collection(db, 'settings');

// @desc    Receive new data from ESP32
// @route   POST /api/sensor
router.post('/', async (req, res) => {
  try {
    const { peopleCount, temperature, humidity, bodyTemperatureAvg } = req.body;

    const settingsSnap = await getDocs(settingsRef);
    let maxCrowdLimit = 100;
    if (!settingsSnap.empty) {
      maxCrowdLimit = settingsSnap.docs[0].data().maxCrowdLimit;
    } else {
      await addDoc(settingsRef, { maxCrowdLimit: 100 });
    }

    const crowdStatus = peopleCount > maxCrowdLimit ? 'OVERCROWDED' : 'SAFE';

    const newDocParams = {
      peopleCount,
      temperature,
      humidity,
      bodyTemperatureAvg,
      crowdStatus,
      timestamp: Date.now()
    };

    const docRef = await addDoc(sensorRef, newDocParams);
    res.status(201).json({ _id: docRef.id, ...newDocParams });
  } catch (error) {
    console.error('Error in POST /api/sensor:', error);
    res.status(500).json({ message: 'Server error saving sensor data' });
  }
});

// @desc    Get latest sensor data for dashboard
// @route   GET /api/sensor/latest
router.get('/latest', protect, async (req, res) => {
  try {
    const q = query(sensorRef, orderBy('timestamp', 'desc'), fbLimit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      res.json({ _id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    } else {
      res.status(404).json({ message: 'No sensor data found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching latest data' });
  }
});

// @desc    Get historical sensor data for charts
// @route   GET /api/sensor/history
router.get('/history', protect, async (req, res) => {
  try {
    const limitNum = parseInt(req.query.limit) || 20;
    const q = query(sensorRef, orderBy('timestamp', 'desc'), fbLimit(limitNum));
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    res.json(history.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching history data' });
  }
});

export default router;
