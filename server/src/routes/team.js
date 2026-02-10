import express from 'express';
import Team from '../models/Team.js';
import Game from '../models/Game.js';
import Hall from '../models/Hall.js';
import { authenticate } from '../middleware/auth.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Get all teams for a hall (for JMCR to see their teams)
router.get('/hall/:hallId', authenticate, async (req, res) => {
  try {
    const teams = await Team.find({ hallId: req.params.hallId })
      .populate('gameId', 'name')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get registration status for a hall (which games have teams registered)
router.get('/status/:hallId', authenticate, async (req, res) => {
  try {
    const teams = await Team.find({ hallId: req.params.hallId }).select('gameId teamName');
    const games = await Game.find().select('name maxTeams');
    
    const registrationStatus = games.map(game => {
      const gameTeams = teams.filter(t => t.gameId.toString() === game._id.toString());
      return {
        gameId: game._id,
        gameName: game.name,
        teamsRegistered: gameTeams.length,
        maxTeams: game.maxTeams,
        teamNames: gameTeams.map(t => t.teamName),
        canRegisterMore: gameTeams.length < game.maxTeams
      };
    });
    
    res.json(registrationStatus);
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new team
router.post('/', authenticate, async (req, res) => {
  try {
    const { hallId, gameId, teamName, players, paymentScreenshot } = req.body;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Validate hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Check if user is JMCR of this hall
    if (hall.jmcr.gsuite !== req.user.email) {
      return res.status(403).json({ message: 'Only JMCR can register teams for this hall' });
    }

    // Check if max teams limit reached
    const existingTeams = await Team.countDocuments({ hallId, gameId });
    if (existingTeams >= game.maxTeams) {
      return res.status(400).json({ message: `Maximum ${game.maxTeams} teams allowed for this game` });
    }

    // Validate player count
    if (players.length < game.minPlayersPerTeam || players.length > game.maxPlayersPerTeam) {
      return res.status(400).json({ 
        message: `Team must have between ${game.minPlayersPerTeam} and ${game.maxPlayersPerTeam} players` 
      });
    }

    // Create team
    const team = new Team({
      hallId,
      gameId,
      teamName,
      players,
      paymentScreenshot,
      registeredBy: req.user._id
    });

    await team.save();
    res.status(201).json({ message: 'Team registered successfully', team });
  } catch (error) {
    console.error('Create team error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Team name already exists for this game' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teams (admin only)
router.get('/all', authenticateAdmin, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('hallId', 'name type')
      .populate('gameId', 'name')
      .populate('registeredBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(teams);
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a team (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
