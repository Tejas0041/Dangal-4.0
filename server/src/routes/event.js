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
        registrationOpen: false,
      });
    }

    res.json({
      eventDate: settings.eventDate,
      eventName: settings.eventName,
      registrationOpen: settings.registrationOpen || false,
      matchesVisible: settings.matchesVisible || false,
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
        registrationOpen: false,
      });
    }

    res.json({
      message: 'Event settings updated successfully',
      eventDate: settings.eventDate,
      eventName: settings.eventName,
      registrationOpen: settings.registrationOpen || false,
      matchesVisible: settings.matchesVisible || false,
    });
  } catch (error) {
    console.error('Update event settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/event/registration/toggle
// @desc    Toggle registration open/closed
// @access  Private (Admin)
router.post('/registration/toggle', authenticateAdmin, async (req, res) => {
  try {
    let settings = await EventSettings.findOne({ isActive: true });

    if (!settings) {
      settings = await EventSettings.create({
        eventDate: new Date('2026-02-16T00:00:00'),
        eventName: 'Dangal 4.0',
        isActive: true,
        registrationOpen: true,
        matchesVisible: false,
      });
    } else {
      settings.registrationOpen = !settings.registrationOpen;
      await settings.save();
    }

    res.json({
      message: `Registration ${settings.registrationOpen ? 'opened' : 'closed'} successfully`,
      registrationOpen: settings.registrationOpen,
    });
  } catch (error) {
    console.error('Toggle registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/event/matches/toggle
// @desc    Toggle matches visibility
// @access  Private (Admin)
router.post('/matches/toggle', authenticateAdmin, async (req, res) => {
  try {
    let settings = await EventSettings.findOne({ isActive: true });

    if (!settings) {
      settings = await EventSettings.create({
        eventDate: new Date('2026-02-16T00:00:00'),
        eventName: 'Dangal 4.0',
        isActive: true,
        registrationOpen: false,
        matchesVisible: true,
      });
    } else {
      settings.matchesVisible = !settings.matchesVisible;
      await settings.save();
    }

    res.json({
      message: `Matches ${settings.matchesVisible ? 'shown' : 'hidden'} successfully`,
      matchesVisible: settings.matchesVisible,
    });
  } catch (error) {
    console.error('Toggle matches visibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
