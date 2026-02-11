import express from 'express';
import Schedule from '../models/Schedule.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Schedule.find()
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName')
      .sort({ matchNumber: 1 });
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get match by ID
router.get('/:id', async (req, res) => {
  try {
    const match = await Schedule.findById(req.params.id)
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName');
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new match (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { game, teamA, teamB, date, time, venue, round, status } = req.body;

    // Validate teams are different
    if (teamA === teamB) {
      return res.status(400).json({ message: 'Teams must be different' });
    }

    // Get the highest match number and increment
    const lastMatch = await Schedule.findOne().sort({ matchNumber: -1 });
    const matchNumber = lastMatch ? lastMatch.matchNumber + 1 : 1;

    const match = new Schedule({
      matchNumber,
      game,
      teamA,
      teamB,
      date,
      time,
      venue,
      round,
      status
    });

    await match.save();
    
    const populatedMatch = await Schedule.findById(match._id)
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      });

    res.status(201).json(populatedMatch);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update match (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { game, teamA, teamB, date, time, venue, round, status, result, matchNumber } = req.body;

    // Validate teams are different
    if (teamA === teamB) {
      return res.status(400).json({ message: 'Teams must be different' });
    }

    // If matchNumber is being updated, check for duplicates
    if (matchNumber !== undefined) {
      const existingMatch = await Schedule.findOne({ 
        matchNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingMatch) {
        return res.status(400).json({ message: 'Match number already exists' });
      }
    }

    const match = await Schedule.findByIdAndUpdate(
      req.params.id,
      { game, teamA, teamB, date, time, venue, round, status, result, matchNumber },
      { new: true, runValidators: true }
    )
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete match (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const match = await Schedule.findByIdAndDelete(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get matches by game
router.get('/game/:gameId', async (req, res) => {
  try {
    const matches = await Schedule.find({ game: req.params.gameId })
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName')
      .sort({ matchNumber: 1 });
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get matches by date
router.get('/date/:date', async (req, res) => {
  try {
    const startDate = new Date(req.params.date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const matches = await Schedule.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    })
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName')
      .sort({ matchNumber: 1 });
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
