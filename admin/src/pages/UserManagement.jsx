import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isMobile, setIsMaobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true,
      });
      setUsers(response.data.users);
    } catch (err) {
      setToast({ message: 'Failed to fetch users', type: 'error' });
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setConfirmDialog({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
            withCredentials: true,
          });
          setUsers(users.filter(user => user._id !== userId));
          setToast({ message: 'User deleted successfully', type: 'success' });
        } catch (err) {
          setToast({ message: 'Failed to delete user', type: 'error' });
          console.error('Delete user error:', err);
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loader />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ 
        marginBottom: isMobile ? '1.5rem' : '2rem',
        minWidth: 0, // Allow shrinking
      }}>
        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#FFD700', marginBottom: '0.5rem' }}>
          User Management
        </h1>
        <p style={{ color: '#888', fontSize: isMobile ? '0.875rem' : '1rem' }}>
          Total Users: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{users.length}</span>
        </p>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '1rem',
        overflow: 'visible',
        minWidth: 0,
      }}>
        {/* Swipe indicator for mobile */}
        {isMobile && users.length > 0 && (
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
        <div 
          className="table-scroll-container"
          style={{ 
            display: 'block',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            width: '100%',
            borderRadius: '0 0 1rem 1rem',
          }}
        >
          <table style={{ 
            width: '100%',
            minWidth: isMobile ? '1000px' : '100%',
            borderCollapse: 'collapse',
            whiteSpace: 'nowrap',
          }}>
            <thead>
              <tr style={{ background: 'rgba(255, 215, 0, 0.1)', borderBottom: '1px solid rgba(255, 215, 0, 0.3)' }}>
                <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: isMobile ? '0.75rem' : '0.875rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Avatar
                </th>
                <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: isMobile ? '0.75rem' : '0.875rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Name
                </th>
                <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: isMobile ? '0.75rem' : '0.875rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Email
                </th>
                <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: isMobile ? '0.75rem' : '0.875rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Role
                </th>
                <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: isMobile ? '0.75rem' : '0.875rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Joined
                </th>
                <th style={{ padding: isMobile ? '0.75rem' : '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: isMobile ? '0.75rem' : '0.875rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: isMobile ? '2rem 1rem' : '3rem', textAlign: 'center', color: '#888' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          style={{
                            width: isMobile ? '35px' : '40px',
                            height: isMobile ? '35px' : '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: isMobile ? '35px' : '40px',
                          height: isMobile ? '35px' : '40px',
                          borderRadius: '50%',
                          background: 'rgba(255, 215, 0, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFD700',
                          fontWeight: 'bold',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: isMobile ? '0.75rem' : '1rem', color: '#fff', fontSize: isMobile ? '0.875rem' : '1rem', whiteSpace: 'nowrap' }}>{user.name}</td>
                    <td style={{ padding: isMobile ? '0.75rem' : '1rem', color: '#aaa', fontSize: isMobile ? '0.8rem' : '0.875rem', whiteSpace: 'nowrap' }}>{user.email}</td>
                    <td style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
                      <span style={{
                        padding: isMobile ? '0.2rem 0.6rem' : '0.25rem 0.75rem',
                        background: user.role === 'admin' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: user.role === 'admin' ? '#FFD700' : '#aaa',
                        borderRadius: '9999px',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: isMobile ? '0.75rem' : '1rem', color: '#aaa', fontSize: isMobile ? '0.8rem' : '0.875rem', whiteSpace: 'nowrap' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        style={{
                          padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '0.375rem',
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      <style>{`
        /* Custom scrollbar for table */
        .table-scroll-container::-webkit-scrollbar {
          height: 12px;
        }
        
        .table-scroll-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.6);
          border-radius: 6px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.8);
        }
        
        .table-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 215, 0, 0.6) rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </AdminLayout>
  );
};

export default UserManagement;
