import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';

const EventSettings = () => {
  const [eventDate, setEventDate] = useState(null);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [matchesVisible, setMatchesVisible] = useState(false);
  const [scoresVisible, setScoresVisible] = useState(false);
  const [toggleLoading, setToggleLoading] = useState({ registration: false, matches: false, scores: false });

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/event/settings`);
      setEventDate(dayjs(response.data.eventDate));
      setEventName(response.data.eventName);
      setRegistrationOpen(response.data.registrationOpen || false);
      setMatchesVisible(response.data.matchesVisible || false);
      setScoresVisible(response.data.scoresVisible || false);
    } catch (error) {
      console.error('Fetch settings error:', error);
    }
  };

  const formatDisplayDate = (date) => {
    if (!date) return '';
    return date.format('DD/MM/YYYY HH:mm');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await axios.put(
        `${API_URL}/api/event/settings`,
        {
          eventDate: eventDate.toISOString(),
          eventName,
        },
        { withCredentials: true }
      );

      setMessage(response.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (type) => {
    setToggleLoading(prev => ({ ...prev, [type]: true }));
    setMessage('');
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/event/${type}/toggle`,
        {},
        { withCredentials: true }
      );

      setMessage(response.data.message);
      
      if (type === 'registration') {
        setRegistrationOpen(response.data.registrationOpen);
      } else if (type === 'matches') {
        setMatchesVisible(response.data.matchesVisible);
      } else if (type === 'scores') {
        setScoresVisible(response.data.scoresVisible);
      }

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to toggle ${type}`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setToggleLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <AdminLayout>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#FFD700',
            colorBgContainer: 'rgba(255, 255, 255, 0.05)',
            colorBorder: 'rgba(255, 215, 0, 0.3)',
            colorText: '#fff',
            colorTextPlaceholder: '#888',
            colorBgElevated: '#1a1a1a',
            colorIcon: '#FFD700',
            colorIconHover: '#FFA500',
            controlHeight: 48,
            fontSize: 16,
            borderRadius: 12,
          },
          components: {
            DatePicker: {
              cellHoverBg: 'rgba(255, 215, 0, 0.2)',
              cellActiveWithRangeBg: 'rgba(255, 215, 0, 0.1)',
              cellRangeBorderColor: '#FFD700',
            },
          },
        }}
      >
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '1rem',
            padding: '2.5rem',
          }}>
            <h2 style={{ 
              fontSize: '2rem', 
              marginBottom: '0.5rem', 
              color: '#FFD700',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2v-5h6v7z"></path>
                <path d="M15 21h4a2 2 0 0 0 2-2v-9h-6v11z"></path>
                <path d="M9 14V9h6v5"></path>
                <path d="M12 2l2 3h3l-2 3 2 3h-3l-2 3-2-3H7l2-3-2-3h3l2-3z"></path>
              </svg>
              Event Settings
            </h2>
            <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Configure your event details and schedule
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  // display: 'block',
                  marginBottom: '0.75rem',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Event Name
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s',
                  }}
                  placeholder="Dangal 4.0"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFD700';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  // display: 'block',
                  marginBottom: '0.75rem',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Event Date & Time
                </label>
                
                <DatePicker
                  value={eventDate}
                  onChange={(date) => setEventDate(date)}
                  showTime={{
                    format: 'HH:mm',
                    minuteStep: 1,
                  }}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Select date and time"
                  style={{
                    width: '100%',
                  }}
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf('day');
                  }}
                  popupClassName="custom-antd-picker"
                />

                <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                  {eventDate ? `Selected: ${formatDisplayDate(eventDate)} • ` : ''}This will be used for the countdown timer
                </small>
              </div>

              {message && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: '0.75rem',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {message}
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
                  gap: '0.75rem',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '1rem 2rem',
                  background: loading ? '#666' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(255, 215, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s',
                }}
              >
                {loading ? (
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
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Visibility Toggles */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '1rem',
            padding: '2.5rem',
            marginTop: '2rem',
          }}>
            <h2 style={{ 
              fontSize: '2rem', 
              marginBottom: '0.5rem', 
              color: '#FFD700',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Visibility Controls
            </h2>
            <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Control what users can see on the website
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Registration Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 215, 0, 0.15)',
                borderRadius: '0.75rem',
              }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Registration
                  </h3>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>
                    {registrationOpen ? 'Users can register for events' : 'Registration is closed'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('registration')}
                  disabled={toggleLoading.registration}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: registrationOpen ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid',
                    borderColor: registrationOpen ? '#22c55e' : 'rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: registrationOpen ? '#000' : '#fff',
                    fontWeight: 'bold',
                    cursor: toggleLoading.registration ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s',
                    minWidth: '100px',
                  }}
                >
                  {toggleLoading.registration ? 'Loading...' : (registrationOpen ? 'Open' : 'Closed')}
                </button>
              </div>

              {/* Matches Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 215, 0, 0.15)',
                borderRadius: '0.75rem',
              }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Match Schedule
                  </h3>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>
                    {matchesVisible ? 'Match schedule is visible to users' : 'Match schedule is hidden'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('matches')}
                  disabled={toggleLoading.matches}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: matchesVisible ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid',
                    borderColor: matchesVisible ? '#22c55e' : 'rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: matchesVisible ? '#000' : '#fff',
                    fontWeight: 'bold',
                    cursor: toggleLoading.matches ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s',
                    minWidth: '100px',
                  }}
                >
                  {toggleLoading.matches ? 'Loading...' : (matchesVisible ? 'Visible' : 'Hidden')}
                </button>
              </div>

              {/* Scores Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 215, 0, 0.15)',
                borderRadius: '0.75rem',
              }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Live Scores
                  </h3>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>
                    {scoresVisible ? 'Live scores page is visible to users' : 'Live scores page is hidden'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('scores')}
                  disabled={toggleLoading.scores}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: scoresVisible ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid',
                    borderColor: scoresVisible ? '#22c55e' : 'rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: scoresVisible ? '#000' : '#fff',
                    fontWeight: 'bold',
                    cursor: toggleLoading.scores ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s',
                    minWidth: '100px',
                  }}
                >
                  {toggleLoading.scores ? 'Loading...' : (scoresVisible ? 'Visible' : 'Hidden')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ConfigProvider>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Ant Design DatePicker Custom Styles */
        .ant-picker {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 215, 0, 0.3) !important;
          border-radius: 0.75rem !important;
          padding: 1rem !important;
          transition: all 0.3s !important;
        }

        .ant-picker:hover {
          border-color: #FFD700 !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .ant-picker-focused {
          border-color: #FFD700 !important;
          background: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.1) !important;
        }

        .ant-picker-input > input {
          color: #fff !important;
          font-size: 1rem !important;
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
          display: flex !important;
          flex-direction: column !important;
          height: 224px !important;
        }

        .ant-picker-time-panel-column {
          overflow-y: auto !important;
          flex: 1 !important;
          max-height: 224px !important;
        }

        .ant-picker-time-panel-column > ul {
          padding: 0 !important;
          margin: 0 !important;
        }

        .ant-picker-time-panel-column > ul::after {
          display: none !important;
        }

        .ant-picker-time-panel-cell {
          color: #fff !important;
          padding: 4px 0 !important;
          height: 28px !important;
          line-height: 28px !important;
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

        .ant-picker-ranges {
          padding: 0.5rem !important;
        }

        .ant-picker-ranges .ant-picker-preset {
          color: #FFD700 !important;
        }

        .ant-picker-ranges .ant-picker-preset:hover {
          color: #FFA500 !important;
        }

        /* Super/Prev/Next buttons */
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

        /* Scrollbar for time picker */
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

        /* Hide scrollbar when not needed */
        .ant-picker-time-panel-column {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 215, 0, 0.3) rgba(255, 255, 255, 0.05);
          overscroll-behavior: contain;
        }

        /* Additional fix for selected cell inner content */
        .ant-picker-time-panel-cell-selected:hover {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
        }

        .ant-picker-time-panel-cell-inner {
          color: inherit !important;
        }

        /* Ensure panel content uses full height */
        .ant-picker-panel {
          display: flex !important;
          flex-direction: column !important;
        }

        .ant-picker-date-panel,
        .ant-picker-datetime-panel {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
        }

        .ant-picker-body {
          flex: 1 !important;
        }

        .ant-picker-datetime-panel .ant-picker-time-panel {
          width: 100px !important;
        }

        .ant-picker-time-panel-column {
          text-align: center !important;
        }

        /* Prevent over-scrolling */
        .ant-picker-time-panel-column {
          overscroll-behavior: contain !important;
        }
      `}</style>
    </AdminLayout>
  );
};

export default EventSettings;
