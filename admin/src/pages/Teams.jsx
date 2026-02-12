import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [halls, setHalls] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHall, setSelectedHall] = useState('all');
  const [selectedGame, setSelectedGame] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hallSearchQuery, setHallSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showHallDropdown, setShowHallDropdown] = useState(false);
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [teamsRes, hallsRes, gamesRes] = await Promise.all([
        axios.get(`${API_URL}/api/teams/all`, { withCredentials: true }),
        axios.get(`${API_URL}/api/halls/all`, { withCredentials: true }),
        axios.get(`${API_URL}/api/games`, { withCredentials: true }),
      ]);

      setTeams(teamsRes.data);
      setHalls(hallsRes.data);
      setGames(gamesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to fetch teams data');
    } finally {
      setLoading(false);
    }
  };

  const getHallName = (hallId) => {
    if (!hallId) return 'Unknown';
    if (typeof hallId === 'object' && hallId.name) return hallId.name;
    const hall = halls.find(h => h._id === hallId);
    return hall?.name || 'Unknown';
  };

  const getGameName = (gameId) => {
    if (!gameId) return 'Unknown';
    if (typeof gameId === 'object' && gameId.name) return gameId.name;
    const game = games.find(g => g._id === gameId);
    return game?.name || 'Unknown';
  };

  const getSelectedHallName = () => {
    if (selectedHall === 'all') return 'All Halls / Hostels';
    const hall = halls.find(h => h._id === selectedHall);
    return hall?.name || 'All Halls / Hostels';
  };

  const getSelectedGameName = () => {
    if (selectedGame === 'all') return 'All Events';
    const game = games.find(g => g._id === selectedGame);
    return game?.name || 'All Events';
  };

  const filteredHalls = halls.filter(hall => 
    hall.name.toLowerCase().includes(hallSearchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter(team => {
    const hallMatch = selectedHall === 'all' || team.hallId?._id === selectedHall;
    const gameMatch = selectedGame === 'all' || team.gameId?._id === selectedGame;
    const searchMatch = searchQuery === '' || 
      team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getHallName(team.hallId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getGameName(team.gameId).toLowerCase().includes(searchQuery.toLowerCase());
    return hallMatch && gameMatch && searchMatch;
  });

  const viewTeamDetails = (team) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const generatePDF = async () => {
  setGeneratingPDF(true);
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const logoImg = new Image();
    logoImg.src = '/black_logo.webp';

    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });

    const teamsByHallAndGame = {};
    teams.forEach(team => {
      const hallName = getHallName(team.hallId);
      const gameName = getGameName(team.gameId);

      if (!teamsByHallAndGame[hallName]) teamsByHallAndGame[hallName] = {};
      if (!teamsByHallAndGame[hallName][gameName])
        teamsByHallAndGame[hallName][gameName] = [];

      teamsByHallAndGame[hallName][gameName].push(team);
    });

    let isFirstPage = true;

    for (const hallName of Object.keys(teamsByHallAndGame)) {
      const gamesForHall = teamsByHallAndGame[hallName];

      for (const gameName of Object.keys(gamesForHall)) {
        const teamsForGame = gamesForHall[gameName];

        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        let yPos = 18;

        // Header
        doc.setFontSize(13);
        doc.text('Macdonald Hall Presents', pageWidth / 2, yPos, { align: 'center' });

        yPos += 10;

        // ===== LOGO + DANGAL CENTER BLOCK =====
        const imgProps = doc.getImageProperties(logoImg);
        const logoHeight = 40;
        const logoWidth = (imgProps.width / imgProps.height) * logoHeight;

        const dangalFontSize = 42;

        doc.setFont('times', 'bold');
        doc.setFontSize(dangalFontSize);

        const dangalWidth = doc.getTextWidth('DANGAL 4.0');

        const totalWidth = logoWidth + 15 + dangalWidth;
        const startX = (pageWidth - totalWidth) / 2;

        // logo
        doc.addImage(
          logoImg,
          'WEBP',
          startX,
          yPos,
          logoWidth,
          logoHeight
        );

        // dangal text (vertically centered with logo)
        doc.text(
          'DANGAL 4.0',
          startX + logoWidth + 15,
          yPos + logoHeight / 2 + dangalFontSize / 3
        );

        yPos += logoHeight + 15;

        // Game Title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `Teams for ${gameName} (${hallName})`,
          pageWidth / 2,
          yPos,
          { align: 'center' }
        );

        yPos += 18;

        const separatorX = pageWidth / 2;
        doc.line(separatorX, yPos, separatorX, pageHeight - 20);

        const teamA = teamsForGame.find(t => t.teamName === 'A') || teamsForGame[0];
        const teamB = teamsForGame.find(t => t.teamName === 'B') || teamsForGame[1];

        const leftMargin = 20;
        const rightMargin = pageWidth - 20;

        const columnWidth = separatorX - leftMargin - 10;

        // ===== TEAM TITLE LARGE =====
        const teamTitleSize = 24;
        const playerSize = 19;
        const lineGap = 11;

        doc.setFontSize(teamTitleSize);
        doc.setFont('helvetica', 'bold');

        const teamATitle = teamA.secondTeamName
          ? `${teamA.secondTeamName} (Team ${teamA.teamName})`
          : `Team ${teamA.teamName}`;

        const teamBTitle = teamB.secondTeamName
          ? `${teamB.secondTeamName} (Team ${teamB.teamName})`
          : `Team ${teamB.teamName}`;

        const wrappedATitle = doc.splitTextToSize(teamATitle, columnWidth);
        doc.text(wrappedATitle, leftMargin, yPos);

        const wrappedBTitle = doc.splitTextToSize(teamBTitle, columnWidth);
        doc.text(wrappedBTitle, rightMargin, yPos, { align: 'right' });

        let yA = yPos + wrappedATitle.length * lineGap + 6;
        let yB = yPos + wrappedBTitle.length * lineGap + 6;

        doc.setFontSize(playerSize);
        doc.setFont('helvetica', 'normal');

        // ===== LEFT PLAYERS =====
        teamA.players.forEach((player, idx) => {
          const numberText = `${idx + 1}.`;
          doc.text(numberText, leftMargin, yA);

          const nameWrapped = doc.splitTextToSize(
            player.name,
            columnWidth - 15
          );

          doc.text(nameWrapped, leftMargin + 15, yA);

          yA += nameWrapped.length * lineGap;
        });

        // ===== RIGHT PLAYERS (aligned numbers column) =====
        teamB.players.forEach((player, idx) => {
          const numberText = `${idx + 1}.`;
          doc.text(numberText, rightMargin - columnWidth, yB);

          const nameWrapped = doc.splitTextToSize(
            player.name,
            columnWidth - 15
          );

          doc.text(nameWrapped, rightMargin - 15, yB, {
            align: 'right'
          });

          yB += nameWrapped.length * lineGap;
        });
      }
    }

    doc.save('Dangal_4.0_All_Teams.pdf');
  } catch (error) {
    console.error(error);
    alert('Failed to generate PDF.');
  } finally {
    setGeneratingPDF(false);
  }
};


  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(255, 215, 0, 0.2)',
              borderTop: '4px solid #FFD700',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <p style={{ color: '#888' }}>Loading teams...</p>
          </div>
        </div>
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
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#FFD700', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Teams List
          </h1>
          <p style={{ color: '#888' }}>View all registered teams</p>
        </div>

        {/* Filters */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 50,
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
            Filters & Search
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', position: 'relative', zIndex: 50 }}>
            {/* Search Bar */}
            <div>
              <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by team, hall, or event..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)'}
                />
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#888"
                  strokeWidth="2"
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
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

            {/* Hall Filter with Search */}
            <div>
              <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Hall/Hostel
              </label>
              <div style={{ position: 'relative', zIndex: showHallDropdown ? 102 : 1 }}>
                <button
                  onClick={() => {
                    setShowHallDropdown(!showHallDropdown);
                    setShowGameDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '2.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
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
              <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
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
                    padding: '0.75rem',
                    paddingRight: '2.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
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
          </div>
        </div>

        {/* Download PDF Button */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={generatePDF}
            disabled={generatingPDF || teams.length === 0}
            style={{
              padding: '1rem 2rem',
              background: generatingPDF || teams.length === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.2)',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              borderRadius: '0.75rem',
              color: generatingPDF || teams.length === 0 ? '#888' : '#FFD700',
              cursor: generatingPDF || teams.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s',
              opacity: generatingPDF || teams.length === 0 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!generatingPDF && teams.length > 0) {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!generatingPDF && teams.length > 0) {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {generatingPDF ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255, 215, 0, 0.2)',
                  borderTop: '3px solid #FFD700',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Generating PDF...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download All Teams PDF
              </>
            )}
          </button>
          <div style={{ marginTop: '0.5rem', color: '#888', fontSize: '0.85rem' }}>
            * To be implemented properly
          </div>
        </div>

        {/* Teams List */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '1rem',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 215, 0, 0.2)' }}>
            <h3 style={{ color: '#FFD700', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              All Teams ({filteredTeams.length})
            </h3>
          </div>

          {filteredTeams.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <p>No teams found with the selected filters</p>
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {filteredTeams.map((team, index) => (
                  <div
                    key={team._id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                      alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 215, 0, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: '2px solid rgba(255, 215, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFD700',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          color: '#fff', 
                          fontWeight: '600', 
                          fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem', 
                          marginBottom: '0.25rem',
                          wordBreak: 'break-word',
                          lineHeight: '1.4'
                        }}>
                          {getGameName(team.gameId)} - {team.secondTeamName ? `${team.secondTeamName} (${getHallName(team.hallId)} - Team ${team.teamName})` : `${getHallName(team.hallId)} (Team ${team.teamName})`}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.85rem' }}>
                          {team.players.length} players
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => viewTeamDetails(team)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: '1px solid rgba(255, 215, 0, 0.4)',
                        borderRadius: '0.5rem',
                        color: '#FFD700',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        width: window.innerWidth < 768 ? '100%' : 'auto',
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
                      View Details
                    </button>
                  </div>
                ))}
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
            zIndex: 9999,
            padding: '1rem',
            overflowY: 'auto',
          }}
          onClick={() => setShowTeamModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              borderRadius: '1.5rem',
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
              padding: '2rem',
              borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
              background: 'rgba(255, 215, 0, 0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h2 style={{ color: '#FFD700', fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {selectedTeam.secondTeamName ? selectedTeam.secondTeamName : `${getHallName(selectedTeam.hallId)} (Team ${selectedTeam.teamName})`}
                  </h2>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>
                    {selectedTeam.secondTeamName ? `${getHallName(selectedTeam.hallId)} - Team ${selectedTeam.teamName} • ${getGameName(selectedTeam.gameId)}` : getGameName(selectedTeam.gameId)}
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
            <div style={{ padding: '2rem' }}>
              {/* Players List */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#FFD700', fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: '2px solid rgba(255, 215, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFD700',
                        fontWeight: 'bold',
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: '500' }}>{player.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
};

export default Teams;
