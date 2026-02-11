import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';

const Management = () => {
  // Event Settings State
  const [eventDate, setEventDate] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventLoading, setEventLoading] = useState(false);
  
  // Games State
  const [games, setGames] = useState([]);
  const [fetchingGames, setFetchingGames] = useState(true);
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [gameFormData, setGameFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: '',
    rulebook: '',
    registrationAmount: '',
    minPlayersPerTeam: '',
    maxPlayersPerTeam: '',
    maxTeams: '',
    qrCodeImage: '',
    venue: '',
    dateTime: null
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingQRCode, setUploadingQRCode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Messages
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchEventSettings();
    fetchGames();
  }, []);

  const fetchEventSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/event/settings`);
      setEventDate(dayjs(response.data.eventDate));
      setEventName(response.data.eventName);
    } catch (error) {
      console.error('Fetch settings error:', error);
    }
  };

  const fetchGames = async () => {
    setFetchingGames(true);
    try {
      const response = await axios.get(`${API_URL}/api/games/all`, { withCredentials: true });
      setGames(response.data);
    } catch (error) {
      console.error('Fetch games error:', error);
      setError('Failed to fetch games');
    } finally {
      setFetchingGames(false);
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventLoading(true);

    try {
      await axios.put(
        `${API_URL}/api/event/settings`,
        {
          eventDate: eventDate.toISOString(),
          eventName,
        },
        { withCredentials: true }
      );

      setToast({ message: 'Event settings updated successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update settings', type: 'error' });
    } finally {
      setEventLoading(false);
    }
  };

  const handleGameSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...gameFormData,
        dateTime: gameFormData.dateTime ? gameFormData.dateTime.toISOString() : null
      };

      if (editingGame) {
        await axios.put(
          `${API_URL}/api/games/${editingGame._id}`,
          payload,
          { withCredentials: true }
        );
        setToast({ message: 'Game updated successfully', type: 'success' });
      } else {
        await axios.post(
          `${API_URL}/api/games`,
          payload,
          { withCredentials: true }
        );
        setToast({ message: 'Game created successfully', type: 'success' });
      }
      
      fetchGames();
      handleCloseGameModal();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save game', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (id) => {
    setConfirmDialog({
      title: 'Delete Game',
      message: 'Are you sure you want to delete this game? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/games/${id}`, { withCredentials: true });
          setToast({ message: 'Game deleted successfully', type: 'success' });
          fetchGames();
        } catch (err) {
          setToast({ message: err.response?.data?.message || 'Failed to delete game', type: 'error' });
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setGameFormData({
      name: game.name,
      description: game.description,
      image: game.image,
      icon: game.icon || '',
      rulebook: game.rulebook || '',
      registrationAmount: game.registrationAmount || '',
      minPlayersPerTeam: game.minPlayersPerTeam || '',
      maxPlayersPerTeam: game.maxPlayersPerTeam || '',
      maxTeams: game.maxTeams || '',
      qrCodeImage: game.qrCodeImage || '',
      venue: game.venue || '',
      dateTime: game.dateTime ? dayjs(game.dateTime) : null
    });
    setShowGameModal(true);
  };

  const handleCloseGameModal = () => {
    setShowGameModal(false);
    setEditingGame(null);
    setGameFormData({
      name: '',
      description: '',
      image: '',
      icon: '',
      rulebook: '',
      registrationAmount: '',
      minPlayersPerTeam: '',
      maxPlayersPerTeam: '',
      maxTeams: '',
      qrCodeImage: '',
      venue: '',
      dateTime: null
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `${API_URL}/api/upload/image`,
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setGameFormData(prev => ({ ...prev, image: response.data.url }));
    } catch (error) {
      console.error('Image upload error:', error);
      setToast({ message: error.response?.data?.message || 'Failed to upload image', type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: 'Icon size should be less than 2MB', type: 'error' });
      return;
    }

    setUploadingIcon(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `${API_URL}/api/upload/image`,
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setGameFormData(prev => ({ ...prev, icon: response.data.url }));
      setToast({ message: 'Icon uploaded successfully. Recommended size: 64x64px', type: 'success' });
    } catch (error) {
      console.error('Icon upload error:', error);
      setToast({ message: error.response?.data?.message || 'Failed to upload icon', type: 'error' });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleQRCodeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image size should be less than 5MB', type: 'error' });
      return;
    }

    setUploadingQRCode(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `${API_URL}/api/upload/image`,
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setGameFormData(prev => ({ ...prev, qrCodeImage: response.data.url }));
    } catch (error) {
      console.error('QR code upload error:', error);
      setToast({ message: error.response?.data?.message || 'Failed to upload QR code', type: 'error' });
    } finally {
      setUploadingQRCode(false);
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
            controlHeight: 40,
            fontSize: 14,
            borderRadius: 8,
          },
          components: {
            DatePicker: {
              cellHoverBg: 'rgba(255, 215, 0, 0.2)',
              cellActiveWithRangeBg: '#FFD700',
              cellRangeBorderColor: '#FFD700',
              cellBgDisabled: 'transparent',
              colorTextDisabled: '#444',
            },
          },
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <h2 style={{
            fontSize: '2rem',
            color: '#FFD700',
            fontWeight: 'bold',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2v-5h6v7z"></path>
              <path d="M15 21h4a2 2 0 0 0 2-2v-9h-6v11z"></path>
              <path d="M9 14V9h6v5"></path>
              <path d="M12 2l2 3h3l-2 3 2 3h-3l-2 3-2-3H7l2-3-2-3h3l2-3z"></path>
            </svg>
            Event Management
          </h2>

          {/* Compact Event Settings */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              color: '#FFD700',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              Event Settings
            </h3>
            <form onSubmit={handleEventSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    placeholder="Dangal 4.0"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    Event Date & Time
                  </label>
                  <DatePicker
                    value={eventDate}
                    onChange={(date) => setEventDate(date)}
                    showTime={{ format: 'HH:mm', minuteStep: 1 }}
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Select date and time"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={eventLoading}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: eventLoading ? '#666' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: eventLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {eventLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Games Management */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#FFD700',
                fontWeight: 'bold',
                marginBottom: '0.25rem'
              }}>
                Games
              </h3>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                Manage games and events • {games.length} Total
              </p>
            </div>
            <button
              onClick={() => setShowGameModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
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
                gap: '0.5rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Game
            </button>
          </div>

          {/* Games Grid */}
          {fetchingGames ? (
            <Loader size="large" />
          ) : games.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {games.map((game) => (
                <div
                  key={game._id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Game Image */}
                  <div style={{
                    width: '100%',
                    height: '180px',
                    overflow: 'hidden',
                    background: 'rgba(0, 0, 0, 0.3)'
                  }}>
                    <img 
                      src={game.image} 
                      alt={game.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1
                  }}>
                    <h4 style={{
                      fontSize: '1.25rem',
                      color: '#FFD700',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem'
                    }}>
                      {game.name}
                    </h4>

                    <p style={{
                      color: '#aaa',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      lineHeight: '1.5'
                    }}>
                      {game.description.length > 100 
                        ? `${game.description.substring(0, 100)}...` 
                        : game.description}
                    </p>

                    {(game.venue || game.dateTime) && (
                      <div style={{
                        marginBottom: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(255, 215, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        {game.venue && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#888',
                            fontSize: '0.85rem'
                          }}>
                            <svg 
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2"
                              style={{ flexShrink: 0, display: 'block' }}
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span style={{ lineHeight: '1' }}>{game.venue}</span>
                          </div>
                        )}
                        {game.dateTime && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#888',
                            fontSize: '0.85rem'
                          }}>
                            <svg 
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2"
                              style={{ flexShrink: 0, display: 'block' }}
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span style={{ lineHeight: '1' }}>{dayjs(game.dateTime).format('DD/MM/YYYY HH:mm')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: 'auto'
                    }}>
                      {game.rulebook && (
                        <a
                          href={game.rulebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'rgba(96, 165, 250, 0.1)',
                            border: '1px solid rgba(96, 165, 250, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#60a5fa',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          Rules
                        </a>
                      )}
                      <button
                        onClick={() => handleEditGame(game)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(255, 215, 0, 0.1)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '0.5rem',
                          color: '#FFD700',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGame(game._id)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '0.5rem',
                          color: '#ff6b6b',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#888'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              <p>No games added yet. Click "Add Game" to create one.</p>
            </div>
          )}
        </div>

      {/* Game Modal */}
      {showGameModal && (
        <>
          <div
            onClick={handleCloseGameModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#FFD700 transparent'
          }}
          className="custom-scrollbar"
          >
            <h3 style={{
              fontSize: '1.5rem',
              color: '#FFD700',
              fontWeight: 'bold',
              marginBottom: '1.5rem'
            }}>
              {editingGame ? 'Edit Game' : 'Add New Game'}
            </h3>

            <form onSubmit={handleGameSubmit}>
              {/* Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Game Name *
                </label>
                <input
                  type="text"
                  value={gameFormData.name}
                  onChange={(e) => setGameFormData({ ...gameFormData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., Kabaddi"
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Description *
                </label>
                <textarea
                  value={gameFormData.description}
                  onChange={(e) => setGameFormData({ ...gameFormData, description: e.target.value })}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Describe the game..."
                />
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Game Image *
                </label>
                
                {gameFormData.image ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 215, 0, 0.3)'
                  }}>
                    <img 
                      src={gameFormData.image} 
                      alt="Game preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setGameFormData({ ...gameFormData, image: '' })}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                      id="game-image-upload"
                    />
                    <label
                      htmlFor="game-image-upload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '150px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px dashed rgba(255, 215, 0, 0.3)',
                        borderRadius: '0.5rem',
                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader size="small" />
                          <span style={{ color: '#FFD700', fontSize: '0.9rem', marginTop: '0.5rem' }}>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" style={{ marginBottom: '0.5rem' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold' }}>Click to upload image</span>
                          <span style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>PNG, JPG up to 5MB</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Game Icon Upload - Optional */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Game Icon (64x64px) - Optional
                </label>
                
                {gameFormData.icon ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '150px',
                    height: '150px',
                    margin: '0 auto',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                    background: 'rgba(0, 0, 0, 0.3)'
                  }}>
                    <img 
                      src={gameFormData.icon} 
                      alt="Game icon preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: '1rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setGameFormData({ ...gameFormData, icon: '' })}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      disabled={uploadingIcon}
                      style={{ display: 'none' }}
                      id="game-icon-upload"
                    />
                    <label
                      htmlFor="game-icon-upload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '150px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px dashed rgba(255, 215, 0, 0.3)',
                        borderRadius: '0.5rem',
                        cursor: uploadingIcon ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {uploadingIcon ? (
                        <>
                          <Loader size="small" />
                          <span style={{ color: '#FFD700', fontSize: '0.9rem', marginTop: '0.5rem' }}>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" style={{ marginBottom: '0.5rem' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>Upload Icon</span>
                          <span style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>PNG, JPG up to 2MB</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
                <p style={{
                  fontSize: '0.75rem',
                  color: '#888',
                  marginTop: '0.5rem',
                  marginBottom: 0,
                  textAlign: 'center'
                }}>
                  Small icon for match cards (recommended: 64x64px, PNG with transparency)
                </p>
              </div>

              {/* Rulebook PDF URL */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Rulebook PDF URL *
                </label>
                <input
                  type="url"
                  value={gameFormData.rulebook}
                  onChange={(e) => setGameFormData({ ...gameFormData, rulebook: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="https://example.com/rulebook.pdf"
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: '#888',
                  marginTop: '0.25rem',
                  marginBottom: 0
                }}>
                  Enter the direct URL to the PDF rulebook
                </p>
              </div>

              {/* Registration Amount */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Registration Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={gameFormData.registrationAmount}
                  onChange={(e) => setGameFormData({ ...gameFormData, registrationAmount: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., 100"
                />
              </div>

              {/* Min and Max Players Per Team */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem',
                marginBottom: '1.5rem' 
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    Min Players/Team *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={gameFormData.minPlayersPerTeam}
                    onChange={(e) => setGameFormData({ ...gameFormData, minPlayersPerTeam: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    Max Players/Team *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={gameFormData.maxPlayersPerTeam}
                    onChange={(e) => setGameFormData({ ...gameFormData, maxPlayersPerTeam: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="e.g., 7"
                  />
                </div>
              </div>

              {/* Max Teams */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Max Number of Teams *
                </label>
                <input
                  type="number"
                  min="1"
                  value={gameFormData.maxTeams}
                  onChange={(e) => setGameFormData({ ...gameFormData, maxTeams: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., 8"
                />
              </div>

              {/* QR Code Upload - Full Width */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Payment QR Code *
                </label>
                
                {gameFormData.qrCodeImage ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '300px',
                    height: '300px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    margin: '0 auto'
                  }}>
                    <img 
                      src={gameFormData.qrCodeImage} 
                      alt="QR Code preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#fff'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setGameFormData({ ...gameFormData, qrCodeImage: '' })}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQRCodeUpload}
                      disabled={uploadingQRCode}
                      style={{ display: 'none' }}
                      id="qr-code-upload"
                      required
                    />
                    <label
                      htmlFor="qr-code-upload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '200px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px dashed rgba(255, 215, 0, 0.3)',
                        borderRadius: '0.5rem',
                        cursor: uploadingQRCode ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {uploadingQRCode ? (
                        <>
                          <Loader size="small" />
                          <span style={{ color: '#FFD700', fontSize: '0.9rem', marginTop: '0.5rem' }}>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" style={{ marginBottom: '0.5rem' }}>
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                          <span style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold' }}>Click to upload QR Code</span>
                          <span style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>PNG, JPG up to 5MB</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Venue - Optional */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Venue - Optional
                </label>
                <input
                  type="text"
                  value={gameFormData.venue}
                  onChange={(e) => setGameFormData({ ...gameFormData, venue: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., Parade Ground"
                />
              </div>

              {/* Date & Time - Optional */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Date & Time - Optional
                </label>
                <DatePicker
                  value={gameFormData.dateTime}
                  onChange={(date) => setGameFormData({ ...gameFormData, dateTime: date })}
                  showTime={{ format: 'HH:mm', minuteStep: 1 }}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Select date and time"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={handleCloseGameModal}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading || 
                    uploadingImage || 
                    uploadingQRCode || 
                    !gameFormData.image || 
                    !gameFormData.rulebook ||
                    !gameFormData.registrationAmount ||
                    !gameFormData.minPlayersPerTeam ||
                    !gameFormData.maxPlayersPerTeam ||
                    !gameFormData.maxTeams ||
                    !gameFormData.qrCodeImage
                  }
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: (
                      loading || 
                      uploadingImage || 
                      uploadingQRCode || 
                      !gameFormData.image || 
                      !gameFormData.rulebook ||
                      !gameFormData.registrationAmount ||
                      !gameFormData.minPlayersPerTeam ||
                      !gameFormData.maxPlayersPerTeam ||
                      !gameFormData.maxTeams ||
                      !gameFormData.qrCodeImage
                    ) ? '#666' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: (
                      loading || 
                      uploadingImage || 
                      uploadingQRCode || 
                      !gameFormData.image || 
                      !gameFormData.rulebook ||
                      !gameFormData.registrationAmount ||
                      !gameFormData.minPlayersPerTeam ||
                      !gameFormData.maxPlayersPerTeam ||
                      !gameFormData.maxTeams ||
                      !gameFormData.qrCodeImage
                    ) ? '#aaa' : '#000',
                    fontWeight: 'bold',
                    cursor: (
                      loading || 
                      uploadingImage || 
                      uploadingQRCode || 
                      !gameFormData.image || 
                      !gameFormData.rulebook ||
                      !gameFormData.registrationAmount ||
                      !gameFormData.minPlayersPerTeam ||
                      !gameFormData.maxPlayersPerTeam ||
                      !gameFormData.maxTeams ||
                      !gameFormData.qrCodeImage
                    ) ? 'not-allowed' : 'pointer',
                    opacity: (
                      loading || 
                      uploadingImage || 
                      uploadingQRCode || 
                      !gameFormData.image || 
                      !gameFormData.rulebook ||
                      !gameFormData.registrationAmount ||
                      !gameFormData.minPlayersPerTeam ||
                      !gameFormData.maxPlayersPerTeam ||
                      !gameFormData.maxTeams ||
                      !gameFormData.qrCodeImage
                    ) ? 0.6 : 1
                  }}
                >
                  {loading ? 'Saving...' : (editingGame ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Ant Design Styles */}
      <style>{`
        /* Custom Scrollbar for Modal */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 1rem 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFD700;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FFA500;
        }
        /* Hide scrollbar arrows */
        .custom-scrollbar::-webkit-scrollbar-button {
          display: none;
        }

        /* DatePicker Input */
        .ant-picker {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 215, 0, 0.3) !important;
        }
        .ant-picker:hover {
          border-color: #FFD700 !important;
        }
        .ant-picker-focused {
          border-color: #FFD700 !important;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.1) !important;
        }
        .ant-picker-input > input {
          color: #fff !important;
        }
        .ant-picker-suffix {
          color: #FFD700 !important;
        }

        /* Dropdown Panel */
        .ant-picker-dropdown {
          z-index: 9999 !important;
        }
        .ant-picker-panel-container {
          background: #1a1a1a !important;
          border: 1px solid rgba(255, 215, 0, 0.3) !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
        }

        /* Header */
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

        /* Calendar Cells */
        .ant-picker-content th {
          color: #888 !important;
        }
        .ant-picker-cell {
          color: #fff !important;
        }
        .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-disabled) .ant-picker-cell-inner {
          background: rgba(255, 215, 0, 0.2) !important;
        }
        
        /* SELECTED CELL - Yellow background with black text */
        .ant-picker-cell-selected .ant-picker-cell-inner {
          background: #FFD700 !important;
          color: #000 !important;
          font-weight: bold !important;
        }
        .ant-picker-cell-selected:hover .ant-picker-cell-inner {
          background: #FFD700 !important;
          color: #000 !important;
        }

        /* Today indicator */
        .ant-picker-cell-today .ant-picker-cell-inner::before {
          border: 1px solid #FFD700 !important;
        }

        /* Disabled cells */
        .ant-picker-cell-disabled {
          color: #444 !important;
        }
        .ant-picker-cell-disabled .ant-picker-cell-inner {
          background: transparent !important;
        }

        /* Time Panel */
        .ant-picker-time-panel {
          border-left: 1px solid rgba(255, 215, 0, 0.2) !important;
        }
        .ant-picker-time-panel-column {
          overflow-y: auto !important;
          position: relative !important;
        }
        
        /* Add HH and MM headers */
        .ant-picker-time-panel-column::before {
          content: attr(data-label);
          position: sticky !important;
          top: 0 !important;
          display: block !important;
          padding: 8px 0 !important;
          background: #1a1a1a !important;
          color: #FFD700 !important;
          font-weight: bold !important;
          font-size: 12px !important;
          text-align: center !important;
          border-bottom: 1px solid rgba(255, 215, 0, 0.2) !important;
          z-index: 10 !important;
        }
        .ant-picker-time-panel-column:first-child::before {
          content: 'HH' !important;
        }
        .ant-picker-time-panel-column:last-child::before {
          content: 'MM' !important;
        }
        
        .ant-picker-time-panel-cell {
          color: #fff !important;
        }
        .ant-picker-time-panel-cell:hover {
          background: rgba(255, 215, 0, 0.2) !important;
        }
        
        /* SELECTED TIME CELL - Yellow background with black text */
        .ant-picker-time-panel-cell-selected {
          background: #FFD700 !important;
        }
        .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
          background: transparent !important;
          color: #000 !important;
          font-weight: bold !important;
        }

        /* Footer */
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
          background: #FFD700 !important;
          border: none !important;
          color: #000 !important;
          font-weight: bold !important;
        }
        .ant-picker-ok button:hover {
          opacity: 0.9 !important;
        }

        /* Scrollbar */
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
      `}</style>
      </ConfigProvider>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </AdminLayout>
  );
};

export default Management;
