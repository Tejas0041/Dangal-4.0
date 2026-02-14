import AdminLayout from '../components/AdminLayout';
import Countdown from '../components/Countdown';
import Toast from '../components/Toast';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [activeMatchesCount, setActiveMatchesCount] = useState(0);
  const [totalEventsCount, setTotalEventsCount] = useState(3);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [matchesVisible, setMatchesVisible] = useState(false);
  const [scoresVisible, setScoresVisible] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingMatchesToggle, setLoadingMatchesToggle] = useState(false);
  const [loadingScoresToggle, setLoadingScoresToggle] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [usersRes, settingsRes, matchesRes, teamsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users`, { withCredentials: true }),
        axios.get(`${API_URL}/api/event/settings`),
        axios.get(`${API_URL}/api/schedule`),
        axios.get(`${API_URL}/api/teams/all`, { withCredentials: true })
      ]);

      setUserCount(usersRes.data.total || 0);
      setRegistrationOpen(settingsRes.data.registrationOpen || false);
      setMatchesVisible(settingsRes.data.matchesVisible || false);
      setScoresVisible(settingsRes.data.scoresVisible || false);
      
      // Count active (Live) matches
      const activeMatches = matchesRes.data.filter(m => m.status === 'Live');
      setActiveMatchesCount(activeMatches.length);
      
      // Count team registrations
      setRegistrationCount(teamsRes.data.length || 0);
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
    }
  };

  const toggleRegistration = async () => {
    setLoadingToggle(true);
    try {
      const response = await axios.post(`${API_URL}/api/event/registration/toggle`, {}, {
        withCredentials: true,
      });
      setRegistrationOpen(response.data.registrationOpen);
      setToast({ message: response.data.message, type: 'success' });
    } catch (err) {
      console.error('Toggle registration error:', err);
      setToast({ message: 'Failed to toggle registration', type: 'error' });
    } finally {
      setLoadingToggle(false);
    }
  };

  const toggleMatchesVisibility = async () => {
    setLoadingMatchesToggle(true);
    try {
      const response = await axios.post(`${API_URL}/api/event/matches/toggle`, {}, {
        withCredentials: true,
      });
      setMatchesVisible(response.data.matchesVisible);
      setToast({ message: response.data.message, type: 'success' });
    } catch (err) {
      console.error('Toggle matches visibility error:', err);
      setToast({ message: 'Failed to toggle matches visibility', type: 'error' });
    } finally {
      setLoadingMatchesToggle(false);
    }
  };

  const toggleScoresVisibility = async () => {
    setLoadingScoresToggle(true);
    try {
      const response = await axios.post(`${API_URL}/api/event/scores/toggle`, {}, {
        withCredentials: true,
      });
      setScoresVisible(response.data.scoresVisible);
      setToast({ message: response.data.message, type: 'success' });
    } catch (err) {
      console.error('Toggle scores visibility error:', err);
      setToast({ message: 'Failed to toggle scores visibility', type: 'error' });
    } finally {
      setLoadingScoresToggle(false);
    }
  };

  const stats = [
    { 
      title: 'Total Registrations', 
      value: registrationCount.toString(), 
      color: '#FFD700', 
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,193,7,0.1) 100%)' 
    },
    { 
      title: 'Active Matches', 
      value: activeMatchesCount.toString(), 
      color: '#4CAF50', 
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="7"></circle>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, rgba(76,175,80,0.2) 0%, rgba(56,142,60,0.1) 100%)' 
    },
    { 
      title: 'Total Events', 
      value: totalEventsCount.toString(), 
      color: '#2196F3', 
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, rgba(33,150,243,0.2) 0%, rgba(25,118,210,0.1) 100%)' 
    },
    { 
      title: 'Total Users', 
      value: userCount.toString(), 
      color: '#FF9800', 
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, rgba(255,152,0,0.2) 0%, rgba(245,124,0,0.1) 100%)' 
    },
  ];

  return (
    <AdminLayout>
      {/* Countdown Section - Moved to Top */}
      <div style={{ marginBottom: '2rem' }}>
        <Countdown />
      </div>

      {/* Control Buttons - Single Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {/* Registration Control */}
        <div style={{
          background: registrationOpen 
            ? 'linear-gradient(135deg, rgba(76,175,80,0.2) 0%, rgba(56,142,60,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(255,152,0,0.2) 0%, rgba(245,124,0,0.1) 100%)',
          border: `2px solid ${registrationOpen ? '#4CAF50' : '#FF9800'}`,
          borderRadius: '1rem',
          padding: '1.5rem',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '0.5rem', 
            color: registrationOpen ? '#4CAF50' : '#FF9800',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Registration Control
          </h3>
          <p style={{ 
            color: '#aaa', 
            fontSize: '0.85rem',
            marginBottom: '0.75rem',
          }}>
            {registrationOpen 
              ? 'Registrations are currently OPEN. Users can sign in and register teams.'
              : 'Registrations are currently CLOSED. Users will see "Registration Starting Soon" message.'}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            background: registrationOpen ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: registrationOpen ? '#4CAF50' : '#FF9800',
              boxShadow: `0 0 10px ${registrationOpen ? '#4CAF50' : '#FF9800'}`,
              animation: 'pulse 2s infinite',
            }}></div>
            <span style={{ 
              color: registrationOpen ? '#4CAF50' : '#FF9800',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}>
              Status: {registrationOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <button
            onClick={toggleRegistration}
            disabled={loadingToggle}
            style={{
              width: '100%',
              padding: '1rem',
              background: registrationOpen 
                ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#fff',
              fontWeight: 'bold',
              cursor: loadingToggle ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              boxShadow: registrationOpen 
                ? '0 4px 20px rgba(255,152,0,0.4)'
                : '0 4px 20px rgba(76,175,80,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s',
              opacity: loadingToggle ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loadingToggle) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = registrationOpen 
                  ? '0 6px 25px rgba(255,152,0,0.5)'
                  : '0 6px 25px rgba(76,175,80,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingToggle) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = registrationOpen 
                  ? '0 4px 20px rgba(255,152,0,0.4)'
                  : '0 4px 20px rgba(76,175,80,0.4)';
              }
            }}
          >
            {loadingToggle ? (
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
                Processing...
              </>
            ) : registrationOpen ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Close Registration
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Open Registration
              </>
            )}
          </button>
        </div>

        {/* Matches Visibility Control */}
        <div style={{
          background: matchesVisible 
            ? 'linear-gradient(135deg, rgba(76,175,80,0.2) 0%, rgba(56,142,60,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(255,152,0,0.2) 0%, rgba(245,124,0,0.1) 100%)',
          border: `2px solid ${matchesVisible ? '#4CAF50' : '#FF9800'}`,
          borderRadius: '1rem',
          padding: '1.5rem',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '0.5rem', 
            color: matchesVisible ? '#4CAF50' : '#FF9800',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Matches Visibility
          </h3>
          <p style={{ 
            color: '#aaa', 
            fontSize: '0.85rem',
            marginBottom: '0.75rem',
          }}>
            {matchesVisible 
              ? 'Matches are currently VISIBLE. Users can view the match schedule on the website.'
              : 'Matches are currently HIDDEN. Users will see "Coming Soon" message.'}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            background: matchesVisible ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: matchesVisible ? '#4CAF50' : '#FF9800',
              boxShadow: `0 0 10px ${matchesVisible ? '#4CAF50' : '#FF9800'}`,
              animation: 'pulse 2s infinite',
            }}></div>
            <span style={{ 
              color: matchesVisible ? '#4CAF50' : '#FF9800',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}>
              Status: {matchesVisible ? 'VISIBLE' : 'HIDDEN'}
            </span>
          </div>
          <button
            onClick={toggleMatchesVisibility}
            disabled={loadingMatchesToggle}
            style={{
              width: '100%',
              padding: '1rem',
              background: matchesVisible 
                ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#fff',
              fontWeight: 'bold',
              cursor: loadingMatchesToggle ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              boxShadow: matchesVisible 
                ? '0 4px 20px rgba(255,152,0,0.4)'
                : '0 4px 20px rgba(76,175,80,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s',
              opacity: loadingMatchesToggle ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loadingMatchesToggle) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = matchesVisible 
                  ? '0 6px 25px rgba(255,152,0,0.5)'
                  : '0 6px 25px rgba(76,175,80,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingMatchesToggle) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = matchesVisible 
                  ? '0 4px 20px rgba(255,152,0,0.4)'
                  : '0 4px 20px rgba(76,175,80,0.4)';
              }
            }}
          >
            {loadingMatchesToggle ? (
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
                Processing...
              </>
            ) : matchesVisible ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                Hide Matches
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Show Matches
              </>
            )}
          </button>
        </div>

        {/* Scores Visibility Control */}
        <div style={{
          background: scoresVisible 
            ? 'linear-gradient(135deg, rgba(76,175,80,0.2) 0%, rgba(56,142,60,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(255,152,0,0.2) 0%, rgba(245,124,0,0.1) 100%)',
          border: `2px solid ${scoresVisible ? '#4CAF50' : '#FF9800'}`,
          borderRadius: '1rem',
          padding: '1.5rem',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '0.5rem', 
            color: scoresVisible ? '#4CAF50' : '#FF9800',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Scores Visibility
          </h3>
          <p style={{ 
            color: '#aaa', 
            fontSize: '0.85rem',
            marginBottom: '0.75rem',
          }}>
            {scoresVisible 
              ? 'Live scores are currently VISIBLE. Users can view real-time match scores.'
              : 'Live scores are currently HIDDEN. Users will see "Coming Soon" message.'}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            background: scoresVisible ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: scoresVisible ? '#4CAF50' : '#FF9800',
              boxShadow: `0 0 10px ${scoresVisible ? '#4CAF50' : '#FF9800'}`,
              animation: 'pulse 2s infinite',
            }}></div>
            <span style={{ 
              color: scoresVisible ? '#4CAF50' : '#FF9800',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}>
              Status: {scoresVisible ? 'VISIBLE' : 'HIDDEN'}
            </span>
          </div>
          <button
            onClick={toggleScoresVisibility}
            disabled={loadingScoresToggle}
            style={{
              width: '100%',
              padding: '1rem',
              background: scoresVisible 
                ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#fff',
              fontWeight: 'bold',
              cursor: loadingScoresToggle ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              boxShadow: scoresVisible 
                ? '0 4px 20px rgba(255,152,0,0.4)'
                : '0 4px 20px rgba(76,175,80,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s',
              opacity: loadingScoresToggle ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loadingScoresToggle) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = scoresVisible 
                  ? '0 6px 25px rgba(255,152,0,0.5)'
                  : '0 6px 25px rgba(76,175,80,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingScoresToggle) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = scoresVisible 
                  ? '0 4px 20px rgba(255,152,0,0.4)'
                  : '0 4px 20px rgba(76,175,80,0.4)';
              }
            }}
          >
            {loadingScoresToggle ? (
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
                Processing...
              </>
            ) : scoresVisible ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                Hide Scores
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Show Scores
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: stat.gradient,
              border: `1px solid ${stat.color}40`,
              borderRadius: '1rem',
              padding: '1.25rem',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 25px ${stat.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              opacity: 0.3,
            }}>
              {stat.icon}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#888', 
              marginBottom: '0.5rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {stat.title}
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: stat.color,
              textShadow: `0 0 20px ${stat.color}50`,
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '1rem',
        padding: '1.5rem',
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          marginBottom: '1.5rem', 
          color: '#FFD700',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
        }}>
          {[
            { 
              label: 'Manage Users', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              ), 
              path: '/users' 
            },
            { 
              label: 'Event Settings', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2v-5h6v7z"></path>
                  <path d="M15 21h4a2 2 0 0 0 2-2v-9h-6v11z"></path>
                  <path d="M9 14V9h6v5"></path>
                  <path d="M12 2l2 3h3l-2 3 2 3h-3l-2 3-2-3H7l2-3-2-3h3l2-3z"></path>
                </svg>
              ), 
              path: '/event-management' 
            },
            { 
              label: 'Manage Schedule', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              ), 
              path: '/schedule' 
            },
            { 
              label: 'Score Management', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              ), 
              path: '/scores' 
            },
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => {
                if (action.path !== '#') {
                  window.location.href = action.path;
                }
              }}
              style={{
                padding: '1rem',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.75rem',
                color: '#FFD700',
                cursor: action.path !== '#' ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s',
                opacity: action.path === '#' ? 0.5 : 1,
                minHeight: '100px',
              }}
              onMouseEnter={(e) => {
                if (action.path !== '#') {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (action.path !== '#') {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {action.icon}
              <span style={{ textAlign: 'center' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .countdown-container {
            padding: 1rem !important;
          }
          
          h1, h2, h3 {
            font-size: 1.25rem !important;
          }
          
          .stat-card {
            padding: 1rem !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default Dashboard;
