import express from 'express';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const settingsRef = collection(db, 'settings');

const getOrCreateSettings = async () => {
  const snapshot = await getDocs(settingsRef);
  if (snapshot.empty) {
    const docRef = await addDoc(settingsRef, { maxCrowdLimit: 100, warningLimit: 75, isEmergencyMode: false });
    return { _id: docRef.id, maxCrowdLimit: 100, warningLimit: 75, isEmergencyMode: false };
  }
  const data = snapshot.docs[0].data();
  // Ensure we have a default warning limit if upgrading the database
  if (data.warningLimit === undefined) {
      data.warningLimit = Math.floor((data.maxCrowdLimit || 100) * 0.75);
  }
  if (data.isEmergencyMode === undefined) {
      data.isEmergencyMode = false;
  }
  return { _id: snapshot.docs[0].id, ...data };
};

// @desc    Get application settings
router.get('/', protect, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching settings' });
  }
});

// @desc    Update application settings
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const { maxCrowdLimit, warningLimit, isEmergencyMode } = req.body;
    let settings = await getOrCreateSettings();
    
    let updates = {};
    if (maxCrowdLimit !== undefined) updates.maxCrowdLimit = maxCrowdLimit;
    if (warningLimit !== undefined) updates.warningLimit = warningLimit;
    if (isEmergencyMode !== undefined) updates.isEmergencyMode = isEmergencyMode;

    if (Object.keys(updates).length > 0) {
      const dRef = doc(db, 'settings', settings._id);
      await updateDoc(dRef, updates);
      settings = { ...settings, ...updates };

      // Immediately broadcast out an emergency toggle if it was touched
      if (isEmergencyMode !== undefined) {
          const io = req.app.get('io');
          if (io) io.emit('emergency_status', isEmergencyMode);
      }
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating settings' });
  }
});

// @desc    Broadcast message from Admin
router.post('/broadcast', protect, adminOnly, (req, res) => {
  const { message, severity } = req.body; // e.g., 'info', 'warning', 'danger'
  
  if (!message) {
     return res.status(400).json({ message: 'Broadcast message is required' });
  }

  // Use the global io instance attached to the app correctly
  const io = req.app.get('io');
  if (io) {
    io.emit('admin_broadcast', {
       id: Date.now().toString(),
       message,
       severity: severity || 'info',
       timestamp: new Date()
    });
    res.status(200).json({ message: 'Broadcast sent successfully' });
  } else {
    res.status(500).json({ message: 'Socket.IO not initialized' });
  }
});

export default router;
