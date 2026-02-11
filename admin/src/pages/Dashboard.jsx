import AdminLayout from '../components/AdminLayout';
import Countdown from '../components/Countdown';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);

  useEffect(() => {
    fetchUserCount();
    fetchRegistrationStatus();
  }, []);

  const fetchUserCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true,
      });
      setUserCount(response.data.total);
    } catch (err) {
      console.error('Fetch user count error:', err);
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/event/settings`);
      setRegistrationOpen(response.data.registrationOpen || false);
    } catch (err) {
      console.error('Fetch registration status error:', err);
    }
  };

  const toggleRegistration = async () => {
    setLoadingToggle(true);
    try {
      const response = await axios.post(`${API_URL}/api/event/registration/toggle`, {}, {
        withCredentials: true,
      });
      setRegistrationOpen(response.data.registrationOpen);
      alert(response.data.message);
    } catch (err) {
      console.error('Toggle registration error:', err);
      alert('Failed to toggle registration');
    } finally {
      setLoadingToggle(false);
    }
  };

  const stats = [
    { 
      title: 'Total Registrations', 
      value: '0', 
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
      value: '0', 
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
      value: '3', 
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
      {/* Registration Control - Top Priority */}
      <div style={{
        background: registrationOpen 
          ? 'linear-gradient(135deg, rgba(76,175,80,0.2) 0%, rgba(56,142,60,0.1) 100%)'
          : 'linear-gradient(135deg, rgba(255,152,0,0.2) 0%, rgba(245,124,0,0.1) 100%)',
        border: `2px solid ${registrationOpen ? '#4CAF50' : '#FF9800'}`,
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h2 style={{ 
              fontSize: '1.75rem', 
              marginBottom: '0.5rem', 
              color: registrationOpen ? '#4CAF50' : '#FF9800',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Registration Control
            </h2>
            <p style={{ 
              color: '#aaa', 
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
            }}>
              {registrationOpen 
                ? 'Registrations are currently OPEN. Users can sign in and register teams.'
                : 'Registrations are currently CLOSED. Users will see "Registration Starting Soon" message.'}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: registrationOpen ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)',
              borderRadius: '0.5rem',
              marginTop: '0.5rem',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: registrationOpen ? '#4CAF50' : '#FF9800',
                boxShadow: `0 0 10px ${registrationOpen ? '#4CAF50' : '#FF9800'}`,
                animation: 'pulse 2s infinite',
              }}></div>
              <span style={{ 
                color: registrationOpen ? '#4CAF50' : '#FF9800',
                fontWeight: 'bold',
                fontSize: '0.9rem',
              }}>
                Status: {registrationOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleRegistration}
            disabled={loadingToggle}
            style={{
              padding: '1.25rem 2.5rem',
              background: registrationOpen 
                ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#fff',
              fontWeight: 'bold',
              cursor: loadingToggle ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              boxShadow: registrationOpen 
                ? '0 4px 20px rgba(255,152,0,0.4)'
                : '0 4px 20px rgba(76,175,80,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s',
              opacity: loadingToggle ? 0.7 : 1,
              minWidth: '200px',
              justifyContent: 'center',
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Close Registration
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Open Registration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Countdown Section */}
      <div style={{ marginBottom: '2rem' }}>
        <Countdown />
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: stat.gradient,
              border: `1px solid ${stat.color}40`,
              borderRadius: '1rem',
              padding: '1.5rem',
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
              top: '1rem',
              right: '1rem',
              opacity: 0.3,
            }}>
              {stat.icon}
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#888', 
              marginBottom: '0.5rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {stat.title}
            </div>
            <div style={{ 
              fontSize: '2.5rem', 
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
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              path: '/event-settings' 
            },
            { 
              label: 'View Analytics', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              ), 
              path: '#' 
            },
            { 
              label: 'Send Notifications', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              ), 
              path: '#' 
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
                padding: '1.25rem',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.75rem',
                color: '#FFD700',
                cursor: action.path !== '#' ? 'pointer' : 'not-allowed',
                fontSize: '0.95rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s',
                opacity: action.path === '#' ? 0.5 : 1,
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
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '1rem',
        padding: '2rem',
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem', 
          color: '#FFD700',
          fontWeight: 'bold',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Upcoming Features
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#888',
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
        }}>
          These features are currently in development and will be available soon
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {[
            { label: 'Live Score Management', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> },
            { label: 'Registration Management', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> },
            { label: 'Match Scheduling', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
            { label: 'Event Management', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> },
            { label: 'Real-time Updates', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> },
            { label: 'Analytics Dashboard', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                padding: '1.25rem',
                background: 'rgba(255, 215, 0, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                textAlign: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                {feature.icon}
              </div>
              <div style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: '500' }}>
                {feature.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </AdminLayout>
  );
};

export default Dashboard;
