import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Registrations = () => {
  const [teams, setTeams] = useState([]);
  const [halls, setHalls] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHall, setSelectedHall] = useState('all');
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedTeamName, setSelectedTeamName] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hallSearchQuery, setHallSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showHallDropdown, setShowHallDropdown] = useState(false);
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const [showTeamNameDropdown, setShowTeamNameDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching data with cookies (withCredentials)');

      const [teamsRes, hallsRes, gamesRes] = await Promise.all([
        axios.get(`${API_URL}/api/teams/all`, { withCredentials: true }),
        axios.get(`${API_URL}/api/halls/all`, { withCredentials: true }),
        axios.get(`${API_URL}/api/games`, { withCredentials: true }),
      ]);

      console.log('Teams response:', teamsRes.data);
      console.log('Halls response:', hallsRes.data);
      console.log('Games response:', gamesRes.data);

      setTeams(teamsRes.data);
      setHalls(hallsRes.data);
      setGames(gamesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.message || 'Failed to fetch registration data');
    } finally {
      setLoading(false);
    }
  };

  const getHallName = (hallId) => {
    if (typeof hallId === 'object') return hallId.name;
    const hall = halls.find(h => h._id === hallId);
    return hall?.name || 'Unknown';
  };

  const getGameName = (gameId) => {
    if (typeof gameId === 'object') return gameId.name;
    const game = games.find(g => g._id === gameId);
    return game?.name || 'Unknown';
  };

  const getTeamDisplayName = (team) => {
    const hallName = team.hallId?.name || 'Unknown Hall';
    if (team.secondTeamName) {
      return `${team.secondTeamName} (Team ${team.teamName} - ${hallName})`;
    }
    return `${hallName} (Team ${team.teamName})`;
  };

  const getSelectedHallName = () => {
    if (selectedHall === 'all') return 'All Halls / Hostels';
    const hall = halls.find(h => h._id === selectedHall);
    return hall?.name || 'All Halls / Hostels';
  };

  const filteredHalls = halls.filter(hall => 
    hall.name.toLowerCase().includes(hallSearchQuery.toLowerCase())
  );

  const getSelectedGameName = () => {
    if (selectedGame === 'all') return 'All Events';
    const game = games.find(g => g._id === selectedGame);
    return game?.name || 'All Events';
  };

  const getSelectedTeamNameLabel = () => {
    if (selectedTeamName === 'all') return 'All Teams';
    return `Team ${selectedTeamName}`;
  };

  const filteredTeams = teams.filter(team => {
    const hallMatch = selectedHall === 'all' || team.hallId?._id === selectedHall;
    const gameMatch = selectedGame === 'all' || team.gameId?._id === selectedGame;
    const teamNameMatch = selectedTeamName === 'all' || team.teamName === selectedTeamName;
    const searchMatch = searchQuery === '' || 
      team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getHallName(team.hallId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getGameName(team.gameId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.players.some(player => player.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return hallMatch && gameMatch && teamNameMatch && searchMatch;
  });

  const viewTeamDetails = (team) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const handleDeleteClick = (team) => {
    setTeamToDelete(team);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;
    
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/api/teams/${teamToDelete._id}`, { withCredentials: true });
      
      // Refresh data
      await fetchData();
      
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
      alert(error.response?.data?.message || 'Failed to delete team');
    } finally {
      setDeleting(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.toString().split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ background: 'rgba(255, 215, 0, 0.3)', color: '#FFD700', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : part
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loader />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '500px',
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Error Loading Data</h3>
            <p style={{ color: '#888', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={fetchData}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 215, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                borderRadius: '0.5rem',
                color: '#FFD700',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: isMobile ? '0.75rem' : '1rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '1rem',
            padding: isMobile ? '0.75rem' : '1.5rem',
          }}>
            <div style={{ fontSize: isMobile ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#FFD700', marginBottom: '0.5rem' }}>
              {teams.length}
            </div>
            <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Teams
            </div>
          </div>

          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '1rem',
            padding: isMobile ? '0.75rem' : '1.5rem',
          }}>
            <div style={{ fontSize: isMobile ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#22c55e', marginBottom: '0.5rem' }}>
              {halls.length}
            </div>
            <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Participating Halls
            </div>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '1rem',
            padding: isMobile ? '0.75rem' : '1.5rem',
          }}>
            <div style={{ fontSize: isMobile ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
              {games.length}
            </div>
            <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Events
            </div>
          </div>

          <div style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '1rem',
            padding: isMobile ? '0.75rem' : '1.5rem',
          }}>
            <div style={{ fontSize: isMobile ? '1.25rem' : '2rem', fontWeight: 'bold', color: '#a855f7', marginBottom: '0.5rem' }}>
              {teams.reduce((sum, team) => sum + team.players.length, 0)}
            </div>
            <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Players
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '1.5rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 50,
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: '600' }}>
            Filters & Search
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: isMobile ? '0.75rem' : '1rem', position: 'relative', zIndex: 50 }}>
            {/* Search Bar */}
            <div>
              <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isMobile ? "Search..." : "Search by team, hall, event, or player..."}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.65rem 0.65rem 0.65rem 2.25rem' : '0.75rem 0.75rem 0.75rem 2.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)'}
                />
                <svg
                  width={isMobile ? "16" : "18"}
                  height={isMobile ? "16" : "18"}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#888"
                  strokeWidth="2"
                  style={{
                    position: 'absolute',
                    left: isMobile ? '0.65rem' : '0.75rem',
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

            {/* Hall Filter */}
            <div>
              <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                Hall/Hostel
              </label>
              <div style={{ position: 'relative', zIndex: showHallDropdown ? 102 : 1 }}>
                <button
                  onClick={() => {
                    setShowHallDropdown(!showHallDropdown);
                    setShowGameDropdown(false);
                    setShowTeamNameDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.65rem' : '0.75rem',
                    paddingRight: '2.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    outline: 'none',
                    position: 'relative',
                    zIndex: 102,
                  }}
                >
                  {getSelectedHallName()}
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
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 103,
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                
                {showHallDropdown && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                      }}
                      onClick={() => {
                        setShowHallDropdown(false);
                        setHallSearchQuery('');
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
                        borderRadius: '0.5rem',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 101,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {/* Search Input */}
                      <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255, 215, 0, 0.2)', position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 102 }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={hallSearchQuery}
                            onChange={(e) => setHallSearchQuery(e.target.value)}
                            placeholder="Search halls / hostels..."
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.5rem 0.5rem 2rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '0.375rem',
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
                      
                      {/* All Halls Option */}
                      <div
                        onClick={() => {
                          setSelectedHall('all');
                          setShowHallDropdown(false);
                          setHallSearchQuery('');
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          color: selectedHall === 'all' ? '#FFD700' : '#fff',
                          background: selectedHall === 'all' ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedHall !== 'all') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedHall !== 'all') e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        All Halls / Hostels
                      </div>
                      
                      {/* Filtered Halls */}
                      {filteredHalls.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#888', fontSize: '0.875rem' }}>
                          No halls / hostels found
                        </div>
                      ) : (
                        filteredHalls.map(hall => (
                          <div
                            key={hall._id}
                            onClick={() => {
                              setSelectedHall(hall._id);
                              setShowHallDropdown(false);
                              setHallSearchQuery('');
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              color: selectedHall === hall._id ? '#FFD700' : '#fff',
                              background: selectedHall === hall._id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (selectedHall !== hall._id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              if (selectedHall !== hall._id) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {hall.name}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Event Filter */}
            <div>
              <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                Event
              </label>
              <div style={{ position: 'relative', zIndex: showGameDropdown ? 102 : 1 }}>
                <button
                  onClick={() => {
                    setShowGameDropdown(!showGameDropdown);
                    setShowHallDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.65rem' : '0.75rem',
                    paddingRight: '2.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    outline: 'none',
                    position: 'relative',
                    zIndex: 102,
                  }}
                >
                  {getSelectedGameName()}
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
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 103,
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                
                {showGameDropdown && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                      }}
                      onClick={() => setShowGameDropdown(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 0.5rem)',
                        left: 0,
                        right: 0,
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '0.5rem',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 101,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <div
                        onClick={() => {
                          setSelectedGame('all');
                          setShowGameDropdown(false);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          color: selectedGame === 'all' ? '#FFD700' : '#fff',
                          background: selectedGame === 'all' ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedGame !== 'all') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedGame !== 'all') e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        All Events
                      </div>
                      {games.map(game => (
                        <div
                          key={game._id}
                          onClick={() => {
                            setSelectedGame(game._id);
                            setShowGameDropdown(false);
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            color: selectedGame === game._id ? '#FFD700' : '#fff',
                            background: selectedGame === game._id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedGame !== game._id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (selectedGame !== game._id) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {game.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Team Name Filter */}
            <div>
              <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                Team Name
              </label>
              <div style={{ position: 'relative', zIndex: showTeamNameDropdown ? 102 : 1 }}>
                <button
                  onClick={() => {
                    setShowTeamNameDropdown(!showTeamNameDropdown);
                    setShowHallDropdown(false);
                    setShowGameDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.65rem' : '0.75rem',
                    paddingRight: '2.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    outline: 'none',
                    position: 'relative',
                    zIndex: 102,
                  }}
                >
                  {getSelectedTeamNameLabel()}
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
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 103,
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                
                {showTeamNameDropdown && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                      }}
                      onClick={() => setShowTeamNameDropdown(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 0.5rem)',
                        left: 0,
                        right: 0,
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '0.5rem',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 101,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <div
                        onClick={() => {
                          setSelectedTeamName('all');
                          setShowTeamNameDropdown(false);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          color: selectedTeamName === 'all' ? '#FFD700' : '#fff',
                          background: selectedTeamName === 'all' ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTeamName !== 'all') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTeamName !== 'all') e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        All Teams
                      </div>
                      {['A', 'B'].map(teamName => (
                        <div
                          key={teamName}
                          onClick={() => {
                            setSelectedTeamName(teamName);
                            setShowTeamNameDropdown(false);
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            color: selectedTeamName === teamName ? '#FFD700' : '#fff',
                            background: selectedTeamName === teamName ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTeamName !== teamName) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTeamName !== teamName) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          Team {teamName}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Teams Table */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '1rem',
          overflow: 'hidden',
        }}>
          <div style={{ padding: isMobile ? '1rem' : '1.5rem', borderBottom: '1px solid rgba(255, 215, 0, 0.2)' }}>
            <h3 style={{ color: '#FFD700', fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '600', margin: 0 }}>
              Registered Teams ({filteredTeams.length})
            </h3>
          </div>

          {filteredTeams.length === 0 ? (
            <div style={{ padding: isMobile ? '2rem 1rem' : '3rem', textAlign: 'center', color: '#888' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <p>No teams found with the selected filters</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Swipe indicator for mobile */}
              {isMobile && (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
                  textAlign: 'center',
                  color: '#FFD700',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Swipe to view all columns
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              )}
              <div style={{ 
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 215, 0, 0.5) rgba(0, 0, 0, 0.2)',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '900px' : 'auto' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 215, 0, 0.1)', borderBottom: '1px solid rgba(255, 215, 0, 0.2)' }}>
                      <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: '600', fontSize: isMobile ? '0.8rem' : '0.9rem', whiteSpace: 'nowrap' }}>Hall/Hostel</th>
                      <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: '600', fontSize: isMobile ? '0.8rem' : '0.9rem', whiteSpace: 'nowrap' }}>Team Name</th>
                      <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: '600', fontSize: isMobile ? '0.8rem' : '0.9rem', whiteSpace: 'nowrap' }}>Event</th>
                      <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: '600', fontSize: isMobile ? '0.8rem' : '0.9rem', whiteSpace: 'nowrap' }}>Players</th>
                      <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'center', color: '#FFD700', fontWeight: '600', fontSize: isMobile ? '0.8rem' : '0.9rem', width: isMobile ? '160px' : '200px', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team, index) => (
                      <tr
                        key={team._id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 215, 0, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: isMobile ? '0.75rem' : '1rem', color: '#ccc', fontSize: isMobile ? '0.85rem' : '1rem', whiteSpace: 'nowrap' }}>
                          {highlightText(getHallName(team.hallId), searchQuery)}
                        </td>
                        <td style={{ padding: isMobile ? '0.75rem' : '1rem', color: '#fff', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem', whiteSpace: 'nowrap' }}>
                          {highlightText(getTeamDisplayName(team), searchQuery)}
                        </td>
                        <td style={{ padding: isMobile ? '0.75rem' : '1rem', color: '#ccc', fontSize: isMobile ? '0.85rem' : '1rem', whiteSpace: 'nowrap' }}>
                          {highlightText(getGameName(team.gameId), searchQuery)}
                        </td>
                        <td style={{ padding: isMobile ? '0.75rem' : '1rem', color: '#ccc', fontSize: isMobile ? '0.85rem' : '1rem', whiteSpace: 'nowrap' }}>
                          {team.players.length} players
                        </td>
                        <td style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            <button
                              onClick={() => viewTeamDetails(team)}
                              style={{
                                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                                background: 'rgba(255, 215, 0, 0.2)',
                                border: '1px solid rgba(255, 215, 0, 0.4)',
                                borderRadius: '0.5rem',
                                color: '#FFD700',
                                cursor: 'pointer',
                                fontSize: isMobile ? '0.75rem' : '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteClick(team)}
                              style={{
                                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '0.5rem',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: isMobile ? '0.75rem' : '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Details Modal */}
      {showTeamModal && selectedTeam && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: isMobile ? '0.5rem' : '1rem',
          }}
          onClick={() => setShowTeamModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              borderRadius: isMobile ? '1rem' : '1.5rem',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: isMobile ? '1rem' : '2rem',
              borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
              background: 'rgba(255, 215, 0, 0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ color: '#FFD700', fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem', wordBreak: 'break-word' }}>
                    {getTeamDisplayName(selectedTeam)}
                  </h2>
                  <p style={{ color: '#888', fontSize: isMobile ? '0.8rem' : '0.9rem', wordBreak: 'break-word' }}>
                    {getHallName(selectedTeam.hallId)} • {getGameName(selectedTeam.gameId)}
                  </p>
                </div>
                <button
                  onClick={() => setShowTeamModal(false)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '0.5rem',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
              {/* Players List */}
              <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
                <h3 style={{ color: '#FFD700', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Players ({selectedTeam.players.length})
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {selectedTeam.players.map((player, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: isMobile ? '0.75rem' : '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '0.75rem' : '1rem',
                      }}
                    >
                      <div style={{
                        width: isMobile ? '35px' : '40px',
                        height: isMobile ? '35px' : '40px',
                        borderRadius: '50%',
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: '2px solid rgba(255, 215, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFD700',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.85rem' : '1rem',
                        flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: '500', fontSize: isMobile ? '0.9rem' : '1rem', wordBreak: 'break-word' }}>{player.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Screenshot */}
              {selectedTeam.paymentScreenshot && (
                <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
                  <h3 style={{ color: '#FFD700', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    Payment Screenshot
                  </h3>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    padding: isMobile ? '0.75rem' : '1rem',
                    textAlign: 'center',
                  }}>
                    <img
                      src={selectedTeam.paymentScreenshot}
                      alt="Payment Screenshot"
                      style={{
                        maxWidth: '100%',
                        maxHeight: isMobile ? '300px' : '400px',
                        borderRadius: '0.5rem',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && teamToDelete && (
        <ConfirmDialog
          title="Delete Team Registration?"
          message={`Are you sure you want to delete Team ${teamToDelete.teamName} from ${getHallName(teamToDelete.hallId)} for ${getGameName(teamToDelete.gameId)}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setTeamToDelete(null);
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar for table */
        div[style*="overflowX: auto"]::-webkit-scrollbar {
          height: 8px;
        }
        
        div[style*="overflowX: auto"]::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        
        div[style*="overflowX: auto"]::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.5);
          border-radius: 4px;
        }
        
        div[style*="overflowX: auto"]::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.7);
        }
      `}</style>
    </AdminLayout>
  );
};

export default Registrations;
