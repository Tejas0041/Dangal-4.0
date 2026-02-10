import express from 'express';
import Game from '../models/Game.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Get all games (public)
router.get('/', async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: 1 });
    res.json(games);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all games (admin)
router.get('/all', authenticateAdmin, async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    console.error('Get all games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create game (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      image, 
      rulebook, 
      registrationAmount,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      maxTeams,
      qrCodeImage,
      venue, 
      dateTime
    } = req.body;

    if (!rulebook) {
      return res.status(400).json({ message: 'Rulebook PDF is required' });
    }

    if (!qrCodeImage) {
      return res.status(400).json({ message: 'QR Code image is required' });
    }

    const game = new Game({
      name,
      description,
      image,
      rulebook,
      registrationAmount,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      maxTeams,
      qrCodeImage,
      venue: venue || '',
      dateTime: dateTime || null
    });

    await game.save();
    res.status(201).json({ message: 'Game created successfully', game });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update game (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      image, 
      rulebook, 
      registrationAmount,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      maxTeams,
      qrCodeImage,
      venue, 
      dateTime
    } = req.body;

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (name) game.name = name;
    if (description) game.description = description;
    if (image) game.image = image;
    if (rulebook !== undefined) game.rulebook = rulebook;
    if (registrationAmount !== undefined) game.registrationAmount = registrationAmount;
    if (minPlayersPerTeam !== undefined) game.minPlayersPerTeam = minPlayersPerTeam;
    if (maxPlayersPerTeam !== undefined) game.maxPlayersPerTeam = maxPlayersPerTeam;
    if (maxTeams !== undefined) game.maxTeams = maxTeams;
    if (qrCodeImage !== undefined) game.qrCodeImage = qrCodeImage;
    if (venue !== undefined) game.venue = venue || '';
    if (dateTime !== undefined) game.dateTime = dateTime || null;

    await game.save();
    res.json({ message: 'Game updated successfully', game });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete game (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
