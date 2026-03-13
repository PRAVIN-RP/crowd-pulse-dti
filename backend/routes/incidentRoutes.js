import express from 'express';
import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const incidentsRef = collection(db, 'incidents');

// @route   POST /api/incidents
// @desc    Submit a new incident report (Personnel)
router.post('/', protect, async (req, res) => {
  const { title, description, zone, severity } = req.body;
  if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });

  try {
    const incident = {
      title,
      description,
      zone: zone || 'Zone-A',
      severity: severity || 'medium',
      reportedBy: req.user.username,
      reportedById: req.user._id,
      status: 'open',        // open | acknowledged | resolved
      timestamp: new Date().toISOString(),
    };
    const docRef = await addDoc(incidentsRef, incident);
    res.status(201).json({ _id: docRef.id, ...incident });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/incidents
// @desc    Get all incidents (Admin only)
router.get('/', protect, async (req, res) => {
  try {
    const q = query(incidentsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const incidents = snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));
    res.json(incidents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/incidents/:id/status
// @desc    Update incident status (Admin only)
router.patch('/:id/status', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
  const { status } = req.body;
  if (!['open', 'acknowledged', 'resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    await updateDoc(doc(db, 'incidents', req.params.id), {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.username
    });
    res.json({ message: `Incident ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
