import express from 'express';
import Hall from '../models/Hall.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Get all halls (public)
router.get('/', async (req, res) => {
  try {
    const halls = await Hall.find().sort({ name: 1 });
    res.json(halls);
  } catch (error) {
    console.error('Get halls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all halls including inactive (admin only)
router.get('/all', authenticateAdmin, async (req, res) => {
  try {
    const halls = await Hall.find().sort({ name: 1 });
    res.json(halls);
  } catch (error) {
    console.error('Get all halls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create hall (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, type, image } = req.body;

    // Check if hall already exists
    const existingHall = await Hall.findOne({ name });
    if (existingHall) {
      return res.status(400).json({ message: 'Hall with this name already exists' });
    }

    const hall = new Hall({
      name,
      type,
      image: image || null
    });

    await hall.save();
    res.status(201).json({ message: 'Hall created successfully', hall });
  } catch (error) {
    console.error('Create hall error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update hall (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, type, image, jmcr } = req.body;

    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== hall.name) {
      const existingHall = await Hall.findOne({ name });
      if (existingHall) {
        return res.status(400).json({ message: 'Hall with this name already exists' });
      }
      hall.name = name;
    }

    if (type) hall.type = type;
    if (image !== undefined) hall.image = image || null;
    if (jmcr !== undefined) {
      hall.jmcr = {
        name: jmcr.name || '',
        gsuite: jmcr.gsuite || '',
        contact: jmcr.contact || ''
      };
    }

    await hall.save();
    res.json({ message: 'Hall updated successfully', hall });
  } catch (error) {
    console.error('Update hall error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete hall (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    await Hall.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hall deleted successfully' });
  } catch (error) {
    console.error('Delete hall error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
