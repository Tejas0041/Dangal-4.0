import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import Toast from '../components/Toast';
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
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    secondTeamName: '',
    players: []
  });
  const [savingTeam, setSavingTeam] = useState(false);
  const [toast, setToast] = useState(null);
  const [editPaymentMode, setEditPaymentMode] = useState(false);
  const [paymentStatusChanges, setPaymentStatusChanges] = useState({});
  const [savingPaymentStatus, setSavingPaymentStatus] = useState(false);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');

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
    const paymentMatch = selectedPaymentStatus === 'all' || 
      (selectedPaymentStatus === 'paid' && team.paymentReceived) ||
      (selectedPaymentStatus === 'unpaid' && !team.paymentReceived);
    return hallMatch && gameMatch && searchMatch && paymentMatch;
  });

  const viewTeamDetails = (team) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
    setEditMode(false);
    setEditFormData({
      secondTeamName: team.secondTeamName || '',
      players: team.players.map(p => ({ ...p }))
    });
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditFormData({
      secondTeamName: selectedTeam.secondTeamName || '',
      players: selectedTeam.players.map(p => ({ ...p }))
    });
  };

  const handleAddPlayer = () => {
    const game = games.find(g => g._id === (selectedTeam.gameId._id || selectedTeam.gameId));
    const maxPlayers = game?.maxPlayersPerTeam || 15;
    
    if (editFormData.players.length >= maxPlayers) {
      setToast({ message: `Maximum ${maxPlayers} players allowed for ${game?.name}`, type: 'error' });
      return;
    }
    
    setEditFormData(prev => ({
      ...prev,
      players: [...prev.players, { name: '' }]
    }));
  };

  const handleRemovePlayer = (index) => {
    const game = games.find(g => g._id === (selectedTeam.gameId._id || selectedTeam.gameId));
    const minPlayers = game?.minPlayersPerTeam || 1;
    
    if (editFormData.players.length <= minPlayers) {
      setToast({ message: `Minimum ${minPlayers} players required for ${game?.name}`, type: 'error' });
      return;
    }
    
    setEditFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }));
  };

  const handlePlayerNameChange = (index, value) => {
    setEditFormData(prev => ({
      ...prev,
      players: prev.players.map((p, i) => i === index ? { ...p, name: value } : p)
    }));
  };

  const handleSaveTeam = async () => {
    // Validate
    if (editFormData.players.some(p => !p.name.trim())) {
      setToast({ message: 'All player names must be filled', type: 'error' });
      return;
    }

    const game = games.find(g => g._id === (selectedTeam.gameId._id || selectedTeam.gameId));
    if (editFormData.players.length < game?.minPlayersPerTeam || editFormData.players.length > game?.maxPlayersPerTeam) {
      setToast({ message: `Team must have between ${game?.minPlayersPerTeam} and ${game?.maxPlayersPerTeam} players`, type: 'error' });
      return;
    }

    setSavingTeam(true);
    try {
      const response = await axios.put(
        `${API_URL}/api/teams/${selectedTeam._id}`,
        {
          secondTeamName: editFormData.secondTeamName.trim() || null,
          players: editFormData.players
        },
        { withCredentials: true }
      );

      // Update local state
      setTeams(teams.map(t => t._id === selectedTeam._id ? response.data : t));
      setSelectedTeam(response.data);
      setEditMode(false);
      setToast({ message: 'Team updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating team:', error);
      setToast({ message: error.response?.data?.message || 'Failed to update team', type: 'error' });
    } finally {
      setSavingTeam(false);
    }
  };

  const handleTogglePaymentStatus = async (teamId) => {
    if (editPaymentMode) {
      // In edit mode, just track the change locally
      setPaymentStatusChanges(prev => ({
        ...prev,
        [teamId]: !prev[teamId]
      }));
    }
  };

  const handleSavePaymentChanges = async () => {
    const changedTeamIds = Object.keys(paymentStatusChanges).filter(id => paymentStatusChanges[id]);
    
    if (changedTeamIds.length === 0) {
      setToast({ message: 'No changes to save', type: 'error' });
      return;
    }

    setSavingPaymentStatus(true);
    try {
      // Send requests for all changed teams
      await Promise.all(
        changedTeamIds.map(teamId =>
          axios.patch(
            `${API_URL}/api/teams/${teamId}/payment-status`,
            {},
            { withCredentials: true }
          )
        )
      );

      // Refresh teams data
      const teamsRes = await axios.get(`${API_URL}/api/teams/all`, { withCredentials: true });
      setTeams(teamsRes.data);
      
      setPaymentStatusChanges({});
      setEditPaymentMode(false);
      setToast({ message: `Updated payment status for ${changedTeamIds.length} team(s)`, type: 'success' });
    } catch (error) {
      console.error('Error updating payment status:', error);
      setToast({ message: error.response?.data?.message || 'Failed to update payment status', type: 'error' });
    } finally {
      setSavingPaymentStatus(false);
    }
  };

  const handleCancelPaymentEdit = () => {
    setPaymentStatusChanges({});
    setEditPaymentMode(false);
  };

  const getTeamPaymentStatus = (team) => {
    if (paymentStatusChanges.hasOwnProperty(team._id)) {
      return paymentStatusChanges[team._id] ? !team.paymentReceived : team.paymentReceived;
    }
    return team.paymentReceived;
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

        let yPos = 10;

        // ===== HEADER =====
        doc.setFontSize(13);
        doc.setFont("helvetica", "normal");
        doc.text("Macdonald Hall Presents", pageWidth / 2, yPos, {
          align: "center",
        });

        // yPos += 10;

        // ===== LOGO CENTERED =====
        // const imgProps = doc.getImageProperties(logoImg);
        // const logoHeight = 30; // reduced
        // const logoWidth = (imgProps.width / imgProps.height) * logoHeight;

        // doc.addImage(
        //   logoImg,
        //   "WEBP",
        //   (pageWidth - logoWidth) / 2,
        //   yPos,
        //   logoWidth,
        //   logoHeight
        // );

        yPos += 15;

        // ===== DANGAL CENTERED BELOW LOGO =====
        doc.setFont("times", "bold");
        doc.setFontSize(34); // slightly reduced
        doc.text("DANGAL 4.0", pageWidth / 2, yPos, { align: "center" });

        yPos += 18;

        // ===== GAME TITLE =====
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(`Teams for ${gameName} (${hallName})`, pageWidth / 2, yPos, {
          align: "center",
        });

        yPos += 20;

        const teamA = teamsForGame.find((t) => t.teamName === "A");
        const teamB = teamsForGame.find((t) => t.teamName === "B");
        
        const teamTitleSize = 21;
        const playerSize = 20;
        const lineGap = 12;

        // Check if only one team exists
        if (teamsForGame.length === 1) {
          // Single team - display centered
          const singleTeam = teamsForGame[0];
          const centerX = pageWidth / 2;
          const columnWidth = pageWidth - 50; // Full width with margins

          doc.setFontSize(teamTitleSize);
          doc.setFont("helvetica", "bold");

          const teamTitle = singleTeam.secondTeamName
            ? `${singleTeam.secondTeamName} (Team ${singleTeam.teamName})`
            : `Team ${singleTeam.teamName}`;

          const wrappedTitle = doc.splitTextToSize(teamTitle, columnWidth);
          doc.text(wrappedTitle, centerX, yPos, { align: "center" });
          
          // Add checkmark if payment received
          if (singleTeam.paymentReceived) {
            const titleWidth = doc.getTextWidth(wrappedTitle[0]);
            const checkX = centerX + (titleWidth / 2) + 5;
            const checkY = yPos - 3;
            
            // Draw checkmark using lines
            doc.setLineWidth(1.5);
            doc.line(checkX, checkY, checkX + 2, checkY + 3);
            doc.line(checkX + 2, checkY + 3, checkX + 6, checkY - 2);
            doc.setLineWidth(0.5);
          }

          let yTeam = yPos + wrappedTitle.length * lineGap + 8;

          // Players centered
          doc.setFontSize(playerSize);
          doc.setFont("helvetica", "bold");

          singleTeam.players.forEach((player, idx) => {
            const numberText = `${idx + 1}. `;
            const nameText = player.name;
            
            // Calculate text width to check if wrapping is needed
            const fullText = numberText + nameText;
            const textWidth = doc.getTextWidth(fullText);
            const maxWidth = columnWidth;
            
            if (textWidth <= maxWidth) {
              // No wrapping needed
              doc.text(fullText, centerX, yTeam, { align: "center" });
              yTeam += lineGap;
            } else {
              // Need to wrap - split manually and indent continuation
              const numberWidth = doc.getTextWidth(numberText);
              const availableWidth = maxWidth - numberWidth;
              
              // Split the name into lines
              const words = nameText.split(' ');
              let currentLine = '';
              const lines = [];
              
              words.forEach(word => {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const testWidth = doc.getTextWidth(testLine);
                
                if (testWidth <= availableWidth && currentLine) {
                  currentLine = testLine;
                } else {
                  if (currentLine) lines.push(currentLine);
                  currentLine = word;
                }
              });
              if (currentLine) lines.push(currentLine);
              
              // Print first line with number
              doc.text(numberText + lines[0], centerX, yTeam, { align: "center" });
              yTeam += lineGap;
              
              // Print continuation lines with indent (spaces to match number width)
              for (let i = 1; i < lines.length; i++) {
                const indent = '    '; // Indent for continuation
                doc.text(indent + lines[i], centerX, yTeam, { align: "center" });
                yTeam += lineGap;
              }
            }
          });
        } else {
          // Two teams - display side by side with separator
          const separatorX = pageWidth / 2;
          doc.line(separatorX, yPos, separatorX, pageHeight - 20);

          const leftStart = 25;
          const rightStart = separatorX + 15;
          const columnWidth = separatorX - leftStart - 15;

          // ===== TEAM TITLES =====
          doc.setFontSize(teamTitleSize);
          doc.setFont("helvetica", "bold");

          const teamATitle = teamA.secondTeamName
            ? `${teamA.secondTeamName} (Team ${teamA.teamName})`
            : `Team ${teamA.teamName}`;

          const teamBTitle = teamB.secondTeamName
            ? `${teamB.secondTeamName} (Team ${teamB.teamName})`
            : `Team ${teamB.teamName}`;

          const wrappedATitle = doc.splitTextToSize(teamATitle, columnWidth);
          doc.text(wrappedATitle, leftStart, yPos);
          
          // Add checkmark if payment received for Team A
          if (teamA.paymentReceived) {
            const titleWidth = doc.getTextWidth(wrappedATitle[0]);
            const checkX = leftStart + titleWidth + 3;
            const checkY = yPos - 3;
            
            // Draw checkmark using lines
            doc.setLineWidth(1.5);
            doc.line(checkX, checkY, checkX + 2, checkY + 3);
            doc.line(checkX + 2, checkY + 3, checkX + 6, checkY - 2);
            doc.setLineWidth(0.5);
          }

          const wrappedBTitle = doc.splitTextToSize(teamBTitle, columnWidth);
          doc.text(wrappedBTitle, rightStart, yPos);
          
          // Add checkmark if payment received for Team B
          if (teamB.paymentReceived) {
            const titleWidth = doc.getTextWidth(wrappedBTitle[0]);
            const checkX = rightStart + titleWidth + 3;
            const checkY = yPos - 3;
            
            // Draw checkmark using lines
            doc.setLineWidth(1.5);
            doc.line(checkX, checkY, checkX + 2, checkY + 3);
            doc.line(checkX + 2, checkY + 3, checkX + 6, checkY - 2);
            doc.setLineWidth(0.5);
          }

          let yA = yPos + wrappedATitle.length * lineGap + 8;
          let yB = yPos + wrappedBTitle.length * lineGap + 8;

          // ===== PLAYERS =====
          doc.setFontSize(playerSize);
          doc.setFont("helvetica", "bold");

          // LEFT TEAM PLAYERS
          teamA.players.forEach((player, idx) => {
            const numberText = `${idx + 1}. `;
            const nameText = player.name;
            const numberWidth = doc.getTextWidth(numberText);
            
            // Calculate if wrapping is needed
            const fullText = numberText + nameText;
            const textWidth = doc.getTextWidth(fullText);
            
            if (textWidth <= columnWidth) {
              // No wrapping needed
              doc.text(fullText, leftStart, yA);
              yA += lineGap;
            } else {
              // Need to wrap - split manually
              const availableWidth = columnWidth - numberWidth;
              const words = nameText.split(' ');
              let currentLine = '';
              const lines = [];
              
              words.forEach(word => {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const testWidth = doc.getTextWidth(testLine);
                
                if (testWidth <= availableWidth && currentLine) {
                  currentLine = testLine;
                } else {
                  if (currentLine) lines.push(currentLine);
                  currentLine = word;
                }
              });
              if (currentLine) lines.push(currentLine);
              
              // Print first line with number
              doc.text(numberText + lines[0], leftStart, yA);
              yA += lineGap;
              
              // Print continuation lines aligned with name start
              const nameStartX = leftStart + numberWidth;
              for (let i = 1; i < lines.length; i++) {
                doc.text(lines[i], nameStartX, yA);
                yA += lineGap;
              }
            }
          });

          // RIGHT TEAM PLAYERS
          teamB.players.forEach((player, idx) => {
            const numberText = `${idx + 1}. `;
            const nameText = player.name;
            const numberWidth = doc.getTextWidth(numberText);
            
            // Calculate if wrapping is needed
            const fullText = numberText + nameText;
            const textWidth = doc.getTextWidth(fullText);
            
            if (textWidth <= columnWidth) {
              // No wrapping needed
              doc.text(fullText, rightStart, yB);
              yB += lineGap;
            } else {
              // Need to wrap - split manually
              const availableWidth = columnWidth - numberWidth;
              const words = nameText.split(' ');
              let currentLine = '';
              const lines = [];
              
              words.forEach(word => {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const testWidth = doc.getTextWidth(testLine);
                
                if (testWidth <= availableWidth && currentLine) {
                  currentLine = testLine;
                } else {
                  if (currentLine) lines.push(currentLine);
                  currentLine = word;
                }
              });
              if (currentLine) lines.push(currentLine);
              
              // Print first line with number
              doc.text(numberText + lines[0], rightStart, yB);
              yB += lineGap;
              
              // Print continuation lines aligned with name start
              const nameStartX = rightStart + numberWidth;
              for (let i = 1; i < lines.length; i++) {
                doc.text(lines[i], nameStartX, yB);
                yB += lineGap;
              }
            }
          });
        }
      }
    }

    doc.save("Dangal_4.0_All_Teams.pdf");
  } catch (error) {
    console.error(error);
    setToast({ message: 'Failed to generate PDF', type: 'error' });
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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

            {/* Payment Status Filter */}
            <div>
              <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Payment Status
              </label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all" style={{ background: '#1a1a1a', color: '#fff' }}>All Payments</option>
                <option value="paid" style={{ background: '#1a1a1a', color: '#fff' }}>Paid</option>
                <option value="unpaid" style={{ background: '#1a1a1a', color: '#fff' }}>Not Paid</option>
              </select>
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

        {/* Action Buttons Row */}
        <div style={{ 
          marginBottom: '2rem', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={generatePDF}
            disabled={generatingPDF || teams.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: generatingPDF || teams.length === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.2)',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              borderRadius: '0.75rem',
              color: generatingPDF || teams.length === 0 ? '#888' : '#FFD700',
              cursor: generatingPDF || teams.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
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
                  width: '18px',
                  height: '18px',
                  border: '3px solid rgba(255, 215, 0, 0.2)',
                  borderTop: '3px solid #FFD700',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Generating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download PDF
              </>
            )}
          </button>

          <button
            onClick={() => setEditPaymentMode(true)}
            disabled={editPaymentMode}
            style={{
              padding: '0.75rem 1.5rem',
              background: editPaymentMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '0.75rem',
              color: '#22c55e',
              cursor: editPaymentMode ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              opacity: editPaymentMode ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!editPaymentMode) {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!editPaymentMode) {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Payment Status
          </button>
        </div>

        {/* Payment Status Edit Controls */}
        {editPaymentMode && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <div>
                <div style={{ color: '#22c55e', fontWeight: '600', fontSize: '1rem' }}>
                  Edit Payment Status Mode
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                  Click on teams to toggle payment status, then save changes
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleCancelPaymentEdit}
                disabled={savingPaymentStatus}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: '#aaa',
                  cursor: savingPaymentStatus ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  opacity: savingPaymentStatus ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePaymentChanges}
                disabled={savingPaymentStatus || Object.keys(paymentStatusChanges).length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: savingPaymentStatus || Object.keys(paymentStatusChanges).length === 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: '0.5rem',
                  color: '#22c55e',
                  cursor: savingPaymentStatus || Object.keys(paymentStatusChanges).length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: savingPaymentStatus || Object.keys(paymentStatusChanges).length === 0 ? 0.5 : 1
                }}
              >
                {savingPaymentStatus ? 'Saving...' : `Save Changes (${Object.keys(paymentStatusChanges).filter(id => paymentStatusChanges[id]).length})`}
              </button>
            </div>
          </div>
        )}

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
                {filteredTeams.map((team, index) => {
                  const currentPaymentStatus = getTeamPaymentStatus(team);
                  const isChanged = paymentStatusChanges.hasOwnProperty(team._id) && paymentStatusChanges[team._id];
                  
                  return (
                  <div
                    key={team._id}
                    onClick={() => editPaymentMode && handleTogglePaymentStatus(team._id)}
                    style={{
                      background: isChanged ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: isChanged ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                      alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'all 0.2s',
                      cursor: editPaymentMode ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => {
                      if (editPaymentMode) {
                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                      } else {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isChanged) {
                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
                      } else {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                      }
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
                          lineHeight: '1.4',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          <span>{getGameName(team.gameId)} - {team.secondTeamName ? `${team.secondTeamName} (${getHallName(team.hallId)} - Team ${team.teamName})` : `${getHallName(team.hallId)} (Team ${team.teamName})`}</span>
                          {currentPaymentStatus && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.5rem',
                              background: 'rgba(34, 197, 94, 0.2)',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                              borderRadius: '0.375rem',
                              color: '#22c55e',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '0.25rem' }}>
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              Paid
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.85rem' }}>
                          {team.players.length} players
                        </div>
                      </div>
                    </div>
                    {!editPaymentMode && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: window.innerWidth < 768 ? '100%' : 'auto' }}>
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
                    )}
                  </div>
                  );
                })}
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
                <div style={{ flex: 1 }}>
                  {editMode ? (
                    <div>
                      <label style={{ display: 'block', color: '#FFD700', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Team Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={editFormData.secondTeamName}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, secondTeamName: e.target.value }))}
                        placeholder="Leave empty to use hall name"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '0.5rem',
                          color: '#fff',
                          fontSize: '1rem',
                          marginBottom: '0.5rem'
                        }}
                      />
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>
                        {getHallName(selectedTeam.hallId)} - Team {selectedTeam.teamName} • {getGameName(selectedTeam.gameId)}
                      </p>
                    </div>
                  ) : (
                    <>
                      <h2 style={{ color: '#FFD700', fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {selectedTeam.secondTeamName || `${getHallName(selectedTeam.hallId)} (Team ${selectedTeam.teamName})`}
                      </h2>
                      <p style={{ color: '#888', fontSize: '0.9rem' }}>
                        {selectedTeam.secondTeamName ? `${getHallName(selectedTeam.hallId)} - Team ${selectedTeam.teamName} • ${getGameName(selectedTeam.gameId)}` : getGameName(selectedTeam.gameId)}
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowTeamModal(false);
                    setEditMode(false);
                  }}
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
                    marginLeft: '1rem'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#FFD700', fontSize: '1.1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Players ({editMode ? editFormData.players.length : selectedTeam.players.length})
                  </h3>
                  {editMode && (
                    <button
                      onClick={handleAddPlayer}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '0.5rem',
                        color: '#22c55e',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add Player
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {(editMode ? editFormData.players : selectedTeam.players).map((player, idx) => (
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
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        {editMode ? (
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                            placeholder="Player name"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '0.5rem',
                              color: '#fff',
                              fontSize: '1rem'
                            }}
                          />
                        ) : (
                          <div style={{ color: '#fff', fontWeight: '500' }}>{player.name}</div>
                        )}
                      </div>
                      {editMode && (
                        <button
                          onClick={() => handleRemovePlayer(idx)}
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '0.5rem',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {editMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingTeam}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        color: '#aaa',
                        cursor: savingTeam ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        opacity: savingTeam ? 0.5 : 1
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTeam}
                      disabled={savingTeam}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: savingTeam ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.2)',
                        border: '1px solid rgba(255, 215, 0, 0.4)',
                        borderRadius: '0.5rem',
                        color: '#FFD700',
                        cursor: savingTeam ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: savingTeam ? 0.5 : 1
                      }}
                    >
                      {savingTeam ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditClick}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(255, 215, 0, 0.2)',
                      border: '1px solid rgba(255, 215, 0, 0.4)',
                      borderRadius: '0.5rem',
                      color: '#FFD700',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Team
                  </button>
                )}
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
