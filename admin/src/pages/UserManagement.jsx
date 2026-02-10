import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    fetchUsers();
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
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1.5rem', color: '#FFD700' }}>Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700', marginBottom: '0.5rem' }}>
          User Management
        </h1>
        <p style={{ color: '#888' }}>
          Total Users: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{users.length}</span>
        </p>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '1rem',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 215, 0, 0.1)', borderBottom: '1px solid rgba(255, 215, 0, 0.3)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  Avatar
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  Name
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  Email
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  Role
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  Joined
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700', fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '1rem' }}>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(255, 215, 0, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFD700',
                          fontWeight: 'bold',
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#fff' }}>{user.name}</td>
                    <td style={{ padding: '1rem', color: '#aaa', fontSize: '0.875rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: user.role === 'admin' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: user.role === 'admin' ? '#FFD700' : '#aaa',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#aaa', fontSize: '0.875rem' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s',
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
    </AdminLayout>
  );
};

export default UserManagement;
