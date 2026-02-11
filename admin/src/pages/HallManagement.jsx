import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const HallManagement = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHalls, setFetchingHalls] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showJmcrModal, setShowJmcrModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [editingJmcr, setEditingJmcr] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'boys',
    image: ''
  });
  const [jmcrFormData, setJmcrFormData] = useState({
    name: '',
    gsuite: '',
    contact: ''
  });
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'boys', 'girls'
  const [activeView, setActiveView] = useState('halls'); // 'halls', 'jmcrs'
  const [hallTeams, setHallTeams] = useState({});

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    setFetchingHalls(true);
    try {
      const response = await axios.get(`${API_URL}/api/halls/all`, { withCredentials: true });
      setHalls(response.data);
      // Note: Team data is fetched separately when needed, not here
      setHallTeams({});
    } catch (error) {
      console.error('Fetch halls error:', error);
      setError('Failed to fetch halls');
    } finally {
      setFetchingHalls(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingHall) {
        await axios.put(
          `${API_URL}/api/halls/${editingHall._id}`,
          formData,
          { withCredentials: true }
        );
        setToast({ message: 'Hall updated successfully', type: 'success' });
      } else {
        await axios.post(
          `${API_URL}/api/halls`,
          formData,
          { withCredentials: true }
        );
        setToast({ message: 'Hall created successfully', type: 'success' });
      }
      
      fetchHalls();
      handleCloseModal();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save hall', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      title: 'Delete Hall/Hostel',
      message: 'Are you sure you want to delete this hall/hostel? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/halls/${id}`, { withCredentials: true });
          setToast({ message: 'Hall deleted successfully', type: 'success' });
          fetchHalls();
        } catch (err) {
          setToast({ message: err.response?.data?.message || 'Failed to delete hall', type: 'error' });
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleEdit = (hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name,
      type: hall.type,
      image: hall.image || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHall(null);
    setFormData({
      name: '',
      type: 'boys',
      image: ''
    });
    setShowTypeDropdown(false);
  };

  const handleEditJmcr = (hall) => {
    setEditingJmcr(hall);
    setJmcrFormData({
      name: hall.jmcr?.name || '',
      gsuite: hall.jmcr?.gsuite || '',
      contact: hall.jmcr?.contact || ''
    });
    setShowJmcrModal(true);
  };

  const handleCloseJmcrModal = () => {
    setShowJmcrModal(false);
    setEditingJmcr(null);
    setJmcrFormData({
      name: '',
      gsuite: '',
      contact: ''
    });
  };

  const handleJmcrSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(
        `${API_URL}/api/halls/${editingJmcr._id}`,
        { jmcr: jmcrFormData },
        { withCredentials: true }
      );
      setToast({ message: 'JMCR details updated successfully', type: 'success' });
      fetchHalls();
      handleCloseJmcrModal();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update JMCR details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Validate file size (max 5MB)
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
      
      setFormData(prev => ({ ...prev, image: response.data.url }));
    } catch (error) {
      console.error('Image upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload image');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  // Filter halls based on search and active tab
  const filteredHalls = halls.filter(hall => {
    const matchesSearch = hall.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || hall.type === activeTab;
    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    // Natural sort (handles numbers correctly)
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  const hallCounts = {
    all: halls.length,
    boys: halls.filter(h => h.type === 'boys').length,
    girls: halls.filter(h => h.type === 'girls').length
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* View Toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '2px solid rgba(255, 215, 0, 0.2)',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setActiveView('halls')}
            style={{
              padding: '1rem 2rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeView === 'halls' ? '3px solid #FFD700' : '3px solid transparent',
              color: activeView === 'halls' ? '#FFD700' : '#888',
              fontWeight: activeView === 'halls' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s',
              marginBottom: '-2px'
            }}
          >
            Halls/Hostels
          </button>
          <button
            onClick={() => setActiveView('jmcrs')}
            style={{
              padding: '1rem 2rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeView === 'jmcrs' ? '3px solid #FFD700' : '3px solid transparent',
              color: activeView === 'jmcrs' ? '#FFD700' : '#888',
              fontWeight: activeView === 'jmcrs' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s',
              marginBottom: '-2px'
            }}
          >
            JMCRs
          </button>
        </div>

        {activeView === 'halls' ? (
          <>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h2 style={{
              fontSize: '2rem',
              color: '#FFD700',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Hall/Hostel Management
            </h2>
            <p style={{ color: '#888', fontSize: '0.95rem' }}>
              Manage hostels and halls for the event • {hallCounts.all} Total
            </p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
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
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Hall/Hostel
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          marginBottom: '1.5rem',
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder="Search halls/hostels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.75rem',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#FFD700';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          />
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#FFD700" 
            strokeWidth="2"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          paddingBottom: '0.5rem',
          overflowX: 'auto'
        }}>
          {[
            { key: 'all', label: 'All', count: hallCounts.all },
            { key: 'boys', label: "Boys' Hall/Hostel", count: hallCounts.boys },
            { key: 'girls', label: "Girls' Hall/Hostel", count: hallCounts.girls }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === tab.key ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                border: activeTab === tab.key ? '1px solid rgba(255, 215, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: activeTab === tab.key ? '#FFD700' : '#aaa',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#aaa';
                }
              }}
            >
              {tab.label}
              <span style={{
                padding: '0.125rem 0.5rem',
                background: activeTab === tab.key ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Halls Grid */}
        {fetchingHalls ? (
          <Loader size="large" />
        ) : filteredHalls.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredHalls.map((hall) => (
              <div
                key={hall._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Hall Image */}
                <div style={{
                  width: '100%',
                  height: '180px',
                  overflow: 'hidden',
                  background: hall.image ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                  flexShrink: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {hall.image ? (
                    <>
                      <img 
                        src={hall.image} 
                        alt={hall.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {/* Type Chip on Image */}
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        color: '#FFD700',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}>
                        {hall.type === 'boys' ? "Boys" : "Girls"}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Default Icon */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'rgba(255, 215, 0, 0.3)'
                      }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>No Image</span>
                      </div>
                      {/* Type Chip on Placeholder */}
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: 'rgba(255, 215, 0, 0.15)',
                        color: '#FFD700',
                        border: '1px solid rgba(255, 215, 0, 0.4)'
                      }}>
                        {hall.type === 'boys' ? "Boys" : "Girls"}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ 
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    color: '#FFD700',
                    fontWeight: 'bold',
                    marginBottom: 'auto'
                  }}>
                    {hall.name}
                  </h3>

                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginTop: '1rem'
                  }}>
                    <button
                      onClick={() => handleEdit(hall)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#FFD700',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(hall._id)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#ff6b6b',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
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
              {searchQuery ? (
                <>
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </>
              ) : (
                <>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </>
              )}
            </svg>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {searchQuery 
                ? `No halls/hostels found matching "${searchQuery}"`
                : halls.length === 0
                  ? 'No halls/hostels added yet'
                  : `No ${activeTab === 'boys' ? "boys'" : "girls'"} halls/hostels found`
              }
            </p>
            {searchQuery && (
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Try adjusting your search terms
              </p>
            )}
            {!searchQuery && halls.length === 0 && (
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Click "Add Hall/Hostel" to create one
              </p>
            )}
          </div>
        )}
        </>
      ) : null}

      {/* JMCR View */}
      {activeView === 'jmcrs' && (
        <>
          {/* JMCR Header */}
          <div style={{
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '2rem',
              color: '#FFD700',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              JMCR Details
            </h2>
            <p style={{ color: '#888', fontSize: '0.95rem' }}>
              Manage Junior Most Common Room representatives for each hall/hostel
            </p>
          </div>

          {/* Search Bar for JMCR */}
          <div style={{
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder="Search halls/hostels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FFD700';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#FFD700" 
              strokeWidth="2"
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '2rem',
            borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
            paddingBottom: '0.5rem',
            overflowX: 'auto'
          }}>
            {[
              { key: 'all', label: 'All', count: hallCounts.all },
              { key: 'boys', label: "Boys' Hall/Hostel", count: hallCounts.boys },
              { key: 'girls', label: "Girls' Hall/Hostel", count: hallCounts.girls }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === tab.key ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                  border: activeTab === tab.key ? '1px solid rgba(255, 215, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: activeTab === tab.key ? '#FFD700' : '#aaa',
                  fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#aaa';
                  }
                }}
              >
                {tab.label}
                <span style={{
                  padding: '0.125rem 0.5rem',
                  background: activeTab === tab.key ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* JMCR Grid */}
          {fetchingHalls ? (
            <Loader size="large" />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredHalls.map((hall) => (
                <div
                  key={hall._id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    position: 'relative'
                  }}
                >
                  {/* Hall Name Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        color: '#FFD700',
                        fontWeight: 'bold',
                        marginBottom: '0.25rem'
                      }}>
                        {hall.name}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#888',
                        fontWeight: '500'
                      }}>
                        {hall.type === 'boys' ? "Boys" : "Girls"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEditJmcr(hall)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#FFD700',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                  </div>

                  {/* JMCR Details */}
                  {hall.jmcr?.name || hall.jmcr?.gsuite || hall.jmcr?.contact ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {hall.jmcr.name && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#888',
                            marginBottom: '0.25rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Name
                          </label>
                          <p style={{
                            color: '#fff',
                            fontSize: '0.95rem',
                            margin: 0
                          }}>
                            {hall.jmcr.name}
                          </p>
                        </div>
                      )}
                      {hall.jmcr.gsuite && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#888',
                            marginBottom: '0.25rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            GSuite Email
                          </label>
                          <p style={{
                            color: '#60a5fa',
                            fontSize: '0.9rem',
                            margin: 0,
                            wordBreak: 'break-all'
                          }}>
                            {hall.jmcr.gsuite}
                          </p>
                        </div>
                      )}
                      {hall.jmcr.contact && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#888',
                            marginBottom: '0.25rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Contact
                          </label>
                          <p style={{
                            color: '#4ade80',
                            fontSize: '0.95rem',
                            margin: 0
                          }}>
                            {hall.jmcr.contact}
                          </p>
                        </div>
                      )}
                      
                      {/* Teams Registered */}
                      {hallTeams[hall._id] && hallTeams[hall._id].length > 0 && (
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid rgba(255, 215, 0, 0.2)'
                        }}>
                          <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#888',
                            marginBottom: '0.5rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Teams Registered ({hallTeams[hall._id].length})
                          </label>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}>
                            {hallTeams[hall._id].map((team) => (
                              <div
                                key={team._id}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  background: 'rgba(255, 215, 0, 0.1)',
                                  border: '1px solid rgba(255, 215, 0, 0.3)',
                                  borderRadius: '0.5rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <div>
                                  <p style={{
                                    color: '#FFD700',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    margin: 0
                                  }}>
                                    {team.gameId?.name || 'Unknown Game'}
                                  </p>
                                  <p style={{
                                    color: '#aaa',
                                    fontSize: '0.75rem',
                                    margin: 0
                                  }}>
                                    Team {team.teamName} • {team.players.length} players
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem 1rem',
                      color: '#666'
                    }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>No JMCR details added</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div
            onClick={handleCloseModal}
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
            maxWidth: '500px',
            background: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#FFD700',
              fontWeight: 'bold',
              marginBottom: '1.5rem'
            }}>
              {editingHall ? 'Edit Hall / Hostel' : 'Add New Hall / Hostel'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Hall/Hostel Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  placeholder="e.g., Macdonald Hall"
                />
              </div>

              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Type *
                </label>
                <div
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                >
                  <span>{formData.type === 'boys' ? "Boys' Hall / Hostel" : "Girls' Hall / Hostel"}</span>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      transform: showTypeDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                
                {showTypeDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'rgba(26, 26, 26, 0.98)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    zIndex: 1000,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                  }}>
                    <div
                      onClick={() => {
                        setFormData({ ...formData, type: 'boys' });
                        setShowTypeDropdown(false);
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        background: formData.type === 'boys' ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                        color: formData.type === 'boys' ? '#FFD700' : '#fff',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.type !== 'boys') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.type !== 'boys') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#60a5fa'
                      }} />
                      Boys' Hall/Hostel
                    </div>
                    <div
                      onClick={() => {
                        setFormData({ ...formData, type: 'girls' });
                        setShowTypeDropdown(false);
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        background: formData.type === 'girls' ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                        color: formData.type === 'girls' ? '#FFD700' : '#fff',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.type !== 'girls') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.type !== 'girls') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#f472b6'
                      }} />
                      Girls' Hall/Hostel
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Hall/Hostel Image (Optional)
                </label>
                
                {formData.image ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 215, 0, 0.3)'
                  }}>
                    <img 
                      src={formData.image} 
                      alt="Hall preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                      id="hall-image-upload"
                    />
                    <label
                      htmlFor="hall-image-upload"
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
                      onMouseEnter={(e) => {
                        if (!uploadingImage) {
                          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                      }}
                    >
                      {uploadingImage ? (
                        <>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid rgba(255, 215, 0, 0.2)',
                            borderTop: '3px solid #FFD700',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '0.5rem'
                          }} />
                          <span style={{ color: '#FFD700', fontSize: '0.9rem' }}>Uploading...</span>
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

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                  disabled={loading || uploadingImage}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: (loading || uploadingImage) ? '#666' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: (loading || uploadingImage) ? '#aaa' : '#000',
                    fontWeight: 'bold',
                    cursor: (loading || uploadingImage) ? 'not-allowed' : 'pointer',
                    opacity: (loading || uploadingImage) ? 0.6 : 1
                  }}
                >
                  {uploadingImage ? 'Uploading Image...' : (loading ? 'Saving...' : (editingHall ? 'Update' : 'Create'))}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* JMCR Edit Modal */}
      {showJmcrModal && (
        <>
          <div
            onClick={handleCloseJmcrModal}
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
            maxWidth: '500px',
            background: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#FFD700',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              Edit JMCR Details
            </h3>
            <p style={{
              color: '#888',
              fontSize: '0.9rem',
              marginBottom: '1.5rem'
            }}>
              {editingJmcr?.name} • {editingJmcr?.type === 'boys' ? "Boys" : "Girls"}
            </p>

            <form onSubmit={handleJmcrSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  JMCR Name
                </label>
                <input
                  type="text"
                  value={jmcrFormData.name}
                  onChange={(e) => setJmcrFormData({ ...jmcrFormData, name: e.target.value })}
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
                  placeholder="e.g., John Doe"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  GSuite Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={jmcrFormData.gsuite}
                    onChange={(e) => setJmcrFormData({ ...jmcrFormData, gsuite: e.target.value })}
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
                    placeholder="username@students.iiests.ac.in"
                  />
                </div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#888',
                  marginTop: '0.25rem',
                  marginBottom: 0
                }}>
                  Must be in format: username@students.iiests.ac.in
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={jmcrFormData.contact}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setJmcrFormData({ ...jmcrFormData, contact: value });
                  }}
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
                  placeholder="10-digit mobile number"
                  maxLength="10"
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: '#888',
                  marginTop: '0.25rem',
                  marginBottom: 0
                }}>
                  Enter 10-digit mobile number
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={handleCloseJmcrModal}
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
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: loading ? '#666' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: loading ? '#aaa' : '#000',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

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

export default HallManagement;
