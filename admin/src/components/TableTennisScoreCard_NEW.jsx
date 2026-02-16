import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// New Table Tennis Score Card Component
// League: Single, Double, Single, Double, Single (5 games, win 3)
// Non-League: All 5 types x 3 times (15 games, win 8)
const TableTennisScoreCard = ({ match, updateScore, endMatch, getTeamFullName, isLive, isMobile = false, onPendingUpdateChange }) => {
  const isLeague = match.round === 'League Stage';
  
  // Game pattern:
  // League: 5 rounds (S, D, S, D, S) with 1 set each = 5 games
  // Non-league: 5 rounds (S, D, S, D, S) with 3 sets each = 15 games
  const gamePattern = useMemo(() => {
    const roundPattern = ['Single', 'Double', 'Single', 'Double', 'Single'];
    
    if (isLeague) {
      // Each round has 1 set
      return roundPattern;
    } else {
      // Each round has 3 sets
      const pattern = [];
      roundPattern.forEach(type => {
        pattern.push(type, type, type); // 3 sets of the same type
      });
      return pattern;
    }
  }, [isLeague]);

  const totalGames = gamePattern.length;
  const gamesToWin = Math.ceil(totalGames / 2); // 3 for league, 8 for non-league

  const [games, setGames] = useState([]);
  const [gamesWonA, setGamesWonA] = useState(0);
  const [gamesWonB, setGamesWonB] = useState(0);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [undoHistory, setUndoHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState(match.status);
  const [lastMatchId, setLastMatchId] = useState(null);
  const [updateTimeout, setUpdateTimeout] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [matchStatus, setMatchStatus] = useState(match.status);

  const isMatchLive = matchStatus === 'Live';

  // Load undo history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`undoHistory_${match._id}`);
    if (savedHistory) {
      try {
        setUndoHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse undo history:', e);
      }
    }
  }, [match._id]);

  // Save undo history to localStorage
  useEffect(() => {
    if (undoHistory.length > 0) {
      localStorage.setItem(`undoHistory_${match._id}`, JSON.stringify(undoHistory));
    } else {
      localStorage.removeItem(`undoHistory_${match._id}`);
    }
  }, [undoHistory, match._id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

  // Load scores from match data
  useEffect(() => {
    const matchIdChanged = lastMatchId !== match._id;
    
    if (match.result?.tableTennis?.games && match.result.tableTennis.games.length > 0) {
      // Fix game types if they don't match the expected pattern
      const correctedGames = match.result.tableTennis.games.map((game, index) => {
        const expectedType = gamePattern[index];
        const expectedMaxScore = expectedType === 'Single' ? 11 : 15;
        
        // If type or maxScore doesn't match, correct it
        if (game.type !== expectedType || game.maxScore !== expectedMaxScore) {
          return {
            ...game,
            type: expectedType,
            maxScore: expectedMaxScore
          };
        }
        return game;
      });
      
      setGames(correctedGames);
      setGamesWonA(match.result.tableTennis.gamesWonA || 0);
      setGamesWonB(match.result.tableTennis.gamesWonB || 0);
      
      // Find current game (first incomplete game or last game)
      const incompleteGameIndex = correctedGames.findIndex(g => !g.winner);
      setCurrentGameIndex(incompleteGameIndex !== -1 ? incompleteGameIndex : correctedGames.length - 1);
    } else {
      // Initialize games based on pattern
      const initialGames = gamePattern.map((type) => ({
        type,
        teamAScore: 0,
        teamBScore: 0,
        maxScore: type === 'Single' ? 11 : 15,
        winner: null
      }));
      setGames(initialGames);
      setGamesWonA(0);
      setGamesWonB(0);
      setCurrentGameIndex(0);
    }
    
    if (matchIdChanged) {
      setIsEditing(false);
      setLastMatchId(match._id);
    }
  }, [match._id, lastMatchId, gamePattern]);

  const checkGameWinner = (scoreA, scoreB, maxScore) => {
    if (scoreA >= maxScore || scoreB >= maxScore) {
      // Check for deuce (both at maxScore - 1 or higher)
      if (scoreA >= maxScore - 1 && scoreB >= maxScore - 1) {
        // Need 2 point lead to win
        if (Math.abs(scoreA - scoreB) >= 2) {
          return scoreA > scoreB ? 'A' : 'B';
        }
      } else {
        // Normal win condition
        if (scoreA >= maxScore) return 'A';
        if (scoreB >= maxScore) return 'B';
      }
    }
    return null;
  };

  const handleScoreUpdate = async (gameIndex, team, increment = true) => {
    const newGames = [...games];
    const currentGame = { ...newGames[gameIndex] };

    // Store previous state in history (only for live matches)
    if (isMatchLive) {
      setUndoHistory(prev => [...prev, {
        games: [...games],
        gamesWonA,
        gamesWonB,
        currentGameIndex
      }]);
    }

    // Update score
    if (team === 'A') {
      if (increment) {
        currentGame.teamAScore += 1;
      } else {
        currentGame.teamAScore = Math.max(0, currentGame.teamAScore - 1);
      }
    } else {
      if (increment) {
        currentGame.teamBScore += 1;
      } else {
        currentGame.teamBScore = Math.max(0, currentGame.teamBScore - 1);
      }
    }

    // When editing, allow manual winner removal
    if (isEditing) {
      currentGame.winner = null;
    }

    // Check for game winner
    let winner = null;
    let newGamesWonA = gamesWonA;
    let newGamesWonB = gamesWonB;
    let matchCompleted = false;
    let roundCompleted = false;
    let nextGameIndex = gameIndex + 1;
    
    if ((isMatchLive || (isEditing && increment)) && !currentGame.winner) {
      winner = checkGameWinner(currentGame.teamAScore, currentGame.teamBScore, currentGame.maxScore);
      if (winner) {
        currentGame.winner = winner === 'A' ? match.teamA._id : match.teamB._id;
        
        // Update games won
        newGamesWonA = winner === 'A' ? gamesWonA + 1 : gamesWonA;
        newGamesWonB = winner === 'B' ? gamesWonB + 1 : gamesWonB;
        
        setGamesWonA(newGamesWonA);
        setGamesWonB(newGamesWonB);
      }
    }

    // Update the games array
    newGames[gameIndex] = currentGame;

    // For non-league, check if round is completed AFTER updating games array
    if (!isLeague && isMatchLive && winner) {
      const currentRoundIndex = Math.floor(gameIndex / 3);
      const roundStartIndex = currentRoundIndex * 3;
      const roundEndIndex = Math.min(roundStartIndex + 3, totalGames);
      
      // Count wins in current round using updated newGames array
      let roundWinsA = 0;
      let roundWinsB = 0;
      for (let i = roundStartIndex; i < roundEndIndex; i++) {
        if (newGames[i] && newGames[i].winner === match.teamA._id) {
          roundWinsA++;
        }
        if (newGames[i] && newGames[i].winner === match.teamB._id) {
          roundWinsB++;
        }
      }
      
      console.log(`Round ${currentRoundIndex + 1} wins - A: ${roundWinsA}, B: ${roundWinsB}`);
      
      // If someone won the round (2 out of 3), skip to next round
      if (roundWinsA >= 2 || roundWinsB >= 2) {
        roundCompleted = true;
        const nextRoundIndex = currentRoundIndex + 1;
        if (nextRoundIndex < 5) {
          // Move to first set of next round
          nextGameIndex = nextRoundIndex * 3;
          console.log(`Round completed! Moving to round ${nextRoundIndex + 1}, game index ${nextGameIndex}`);
        }
      }
    }

    setGames(newGames);

    // Move to next game if available (only in live mode)
    if (isMatchLive && winner && !matchCompleted) {
      if (nextGameIndex < totalGames) {
        setCurrentGameIndex(nextGameIndex);
        console.log(`Setting current game index to ${nextGameIndex}`);
      }
    }
    
    // Recalculate games won when editing
    if (isEditing) {
      newGamesWonA = newGames.filter(g => g.winner === match.teamA._id).length;
      newGamesWonB = newGames.filter(g => g.winner === match.teamB._id).length;
      setGamesWonA(newGamesWonA);
      setGamesWonB(newGamesWonB);
    }
    
    // Check if match is won
    if (isMatchLive && winner) {
      if (isLeague) {
        if (newGamesWonA >= gamesToWin || newGamesWonB >= gamesToWin) {
          matchCompleted = true;
        }
      } else {
        // For non-league, check rounds won using updated newGames array
        let roundsWonA = 0;
        let roundsWonB = 0;
        for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
          const startIndex = roundIndex * 3;
          const endIndex = Math.min(startIndex + 3, totalGames);
          let setsWonA = 0;
          let setsWonB = 0;
          for (let i = startIndex; i < endIndex; i++) {
            if (newGames[i] && newGames[i].winner === match.teamA._id) {
              setsWonA++;
            }
            if (newGames[i] && newGames[i].winner === match.teamB._id) {
              setsWonB++;
            }
          }
          if (setsWonA >= 2) roundsWonA++;
          if (setsWonB >= 2) roundsWonB++;
        }
        
        console.log(`Total rounds won - A: ${roundsWonA}, B: ${roundsWonB}`);
        
        // Win 3 out of 5 rounds
        if (roundsWonA >= 3 || roundsWonB >= 3) {
          matchCompleted = true;
          console.log('Match won!');
        }
      }
    }

    // If match is completed, save immediately and update status
    if (matchCompleted) {
      try {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        await updateScore(match._id, {
          tableTennis: {
            games: newGames,
            gamesWonA: newGamesWonA,
            gamesWonB: newGamesWonB
          }
        });
        
        await axios.patch(
          `${API_URL}/api/schedule/${match._id}/status`,
          { status: 'Completed' },
          { withCredentials: true }
        );
        
        match.status = 'Completed';
        setMatchStatus('Completed');
        localStorage.removeItem(`undoHistory_${match._id}`);
        setIsEditing(false);
        
        return;
      } catch (error) {
        console.error('Error completing match:', error);
      }
    }

    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Set pending update indicator
    setPendingUpdate(true);
    if (onPendingUpdateChange) onPendingUpdateChange(true);

    // Debounce the server update
    const timeout = setTimeout(() => {
      updateScore(match._id, {
        tableTennis: {
          games: newGames,
          gamesWonA: newGamesWonA,
          gamesWonB: newGamesWonB
        }
      });
      setPendingUpdate(false);
      if (onPendingUpdateChange) onPendingUpdateChange(false);
    }, 800);

    setUpdateTimeout(timeout);
  };

  const handleDoneEditing = async () => {
    if (isSavingStatus) return;
    
    if (editedStatus !== match.status) {
      setIsSavingStatus(true);
      try {
        await axios.patch(
          `${API_URL}/api/schedule/${match._id}/status`,
          { status: editedStatus },
          { withCredentials: true }
        );
        
        window.location.reload();
        return;
      } catch (error) {
        console.error('Error changing status:', error);
        alert('Failed to change status: ' + (error.response?.data?.message || error.message));
        setIsSavingStatus(false);
        return;
      }
    }
    
    setIsEditing(false);
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;

    const previousState = undoHistory[undoHistory.length - 1];
    
    setGames(previousState.games);
    setGamesWonA(previousState.gamesWonA);
    setGamesWonB(previousState.gamesWonB);
    setCurrentGameIndex(previousState.currentGameIndex);

    setUndoHistory(prev => prev.slice(0, -1));

    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    setPendingUpdate(true);
    if (onPendingUpdateChange) onPendingUpdateChange(true);

    const timeout = setTimeout(() => {
      updateScore(match._id, {
        tableTennis: {
          games: previousState.games,
          gamesWonA: previousState.gamesWonA,
          gamesWonB: previousState.gamesWonB
        }
      });
      setPendingUpdate(false);
      if (onPendingUpdateChange) onPendingUpdateChange(false);
    }, 800);

    setUpdateTimeout(timeout);
  };

  const canUndo = () => {
    if (undoHistory.length === 0) return false;
    const allZero = games.every(g => g.teamAScore === 0 && g.teamBScore === 0);
    return !allZero;
  };

  const getGameStatus = (gameIndex) => {
    // Use currentGameIndex to determine active game
    if (gameIndex < currentGameIndex) return 'completed';
    if (gameIndex === currentGameIndex) return 'active';
    return 'upcoming';
  };

  // Group games by rounds
  const getGroupedGames = () => {
    const roundPattern = ['Single', 'Double', 'Single', 'Double', 'Single'];
    
    if (isLeague) {
      // For league, each round has 1 set (5 rounds total)
      return roundPattern.map((type, roundIndex) => ({
        roundNumber: roundIndex + 1,
        type: type,
        sets: [{ ...games[roundIndex], gameIndex: roundIndex, setNumber: 1 }]
      }));
    } else {
      // For non-league, each round has 3 sets (5 rounds x 3 sets = 15 games)
      return roundPattern.map((type, roundIndex) => {
        const startIndex = roundIndex * 3;
        return {
          roundNumber: roundIndex + 1,
          type: type,
          sets: games.slice(startIndex, startIndex + 3).map((game, setIdx) => ({
            ...game,
            gameIndex: startIndex + setIdx,
            setNumber: setIdx + 1
          }))
        };
      });
    }
  };

  const groupedGames = getGroupedGames();
  
  // Find which round contains the active game using currentGameIndex
  let activeRoundIndex = -1;
  if (isLeague) {
    activeRoundIndex = currentGameIndex;
  } else {
    activeRoundIndex = Math.floor(currentGameIndex / 3);
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      padding: isMobile ? '1rem' : '2rem',
      position: 'relative'
    }}>
      {/* Match Header */}
      <div style={{ 
        marginBottom: isMobile ? '1.5rem' : '2rem',
        paddingBottom: isMobile ? '0.75rem' : '1rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <div>
          <h3 style={{ color: '#FFD700', fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {match.game.name} - Match {String(match.matchNumber).padStart(2, '0')}
          </h3>
          <p style={{ color: '#888', fontSize: isMobile ? '0.8rem' : '0.9rem', marginBottom: '1rem' }}>
            {match.round} • Win {isLeague ? `${gamesToWin} of ${totalGames} games` : `3 of 5 rounds`}
          </p>
        </div>

        {/* Status and Controls */}
        <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {isEditing ? (
            <select
              value={editedStatus}
              onChange={(e) => setEditedStatus(e.target.value)}
              style={{
                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#FFD700',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Live">Live</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          ) : (
            <div style={{
              padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
              background: matchStatus === 'Live' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${matchStatus === 'Live' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              borderRadius: '0.5rem',
              color: matchStatus === 'Live' ? '#4ade80' : '#eab308',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.8rem' : '1rem'
            }}>
              {matchStatus}
            </div>
          )}

          {/* Undo Button */}
          {isMatchLive && canUndo() && (
            <button
              onClick={handleUndo}
              style={{
                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '0.5rem',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600'
              }}
            >
              Undo
            </button>
          )}

          {/* Edit/Done Button */}
          {matchStatus === 'Completed' && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                background: 'rgba(255, 215, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                borderRadius: '0.5rem',
                color: '#FFD700',
                cursor: 'pointer',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600'
              }}
            >
              Edit
            </button>
          )}

          {isEditing && (
            <button
              onClick={handleDoneEditing}
              disabled={isSavingStatus}
              style={{
                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '0.5rem',
                color: '#22c55e',
                cursor: isSavingStatus ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                opacity: isSavingStatus ? 0.5 : 1
              }}
            >
              {isSavingStatus ? 'Saving...' : 'Done'}
            </button>
          )}

          {pendingUpdate && (
            <span style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
              Saving...
            </span>
          )}
        </div>

        {/* Games/Rounds Won Display */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', marginBottom: '0.25rem' }}>
              {getTeamFullName(match.teamA)}
            </div>
            <div style={{ color: '#FFD700', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
              {(() => {
                if (isLeague) {
                  return gamesWonA;
                } else {
                  // Calculate rounds won for non-league
                  let roundsWon = 0;
                  for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                    const startIndex = roundIndex * 3;
                    const endIndex = Math.min(startIndex + 3, games.length);
                    let setsWonInRound = 0;
                    for (let i = startIndex; i < endIndex; i++) {
                      if (games[i] && games[i].winner === match.teamA._id) {
                        setsWonInRound++;
                      }
                    }
                    if (setsWonInRound >= 2) roundsWon++;
                  }
                  return roundsWon;
                }
              })()}
            </div>
          </div>
          <div style={{ color: '#888', fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 'bold' }}>
            VS
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', marginBottom: '0.25rem' }}>
              {getTeamFullName(match.teamB)}
            </div>
            <div style={{ color: '#FFD700', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
              {(() => {
                if (isLeague) {
                  return gamesWonB;
                } else {
                  // Calculate rounds won for non-league
                  let roundsWon = 0;
                  for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                    const startIndex = roundIndex * 3;
                    const endIndex = Math.min(startIndex + 3, games.length);
                    let setsWonInRound = 0;
                    for (let i = startIndex; i < endIndex; i++) {
                      if (games[i] && games[i].winner === match.teamB._id) {
                        setsWonInRound++;
                      }
                    }
                    if (setsWonInRound >= 2) roundsWon++;
                  }
                  return roundsWon;
                }
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div style={{ display: 'grid', gap: isMobile ? '1rem' : '1.5rem' }}>
        {groupedGames.map((round, roundIndex) => {
          // Determine if this round is active (only when match is Live)
          const isActiveRound = isMatchLive && roundIndex === activeRoundIndex;
          const isCompletedRound = roundIndex < activeRoundIndex || (matchStatus === 'Completed' && roundIndex <= activeRoundIndex);
          
          // For completed matches, show last played round at top
          // For live matches, show active round at top
          let displayOrder = roundIndex;
          if (matchStatus === 'Completed') {
            // Show rounds in reverse order (last played first)
            displayOrder = -roundIndex;
          } else if (isActiveRound) {
            // Active round goes to top
            displayOrder = -1000;
          }
          
          return (
            <div
              key={roundIndex}
              style={{
                background: isActiveRound ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isActiveRound ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '1rem',
                padding: isMobile ? '1rem' : '1.5rem',
                order: displayOrder
              }}
            >
              {/* Round Header */}
              <div style={{ 
                marginBottom: isMobile ? '0.75rem' : '1rem',
                paddingBottom: isMobile ? '0.5rem' : '0.75rem',
                borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <h4 style={{ 
                    color: '#FFD700', 
                    fontSize: isMobile ? '1rem' : '1.25rem', 
                    fontWeight: 'bold'
                  }}>
                    Round {round.roundNumber}
                  </h4>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: round.type === 'Single' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                    border: `1px solid ${round.type === 'Single' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
                    borderRadius: '0.375rem',
                    color: round.type === 'Single' ? '#3b82f6' : '#a855f7',
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    fontWeight: '600'
                  }}>
                    {round.type}
                  </span>
                  {/* Round Winner Badge for non-league completed rounds */}
                  {!isLeague && isCompletedRound && (() => {
                    // Count sets won in this round
                    let setsWonA = 0;
                    let setsWonB = 0;
                    round.sets.forEach(set => {
                      if (set && set.winner === match.teamA._id) setsWonA++;
                      if (set && set.winner === match.teamB._id) setsWonB++;
                    });
                    
                    if (setsWonA >= 2 || setsWonB >= 2) {
                      const roundWinner = setsWonA >= 2 ? match.teamA : match.teamB;
                      return (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          borderRadius: '0.375rem',
                          color: '#22c55e',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          fontWeight: '600'
                        }}>
                          Won by {getTeamFullName(roundWinner)}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                {isActiveRound && isMatchLive && (
                  <p style={{ color: '#22c55e', fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '600' }}>
                    Currently Playing
                  </p>
                )}
                {isCompletedRound && (
                  <p style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                    Completed
                  </p>
                )}
              </div>

              {/* Sets in this round */}
              <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : '1rem' }}>
                {round.sets.map((set) => {
                  const status = getGameStatus(set.gameIndex);
                  const isActive = status === 'active';
                  const isCompleted = status === 'completed';
                  
                  return (
                    <div
                      key={set.gameIndex}
                      style={{
                        background: isActive ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isActive ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '0.75rem',
                        padding: isMobile ? '0.75rem' : '1rem'
                      }}
                    >
                      {/* Set Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            color: isActive ? '#FFD700' : '#888', 
                            fontWeight: 'bold', 
                            fontSize: isMobile ? '0.85rem' : '0.95rem' 
                          }}>
                            {isLeague ? '' : `Set ${set.setNumber}`}
                          </span>
                          <span style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                            (First to {set.maxScore})
                          </span>
                        </div>
                        {isCompleted && set.winner && (
                          <span style={{ 
                            color: '#22c55e', 
                            fontSize: isMobile ? '0.75rem' : '0.85rem',
                            fontWeight: '600'
                          }}>
                            Won by {set.winner === match.teamA._id ? getTeamFullName(match.teamA) : getTeamFullName(match.teamB)}
                          </span>
                        )}
                      </div>

                      {/* Score Display */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: isMobile ? '0.5rem' : '1rem', alignItems: 'center' }}>
                        {/* Team A */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ color: '#fff', fontSize: isMobile ? '0.85rem' : '0.95rem', textAlign: 'center' }}>
                            {getTeamFullName(match.teamA)}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            {(isMatchLive || isEditing) && (
                              <button
                                onClick={() => handleScoreUpdate(set.gameIndex, 'A', false)}
                                style={{
                                  width: isMobile ? '2rem' : '2.5rem',
                                  height: isMobile ? '2rem' : '2.5rem',
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  borderRadius: '0.5rem',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: isMobile ? '1rem' : '1.25rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                -
                              </button>
                            )}
                            <div style={{
                              minWidth: isMobile ? '3rem' : '4rem',
                              padding: isMobile ? '0.5rem' : '0.75rem',
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '0.5rem',
                              color: set.winner === match.teamA._id ? '#FFD700' : (isActive ? '#FFD700' : '#888'),
                              fontSize: isMobile ? '1.25rem' : '1.5rem',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}>
                              {set.teamAScore}
                            </div>
                            {(isMatchLive || isEditing) && (
                              <button
                                onClick={() => handleScoreUpdate(set.gameIndex, 'A', true)}
                                style={{
                                  width: isMobile ? '2rem' : '2.5rem',
                                  height: isMobile ? '2rem' : '2.5rem',
                                  background: 'rgba(34, 197, 94, 0.2)',
                                  border: '1px solid rgba(34, 197, 94, 0.4)',
                                  borderRadius: '0.5rem',
                                  color: '#22c55e',
                                  cursor: 'pointer',
                                  fontSize: isMobile ? '1rem' : '1.25rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>

                        {/* VS */}
                        <div style={{ color: '#888', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 'bold' }}>
                          VS
                        </div>

                        {/* Team B */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ color: '#fff', fontSize: isMobile ? '0.85rem' : '0.95rem', textAlign: 'center' }}>
                            {getTeamFullName(match.teamB)}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            {(isMatchLive || isEditing) && (
                              <button
                                onClick={() => handleScoreUpdate(set.gameIndex, 'B', false)}
                                style={{
                                  width: isMobile ? '2rem' : '2.5rem',
                                  height: isMobile ? '2rem' : '2.5rem',
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  borderRadius: '0.5rem',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: isMobile ? '1rem' : '1.25rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                -
                              </button>
                            )}
                            <div style={{
                              minWidth: isMobile ? '3rem' : '4rem',
                              padding: isMobile ? '0.5rem' : '0.75rem',
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '0.5rem',
                              color: set.winner === match.teamB._id ? '#FFD700' : (isActive ? '#FFD700' : '#888'),
                              fontSize: isMobile ? '1.25rem' : '1.5rem',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}>
                              {set.teamBScore}
                            </div>
                            {(isMatchLive || isEditing) && (
                              <button
                                onClick={() => handleScoreUpdate(set.gameIndex, 'B', true)}
                                style={{
                                  width: isMobile ? '2rem' : '2.5rem',
                                  height: isMobile ? '2rem' : '2.5rem',
                                  background: 'rgba(34, 197, 94, 0.2)',
                                  border: '1px solid rgba(34, 197, 94, 0.4)',
                                  borderRadius: '0.5rem',
                                  color: '#22c55e',
                                  cursor: 'pointer',
                                  fontSize: isMobile ? '1rem' : '1.25rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableTennisScoreCard;
