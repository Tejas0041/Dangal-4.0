import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScoreManagement = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showEndMatchConfirm, setShowEndMatchConfirm] = useState(false);
  const [matchToEnd, setMatchToEnd] = useState(null);
  const [showWinnerSelect, setShowWinnerSelect] = useState(false);
  const [tieMatchData, setTieMatchData] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, [activeTab]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/schedule`, { withCredentials: true });
      const filteredMatches = response.data.filter(match => 
        activeTab === 'live' ? match.status === 'Live' : match.status === 'Completed'
      );
      setMatches(filteredMatches);
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
      totalA = scoreData.teamA.raidPoints + scoreData.teamA.bonusPoints + scoreData.teamA.allOutPoints + scoreData.teamA.extraPoints;
      totalB = scoreData.teamB.raidPoints + scoreData.teamB.bonusPoints + scoreData.teamB.allOutPoints + scoreData.teamB.extraPoints;
    } 
    // Handle Table Tennis scoring
    else if (scoreData.setsWonA !== undefined && scoreData.setsWonB !== undefined) {
      totalA = scoreData.setsWonA;
      totalB = scoreData.setsWonB;
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
    try {
      await axios.patch(`${API_URL}/api/schedule/${matchToEnd.matchId}/status`, 
        { status: 'Completed', winner: matchToEnd.winner }, 
        { withCredentials: true }
      );
      setToast({ message: 'Match ended successfully!', type: 'success' });
      
      // Clear undo history from localStorage when match ends
      localStorage.removeItem(`undoHistory_${matchToEnd.matchId}`);
      localStorage.removeItem(`kabaddiUndoHistory_${matchToEnd.matchId}`);
      
      // Remove from current list and go back
      setMatches(prevMatches => prevMatches.filter(match => match._id !== matchToEnd.matchId));
      setSelectedMatch(null);
    } catch (error) {
      setToast({ message: 'Failed to end match', type: 'error' });
    } finally {
      setShowEndMatchConfirm(false);
      setMatchToEnd(null);
    }
  };

  const cancelEndMatch = () => {
    setShowEndMatchConfirm(false);
    setMatchToEnd(null);
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
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Back Button */}
          <button
            onClick={() => setSelectedMatch(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.5rem',
              color: '#FFD700',
              cursor: 'pointer',
              marginBottom: '2rem',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Matches
          </button>

          {selectedMatch.game.name.toUpperCase() === 'KABADDI' ? (
            <KabaddiScoreCard 
              match={selectedMatch} 
              updateScore={updateScore}
              endMatch={(match, scores) => endMatch(match, scores)}
              getTeamFullName={getTeamFullName}
              isLive={selectedMatch.status === 'Live'}
            />
          ) : selectedMatch.game.name.toUpperCase() === 'TABLE TENNIS' ? (
            <TableTennisScoreCard 
              match={selectedMatch} 
              updateScore={updateScore}
              endMatch={(match, setsWonA, setsWonB) => endMatch(match, { setsWonA, setsWonB })}
              getTeamFullName={getTeamFullName}
              isLive={selectedMatch.status === 'Live'}
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

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ color: '#FFD700', fontSize: '1.25rem' }}>Loading...</div>
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
            Live Matches ({matches.length})
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
            Completed Matches
          </button>
        </div>

        {/* Matches List */}
        {matches.length === 0 ? (
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
              No {activeTab === 'live' ? 'live' : 'completed'} matches found
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {matches.map((match) => (
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
        )}

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
const TugOfWarScoreCard = ({ match, updateScore, setSelectedMatch, setMatches, activeTab, getTeamFullName, isLive }) => {
  const [selectedWinner, setSelectedWinner] = useState(match.result?.winner?._id || match.result?.winner || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // If we're on the Live tab, remove the match from the list
      if (activeTab === 'live') {
        setMatches(prevMatches => prevMatches.filter(m => m._id !== match._id));
      }
      
      // Close the score menu
      setSelectedMatch(null);
      
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <div>
          <h3 style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {match.game.name} - Match {String(match.matchNumber).padStart(2, '0')}
          </h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>{match.round}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            padding: '0.5rem 1rem',
            background: isLive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            borderRadius: '0.5rem',
            color: isLive ? '#4ade80' : '#eab308',
            fontWeight: 'bold'
          }}>
            {match.status}
          </div>
          {!isLive && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '0.5rem',
                color: '#3b82f6',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Winner
            </button>
          )}
        </div>
      </div>

      {/* Teams Display */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', 
        gap: '3rem', 
        alignItems: 'center',
        marginTop: '3rem'
      }}>
        {/* Team A */}
        <div 
          onClick={() => (isLive || isEditing) && handleSelectWinner(match.teamA._id)}
          style={{
            padding: '2rem',
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
          <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {getTeamFullName(match.teamA)}
          </div>
        </div>

        {/* VS Divider */}
        <div style={{
          color: '#FFD700',
          fontSize: '2rem',
          fontWeight: 'bold',
          opacity: 0.5
        }}>
          VS
        </div>

        {/* Team B */}
        <div 
          onClick={() => (isLive || isEditing) && handleSelectWinner(match.teamB._id)}
          style={{
            padding: '2rem',
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
          <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
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
const KabaddiScoreCard = ({ match, updateScore, endMatch, getTeamFullName, isLive }) => {
  const [scores, setScores] = useState({
    teamA: {
      raidPoints: 0,
      bonusPoints: 0,
      allOutPoints: 0,
      extraPoints: 0,
    },
    teamB: {
      raidPoints: 0,
      bonusPoints: 0,
      allOutPoints: 0,
      extraPoints: 0,
    }
  });
  const [undoHistory, setUndoHistory] = useState([]); // Track history for undo
  const [updateTimeout, setUpdateTimeout] = useState(null); // Debounce timeout
  const [pendingUpdate, setPendingUpdate] = useState(false); // Track if update is pending
  const [lastMatchId, setLastMatchId] = useState(null); // Track match ID changes

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
            bonusPoints: match.result.teamAScore?.bonusPoints || 0,
            allOutPoints: match.result.teamAScore?.allOutPoints || 0,
            extraPoints: match.result.teamAScore?.extraPoints || 0,
          },
          teamB: {
            raidPoints: match.result.teamBScore?.raidPoints || 0,
            bonusPoints: match.result.teamBScore?.bonusPoints || 0,
            allOutPoints: match.result.teamBScore?.allOutPoints || 0,
            extraPoints: match.result.teamBScore?.extraPoints || 0,
          }
        });
      }
      setLastMatchId(match._id);
    }
  }, [match._id, lastMatchId, match.result]);

  const calculateTotal = (teamScores) => {
    return teamScores.raidPoints + teamScores.bonusPoints + teamScores.allOutPoints + teamScores.extraPoints;
  };

  const handleIncrement = (team, field) => {
    // Store previous state in history (only for live matches)
    if (isLive) {
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

    // Debounce the server update (800ms delay)
    const timeout = setTimeout(() => {
      updateScore(match._id, {
        teamAScore: newScores.teamA,
        teamBScore: newScores.teamB
      });
      setPendingUpdate(false);
    }, 800);

    setUpdateTimeout(timeout);
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

    // Debounce the server update (800ms delay)
    const timeout = setTimeout(() => {
      updateScore(match._id, {
        teamAScore: previousState.teamA,
        teamBScore: previousState.teamB
      });
      setPendingUpdate(false);
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <div>
          <h3 style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {match.game.name} - Match {String(match.matchNumber).padStart(2, '0')}
          </h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>{match.round}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '0.5rem',
            color: '#4ade80',
            fontWeight: 'bold'
          }}>
            {match.status}
          </div>
          {pendingUpdate && (
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '0.5rem',
              color: '#60a5fa',
              fontWeight: 'bold',
              fontSize: '0.85rem',
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
          {isLive && canUndo() && (
            <button
              onClick={handleUndo}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '0.5rem',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                padding: '0.5rem 1.5rem',
                background: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '0.5rem',
                color: '#eab308',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              End Match
            </button>
          )}
        </div>
      </div>

      {/* Score Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr auto 2fr', gap: '3rem', alignItems: 'start' }}>
        {/* Team A Column */}
        <div>
          {/* Team A Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '0.75rem'
          }}>
            <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>TEAM A</div>
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {getTeamFullName(match.teamA)}
            </div>
            <div style={{ 
              color: '#FFD700', 
              fontSize: '3rem', 
              fontWeight: 'bold',
              lineHeight: '1'
            }}>
              {calculateTotal(scores.teamA)}
            </div>
            <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>Total Points</div>
          </div>

          {/* Team A Scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
        </div>

        {/* Center Labels Column */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem'
        }}>
          {/* Empty space to match team header height */}
          <div style={{ height: 'calc(8.5rem + 4rem)' }}></div>
          
          {/* Labels aligned with score rows */}
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

        {/* Team B Column */}
        <div>
          {/* Team B Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '0.75rem'
          }}>
            <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>TEAM B</div>
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {getTeamFullName(match.teamB)}
            </div>
            <div style={{ 
              color: '#FFD700', 
              fontSize: '3rem', 
              fontWeight: 'bold',
              lineHeight: '1'
            }}>
              {calculateTotal(scores.teamB)}
            </div>
            <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>Total Points</div>
          </div>

          {/* Team B Scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
      </div>
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

// Table Tennis Score Card Component
const TableTennisScoreCard = ({ match, updateScore, endMatch, getTeamFullName, isLive }) => {
  const maxSets = match.round === 'League Stage' ? 1 : 3;
  const winningScore = match.matchType === 'Singles' ? 11 : 15;
  
  const [sets, setSets] = useState([]);
  const [setsWonA, setSetsWonA] = useState(0);
  const [setsWonB, setSetsWonB] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [undoHistory, setUndoHistory] = useState([]); // Track history for multiple undos
  const [isEditing, setIsEditing] = useState(false); // Track if editing completed match
  const [lastMatchId, setLastMatchId] = useState(null); // Track match ID changes
  const [updateTimeout, setUpdateTimeout] = useState(null); // Debounce timeout
  const [pendingUpdate, setPendingUpdate] = useState(false); // Track if update is pending

  // Load undo history from localStorage on mount
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

  // Save undo history to localStorage whenever it changes
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

  // Load scores from match data on mount and when match changes
  useEffect(() => {
    const matchIdChanged = lastMatchId !== match._id;
    
    if (match.result?.tableTennis?.sets && match.result.tableTennis.sets.length > 0) {
      setSets(match.result.tableTennis.sets);
      setSetsWonA(match.result.tableTennis.setsWonA || 0);
      setSetsWonB(match.result.tableTennis.setsWonB || 0);
      
      // Find the current set (first incomplete set or last set)
      const incompleteSetIndex = match.result.tableTennis.sets.findIndex(set => !set.winner);
      setCurrentSetIndex(incompleteSetIndex !== -1 ? incompleteSetIndex : match.result.tableTennis.sets.length - 1);
    } else {
      // Initialize with empty sets
      const initialSets = Array(maxSets).fill(null).map(() => ({
        teamAScore: 0,
        teamBScore: 0,
        winner: null
      }));
      setSets(initialSets);
      setSetsWonA(0);
      setSetsWonB(0);
      setCurrentSetIndex(0);
    }
    
    // Only reset editing mode when match ID actually changes
    // Don't clear undo history here - it's managed by localStorage
    if (matchIdChanged) {
      setIsEditing(false);
      setLastMatchId(match._id);
    }
  }, [match._id, maxSets, lastMatchId]);

  const checkSetWinner = (scoreA, scoreB) => {
    // Check if either team reached winning score
    if (scoreA >= winningScore || scoreB >= winningScore) {
      // Check for deuce situation (both at winningScore - 1 or higher)
      if (scoreA >= winningScore - 1 && scoreB >= winningScore - 1) {
        // In deuce, need 2 point lead to win
        if (Math.abs(scoreA - scoreB) >= 2) {
          return scoreA > scoreB ? 'A' : 'B';
        }
      } else {
        // Normal win condition
        if (scoreA >= winningScore) return 'A';
        if (scoreB >= winningScore) return 'B';
      }
    }
    return null;
  };

  const handleScoreUpdate = (setIndex, team, increment = true) => {
    const newSets = [...sets];
    const currentSet = { ...newSets[setIndex] };

    // Store previous state in history (only for live matches)
    if (isLive) {
      setUndoHistory(prev => [...prev, {
        sets: [...sets],
        setsWonA: setsWonA,
        setsWonB: setsWonB,
        currentSetIndex: currentSetIndex
      }]);
    }

    // Increment or decrement score
    if (team === 'A') {
      if (increment) {
        currentSet.teamAScore += 1;
      } else {
        currentSet.teamAScore = Math.max(0, currentSet.teamAScore - 1);
      }
    } else {
      if (increment) {
        currentSet.teamBScore += 1;
      } else {
        currentSet.teamBScore = Math.max(0, currentSet.teamBScore - 1);
      }
    }

    // When editing, allow manual winner removal
    if (isEditing) {
      currentSet.winner = null;
    }

    // Check for set winner (only for live matches or when incrementing in edit mode)
    let winner = null;
    let newSetsWonA = setsWonA;
    let newSetsWonB = setsWonB;
    
    if ((isLive || (isEditing && increment)) && !currentSet.winner) {
      winner = checkSetWinner(currentSet.teamAScore, currentSet.teamBScore);
      if (winner) {
        currentSet.winner = winner === 'A' ? match.teamA._id : match.teamB._id;
        
        // Update sets won
        newSetsWonA = winner === 'A' ? setsWonA + 1 : setsWonA;
        newSetsWonB = winner === 'B' ? setsWonB + 1 : setsWonB;
        
        setSetsWonA(newSetsWonA);
        setSetsWonB(newSetsWonB);

        // Move to next set if available (only in live mode)
        if (isLive && setIndex < maxSets - 1) {
          setCurrentSetIndex(setIndex + 1);
        }
      }
    }

    newSets[setIndex] = currentSet;
    setSets(newSets);

    // Recalculate sets won when editing
    if (isEditing) {
      newSetsWonA = newSets.filter(s => s.winner === match.teamA._id).length;
      newSetsWonB = newSets.filter(s => s.winner === match.teamB._id).length;
      setSetsWonA(newSetsWonA);
      setSetsWonB(newSetsWonB);
    }

    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Set pending update indicator
    setPendingUpdate(true);

    // Debounce the server update (800ms delay)
    const timeout = setTimeout(() => {
      updateScore(match._id, {
        tableTennis: {
          sets: newSets,
          setsWonA: newSetsWonA,
          setsWonB: newSetsWonB
        }
      });
      setPendingUpdate(false);
    }, 800);

    setUpdateTimeout(timeout);
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;

    // Get the last state from history
    const previousState = undoHistory[undoHistory.length - 1];
    
    // Restore previous state
    setSets(previousState.sets);
    setSetsWonA(previousState.setsWonA);
    setSetsWonB(previousState.setsWonB);
    setCurrentSetIndex(previousState.currentSetIndex);

    // Remove the last state from history
    setUndoHistory(prev => prev.slice(0, -1));

    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Set pending update indicator
    setPendingUpdate(true);

    // Debounce the server update (800ms delay)
    const timeout = setTimeout(() => {
      updateScore(match._id, {
        tableTennis: {
          sets: previousState.sets,
          setsWonA: previousState.setsWonA,
          setsWonB: previousState.setsWonB
        }
      });
      setPendingUpdate(false);
    }, 800);

    setUpdateTimeout(timeout);
  };

  const canUndo = () => {
    if (undoHistory.length === 0) return false;
    
    // Check if all sets are at 0-0
    const allZero = sets.every(set => set.teamAScore === 0 && set.teamBScore === 0);
    return !allZero;
  };

  const getSetStatus = (setIndex) => {
    if (setIndex < currentSetIndex) return 'completed';
    if (setIndex === currentSetIndex) return 'active';
    return 'upcoming';
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <div>
          <h3 style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {match.game.name} - Match {String(match.matchNumber).padStart(2, '0')}
          </h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            {match.round} • {match.matchType} • Best of {maxSets}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            padding: '0.5rem 1rem',
            background: match.status === 'Live' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            border: `1px solid ${match.status === 'Live' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            borderRadius: '0.5rem',
            color: match.status === 'Live' ? '#4ade80' : '#eab308',
            fontWeight: 'bold'
          }}>
            {match.status}
          </div>
          {pendingUpdate && (
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '0.5rem',
              color: '#60a5fa',
              fontWeight: 'bold',
              fontSize: '0.85rem',
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
          {isLive && canUndo() && (
            <button
              onClick={handleUndo}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '0.5rem',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6"></path>
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
              </svg>
              Undo ({undoHistory.length})
            </button>
          )}
          {isLive && (
            <button
              onClick={() => endMatch(match, setsWonA, setsWonB)}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '0.5rem',
                color: '#eab308',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              End Match
            </button>
          )}
          {!isLive && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '0.5rem 1.5rem',
                background: isEditing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${isEditing ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                borderRadius: '0.5rem',
                color: isEditing ? '#ff6b6b' : '#60a5fa',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isEditing ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isEditing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isEditing ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Cancel Edit
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Scores
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sets Won Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', 
        gap: '2rem', 
        marginBottom: '2rem',
        alignItems: 'center'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '1.5rem',
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '0.75rem'
        }}>
          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>TEAM A</div>
          <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {getTeamFullName(match.teamA)}
          </div>
          <div style={{ 
            color: '#FFD700', 
            fontSize: '3rem', 
            fontWeight: 'bold',
            lineHeight: '1'
          }}>
            {setsWonA}
          </div>
          <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>Sets Won</div>
        </div>

        <div style={{ 
          color: '#FFD700', 
          fontSize: '2rem', 
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          VS
        </div>

        <div style={{ 
          textAlign: 'center',
          padding: '1.5rem',
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '0.75rem'
        }}>
          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>TEAM B</div>
          <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {getTeamFullName(match.teamB)}
          </div>
          <div style={{ 
            color: '#FFD700', 
            fontSize: '3rem', 
            fontWeight: 'bold',
            lineHeight: '1'
          }}>
            {setsWonB}
          </div>
          <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>Sets Won</div>
        </div>
      </div>

      {/* Individual Sets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {sets.map((set, index) => {
          const status = getSetStatus(index);
          const isActive = status === 'active';
          const isCompleted = status === 'completed';
          
          return (
            <div
              key={index}
              style={{
                background: isActive ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: `2px solid ${isActive ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.1)'}`,
                borderRadius: '0.75rem',
                padding: '1.5rem',
                opacity: status === 'upcoming' ? 0.5 : 1
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h4 style={{ 
                  color: isActive ? '#FFD700' : '#888', 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold' 
                }}>
                  Set {index + 1}
                </h4>
                {isCompleted && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '0.375rem',
                    color: '#4ade80',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    Completed
                  </span>
                )}
                {isActive && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 215, 0, 0.2)',
                    border: '1px solid rgba(255, 215, 0, 0.4)',
                    borderRadius: '0.375rem',
                    color: '#FFD700',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    In Progress
                  </span>
                )}
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto 1fr', 
                gap: '2rem',
                alignItems: 'center'
              }}>
                {/* Team A Score */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  gap: '1rem'
                }}>
                  <div style={{ 
                    color: '#FFD700', 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {set.teamAScore}
                  </div>
                  {isLive && isActive && !set.winner && (
                    <button
                      onClick={() => handleScoreUpdate(index, 'A')}
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
                  {isEditing && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleScoreUpdate(index, 'A', false)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '0.5rem',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
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
                        -1
                      </button>
                      <button
                        onClick={() => handleScoreUpdate(index, 'A', true)}
                        style={{
                          padding: '0.5rem 1rem',
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
                    </div>
                  )}
                </div>

                {/* Separator */}
                <div style={{ 
                  color: '#888', 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold' 
                }}>
                  -
                </div>

                {/* Team B Score */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-start',
                  gap: '1rem'
                }}>
                  {isLive && isActive && !set.winner && (
                    <button
                      onClick={() => handleScoreUpdate(index, 'B')}
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
                  {isEditing && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleScoreUpdate(index, 'B', false)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '0.5rem',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
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
                        -1
                      </button>
                      <button
                        onClick={() => handleScoreUpdate(index, 'B', true)}
                        style={{
                          padding: '0.5rem 1rem',
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
                    </div>
                  )}
                  <div style={{ 
                    color: '#FFD700', 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {set.teamBScore}
                  </div>
                </div>
              </div>

              {/* Set Winner Indicator */}
              {set.winner && (
                <div style={{ 
                  marginTop: '1rem', 
                  textAlign: 'center',
                  padding: '0.75rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Winner: {set.winner === match.teamA._id ? 'Team A' : 'Team B'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scoring Rules Info */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255, 215, 0, 0.1)'
      }}>
        <div style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.6' }}>
          <strong style={{ color: '#FFD700' }}>Scoring Rules:</strong> First to {winningScore} points wins the set. 
          If both players reach {winningScore - 1}, deuce applies - need 2 consecutive points to win.
        </div>
      </div>
    </div>
  );
};

export default ScoreManagement;
