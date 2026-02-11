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
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName secondTeamName')
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
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName secondTeamName');
    
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
    const { game, teamA, teamB, date, time, venue, round, status, matchType } = req.body;

    // Validate teams are different
    if (teamA === teamB) {
      return res.status(400).json({ message: 'Teams must be different' });
    }

    // Get the highest match number and increment
    const lastMatch = await Schedule.findOne().sort({ matchNumber: -1 });
    const matchNumber = lastMatch ? lastMatch.matchNumber + 1 : 1;

    const matchData = {
      matchNumber,
      game,
      teamA,
      teamB,
      date,
      time,
      venue,
      round,
      status
    };

    // Add matchType if provided (for Table Tennis)
    if (matchType) {
      matchData.matchType = matchType;
    }

    const match = new Schedule(matchData);

    await match.save();
    
    const populatedMatch = await Schedule.findById(match._id)
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName secondTeamName hallId',
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
    const { game, teamA, teamB, date, time, venue, round, status, result, matchNumber, matchType } = req.body;

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

    const updateData = { game, teamA, teamB, date, time, venue, round, status, result, matchNumber };
    
    // Add matchType if provided
    if (matchType) {
      updateData.matchType = matchType;
    }

    const match = await Schedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName secondTeamName');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update match status only (Admin only)
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, winner } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updateData = { status };
    
    // If winner is provided, update the result.winner field
    if (winner) {
      updateData['result.winner'] = winner;
    }

    const match = await Schedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName secondTeamName hallId');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to('live-scores').emit('matchUpdated', match);
      
      // If match is completed and has a winner, emit matchWon
      if (status === 'Completed' && winner) {
        console.log('Emitting matchWon from status update:', winner);
        io.to('live-scores').emit('matchWon', {
          matchId: match._id.toString(),
          winner: winner
        });
      }
    }

    res.json(match);
  } catch (error) {
    console.error('Error updating match status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update match score (Admin only)
router.patch('/:id/score', authenticateAdmin, async (req, res) => {
  try {
    const { teamAScore, teamBScore, tableTennis, winner } = req.body;

    // Fetch current match state before update
    const currentMatch = await Schedule.findById(req.params.id);
    if (!currentMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }

    let updateData = {};
    let pointIncrements = { teamA: 0, teamB: 0 }; // Track point increments in current set
    let scoreTypes = { teamA: [], teamB: [] }; // Track which score types changed for Kabaddi
    let setWon = null; // Track if a set was won
    let matchWon = null; // Track if match was won

    // Handle Kabaddi scoring
    if (teamAScore && teamBScore) {
      const scoreA = (teamAScore?.raidPoints || 0) + 
                     (teamAScore?.bonusPoints || 0) + 
                     (teamAScore?.allOutPoints || 0) + 
                     (teamAScore?.extraPoints || 0);
      
      const scoreB = (teamBScore?.raidPoints || 0) + 
                     (teamBScore?.bonusPoints || 0) + 
                     (teamBScore?.allOutPoints || 0) + 
                     (teamBScore?.extraPoints || 0);

      // Calculate increments and determine which score types changed
      const prevScoreA = (currentMatch.result?.teamAScore?.raidPoints || 0) +
                         (currentMatch.result?.teamAScore?.bonusPoints || 0) +
                         (currentMatch.result?.teamAScore?.allOutPoints || 0) +
                         (currentMatch.result?.teamAScore?.extraPoints || 0);
      const prevScoreB = (currentMatch.result?.teamBScore?.raidPoints || 0) +
                         (currentMatch.result?.teamBScore?.bonusPoints || 0) +
                         (currentMatch.result?.teamBScore?.allOutPoints || 0) +
                         (currentMatch.result?.teamBScore?.extraPoints || 0);
      
      pointIncrements.teamA = scoreA - prevScoreA;
      pointIncrements.teamB = scoreB - prevScoreB;

      // Determine which specific score types changed for Team A
      if (pointIncrements.teamA > 0) {
        if ((teamAScore.raidPoints || 0) > (currentMatch.result?.teamAScore?.raidPoints || 0)) {
          const diff = (teamAScore.raidPoints || 0) - (currentMatch.result?.teamAScore?.raidPoints || 0);
          scoreTypes.teamA.push({ type: 'Raid Points', value: diff });
        }
        if ((teamAScore.bonusPoints || 0) > (currentMatch.result?.teamAScore?.bonusPoints || 0)) {
          const diff = (teamAScore.bonusPoints || 0) - (currentMatch.result?.teamAScore?.bonusPoints || 0);
          scoreTypes.teamA.push({ type: 'Bonus Points', value: diff });
        }
        if ((teamAScore.allOutPoints || 0) > (currentMatch.result?.teamAScore?.allOutPoints || 0)) {
          const diff = (teamAScore.allOutPoints || 0) - (currentMatch.result?.teamAScore?.allOutPoints || 0);
          scoreTypes.teamA.push({ type: 'All Out Points', value: diff });
        }
        if ((teamAScore.extraPoints || 0) > (currentMatch.result?.teamAScore?.extraPoints || 0)) {
          const diff = (teamAScore.extraPoints || 0) - (currentMatch.result?.teamAScore?.extraPoints || 0);
          scoreTypes.teamA.push({ type: 'Extra Points', value: diff });
        }
      }

      // Determine which specific score types changed for Team B
      if (pointIncrements.teamB > 0) {
        if ((teamBScore.raidPoints || 0) > (currentMatch.result?.teamBScore?.raidPoints || 0)) {
          const diff = (teamBScore.raidPoints || 0) - (currentMatch.result?.teamBScore?.raidPoints || 0);
          scoreTypes.teamB.push({ type: 'Raid Points', value: diff });
        }
        if ((teamBScore.bonusPoints || 0) > (currentMatch.result?.teamBScore?.bonusPoints || 0)) {
          const diff = (teamBScore.bonusPoints || 0) - (currentMatch.result?.teamBScore?.bonusPoints || 0);
          scoreTypes.teamB.push({ type: 'Bonus Points', value: diff });
        }
        if ((teamBScore.allOutPoints || 0) > (currentMatch.result?.teamBScore?.allOutPoints || 0)) {
          const diff = (teamBScore.allOutPoints || 0) - (currentMatch.result?.teamBScore?.allOutPoints || 0);
          scoreTypes.teamB.push({ type: 'All Out Points', value: diff });
        }
        if ((teamBScore.extraPoints || 0) > (currentMatch.result?.teamBScore?.extraPoints || 0)) {
          const diff = (teamBScore.extraPoints || 0) - (currentMatch.result?.teamBScore?.extraPoints || 0);
          scoreTypes.teamB.push({ type: 'Extra Points', value: diff });
        }
      }

      updateData = {
        'result.teamAScore': teamAScore,
        'result.teamBScore': teamBScore,
        'result.scoreA': scoreA,
        'result.scoreB': scoreB
      };
    }

    // Handle Table Tennis scoring
    if (tableTennis) {
      // Check if a set was just won by comparing sets won
      const prevSetsWonA = currentMatch.result?.tableTennis?.setsWonA || 0;
      const prevSetsWonB = currentMatch.result?.tableTennis?.setsWonB || 0;
      const setsWonIncrementA = tableTennis.setsWonA - prevSetsWonA;
      const setsWonIncrementB = tableTennis.setsWonB - prevSetsWonB;

      if (setsWonIncrementA > 0) {
        setWon = { team: 'A', setNumber: tableTennis.setsWonA };
      } else if (setsWonIncrementB > 0) {
        setWon = { team: 'B', setNumber: tableTennis.setsWonB };
      }

      // Calculate point increments in the current set (last set in array)
      if (tableTennis.sets && tableTennis.sets.length > 0) {
        const currentSetIndex = tableTennis.sets.length - 1;
        const currentSet = tableTennis.sets[currentSetIndex];
        const prevSets = currentMatch.result?.tableTennis?.sets || [];
        const prevSet = prevSets[currentSetIndex] || { teamAScore: 0, teamBScore: 0 };

        pointIncrements.teamA = currentSet.teamAScore - prevSet.teamAScore;
        pointIncrements.teamB = currentSet.teamBScore - prevSet.teamBScore;
      }

      // Check if match is won (League Stage: 1 set, Semi/Final: 2 out of 3 sets)
      const maxSets = currentMatch.round === 'League Stage' ? 1 : 3;
      const setsToWin = currentMatch.round === 'League Stage' ? 1 : 2;
      
      if (tableTennis.setsWonA >= setsToWin) {
        matchWon = currentMatch.teamA._id.toString();
      } else if (tableTennis.setsWonB >= setsToWin) {
        matchWon = currentMatch.teamB._id.toString();
      }

      updateData['result.tableTennis'] = tableTennis;
      updateData['result.scoreA'] = tableTennis.setsWonA;
      updateData['result.scoreB'] = tableTennis.setsWonB;
      
      // If match is won, set winner and status
      if (matchWon) {
        updateData['result.winner'] = matchWon;
        updateData['status'] = 'Completed';
      } else if (currentMatch.status === 'Completed') {
        // If match was completed but now no one has won (undo scenario), set back to Live
        updateData['result.winner'] = null;
        updateData['status'] = 'Live';
      }
    }

    // Handle Tug of War winner (or any game that only needs winner selection)
    if (winner) {
      updateData['result.winner'] = winner;
      matchWon = winner;
    }

    const match = await Schedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('game', 'name venue image icon')
      .populate({
        path: 'teamA',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName secondTeamName hallId');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to('live-scores').emit('matchUpdated', match);
      
      console.log('Point increments:', pointIncrements);
      console.log('Set won:', setWon);
      console.log('Match won:', matchWon);
      
      // Priority: matchWon > setWon > scoreUpdate
      // Only emit one type of event to avoid duplicate animations
      
      if (matchWon) {
        // Match won - emit only matchWon event with point increment
        const winningTeam = String(matchWon) === String(match.teamA._id) ? 'A' : 'B';
        const eventData = {
          matchId: match._id.toString(),
          winner: matchWon,
          team: winningTeam,
          pointIncrement: winningTeam === 'A' ? pointIncrements.teamA : pointIncrements.teamB,
          scoreTypes: winningTeam === 'A' ? scoreTypes.teamA : scoreTypes.teamB
        };
        console.log('Emitting matchWon:', eventData);
        io.to('live-scores').emit('matchWon', eventData);
      } else if (setWon) {
        // Set won - emit only setWon event with point increment
        const eventData = {
          matchId: match._id.toString(),
          team: setWon.team,
          setNumber: setWon.setNumber,
          pointIncrement: setWon.team === 'A' ? pointIncrements.teamA : pointIncrements.teamB
        };
        console.log('Emitting setWon:', eventData);
        io.to('live-scores').emit('setWon', eventData);
      } else {
        // Regular point scoring - emit scoreUpdate events
        if (pointIncrements.teamA > 0) {
          const eventData = {
            matchId: match._id.toString(),
            team: 'A',
            increment: pointIncrements.teamA,
            type: 'pointScored',
            scoreTypes: scoreTypes.teamA
          };
          console.log('Emitting scoreUpdate for Team A:', eventData);
          io.to('live-scores').emit('scoreUpdate', eventData);
        }
        if (pointIncrements.teamB > 0) {
          const eventData = {
            matchId: match._id.toString(),
            team: 'B',
            increment: pointIncrements.teamB,
            type: 'pointScored',
            scoreTypes: scoreTypes.teamB
          };
          console.log('Emitting scoreUpdate for Team B:', eventData);
          io.to('live-scores').emit('scoreUpdate', eventData);
        }
      }
    }

    res.json(match);
  } catch (error) {
    console.error('Error updating match score:', error);
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
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName secondTeamName')
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
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate({
        path: 'teamB',
        select: 'teamName secondTeamName hallId',
        populate: {
          path: 'hallId',
          select: 'name image'
        }
      })
      .populate('result.winner', 'teamName secondTeamName')
      .sort({ matchNumber: 1 });
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
