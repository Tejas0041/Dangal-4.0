import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import TableTennisScoreCard from '../components/TableTennisScoreCard_NEW';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScoreManagement = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [matches, setMatches] = useState([]);
  const [liveMatchesCount, setLiveMatchesCount] = useState(0);
  const [completedMatchesCount, setCompletedMatchesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showEndMatchConfirm, setShowEndMatchConfirm] = useState(false);
  const [matchToEnd, setMatchToEnd] = useState(null);
  const [endingMatch, setEndingMatch] = useState(false);
  const [showWinnerSelect, setShowWinnerSelect] = useState(false);
  const [tieMatchData, setTieMatchData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isPendingSave, setIsPendingSave] = useState(false);
  const [showEndHalfConfirm, setShowEndHalfConfirm] = useState(false);
  const [endingHalf, setEndingHalf] = useState(false);
  const [matchToEndHalf, setMatchToEndHalf] = useState(null);
  
  // Search and filter states
  const [searchMatchNumber, setSearchMatchNumber] = useState('');
  const [filterHall, setFilterHall] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [halls, setHalls] = useState([]);
  const [games, setGames] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [activeTab]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const [matchesRes, hallsRes, gamesRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedule`, { withCredentials: true }),
        axios.get(`${API_URL}/api/halls/all`, { withCredentials: true }),
        axios.get(`${API_URL}/api/games`, { withCredentials: true })
      ]);
      
      // Count live and completed matches
      const liveCount = matchesRes.data.filter(match => match.status === 'Live').length;
      const completedCount = matchesRes.data.filter(match => match.status === 'Completed').length;
      
      setLiveMatchesCount(liveCount);
      setCompletedMatchesCount(completedCount);
      
      // Filter matches based on active tab
      const filteredMatches = matchesRes.data.filter(match => 
        activeTab === 'live' ? match.status === 'Live' : match.status === 'Completed'
      );
      setMatches(filteredMatches);
      setHalls(hallsRes.data);
      setGames(gamesRes.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setToast({ message: 'Failed to load matches', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (matchId, scoreData) => {
    try {
      const response = await axios.patch(`${API_URL}/api/schedule/${matchId}/score`, scoreData, { withCredentials: true });
      // Removed toast notification for score updates
      
      // Don't update selectedMatch to prevent re-rendering and flickering
      // The local state in score cards already has the correct values
      
      // Update in the matches list for when user goes back
      setMatches(prevMatches => 
        prevMatches.map(match => match._id === matchId ? response.data : match)
      );
    } catch (error) {
      setToast({ message: 'Failed to update score', type: 'error' });
    }
  };

  const endMatch = async (match, scoreData) => {
    let totalA, totalB;

    // Handle Kabaddi scoring
    if (scoreData.teamA && scoreData.teamB) {
      totalA = scoreData.teamA.raidPoints + scoreData.teamA.tacklePoints + scoreData.teamA.bonusPoints + scoreData.teamA.allOutPoints + scoreData.teamA.extraPoints;
      totalB = scoreData.teamB.raidPoints + scoreData.teamB.tacklePoints + scoreData.teamB.bonusPoints + scoreData.teamB.allOutPoints + scoreData.teamB.extraPoints;
    } 
    // Handle Table Tennis scoring
    else if (scoreData.gamesWonA !== undefined && scoreData.gamesWonB !== undefined) {
      totalA = scoreData.gamesWonA;
      totalB = scoreData.gamesWonB;
    }

    if (totalA === totalB) {
      // Tie - ask user to select winner
      setTieMatchData({ match, scores: scoreData, totalA, totalB });
      setShowWinnerSelect(true);
    } else {
      // Clear winner - show confirmation
      const winner = totalA > totalB ? match.teamA._id : match.teamB._id;
      setMatchToEnd({ matchId: match._id, winner });
      setShowEndMatchConfirm(true);
    }
  };

  const confirmEndMatch = async () => {
    setEndingMatch(true);
    try {
      await axios.patch(`${API_URL}/api/schedule/${matchToEnd.matchId}/status`, 
        { status: 'Completed', winner: matchToEnd.winner }, 
        { withCredentials: true }
      );
      setToast({ message: 'Match ended successfully!', type: 'success' });
      
      // Clear undo history from localStorage when match ends
      localStorage.removeItem(`undoHistory_${matchToEnd.matchId}`);
      localStorage.removeItem(`kabaddiUndoHistory_${matchToEnd.matchId}`);
      
      // Update counts
      setLiveMatchesCount(prev => Math.max(0, prev - 1));
      setCompletedMatchesCount(prev => prev + 1);
      
      // Remove from current list and go back
      setMatches(prevMatches => prevMatches.filter(match => match._id !== matchToEnd.matchId));
      setSelectedMatch(null);
    } catch (error) {
      setToast({ message: 'Failed to end match', type: 'error' });
    } finally {
      setEndingMatch(false);
      setShowEndMatchConfirm(false);
      setMatchToEnd(null);
    }
  };

  const cancelEndMatch = () => {
    setShowEndMatchConfirm(false);
    setMatchToEnd(null);
  };

  const confirmEndHalf = async () => {
    setEndingHalf(true);
    try {
      const response = await axios.patch(
        `${API_URL}/api/schedule/${matchToEndHalf}/kabaddi/end-half`,
        {},
        { withCredentials: true }
      );
      setToast({ message: 'First half ended successfully!', type: 'success' });
      
      // Update the selected match with the response data
      setSelectedMatch(response.data);
      
      // Close dialog
      setEndingHalf(false);
      setShowEndHalfConfirm(false);
      setMatchToEndHalf(null);
    } catch (error) {
      console.error('Error ending half:', error);
      setToast({
        message: 'Failed to end half: ' + (error.response?.data?.message || error.message),
        type: 'error'
      });
      setEndingHalf(false);
      setShowEndHalfConfirm(false);
    }
  };

  const selectWinner = async (winnerId) => {
    try {
      await axios.patch(`${API_URL}/api/schedule/${tieMatchData.match._id}/status`, 
        { status: 'Completed', winner: winnerId }, 
        { withCredentials: true }
      );
      setToast({ message: 'Match ended successfully!', type: 'success' });
      
      // Clear undo history from localStorage when match ends
      localStorage.removeItem(`undoHistory_${tieMatchData.match._id}`);
      localStorage.removeItem(`kabaddiUndoHistory_${tieMatchData.match._id}`);
      
      // Update counts
      setLiveMatchesCount(prev => Math.max(0, prev - 1));
      setCompletedMatchesCount(prev => prev + 1);
      
      // Remove from current list and go back
      setMatches(prevMatches => prevMatches.filter(match => match._id !== tieMatchData.match._id));
      setSelectedMatch(null);
    } catch (error) {
      setToast({ message: 'Failed to end match', type: 'error' });
    } finally {
      setShowWinnerSelect(false);
      setTieMatchData(null);
    }
  };

  const cancelWinnerSelect = () => {
    setShowWinnerSelect(false);
    setTieMatchData(null);
  };

  const getTeamFullName = (team) => {
    if (!team) return 'Unknown Team';
    const hallName = team.hallId?.name || 'Unknown Hall';
    if (team.secondTeamName) {
      return `${team.secondTeamName} (Team ${team.teamName} - ${hallName})`;
    }
    return `${hallName} (Team ${team.teamName})`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // If a match is selected, show the score editor
  if (selectedMatch) {
    return (
      <AdminLayout>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '0' : '0' }}>
          {/* Back Button and Saving Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '1rem' : '2rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                setSelectedMatch(null);
                fetchMatches(); // Refresh the matches list
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: isMobile ? '0.65rem 1rem' : '0.75rem 1.5rem',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#FFD700',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: isMobile ? '0.9rem' : '1rem',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              }}
            >
              <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Matches
            </button>
            
            {isPendingSave && (
              <div style={{
                padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '0.5rem',
                color: '#60a5fa',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15"></circle>
                </svg>
                Saving...
              </div>
            )}
          </div>

          {selectedMatch.game.name.toUpperCase() === 'KABADDI' ? (
            <KabaddiScoreCard 
              match={selectedMatch} 
              updateScore={updateScore}
              endMatch={(match, scores) => endMatch(match, scores)}
              getTeamFullName={getTeamFullName}
              isLive={selectedMatch.status === 'Live'}
              isMobile={isMobile}
              onPendingUpdateChange={setIsPendingSave}
              onEndHalf={() => {
                setMatchToEndHalf(selectedMatch._id);
                setShowEndHalfConfirm(true);
              }}
            />
          ) : selectedMatch.game.name.toUpperCase() === 'TABLE TENNIS' ? (
            <TableTennisScoreCard 
              match={selectedMatch} 
              updateScore={updateScore}
              endMatch={(match, gamesWonA, gamesWonB) => endMatch(match, { gamesWonA, gamesWonB })}
              getTeamFullName={getTeamFullName}
              isLive={selectedMatch.status === 'Live'}
              isMobile={isMobile}
              onPendingUpdateChange={setIsPendingSave}
            />
          ) : selectedMatch.game.name.toUpperCase() === 'TUG OF WAR' ? (
            <TugOfWarScoreCard 
              match={selectedMatch} 
              updateScore={updateScore}
              setSelectedMatch={setSelectedMatch}
              setMatches={setMatches}
              activeTab={activeTab}
              getTeamFullName={getTeamFullName}
              isLive={selectedMatch.status === 'Live'}
              isMobile={isMobile}
            />
          ) : (
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              padding: '2rem',
              textAlign: 'center',
              color: '#888'
            }}>
              Score management for {selectedMatch.game.name} coming soon...
            </div>
          )}

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          {showEndMatchConfirm && (
            <ConfirmDialog
              title="End Match"
              message="Are you sure you want to end this match? This will mark it as Completed."
              onConfirm={confirmEndMatch}
              onCancel={cancelEndMatch}
              confirmText="End Match"
              confirmColor="#FFD700"
              icon="warning"
              loading={endingMatch}
            />
          )}

          {showEndHalfConfirm && (
            <ConfirmDialog
              title="End First Half"
              message="End first half? Timer will reset for second half."
              onConfirm={confirmEndHalf}
              onCancel={() => setShowEndHalfConfirm(false)}
              confirmText="End 1st Half"
              confirmColor="#FFD700"
              icon="warning"
              loading={endingHalf}
            />
          )}

          {showWinnerSelect && tieMatchData && (
            <WinnerSelectDialog
              match={tieMatchData.match}
              totalA={tieMatchData.totalA}
              totalB={tieMatchData.totalB}
              onSelectWinner={selectWinner}
              onCancel={cancelWinnerSelect}
              getTeamFullName={getTeamFullName}
            />
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#FFD700',
            marginBottom: '0.5rem'
          }}>
            Score Management
          </h1>
          <p style={{ color: '#888', fontSize: '0.95rem' }}>
            Manage live match scores and view completed matches
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          borderBottom: '2px solid rgba(255, 215, 0, 0.2)'
        }}>
          <button
            onClick={() => setActiveTab('live')}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'live' ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'live' ? '3px solid #FFD700' : '3px solid transparent',
              color: activeTab === 'live' ? '#FFD700' : '#888',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s',
              marginBottom: '-2px'
            }}
          >
            Live Matches ({liveMatchesCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'completed' ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'completed' ? '3px solid #FFD700' : '3px solid transparent',
              color: activeTab === 'completed' ? '#FFD700' : '#888',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s',
              marginBottom: '-2px'
            }}
          >
            Completed Matches ({completedMatchesCount})
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            {/* Search by Match Number */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700', fontSize: '0.9rem' }}>
                Search Match Number
              </label>
              <input
                type="text"
                placeholder="Enter match number..."
                value={searchMatchNumber}
                onChange={(e) => setSearchMatchNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Filter by Hall */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700', fontSize: '0.9rem' }}>
                Filter by Hall/Hostel
              </label>
              <select
                value={filterHall}
                onChange={(e) => setFilterHall(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>All Halls/Hostels</option>
                {halls.map(hall => (
                  <option key={hall._id} value={hall._id} style={{ background: '#1a1a1a', color: '#fff' }}>{hall.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Game */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700', fontSize: '0.9rem' }}>
                Filter by Game
              </label>
              <select
                value={filterGame}
                onChange={(e) => setFilterGame(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>All Games</option>
                {games.map(game => (
                  <option key={game._id} value={game._id} style={{ background: '#1a1a1a', color: '#fff' }}>{game.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchMatchNumber || filterHall || filterGame) && (
            <button
              onClick={() => {
                setSearchMatchNumber('');
                setFilterHall('');
                setFilterGame('');
              }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#FFD700',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Matches List */}
        {loading ? (
          <Loader />
        ) : (() => {
          // Apply filters
          const filteredMatches = matches.filter(match => {
            // Search by match number
            if (searchMatchNumber && !match.matchNumber.toString().includes(searchMatchNumber)) {
              return false;
            }
            
            // Filter by hall
            if (filterHall) {
              const teamAHallId = match.teamA?.hallId?._id || match.teamA?.hallId;
              const teamBHallId = match.teamB?.hallId?._id || match.teamB?.hallId;
              if (teamAHallId !== filterHall && teamBHallId !== filterHall) {
                return false;
              }
            }
            
            // Filter by game
            if (filterGame) {
              const gameId = match.game?._id || match.game;
              if (gameId !== filterGame) {
                return false;
              }
            }
            
            return true;
          });

          return filteredMatches.length === 0 ? (
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              padding: '4rem 2rem',
              textAlign: 'center',
              color: '#888'
            }}>
              <p style={{ fontSize: '1.1rem' }}>
                {searchMatchNumber || filterHall || filterGame 
                  ? 'No matches found matching your filters' 
                  : `No ${activeTab === 'live' ? 'live' : 'completed'} matches found`}
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {filteredMatches.map((match) => (
              <div
                key={match._id}
                onClick={() => setSelectedMatch(match)}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  padding: '1.5rem',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Match Header */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: '#FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="10 8 16 12 10 16 10 8"></polygon>
                    </svg>
                    {match.game.name}
                  </div>
                  <div style={{
                    padding: '0.4rem 0.875rem',
                    background: 'rgba(255, 215, 0, 0.15)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#FFD700',
                    fontSize: '0.85rem',
                    fontWeight: '700'
                  }}>
                    Match {String(match.matchNumber).padStart(2, '0')}
                  </div>
                </div>

                {/* Teams */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'rgba(255, 215, 0, 0.05)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Team A</div>
                    <div style={{ 
                      color: '#fff', 
                      fontSize: '0.95rem', 
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <span>{getTeamFullName(match.teamA)}</span>
                      {match.status === 'Completed' && match.result?.winner && 
                       match.result.winner._id === match.teamA._id && (
                        <span style={{
                          padding: '0.25rem 0.625rem',
                          background: 'rgba(255, 215, 0, 0.2)',
                          border: '1px solid rgba(255, 215, 0, 0.4)',
                          borderRadius: '0.375rem',
                          color: '#FFD700',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                          </svg>
                          Winner
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#FFD700', 
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    margin: '0.5rem 0'
                  }}>
                    VS
                  </div>
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'rgba(255, 215, 0, 0.05)',
                    borderRadius: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Team B</div>
                    <div style={{ 
                      color: '#fff', 
                      fontSize: '0.95rem', 
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <span>{getTeamFullName(match.teamB)}</span>
                      {match.status === 'Completed' && match.result?.winner && 
                       match.result.winner._id === match.teamB._id && (
                        <span style={{
                          padding: '0.25rem 0.625rem',
                          background: 'rgba(255, 215, 0, 0.2)',
                          border: '1px solid rgba(255, 215, 0, 0.4)',
                          borderRadius: '0.375rem',
                          color: '#FFD700',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                          </svg>
                          Winner
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255, 215, 0, 0.1)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Date</div>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      {formatDate(match.date)}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255, 215, 0, 0.1)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Time</div>
                    <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: '500' }}>
                      {formatTime(match.time)}
                    </div>
                  </div>
                </div>

                {/* Status & Round */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.4rem 0.875rem',
                    background: 'rgba(255, 215, 0, 0.15)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#FFD700',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {match.round}
                  </span>
                  <span style={{
                    padding: '0.4rem 0.875rem',
                    background: match.status === 'Live' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    border: `1px solid ${match.status === 'Live' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                    borderRadius: '0.5rem',
                    color: match.status === 'Live' ? '#4ade80' : '#eab308',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {match.status}
                  </span>
                </div>

                {/* Click to manage indicator */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 215, 0, 0.05)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  color: '#FFD700',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Click to Manage Score
                </div>
              </div>
            ))}
          </div>
          );
        })()}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
};

// Tug of War Score Card Component
const TugOfWarScoreCard = ({ match, updateScore, setSelectedMatch, setMatches, activeTab, getTeamFullName, isLive, isMobile = false }) => {
  const [selectedWinner, setSelectedWinner] = useState(match.result?.winner?._id || match.result?.winner || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedStatus, setEditedStatus] = useState(match.status);

  // Sync selectedWinner with match.result.winner when match changes
  useEffect(() => {
    setSelectedWinner(match.result?.winner?._id || match.result?.winner || null);
  }, [match._id, match.result?.winner]);

  // Helper function to compare IDs (handles both ObjectId and string)
  const isWinner = (teamId) => {
    if (!selectedWinner || !teamId) return false;
    return String(selectedWinner) === String(teamId);
  };

  const handleSelectWinner = (teamId) => {
    setSelectedWinner(teamId);
  };

  const handleStatusChange = async (newStatus) => {
    setEditedStatus(newStatus);
    
    // If changing from Completed to Live, clear the winner
    if (match.status === 'Completed' && newStatus === 'Live') {
      setSelectedWinner(null);
      try {
        // Clear winner in database
        await axios.patch(
          `${API_URL}/api/schedule/${match._id}/score`,
          { winner: null },
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error clearing winner:', error);
      }
    }
  };

  const handleDoneEditing = async () => {
    if (isSubmitting) return;
    
    // If status changed, update it
    if (editedStatus !== match.status) {
      setIsSubmitting(true);
      try {
        await axios.patch(
          `${API_URL}/api/schedule/${match._id}/status`,
          { status: editedStatus, winner: selectedWinner },
          { withCredentials: true }
        );
        
        // Reload to refresh the list and counts
        window.location.reload();
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status: ' + (error.response?.data?.message || error.message));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    // Just exit edit mode
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    if (!selectedWinner || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting winner:', selectedWinner);
      
      // First update the winner
      const scoreResponse = await axios.patch(
        `${API_URL}/api/schedule/${match._id}/score`, 
        { winner: selectedWinner }, 
        { withCredentials: true }
      );
      
      console.log('Score Response:', scoreResponse.data);
      
      // Then update the status to Completed
      const statusResponse = await axios.patch(
        `${API_URL}/api/schedule/${match._id}/status`, 
        { status: 'Completed', winner: selectedWinner }, 
        { withCredentials: true }
      );
      
      console.log('Status Response:', statusResponse.data);
      
      // Update counts
      if (activeTab === 'live') {
        // Moving from Live to Completed
        setMatches(prevMatches => prevMatches.filter(m => m._id !== match._id));
      }
      
      // Close the score menu
      setSelectedMatch(null);
      
      // Refetch to update counts
      window.location.reload();
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating winner:', error);
      alert('Failed to update winner: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      padding: '2rem',
      position: 'relative'
    }}>
      {/* Match Header */}
      <div style={{ marginBottom: '2rem' }}>
        {/* Title */}
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ 
            color: '#FFD700', 
            fontSize: isMobile ? '1.25rem' : '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem' 
          }}>
            {match.game.name} - Match {String(match.matchNumber).padStart(2, '0')}
          </h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>{match.round}</p>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '0.5rem' : '1rem', 
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          {/* Status Display/Dropdown */}
          {isEditing ? (
            <select
              value={editedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#FFD700',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Scheduled" style={{ background: '#1a1a1a', color: '#FFD700' }}>Scheduled</option>
              <option value="Live" style={{ background: '#1a1a1a', color: '#FFD700' }}>Live</option>
              <option value="Completed" style={{ background: '#1a1a1a', color: '#FFD700' }}>Completed</option>
              <option value="Cancelled" style={{ background: '#1a1a1a', color: '#FFD700' }}>Cancelled</option>
            </select>
          ) : (
            <div style={{
              padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
              background: isLive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              borderRadius: '0.5rem',
              color: isLive ? '#4ade80' : '#eab308',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}>
              {match.status}
            </div>
          )}
          
          {!isLive && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: isMobile ? '0.4rem 0.875rem' : '0.5rem 1.5rem',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '0.5rem',
                color: '#3b82f6',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Winner
            </button>
          )}
          {isEditing && (
            <button
              onClick={handleDoneEditing}
              disabled={isSubmitting}
              style={{
                padding: isMobile ? '0.4rem 0.875rem' : '0.5rem 1.5rem',
                background: isSubmitting ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '0.5rem',
                color: '#4ade80',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15"></circle>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Done Editing
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Teams Display */}
      <div style={{ 
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : '1fr auto 1fr', 
        gap: isMobile ? '1.5rem' : '3rem', 
        alignItems: 'center',
        marginTop: isMobile ? '2rem' : '3rem'
      }}>
        {/* Team A */}
        <div 
          onClick={() => (isLive || isEditing) && handleSelectWinner(match.teamA._id)}
          style={{
            padding: isMobile ? '1.5rem' : '2rem',
            background: isWinner(match.teamA._id)
              ? 'rgba(255, 215, 0, 0.2)' 
              : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '1rem',
            border: isWinner(match.teamA._id)
              ? '2px solid rgba(255, 215, 0, 0.5)' 
              : '1px solid rgba(255, 215, 0, 0.1)',
            textAlign: 'center',
            cursor: (isLive || isEditing) ? 'pointer' : 'default',
            transition: 'all 0.3s',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (isLive || isEditing) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (isLive || isEditing) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = isWinner(match.teamA._id)
                ? 'rgba(255, 215, 0, 0.2)' 
                : 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          {isWinner(match.teamA._id) && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Winner
            </div>
          )}
          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>
            TEAM A
          </div>
          <div style={{ 
            color: '#fff', 
            fontSize: isMobile ? '1.1rem' : '1.5rem', 
            fontWeight: 'bold',
            wordBreak: 'break-word'
          }}>
            {getTeamFullName(match.teamA)}
          </div>
        </div>

        {/* VS Divider */}
        <div style={{
          color: '#FFD700',
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          opacity: 0.5,
          textAlign: 'center'
        }}>
          VS
        </div>

        {/* Team B */}
        <div 
          onClick={() => (isLive || isEditing) && handleSelectWinner(match.teamB._id)}
          style={{
            padding: isMobile ? '1.5rem' : '2rem',
            background: isWinner(match.teamB._id)
              ? 'rgba(255, 215, 0, 0.2)' 
              : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '1rem',
            border: isWinner(match.teamB._id)
              ? '2px solid rgba(255, 215, 0, 0.5)' 
              : '1px solid rgba(255, 215, 0, 0.1)',
            textAlign: 'center',
            cursor: (isLive || isEditing) ? 'pointer' : 'default',
            transition: 'all 0.3s',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (isLive || isEditing) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (isLive || isEditing) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = isWinner(match.teamB._id)
                ? 'rgba(255, 215, 0, 0.2)' 
                : 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          {isWinner(match.teamB._id) && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Winner
            </div>
          )}
          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>
            TEAM B
          </div>
          <div style={{ 
            color: '#fff', 
            fontSize: isMobile ? '1.1rem' : '1.5rem', 
            fontWeight: 'bold',
            wordBreak: 'break-word'
          }}>
            {getTeamFullName(match.teamB)}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      {(isLive || isEditing) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem',
          marginTop: '3rem' 
        }}>
          {isEditing && (
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedWinner(match.result?.winner || null);
              }}
              style={{
                padding: '0.75rem 2rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '0.5rem',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!selectedWinner || isSubmitting}
            style={{
              padding: '0.75rem 2rem',
              background: (selectedWinner && !isSubmitting)
                ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '0.5rem',
              color: (selectedWinner && !isSubmitting) ? '#000' : '#666',
              cursor: (selectedWinner && !isSubmitting) ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'all 0.3s',
              boxShadow: (selectedWinner && !isSubmitting) ? '0 4px 12px rgba(255, 215, 0, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (selectedWinner && !isSubmitting) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 215, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedWinner && !isSubmitting) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Saving...
              </>
            ) : (
              isEditing ? 'Update Winner' : 'Submit Winner'
            )}
          </button>
        </div>
      )}

      {/* Instructions */}
      {(isLive || isEditing) && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          textAlign: 'center',
          color: '#3b82f6',
          fontSize: '0.9rem'
        }}>
          Click on a team to select the winner, then click Submit
        </div>
      )}
    </div>
  );
};

// Kabaddi Score Card Component
const KabaddiScoreCard = ({ match, updateScore, endMatch, getTeamFullName, isLive, isMobile = false, onPendingUpdateChange, onEndHalf }) => {
  const [scores, setScores] = useState({
    teamA: {
      raidPoints: 0,
      tacklePoints: 0,
      bonusPoints: 0,
      allOutPoints: 0,
      extraPoints: 0,
    },
    teamB: {
      raidPoints: 0,
      tacklePoints: 0,
      bonusPoints: 0,
      allOutPoints: 0,
      extraPoints: 0,
    }
  });
  const [undoHistory, setUndoHistory] = useState([]); // Track history for undo
  const [updateTimeout, setUpdateTimeout] = useState(null); // Debounce timeout
  const [pendingUpdate, setPendingUpdate] = useState(false); // Track if update is pending
  const [lastMatchId, setLastMatchId] = useState(null); // Track match ID changes
  const [isEditing, setIsEditing] = useState(false); // Track edit mode for completed matches
  const [editedStatus, setEditedStatus] = useState(match.status); // Track edited status
  
  // Timer state
  const [timer, setTimer] = useState({
    minutes: 10,
    seconds: 0,
    centiseconds: 0,
    isRunning: false,
    isVisible: true
  });
  const [timerInterval, setTimerInterval] = useState(null);
  const [currentHalf, setCurrentHalf] = useState(1);
  const [halfTimeScores, setHalfTimeScores] = useState(null);
  const [timerRate, setTimerRate] = useState(1.0);

  // Load undo history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(`kabaddiUndoHistory_${match._id}`);
    if (savedHistory) {
      try {
        setUndoHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse undo history:', e);
      }
    }
  }, [match._id]);

  // Fetch timer rate from event settings
  useEffect(() => {
    const fetchTimerRate = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/event/settings`, { withCredentials: true });
        setTimerRate(response.data.kabaddiTimerRate || 1.0);
      } catch (error) {
        console.error('Error fetching timer rate:', error);
      }
    };
    fetchTimerRate();
  }, []);

  // Save undo history to localStorage whenever it changes
  useEffect(() => {
    if (undoHistory.length > 0) {
      localStorage.setItem(`kabaddiUndoHistory_${match._id}`, JSON.stringify(undoHistory));
    } else {
      localStorage.removeItem(`kabaddiUndoHistory_${match._id}`);
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

  // Load scores from match data only on initial mount or when match ID changes
  useEffect(() => {
    const matchIdChanged = lastMatchId !== match._id;
    
    // Only load from server when match ID actually changes (switching matches)
    if (matchIdChanged) {
      if (match.result) {
        setScores({
          teamA: {
            raidPoints: match.result.teamAScore?.raidPoints || 0,
            tacklePoints: match.result.teamAScore?.tacklePoints || 0,
            bonusPoints: match.result.teamAScore?.bonusPoints || 0,
            allOutPoints: match.result.teamAScore?.allOutPoints || 0,
            extraPoints: match.result.teamAScore?.extraPoints || 0,
          },
          teamB: {
            raidPoints: match.result.teamBScore?.raidPoints || 0,
            tacklePoints: match.result.teamBScore?.tacklePoints || 0,
            bonusPoints: match.result.teamBScore?.bonusPoints || 0,
            allOutPoints: match.result.teamBScore?.allOutPoints || 0,
            extraPoints: match.result.teamBScore?.extraPoints || 0,
          }
        });
      }
      setLastMatchId(match._id);
    }
  }, [match._id, lastMatchId, match.result]);

  // Load timer and half-time data from match
  useEffect(() => {
    if (match.result?.kabaddi) {
      const kabaddiData = match.result.kabaddi;
      if (kabaddiData.timer) {
        // Ensure isVisible is always set (default to true if not present)
        setTimer({
          ...kabaddiData.timer,
          isVisible: kabaddiData.timer.isVisible !== undefined ? kabaddiData.timer.isVisible : true
        });
      }
      if (kabaddiData.currentHalf) {
        setCurrentHalf(kabaddiData.currentHalf);
      }
      if (kabaddiData.halfTimeScores) {
        setHalfTimeScores(kabaddiData.halfTimeScores);
      }
    }
  }, [match.result]);

  // Sync timer with server
  const syncTimer = useCallback(async (newTimer) => {
    try {
      await axios.patch(
        `${API_URL}/api/schedule/${match._id}/kabaddi/timer`,
        newTimer,
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Error syncing timer:', error);
    }
  }, [match._id]);

  // Timer rate visibility state
  const [showTimerRate, setShowTimerRate] = useState(false);
  
  // Debounce timer for rate updates
  const [rateUpdateTimeout, setRateUpdateTimeout] = useState(null);
  const [pendingRateUpdate, setPendingRateUpdate] = useState(null);

  // Spacebar to play/pause timer (desktop only)
  useEffect(() => {
    // Only enable on desktop (not mobile)
    if (isMobile) return;

    const handleKeyPress = (e) => {
      // Check if not in an input/textarea
      if (e.target.tagName !== 'INPUT' && 
          e.target.tagName !== 'TEXTAREA' &&
          !e.target.isContentEditable) {
        
        // Spacebar: Toggle timer
        if (e.code === 'Space') {
          e.preventDefault(); // Prevent page scroll
          
          // Toggle timer using the current state
          setTimer(prev => {
            const newTimer = { ...prev, isRunning: !prev.isRunning };
            syncTimer(newTimer);
            return newTimer;
          });
        }
        
        // S key: Sync timer and refetch timer rate
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          syncTimer(timer);
          
          // Refetch timer rate
          axios.get(`${API_URL}/api/event/settings`, { withCredentials: true })
            .then(response => {
              setTimerRate(response.data.kabaddiTimerRate || 1.0);
            })
            .catch(error => {
              console.error('Error fetching timer rate:', error);
            });
        }
        
        // E key: Increase timer rate by 0.01
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          setTimerRate(prev => {
            const newRate = Math.min(2.0, Math.round((prev + 0.01) * 100) / 100);
            
            // Clear existing timeout
            if (rateUpdateTimeout) {
              clearTimeout(rateUpdateTimeout);
            }
            
            // Set pending update
            setPendingRateUpdate(newRate);
            
            // Debounce DB update by 400ms
            const timeout = setTimeout(() => {
              axios.patch(`${API_URL}/api/event/timer-rate`, { kabaddiTimerRate: newRate }, { withCredentials: true })
                .catch(error => console.error('Error updating timer rate:', error));
              setPendingRateUpdate(null);
            }, 400);
            
            setRateUpdateTimeout(timeout);
            return newRate;
          });
        }
        
        // D key: Decrease timer rate by 0.01
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          setTimerRate(prev => {
            const newRate = Math.max(0.5, Math.round((prev - 0.01) * 100) / 100);
            
            // Clear existing timeout
            if (rateUpdateTimeout) {
              clearTimeout(rateUpdateTimeout);
            }
            
            // Set pending update
            setPendingRateUpdate(newRate);
            
            // Debounce DB update by 400ms
            const timeout = setTimeout(() => {
              axios.patch(`${API_URL}/api/event/timer-rate`, { kabaddiTimerRate: newRate }, { withCredentials: true })
                .catch(error => console.error('Error updating timer rate:', error));
              setPendingRateUpdate(null);
            }, 400);
            
            setRateUpdateTimeout(timeout);
            return newRate;
          });
        }
        
        // R key: Reset timer rate to 1.0
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setTimerRate(1.0);
          
          // Clear any pending updates
          if (rateUpdateTimeout) {
            clearTimeout(rateUpdateTimeout);
          }
          setPendingRateUpdate(null);
          
          // Update DB immediately
          axios.patch(`${API_URL}/api/event/timer-rate`, { kabaddiTimerRate: 1.0 }, { withCredentials: true })
            .catch(error => console.error('Error resetting timer rate:', error));
        }
        
        // H key: Toggle timer rate visibility
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          setShowTimerRate(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      // Cleanup timeout on unmount
      if (rateUpdateTimeout) {
        clearTimeout(rateUpdateTimeout);
      }
    };
  }, [isMobile, syncTimer, timer, rateUpdateTimeout]);

  // Timer countdown logic
  useEffect(() => {
    if (timer.isRunning) {
      // Calculate interval based on timer rate
      // If rate is 0.95, timer runs 5% faster (interval = 10 * 0.95 = 9.5ms)
      // If rate is 1.05, timer runs 5% slower (interval = 10 * 1.05 = 10.5ms)
      const intervalDuration = 10 * timerRate;
      
      const interval = setInterval(() => {
        setTimer(prev => {
          let newCentiseconds = prev.centiseconds - 1;
          let newSeconds = prev.seconds;
          let newMinutes = prev.minutes;

          if (newCentiseconds < 0) {
            newCentiseconds = 99;
            newSeconds -= 1;
          }

          if (newSeconds < 0) {
            newSeconds = 59;
            newMinutes -= 1;
          }

          // Stop at 0 and sync to DB
          if (newMinutes < 0) {
            clearInterval(interval);
            const stoppedTimer = { minutes: 0, seconds: 0, centiseconds: 0, isRunning: false, isVisible: prev.isVisible };
            // Sync to database immediately
            syncTimer(stoppedTimer);
            return stoppedTimer;
          }

          return {
            minutes: newMinutes,
            seconds: newSeconds,
            centiseconds: newCentiseconds,
            isRunning: true,
            isVisible: prev.isVisible
          };
        });
      }, intervalDuration);

      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [timer.isRunning, timerRate, syncTimer]);

  const handleSetTimer = (field, value) => {
    const newTimer = { ...timer, [field]: parseInt(value) || 0 };
    setTimer(newTimer);
    syncTimer(newTimer);
  };

  const handleStartTimer = () => {
    const newTimer = { ...timer, isRunning: true };
    setTimer(newTimer);
    syncTimer(newTimer);
  };

  const handleStopTimer = () => {
    const newTimer = { ...timer, isRunning: false };
    setTimer(newTimer);
    syncTimer(newTimer);
  };

  const handleResetTimer = () => {
    const newTimer = { ...timer, minutes: 10, seconds: 0, centiseconds: 0, isRunning: false };
    setTimer(newTimer);
    syncTimer(newTimer);
  };

  const handleToggleTimerVisibility = () => {
    const newTimer = { ...timer, isVisible: !timer.isVisible };
    setTimer(newTimer);
    syncTimer(newTimer);
  };

  const handleSyncTimer = async () => {
    // Force sync current timer state to all clients
    syncTimer(timer);
    
    // Also refetch timer rate from event settings
    try {
      const response = await axios.get(`${API_URL}/api/event/settings`, { withCredentials: true });
      setTimerRate(response.data.kabaddiTimerRate || 1.0);
    } catch (error) {
      console.error('Error fetching timer rate:', error);
    }
  };

  const handleEndHalf = async () => {
    if (currentHalf === 1 && onEndHalf) {
      onEndHalf();
    }
  };

  const calculateTotal = (teamScores) => {
    return teamScores.raidPoints + teamScores.tacklePoints + teamScores.bonusPoints + teamScores.allOutPoints + teamScores.extraPoints;
  };

  const handleIncrement = (team, field) => {
    // Store previous state in history (only for live matches or editing)
    if (isLive || isEditing) {
      setUndoHistory(prev => [...prev, { ...scores }]);
    }

    const newScores = {
      ...scores,
      [team]: {
        ...scores[team],
        [field]: scores[team][field] + 1
      }
    };
    setScores(newScores);
    
    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Set pending update indicator
    setPendingUpdate(true);
    if (onPendingUpdateChange) onPendingUpdateChange(true);

    // Debounce the server update (800ms delay)
    const timeout = setTimeout(() => {
      updateScore(match._id, {
        teamAScore: newScores.teamA,
        teamBScore: newScores.teamB
      });
      setPendingUpdate(false);
      if (onPendingUpdateChange) onPendingUpdateChange(false);
    }, 800);

    setUpdateTimeout(timeout);
  };

  const handleDecrement = (team, field) => {
    // Only allow decrement if value is greater than 0
    if (scores[team][field] <= 0) return;

    // Store previous state in history
    if (isEditing) {
      setUndoHistory(prev => [...prev, { ...scores }]);
    }

    const newScores = {
      ...scores,
      [team]: {
        ...scores[team],
        [field]: scores[team][field] - 1
      }
    };
    setScores(newScores);
    
    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Set pending update indicator
    setPendingUpdate(true);
    if (onPendingUpdateChange) onPendingUpdateChange(true);

    // Debounce the server update (800ms delay)
    const timeout = setTimeout(() => {
      updateScore(match._id, {
        teamAScore: newScores.teamA,
        teamBScore: newScores.teamB
      });
      setPendingUpdate(false);
      if (onPendingUpdateChange) onPendingUpdateChange(false);
    }, 800);

    setUpdateTimeout(timeout);
  };

  const handleChangeStatus = async () => {
    const statuses = ['Scheduled', 'Live', 'Completed'];
    const currentIndex = statuses.indexOf(match.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    const confirmed = window.confirm(`Change match status from "${match.status}" to "${nextStatus}"?`);
    if (!confirmed) return;

    try {
      await axios.patch(
        `${API_URL}/api/schedule/${match._id}/status`,
        { status: nextStatus },
        { withCredentials: true }
      );
      
      // Reload the page to reflect the new status
      window.location.reload();
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDoneEditing = async () => {
    // Save status if it was changed
    if (editedStatus !== match.status) {
      try {
        await axios.patch(
          `${API_URL}/api/schedule/${match._id}/status`,
          { status: editedStatus },
          { withCredentials: true }
        );
        
        // Reload the page to reflect the new status
        window.location.reload();
        return;
      } catch (error) {
        console.error('Error changing status:', error);
        alert('Failed to change status: ' + (error.response?.data?.message || error.message));
        return;
      }
    }
    
    // Just exit edit mode if status wasn't changed
    setIsEditing(false);
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;

    // Get the last state from history
    const previousState = undoHistory[undoHistory.length - 1];
    
    // Restore previous state
    setScores(previousState);

    // Remove the last state from history
    setUndoHistory(prev => prev.slice(0, -1));

    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Set pending update indicator
    setPendingUpdate(true);
    if (onPendingUpdateChange) onPendingUpdateChange(true);

    // Debounce the server update (800ms delay)
    const timeout = setTimeout(() => {
      updateScore(match._id, {
        teamAScore: previousState.teamA,
        teamBScore: previousState.teamB
      });
      setPendingUpdate(false);
      if (onPendingUpdateChange) onPendingUpdateChange(false);
    }, 800);

    setUpdateTimeout(timeout);
  };

  const canUndo = () => {
    if (undoHistory.length === 0) return false;
    
    // Check if all scores are at 0
    const allZero = calculateTotal(scores.teamA) === 0 && calculateTotal(scores.teamB) === 0;
    return !allZero;
  };

  const scoreCategories = [
    { label: 'Raid Points', field: 'raidPoints' },
    { label: 'Tackle Points', field: 'tacklePoints' },
    { label: 'Bonus Points', field: 'bonusPoints' },
    { label: 'All Out Points', field: 'allOutPoints' },
    { label: 'Extra Points', field: 'extraPoints' }
  ];

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      padding: '2rem',
      position: 'relative'
    }}>
      {/* Match Header */}
      <div style={{ marginBottom: '2rem' }}>
        {/* Title */}
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ 
            color: '#FFD700', 
            fontSize: isMobile ? '1.25rem' : '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem' 
          }}>
            {match.game.name} - Match {String(match.matchNumber).padStart(2, '0')}
          </h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>{match.round}</p>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '0.5rem' : '1rem', 
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          {/* Status Display/Dropdown */}
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
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Scheduled" style={{ background: '#1a1a1a', color: '#FFD700' }}>Scheduled</option>
              <option value="Live" style={{ background: '#1a1a1a', color: '#FFD700' }}>Live</option>
              <option value="Completed" style={{ background: '#1a1a1a', color: '#FFD700' }}>Completed</option>
              <option value="Cancelled" style={{ background: '#1a1a1a', color: '#FFD700' }}>Cancelled</option>
            </select>
          ) : (
            <div style={{
              padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
              background: isLive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              borderRadius: '0.5rem',
              color: isLive ? '#4ade80' : '#eab308',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}>
              {match.status}
            </div>
          )}
          
          {!isLive && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: isMobile ? '0.4rem 0.875rem' : '0.5rem 1.5rem',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '0.5rem',
                color: '#3b82f6',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Match
            </button>
          )}
          {isEditing && (
            <button
              onClick={handleDoneEditing}
              style={{
                padding: isMobile ? '0.4rem 0.875rem' : '0.5rem 1.5rem',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '0.5rem',
                color: '#4ade80',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Done Editing
            </button>
          )}
          {(isLive || isEditing) && canUndo() && (
            <button
              onClick={handleUndo}
              style={{
                padding: isMobile ? '0.4rem 0.875rem' : '0.5rem 1.5rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '0.5rem',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6"></path>
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
              </svg>
              Undo ({undoHistory.length})
            </button>
          )}
          {isLive && (
            <button
              onClick={() => endMatch(match, scores)}
              style={{
                padding: isMobile ? '0.4rem 0.875rem' : '0.5rem 1.5rem',
                background: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '0.5rem',
                color: '#eab308',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(234, 179, 8, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(234, 179, 8, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              End Match
            </button>
          )}
        </div>
      </div>

      {/* Team Headers Row - Same height for both */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isMobile ? '1rem' : '3rem',
        marginBottom: isMobile ? '1rem' : '2rem'
      }}>
        {/* Team A Header */}
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? '1rem' : '1.5rem',
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          minHeight: isMobile ? '140px' : 'auto'
        }}>
          <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>TEAM A</div>
          <div style={{ 
            color: '#fff', 
            fontSize: isMobile ? '0.7rem' : '1rem', 
            fontWeight: 'bold', 
            marginBottom: isMobile ? '0.5rem' : '1rem',
            wordBreak: 'break-word',
            lineHeight: '1.2',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {getTeamFullName(match.teamA)}
          </div>
          <div style={{ 
            color: '#FFD700', 
            fontSize: isMobile ? '2rem' : '3rem', 
            fontWeight: 'bold',
            lineHeight: '1'
          }}>
            {calculateTotal(scores.teamA)}
          </div>
          <div style={{ color: '#888', fontSize: isMobile ? '0.65rem' : '0.85rem', marginTop: '0.5rem' }}>Total Points</div>
          {halfTimeScores?.teamAScore && (() => {
            const total = calculateTotal(halfTimeScores.teamAScore);
            return total > 0;
          })() && (
            <div style={{ color: '#666', fontSize: isMobile ? '0.6rem' : '0.75rem', marginTop: '0.25rem' }}>
              HT: {calculateTotal(halfTimeScores.teamAScore)}
            </div>
          )}
        </div>

        {/* Team B Header */}
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? '1rem' : '1.5rem',
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          minHeight: isMobile ? '140px' : 'auto'
        }}>
          <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>TEAM B</div>
          <div style={{ 
            color: '#fff', 
            fontSize: isMobile ? '0.7rem' : '1rem', 
            fontWeight: 'bold', 
            marginBottom: isMobile ? '0.5rem' : '1rem',
            wordBreak: 'break-word',
            lineHeight: '1.2',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {getTeamFullName(match.teamB)}
          </div>
          <div style={{ 
            color: '#FFD700', 
            fontSize: isMobile ? '2rem' : '3rem', 
            fontWeight: 'bold',
            lineHeight: '1'
          }}>
            {calculateTotal(scores.teamB)}
          </div>
          <div style={{ color: '#888', fontSize: isMobile ? '0.65rem' : '0.85rem', marginTop: '0.5rem' }}>Total Points</div>
          {halfTimeScores?.teamBScore && (() => {
            const total = calculateTotal(halfTimeScores.teamBScore);
            return total > 0;
          })() && (
            <div style={{ color: '#666', fontSize: isMobile ? '0.6rem' : '0.75rem', marginTop: '0.25rem' }}>
              HT: {calculateTotal(halfTimeScores.teamBScore)}
            </div>
          )}
        </div>
      </div>

      {/* Timer Section */}
      {(isLive || isEditing) && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '0.75rem',
          padding: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '1rem' : '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: isMobile ? '1rem' : '2rem'
          }}>
            {/* Half Indicator */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.85rem', marginBottom: '0.5rem' }}>
                CURRENT HALF
              </div>
              <div style={{ color: '#FFD700', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
                {currentHalf === 1 ? '1st Half' : '2nd Half'}
              </div>
              {timer.minutes === 0 && timer.seconds === 0 && timer.centiseconds === 0 && (
                <div style={{ color: '#ff6b6b', fontSize: isMobile ? '0.7rem' : '0.85rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                  LAST RAID
                </div>
              )}
            </div>

            {/* Timer Display and Controls */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.85rem', marginBottom: '0.5rem' }}>
                TIMER
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: isMobile ? '0.5rem' : '1rem',
                marginBottom: '1rem'
              }}>
                {/* Minutes */}
                <div>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={timer.minutes}
                    onChange={(e) => handleSetTimer('minutes', e.target.value)}
                    disabled={timer.isRunning}
                    style={{
                      width: isMobile ? '60px' : '80px',
                      padding: isMobile ? '0.5rem' : '0.75rem',
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#FFD700',
                      outline: 'none'
                    }}
                  />
                  <div style={{ color: '#888', fontSize: isMobile ? '0.6rem' : '0.75rem', marginTop: '0.25rem' }}>MIN</div>
                </div>
                <span style={{ color: '#FFD700', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>:</span>
                {/* Seconds */}
                <div>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timer.seconds}
                    onChange={(e) => handleSetTimer('seconds', e.target.value)}
                    disabled={timer.isRunning}
                    style={{
                      width: isMobile ? '60px' : '80px',
                      padding: isMobile ? '0.5rem' : '0.75rem',
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#FFD700',
                      outline: 'none'
                    }}
                  />
                  <div style={{ color: '#888', fontSize: isMobile ? '0.6rem' : '0.75rem', marginTop: '0.25rem' }}>SEC</div>
                </div>
                <span style={{ color: '#FFD700', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>:</span>
                {/* Centiseconds */}
                <div>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={timer.centiseconds}
                    onChange={(e) => handleSetTimer('centiseconds', e.target.value)}
                    disabled={timer.isRunning}
                    style={{
                      width: isMobile ? '60px' : '80px',
                      padding: isMobile ? '0.5rem' : '0.75rem',
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#FFD700',
                      outline: 'none'
                    }}
                  />
                  <div style={{ color: '#888', fontSize: isMobile ? '0.6rem' : '0.75rem', marginTop: '0.25rem' }}>CS</div>
                </div>
              </div>

              {/* Timer Control Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* First Row: Start/Stop Button (Full Width) */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {!timer.isRunning ? (
                    <button
                      onClick={handleStartTimer}
                      style={{
                        width: '100%',
                        padding: '1rem 2rem',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '2px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '0.75rem',
                        color: '#4ade80',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1.25rem',
                        transition: 'all 0.3s'
                      }}
                    >
                      ▶ Start
                    </button>
                  ) : (
                    <button
                      onClick={handleStopTimer}
                      style={{
                        width: '100%',
                        padding: '1rem 2rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '0.75rem',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1.25rem',
                        transition: 'all 0.3s'
                      }}
                    >
                      ⏸ Stop
                    </button>
                  )}
                </div>

                {/* Second Row: Other Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleResetTimer}
                    style={{
                      flex: '1 1 auto',
                      minWidth: isMobile ? '80px' : '100px',
                      padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '0.5rem',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '0.8rem' : '1rem',
                      transition: 'all 0.3s'
                    }}
                  >
                    ↻ Reset
                  </button>
                  {isMobile && (
                    <button
                      onClick={handleSyncTimer}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '80px',
                        padding: '0.5rem 1rem',
                        background: 'rgba(14, 165, 233, 0.2)',
                        border: '1px solid rgba(14, 165, 233, 0.4)',
                        borderRadius: '0.5rem',
                        color: '#0ea5e9',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        transition: 'all 0.3s'
                      }}
                      title="Force sync timer to all clients"
                    >
                      Sync
                    </button>
                  )}
                  {currentHalf === 1 && (
                    <button
                      onClick={handleEndHalf}
                      style={{
                        flex: '1 1 auto',
                        minWidth: isMobile ? '100px' : '120px',
                        padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                        background: 'rgba(234, 179, 8, 0.2)',
                        border: '1px solid rgba(234, 179, 8, 0.4)',
                        borderRadius: '0.5rem',
                        color: '#eab308',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.8rem' : '1rem',
                        transition: 'all 0.3s'
                      }}
                    >
                      End 1st Half
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Rows */}
      {isMobile ? (
        // Mobile: Single row per category with label in center
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {scoreCategories.map(({ label, field }) => (
            <div key={field}>
              {/* Label */}
              <div style={{ 
                textAlign: 'center', 
                color: '#FFD700', 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                marginBottom: '0.5rem'
              }}>
                {label}
              </div>
              {/* Score Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                {/* Team A */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  gap: '0.5rem'
                }}>
                  <span style={{ 
                    color: '#FFD700', 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    minWidth: '30px',
                    textAlign: 'center'
                  }}>
                    {scores.teamA[field]}
                  </span>
                  {(isLive || isEditing) && (
                    <button
                      onClick={() => handleIncrement('teamA', field)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '0.5rem',
                        color: '#4ade80',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      +1
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleDecrement('teamA', field)}
                      disabled={scores.teamA[field] <= 0}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: scores.teamA[field] <= 0 ? 'rgba(100, 100, 100, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        border: `1px solid ${scores.teamA[field] <= 0 ? 'rgba(100, 100, 100, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        borderRadius: '0.5rem',
                        color: scores.teamA[field] <= 0 ? '#666' : '#ff6b6b',
                        cursor: scores.teamA[field] <= 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                        opacity: scores.teamA[field] <= 0 ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (scores.teamA[field] > 0) {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (scores.teamA[field] > 0) {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      -1
                    </button>
                  )}
                </div>

                {/* Team B */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  gap: '0.5rem'
                }}>
                  {isEditing && (
                    <button
                      onClick={() => handleDecrement('teamB', field)}
                      disabled={scores.teamB[field] <= 0}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: scores.teamB[field] <= 0 ? 'rgba(100, 100, 100, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        border: `1px solid ${scores.teamB[field] <= 0 ? 'rgba(100, 100, 100, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        borderRadius: '0.5rem',
                        color: scores.teamB[field] <= 0 ? '#666' : '#ff6b6b',
                        cursor: scores.teamB[field] <= 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                        opacity: scores.teamB[field] <= 0 ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (scores.teamB[field] > 0) {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (scores.teamB[field] > 0) {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      -1
                    </button>
                  )}
                  {(isLive || isEditing) && (
                    <button
                      onClick={() => handleIncrement('teamB', field)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '0.5rem',
                        color: '#4ade80',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      +1
                    </button>
                  )}
                  <span style={{ 
                    color: '#FFD700', 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    minWidth: '30px',
                    textAlign: 'center'
                  }}>
                    {scores.teamB[field]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: Original 3-column layout
        <div style={{ display: 'grid', gridTemplateColumns: '2fr auto 2fr', gap: '3rem', alignItems: 'start' }}>
          {/* Team A Scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Team A Header */}
            <div style={{
              textAlign: 'right',
              padding: '0.75rem 1.25rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{ 
                color: '#FFD700', 
                fontSize: '1.1rem', 
                fontWeight: 'bold',
                marginBottom: '0.25rem'
              }}>
                {getTeamFullName(match.teamA)}
              </div>
              <div style={{ 
                color: '#888', 
                fontSize: '0.85rem'
              }}>
                Team A
              </div>
            </div>
            
            {scoreCategories.map(({ field }) => (
              <div key={field} style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 215, 0, 0.1)',
                minHeight: '60px',
                gap: '1rem'
              }}>
                <span style={{ 
                  color: '#FFD700', 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {scores.teamA[field]}
                </span>
                {isLive && (
                  <button
                    onClick={() => handleIncrement('teamA', field)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '0.5rem',
                      color: '#4ade80',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    +1
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Center Labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Empty space for alignment with team headers */}
            <div style={{ 
              padding: '0.75rem 0',
              marginBottom: '0.5rem',
              minHeight: '60px'
            }}></div>
            
            {scoreCategories.map(({ label }) => (
              <div key={label} style={{
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFD700',
                fontSize: '1rem',
                fontWeight: 'bold',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                marginBottom: '10px'
              }}>
                {label}
              </div>
            ))}
          </div>

          {/* Team B Scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Team B Header */}
            <div style={{
              textAlign: 'left',
              padding: '0.75rem 1.25rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{ 
                color: '#FFD700', 
                fontSize: '1.1rem', 
                fontWeight: 'bold',
                marginBottom: '0.25rem'
              }}>
                {getTeamFullName(match.teamB)}
              </div>
              <div style={{ 
                color: '#888', 
                fontSize: '0.85rem'
              }}>
                Team B
              </div>
            </div>
            
            {scoreCategories.map(({ field }) => (
              <div key={field} style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 215, 0, 0.1)',
                minHeight: '60px',
                gap: '1rem'
              }}>
                {isLive && (
                  <button
                    onClick={() => handleIncrement('teamB', field)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '0.5rem',
                      color: '#4ade80',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    +1
                  </button>
                )}
                <span style={{ 
                  color: '#FFD700', 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {scores.teamB[field]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Timer Rate Display (toggle with 'H' key) */}
      {showTimerRate && (
        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
          color: '#FFD700',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          fontFamily: 'monospace'
        }}>
          {timerRate.toFixed(2)}
        </div>
      )}
    </div>
  );
};

// Winner Select Dialog Component (for tie situations)
const WinnerSelectDialog = ({ match, totalA, totalB, onSelectWinner, onCancel, getTeamFullName }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        width: '90%',
        maxWidth: '500px',
        background: 'rgba(26, 26, 26, 0.98)',
        border: '1px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: 'scaleIn 0.2s ease-out'
      }}>
        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 1.5rem',
          background: 'rgba(255, 215, 0, 0.15)',
          border: '2px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.5rem',
          color: '#fff',
          fontWeight: 'bold',
          marginBottom: '0.75rem',
          textAlign: 'center'
        }}>
          Match Tied!
        </h3>

        {/* Message */}
        <p style={{
          color: '#aaa',
          fontSize: '0.95rem',
          marginBottom: '2rem',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          Both teams scored {totalA} points. Please select the winner:
        </p>

        {/* Team Selection Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => onSelectWinner(match.teamA._id)}
            style={{
              padding: '1.25rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.75rem',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>TEAM A</div>
            <div style={{ color: '#FFD700' }}>{getTeamFullName(match.teamA)}</div>
          </button>

          <button
            onClick={() => onSelectWinner(match.teamB._id)}
            style={{
              padding: '1.25rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.75rem',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>TEAM B</div>
            <div style={{ color: '#FFD700' }}>{getTeamFullName(match.teamB)}</div>
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.75rem',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ScoreManagement;
