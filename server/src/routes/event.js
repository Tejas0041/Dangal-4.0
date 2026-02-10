import express from 'express';
import EventSettings from '../models/EventSettings.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// @route   GET /api/event/settings
// @desc    Get event settings (public)
// @access  Public
router.get('/settings', async (req, res) => {
  try {
    let settings = await EventSettings.findOne({ isActive: true });

    // If no settings exist, create default
    if (!settings) {
      settings = await EventSettings.create({
        eventDate: new Date('2026-02-16T00:00:00'),
        eventName: 'Dangal 4.0',
        isActive: true,
      });
    }

    res.json({
      eventDate: settings.eventDate,
      eventName: settings.eventName,
    });
  } catch (error) {
    console.error('Get event settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/event/settings
// @desc    Update event settings
// @access  Private (Admin)
router.put('/settings', authenticateAdmin, async (req, res) => {
  try {
    const { eventDate, eventName } = req.body;

    if (!eventDate) {
      return res.status(400).json({ message: 'Event date is required' });
    }

    // Validate date
    const date = new Date(eventDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    let settings = await EventSettings.findOne({ isActive: true });

    if (settings) {
      settings.eventDate = date;
      if (eventName) settings.eventName = eventName;
      await settings.save();
    } else {
      settings = await EventSettings.create({
        eventDate: date,
        eventName: eventName || 'Dangal 4.0',
        isActive: true,
      });
    }

    res.json({
      message: 'Event settings updated successfully',
      eventDate: settings.eventDate,
      eventName: settings.eventName,
    });
  } catch (error) {
    console.error('Update event settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
