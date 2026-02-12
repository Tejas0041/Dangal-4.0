import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';
import { DatePicker, TimePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import Loader from '../components/Loader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScheduleManagement = () => {
  const [matches, setMatches] = useState([]);
  const [games, setGames] = useState([]);
  const [halls, setHalls] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    game: '',
    round: 'League Stage',
    teamA: '',
    teamB: '',
    date: null,
    time: null,
    venue: '',
    status: 'Scheduled',
    matchNumber: null,
    matchType: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamASearch, setTeamASearch] = useState('');
  const [teamBSearch, setTeamBSearch] = useState('');
  const [showTeamADropdown, setShowTeamADropdown] = useState(false);
  const [showTeamBDropdown, setShowTeamBDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [statusDropdown, setStatusDropdown] = useState(null); // Track which match's dropdown is open
  const [updatingStatus, setUpdatingStatus] = useState(null); // Track which match is being updated
  
  // Search and filter states
  const [searchMatchNumber, setSearchMatchNumber] = useState('');
  const [filterHall, setFilterHall] = useState('');
  const [filterGame, setFilterGame] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (statusDropdown) {
        setStatusDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [statusDropdown]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, gamesRes, hallsRes, teamsRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedule`, { withCredentials: true }),
        axios.get(`${API_URL}/api/games`, { withCredentials: true }),
        axios.get(`${API_URL}/api/halls/all`, { withCredentials: true }),
        axios.get(`${API_URL}/api/teams/all`, { withCredentials: true })
      ]);

      setMatches(matchesRes.data);
      setGames(gamesRes.data);
      setHalls(hallsRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.date) {
      setToast({ message: 'Please select a date', type: 'error' });
      return;
    }
    if (!formData.time) {
      setToast({ message: 'Please select a time', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        date: formData.date.format('YYYY-MM-DD'),
        time: formData.time.format('HH:mm')
      };

      if (editingMatch) {
        const response = await axios.put(`${API_URL}/api/schedule/${editingMatch._id}`, submitData, { withCredentials: true });
        setToast({ message: 'Match updated successfully!', type: 'success' });
        
        // Update only the edited match in state
        setMatches(prevMatches => 
          prevMatches.map(match => 
            match._id === editingMatch._id ? response.data : match
          )
        );
      } else {
        const response = await axios.post(`${API_URL}/api/schedule`, submitData, { withCredentials: true });
        setToast({ message: 'Match created successfully!', type: 'success' });
        
        // Add new match to state
        setMatches(prevMatches => [...prevMatches, response.data]);
      }

      resetForm();
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to save match', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setMatchToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/schedule/${matchToDelete}`, { withCredentials: true });
      setToast({ message: 'Match deleted successfully!', type: 'success' });
      
      // Remove deleted match from state
      setMatches(prevMatches => prevMatches.filter(match => match._id !== matchToDelete));
    } catch (error) {
      setToast({ message: 'Failed to delete match', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setMatchToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMatchToDelete(null);
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    const selectedGame = games.find(g => g._id === match.game._id);
    setFormData({
      game: match.game._id,
      round: match.round,
      teamA: match.teamA._id,
      teamB: match.teamB._id,
      date: match.date ? dayjs(match.date) : null,
      time: match.time ? dayjs(match.time, 'HH:mm') : null,
      venue: selectedGame?.venue || match.venue,
      status: match.status,
      matchNumber: match.matchNumber,
      matchType: match.matchType || ''
    });
    // Set the team names for display
    setTeamASearch(getTeamFullName(match.teamA));
    setTeamBSearch(getTeamFullName(match.teamB));
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      game: '',
      round: 'League Stage',
      teamA: '',
      teamB: '',
      date: null,
      time: null,
      venue: '',
      status: 'Scheduled',
      matchNumber: null,
      matchType: ''
    });
    setTeamASearch('');
    setTeamBSearch('');
    setShowTeamADropdown(false);
    setShowTeamBDropdown(false);
    setEditingMatch(null);
    setShowModal(false);
  };

  const getTeamsByGame = (gameId) => {
    return teams.filter(team => team.gameId?._id === gameId || team.gameId === gameId);
  };

  const getAvailableTeams = (gameId, excludeMatchId = null, currentRound = 'League Stage') => {
    // Get all teams for this game
    const gameTeams = getTeamsByGame(gameId);
    
    // Get all team IDs that are already in matches (excluding current match being edited)
    const usedTeamIds = matches
      .filter(match => {
        // Exclude the current match being edited
        if (excludeMatchId && match._id === excludeMatchId) {
          return false;
        }
        // Only consider matches for the same game
        if (match.game._id !== gameId && match.game !== gameId) {
          return false;
        }
        // For League Stage round, only exclude teams from League Stage matches
        // For other rounds (Semi Final, Final), only exclude teams from the SAME round
        if (currentRound === 'League Stage') {
          return match.round === 'League Stage';
        } else {
          // For Semi Final, Final - exclude teams already in matches of the same round
          return match.round === currentRound;
        }
      })
      .flatMap(match => [match.teamA._id || match.teamA, match.teamB._id || match.teamB]);
    
    // Filter out teams that are already used
    return gameTeams.filter(team => !usedTeamIds.includes(team._id));
  };

  const getFilteredTeamsA = () => {
    let availableTeams = getAvailableTeams(formData.game, editingMatch?._id, formData.round);
    
    // If Team A is currently selected, include it in the list
    if (formData.teamA) {
      const selectedTeam = teams.find(t => t._id === formData.teamA);
      if (selectedTeam && !availableTeams.find(t => t._id === formData.teamA)) {
        availableTeams = [...availableTeams, selectedTeam];
      }
    }
    
    // Exclude Team B if it's selected
    availableTeams = availableTeams.filter(team => team._id !== formData.teamB);
    
    if (!teamASearch) return availableTeams;
    return availableTeams.filter(team => {
      const searchText = `${team.hallId?.name || ''} ${team.teamName} ${team.secondTeamName || ''}`.toLowerCase();
      return searchText.includes(teamASearch.toLowerCase());
    });
  };

  const getFilteredTeamsB = () => {
    let availableTeams = getAvailableTeams(formData.game, editingMatch?._id, formData.round);
    
    // If Team B is currently selected, include it in the list
    if (formData.teamB) {
      const selectedTeam = teams.find(t => t._id === formData.teamB);
      if (selectedTeam && !availableTeams.find(t => t._id === formData.teamB)) {
        availableTeams = [...availableTeams, selectedTeam];
      }
    }
    
    // Exclude Team A if it's selected
    availableTeams = availableTeams.filter(team => team._id !== formData.teamA);
    
    if (!teamBSearch) return availableTeams;
    return availableTeams.filter(team => {
      const searchText = `${team.hallId?.name || ''} ${team.teamName} ${team.secondTeamName || ''}`.toLowerCase();
      return searchText.includes(teamBSearch.toLowerCase());
    });
  };

  const handleGameChange = (gameId) => {
    const selectedGame = games.find(g => g._id === gameId);
    setFormData({ 
      ...formData, 
      game: gameId, 
      teamA: '', 
      teamB: '',
      venue: selectedGame?.venue || '',
      matchType: ''
    });
    setTeamASearch('');
    setTeamBSearch('');
  };

  const handleTeamASelect = (team) => {
    setFormData({ ...formData, teamA: team._id });
    setTeamASearch(getTeamFullName(team));
    setShowTeamADropdown(false);
  };

  const handleTeamBSelect = (team) => {
    setFormData({ ...formData, teamB: team._id });
    setTeamBSearch(getTeamFullName(team));
    setShowTeamBDropdown(false);
  };

  const handleTeamAClear = (e) => {
    e.stopPropagation();
    setFormData({ ...formData, teamA: '' });
    setTeamASearch('');
    // Dropdown stays open to show the list
  };

  const handleTeamBClear = (e) => {
    e.stopPropagation();
    setFormData({ ...formData, teamB: '' });
    setTeamBSearch('');
    // Dropdown stays open to show the list
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const formatTime = (timeString) => {
    return dayjs(timeString, 'HH:mm').format('hh:mm A');
  };

  const getTeamFullName = (team) => {
    if (!team) return 'Unknown Team';
    const hallName = team.hallId?.name || 'Unknown Hall';
    if (team.secondTeamName) {
      return `${team.secondTeamName} (Team ${team.teamName} - ${hallName})`;
    }
    return `${hallName} (Team ${team.teamName})`;
  };

  const handleSwapTeams = () => {
    if (formData.teamA && formData.teamB) {
      setFormData({
        ...formData,
        teamA: formData.teamB,
        teamB: formData.teamA
      });
      // Swap search texts too
      const tempSearch = teamASearch;
      setTeamASearch(teamBSearch);
      setTeamBSearch(tempSearch);
    }
  };

  const handleStatusChange = async (matchId, newStatus) => {
    try {
      setUpdatingStatus(matchId);
      const response = await axios.patch(`${API_URL}/api/schedule/${matchId}/status`, 
        { status: newStatus }, 
        { withCredentials: true }
      );
      
      // Update only the specific match in the state
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === matchId ? response.data : match
        )
      );
      
      setToast({ message: 'Status updated successfully!', type: 'success' });
      setStatusDropdown(null);
    } catch (error) {
      setToast({ message: 'Failed to update status', type: 'error' });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Live':
        return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' };
      case 'Completed':
        return { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', color: '#eab308' };
      case 'Cancelled':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', color: '#ff6b6b' };
      default: // Scheduled
        return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa' };
    }
  };

  const statusOptions = ['Scheduled', 'Live', 'Completed', 'Cancelled'];

  if (loading) {
    return (
      <AdminLayout>
        <Loader />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#FFD700',
              marginBottom: '0.5rem'
            }}>
              Schedule Management
            </h1>
            <p style={{ color: '#888', fontSize: '0.95rem' }}>
              Create and manage match schedules
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.875rem 1.75rem',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Match
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '0.75rem',
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '0.75rem',
            color: '#ff6b6b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            {error}
          </div>
        )}

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
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
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

        {/* Matches List - Cards Layout */}
        {(() => {
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
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {searchMatchNumber || filterHall || filterGame 
                ? 'No matches found matching your filters' 
                : 'No matches scheduled yet'}
            </p>
            {!searchMatchNumber && !filterHall && !filterGame && (
              <p style={{ fontSize: '0.9rem' }}>Click "Create Match" to add your first match</p>
            )}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {filteredMatches.map((match, index) => (
              <div
                key={match._id}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  padding: '1.5rem',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: statusDropdown === match._id ? 200 : 1
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
                {/* Match Number & Event Name */}
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
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Team 1</div>
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
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Team 2</div>
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

                {/* Venue */}
                <div style={{ 
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Venue</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                    {match.venue}
                  </div>
                </div>

                {/* Round & Status */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
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
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!updatingStatus) {
                            setStatusDropdown(statusDropdown === match._id ? null : match._id);
                          }
                        }}
                        style={{
                          padding: '0.4rem 0.875rem',
                          background: getStatusColor(match.status).bg,
                          border: `1px solid ${getStatusColor(match.status).border}`,
                          borderRadius: '0.5rem',
                          color: getStatusColor(match.status).color,
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: updatingStatus === match._id ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s',
                          opacity: updatingStatus === match._id ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!updatingStatus) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {updatingStatus === match._id ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15"></circle>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          <>
                            {match.status}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </>
                        )}
                      </span>
                      {statusDropdown === match._id && !updatingStatus && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            bottom: index >= matches.length - 2 ? '100%' : 'auto',
                            top: index >= matches.length - 2 ? 'auto' : '100%',
                            right: 0,
                            marginTop: index >= matches.length - 2 ? '0' : '0.5rem',
                            marginBottom: index >= matches.length - 2 ? '0.5rem' : '0',
                            background: '#1a1a1a',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '0.5rem',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
                            zIndex: 1000,
                            minWidth: '140px',
                            overflow: 'hidden'
                          }}
                        >
                          {statusOptions.map((status) => (
                            <div
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(match._id, status);
                              }}
                              style={{
                                padding: '0.75rem 1rem',
                                color: getStatusColor(status).color,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                background: match.status === status ? getStatusColor(status).bg : 'transparent',
                                borderLeft: match.status === status ? `3px solid ${getStatusColor(status).color}` : '3px solid transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = getStatusColor(status).bg;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = match.status === status ? getStatusColor(status).bg : 'transparent';
                              }}
                            >
                              {status}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleEdit(match)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '0.5rem',
                      color: '#60a5fa',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(match._id)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '0.5rem',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          );
        })()}

        {/* Create/Edit Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: 1000,
            padding: '1rem',
            paddingTop: '5rem',
            overflowY: 'auto'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              padding: '2rem',
              borderRadius: '1.5rem',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: 'calc(100vh - 6rem)',
              overflowY: 'auto',
              position: 'relative',
              marginBottom: '2rem'
            }}
            className="schedule-modal-content"
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2rem'
              }}>
                <h2 style={{ 
                  color: '#FFD700', 
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  margin: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {editingMatch ? 'Edit Match' : 'Create New Match'}
                </h2>
                {editingMatch ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ color: '#FFD700', fontSize: '0.85rem', fontWeight: '600' }}>Match #</label>
                    <input
                      type="number"
                      value={formData.matchNumber || ''}
                      onChange={(e) => setFormData({ ...formData, matchNumber: parseInt(e.target.value) || null })}
                      min="1"
                      required
                      className="match-number-input"
                      style={{
                        width: '70px',
                        padding: '0.5rem 0.75rem',
                        background: 'transparent',
                        border: '2px solid #FFD700',
                        borderRadius: '0.75rem',
                        color: '#FFD700',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        outline: 'none',
                        boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    borderRadius: '0.75rem',
                    color: '#000',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                  }}>
                    Match {String(matches.length + 1).padStart(2, '0')}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                  {/* Event */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      Event *
                    </label>
                    <select
                      value={formData.game}
                      onChange={(e) => handleGameChange(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '0.95rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" style={{ background: '#1a1a1a', color: '#888' }}>Select Event</option>
                      {games.map(game => (
                        <option key={game._id} value={game._id} style={{ background: '#1a1a1a', color: '#fff' }}>{game.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {/* Round */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      Round *
                    </label>
                    <select
                      value={formData.round}
                      onChange={(e) => setFormData({ ...formData, round: e.target.value, teamA: '', teamB: '' })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '0.95rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="League Stage" style={{ background: '#1a1a1a', color: '#fff' }}>League Stage</option>
                      <option value="Semi Final" style={{ background: '#1a1a1a', color: '#fff' }}>Semi Final</option>
                      <option value="Final" style={{ background: '#1a1a1a', color: '#fff' }}>Final</option>
                    </select>
                  </div>

                  {/* Match Type (for Table Tennis) */}
                  {formData.game && games.find(g => g._id === formData.game)?.name === 'Table Tennis' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                        Match Type *
                      </label>
                      <select
                        value={formData.matchType}
                        onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          background: '#1a1a1a',
                          border: '1px solid rgba(255, 215, 0, 0.5)',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '0.95rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="" style={{ background: '#1a1a1a', color: '#888' }}>Select Match Type</option>
                        <option value="Singles" style={{ background: '#1a1a1a', color: '#fff' }}>Singles</option>
                        <option value="Doubles" style={{ background: '#1a1a1a', color: '#fff' }}>Doubles</option>
                      </select>
                    </div>
                  )}
                  </div>

                  {/* Team 1 - Searchable Dropdown */}
                  <div style={{ position: 'relative', zIndex: showTeamADropdown ? 102 : 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      Team 1 *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.game) {
                          setShowTeamADropdown(!showTeamADropdown);
                          setShowTeamBDropdown(false);
                        }
                      }}
                      disabled={!formData.game}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        paddingRight: '2.5rem',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: '0.75rem',
                        color: formData.teamA ? '#fff' : '#888',
                        fontSize: '0.95rem',
                        cursor: !formData.game ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        outline: 'none',
                        opacity: !formData.game ? 0.5 : 1,
                        position: 'relative',
                        zIndex: 102,
                      }}
                    >
                      {formData.teamA ? teamASearch || 'Team selected' : 'Select Team 1'}
                    </button>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="2"
                      style={{
                        position: 'absolute',
                        right: '0.875rem',
                        top: 'calc(50% + 0.25rem)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 103,
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    
                    {showTeamADropdown && formData.game && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                          }}
                          onClick={() => {
                            setShowTeamADropdown(false);
                            if (!formData.teamA) setTeamASearch('');
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            left: 0,
                            right: 0,
                            background: '#1a1a1a',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '0.75rem',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 101,
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {formData.teamA ? (
                            // Show Clear button if team is already selected
                            <button
                              type="button"
                              onClick={handleTeamAClear}
                              style={{
                                width: '100%',
                                padding: '1rem',
                                cursor: 'pointer',
                                color: '#ef4444',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: 'none',
                                transition: 'all 0.2s',
                                textAlign: 'center',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                              Clear Selection
                            </button>
                          ) : (
                            <>
                              {/* Search Input */}
                              <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255, 215, 0, 0.2)', position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 102 }}>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="text"
                                    value={teamASearch}
                                    onChange={(e) => setTeamASearch(e.target.value)}
                                    placeholder="Search teams..."
                                    autoFocus
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem 0.5rem 0.5rem 2rem',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid rgba(255, 215, 0, 0.3)',
                                      borderRadius: '0.5rem',
                                      color: '#fff',
                                      fontSize: '0.875rem',
                                      outline: 'none',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#888"
                                    strokeWidth="2"
                                    style={{
                                      position: 'absolute',
                                      left: '0.5rem',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </div>
                              </div>
                              
                              {getFilteredTeamsA().map(team => (
                                <div
                                  key={team._id}
                                  onClick={() => handleTeamASelect(team)}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    color: '#fff',
                                    background: 'transparent',
                                    transition: 'all 0.2s',
                                    borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                >
                                  {getTeamFullName(team)}
                                </div>
                              ))}
                              
                              {getFilteredTeamsA().length === 0 && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                                  No teams found
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Team 2 - Searchable Dropdown */}
                  <div style={{ position: 'relative', zIndex: showTeamBDropdown ? 102 : 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      Team 2 *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.game) {
                          setShowTeamBDropdown(!showTeamBDropdown);
                          setShowTeamADropdown(false);
                        }
                      }}
                      disabled={!formData.game}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        paddingRight: '2.5rem',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: '0.75rem',
                        color: formData.teamB ? '#fff' : '#888',
                        fontSize: '0.95rem',
                        cursor: !formData.game ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        outline: 'none',
                        opacity: !formData.game ? 0.5 : 1,
                        position: 'relative',
                        zIndex: 102,
                      }}
                    >
                      {formData.teamB ? teamBSearch || 'Team selected' : 'Select Team 2'}
                    </button>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="2"
                      style={{
                        position: 'absolute',
                        right: '0.875rem',
                        top: 'calc(50% + 0.25rem)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 103,
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    
                    {showTeamBDropdown && formData.game && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                          }}
                          onClick={() => {
                            setShowTeamBDropdown(false);
                            if (!formData.teamB) setTeamBSearch('');
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            left: 0,
                            right: 0,
                            background: '#1a1a1a',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '0.75rem',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 101,
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {formData.teamB ? (
                            // Show Clear button if team is already selected
                            <button
                              type="button"
                              onClick={handleTeamBClear}
                              style={{
                                width: '100%',
                                padding: '1rem',
                                cursor: 'pointer',
                                color: '#ef4444',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: 'none',
                                transition: 'all 0.2s',
                                textAlign: 'center',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                              Clear Selection
                            </button>
                          ) : (
                            <>
                              {/* Search Input */}
                              <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255, 215, 0, 0.2)', position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 102 }}>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="text"
                                    value={teamBSearch}
                                    onChange={(e) => setTeamBSearch(e.target.value)}
                                    placeholder="Search teams..."
                                    autoFocus
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem 0.5rem 0.5rem 2rem',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid rgba(255, 215, 0, 0.3)',
                                      borderRadius: '0.5rem',
                                      color: '#fff',
                                      fontSize: '0.875rem',
                                      outline: 'none',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#888"
                                    strokeWidth="2"
                                    style={{
                                      position: 'absolute',
                                      left: '0.5rem',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </div>
                              </div>
                              
                              {getFilteredTeamsB().map(team => (
                                <div
                                  key={team._id}
                                  onClick={() => handleTeamBSelect(team)}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    color: '#fff',
                                    background: 'transparent',
                                    transition: 'all 0.2s',
                                    borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                >
                                  {getTeamFullName(team)}
                                </div>
                              ))}
                              
                              {getFilteredTeamsB().length === 0 && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                                  No teams found
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Swap Button - Only show when both teams are selected */}
                  {formData.teamA && formData.teamB && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginTop: '0.75rem'
                    }}>
                      <button
                        type="button"
                        onClick={handleSwapTeams}
                        style={{
                          padding: '0.625rem 1rem',
                          background: 'rgba(255, 215, 0, 0.1)',
                          border: '2px solid rgba(255, 215, 0, 0.5)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          color: '#FFD700',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                          e.currentTarget.style.borderColor = '#FFD700';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                        }}
                        title="Swap teams"
                      >
                        <svg 
                          width="18" 
                          height="18" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="17 1 21 5 17 9"></polyline>
                          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                          <polyline points="7 23 3 19 7 15"></polyline>
                          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                        </svg>
                        Swap Teams
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                  {/* Date - Custom Dropdown */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      Date *
                    </label>
                    <select
                      value={formData.date ? formData.date.format('YYYY-MM-DD') : ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value ? dayjs(e.target.value) : null })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: '#000',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: '0.75rem',
                        color: formData.date ? '#fff' : '#888',
                        fontSize: '0.95rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" style={{ background: '#000', color: '#888' }}>Select Date</option>
                      <option value="2026-02-16" style={{ background: '#000', color: '#fff' }}>16 Feb 2026</option>
                      <option value="2026-02-17" style={{ background: '#000', color: '#fff' }}>17 Feb 2026</option>
                      <option value="2026-02-18" style={{ background: '#000', color: '#fff' }}>18 Feb 2026</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      Time *
                    </label>
                    <ConfigProvider
                      theme={{
                        token: {
                          colorPrimary: '#FFD700',
                          colorBgContainer: 'rgba(255, 255, 255, 0.05)',
                          colorBorder: 'rgba(255, 215, 0, 0.5)',
                          colorText: '#fff',
                          colorTextPlaceholder: '#888',
                          colorBgElevated: '#1a1a1a',
                          colorIcon: '#FFD700',
                          colorIconHover: '#FFA500',
                          controlHeight: 48,
                          fontSize: 15,
                          borderRadius: 12,
                        },
                      }}
                    >
                      <TimePicker
                        value={formData.time}
                        onChange={(time) => setFormData({ ...formData, time })}
                        format="HH:mm"
                        placeholder="Select time"
                        style={{ width: '100%' }}
                        popupClassName="custom-antd-picker"
                        minuteStep={1}
                        showNow={false}
                        needConfirm={false}
                      />
                    </ConfigProvider>
                  </div>
                  </div>

                  {/* Venue - Auto-populated from Game */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      Venue *
                    </label>
                    <input
                      type="text"
                      value={formData.venue}
                      readOnly
                      placeholder="Select an event to see venue"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: '#0a0a0a',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '0.75rem',
                        color: '#888',
                        fontSize: '0.95rem',
                        outline: 'none',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '0.95rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Scheduled" style={{ background: '#1a1a1a', color: '#fff' }}>Scheduled</option>
                      <option value="Live" style={{ background: '#1a1a1a', color: '#fff' }}>Live</option>
                      <option value="Completed" style={{ background: '#1a1a1a', color: '#fff' }}>Completed</option>
                      <option value="Cancelled" style={{ background: '#1a1a1a', color: '#fff' }}>Cancelled</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: submitting ? '#666' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      border: 'none',
                      borderRadius: '0.75rem',
                      color: '#000',
                      fontWeight: 'bold',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: '0.95rem',
                      boxShadow: submitting ? 'none' : '0 4px 15px rgba(255, 215, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: submitting ? 0.7 : 1
                    }}
                  >
                    {submitting ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                          <line x1="12" y1="2" x2="12" y2="6"></line>
                          <line x1="12" y1="18" x2="12" y2="22"></line>
                          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                          <line x1="2" y1="12" x2="6" y2="12"></line>
                          <line x1="18" y1="12" x2="22" y2="12"></line>
                          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                        </svg>
                        {editingMatch ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingMatch ? 'Update Match' : 'Create Match'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Ant Design DatePicker/TimePicker Custom Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ant-picker {
          background: #000 !important;
          border: 1px solid rgba(255, 215, 0, 0.5) !important;
          border-radius: 0.75rem !important;
          padding: 0.875rem !important;
          transition: all 0.3s !important;
        }

        .ant-picker:hover {
          border-color: #FFD700 !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .ant-picker-focused {
          border-color: #FFD700 !important;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.1) !important;
        }

        .ant-picker-input > input {
          color: #fff !important;
          font-size: 0.95rem !important;
        }

        .ant-picker-input > input::placeholder {
          color: #888 !important;
        }

        .ant-picker-suffix {
          color: #FFD700 !important;
        }

        .ant-picker-clear {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
        }

        /* Dropdown Panel */
        .ant-picker-dropdown {
          z-index: 9999 !important;
        }

        .ant-picker-panel-container {
          background: #1a1a1a !important;
          border: 1px solid rgba(255, 215, 0, 0.3) !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.1) !important;
        }

        .ant-picker-header {
          color: #FFD700 !important;
          border-bottom: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        .ant-picker-header-view button {
          color: #FFD700 !important;
          font-weight: bold !important;
        }

        .ant-picker-header-view button:hover {
          color: #FFA500 !important;
        }

        .ant-picker-content th {
          color: #888 !important;
        }

        .ant-picker-cell {
          color: #fff !important;
        }

        .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-disabled) .ant-picker-cell-inner {
          background: rgba(255, 215, 0, 0.2) !important;
        }

        .ant-picker-cell-selected .ant-picker-cell-inner {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
          color: #000 !important;
          font-weight: bold !important;
        }

        .ant-picker-cell-today .ant-picker-cell-inner::before {
          border: 1px solid #FFD700 !important;
        }

        .ant-picker-cell-disabled {
          color: #444 !important;
        }

        .ant-picker-cell-disabled .ant-picker-cell-inner {
          background: transparent !important;
        }

        .ant-picker-time-panel {
          border-left: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        .ant-picker-time-panel-column {
          overflow-y: auto !important;
        }

        .ant-picker-time-panel-cell {
          color: #fff !important;
        }

        .ant-picker-time-panel-cell:hover {
          background: rgba(255, 215, 0, 0.2) !important;
          color: #FFD700 !important;
        }

        .ant-picker-time-panel-cell-selected {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
          color: #000 !important;
          font-weight: bold !important;
        }

        .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
          background: transparent !important;
          color: #000 !important;
        }

        .ant-picker-footer {
          border-top: 1px solid rgba(255, 215, 0, 0.2) !important;
        }

        .ant-picker-now-btn {
          color: #FFD700 !important;
        }

        .ant-picker-now-btn:hover {
          color: #FFA500 !important;
        }

        .ant-picker-ok button {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
          border: none !important;
          color: #000 !important;
          font-weight: bold !important;
        }

        .ant-picker-ok button:hover {
          opacity: 0.9 !important;
        }

        .ant-picker-header-super-prev-btn,
        .ant-picker-header-prev-btn,
        .ant-picker-header-next-btn,
        .ant-picker-header-super-next-btn {
          color: #FFD700 !important;
        }

        .ant-picker-header-super-prev-btn:hover,
        .ant-picker-header-prev-btn:hover,
        .ant-picker-header-next-btn:hover,
        .ant-picker-header-super-next-btn:hover {
          color: #FFA500 !important;
        }

        .ant-picker-time-panel-column::-webkit-scrollbar {
          width: 6px;
        }

        .ant-picker-time-panel-column::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .ant-picker-time-panel-column::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.3);
          border-radius: 3px;
        }

        .ant-picker-time-panel-column::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.5);
        }

        /* Modal Scrollbar Styling */
        .schedule-modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .schedule-modal-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0 1.5rem 1.5rem 0;
          margin: 1rem 0;
        }

        .schedule-modal-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          border-radius: 10px;
        }

        .schedule-modal-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%);
        }

        .schedule-modal-content {
          scrollbar-width: thin;
          scrollbar-color: #FFD700 rgba(255, 255, 255, 0.05);
        }

        /* Remove number input arrows */
        .match-number-input::-webkit-outer-spin-button,
        .match-number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .match-number-input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Match"
          message="Are you sure you want to delete this match? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
};

export default ScheduleManagement;
