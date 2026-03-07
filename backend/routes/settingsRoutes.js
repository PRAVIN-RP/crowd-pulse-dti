import express from 'express';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const settingsRef = collection(db, 'settings');

const getOrCreateSettings = async () => {
  const snapshot = await getDocs(settingsRef);
  if (snapshot.empty) {
    const docRef = await addDoc(settingsRef, { maxCrowdLimit: 100 });
    return { _id: docRef.id, maxCrowdLimit: 100 };
  }
  return { _id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
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
    const { maxCrowdLimit } = req.body;
    let settings = await getOrCreateSettings();
    
    if (maxCrowdLimit) {
      const dRef = doc(db, 'settings', settings._id);
      await updateDoc(dRef, { maxCrowdLimit });
      settings.maxCrowdLimit = maxCrowdLimit;
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating settings' });
  }
});

export default router;
