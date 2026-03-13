import express from 'express';
import { db } from '../config/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   PATCH /api/duty
// @desc    Toggle duty status for logged-in user
router.patch('/', protect, async (req, res) => {
  const { onDuty } = req.body;
  if (typeof onDuty !== 'boolean') return res.status(400).json({ message: 'onDuty must be boolean' });
  try {
    await updateDoc(doc(db, 'users', req.user._id), {
      onDuty,
      dutyUpdatedAt: new Date().toISOString()
    });
    res.json({ onDuty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
