import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Check if token is in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      // Store token in localStorage
      localStorage.setItem('adminToken', tokenFromUrl);
      // Remove token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/api/admin/me`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAdmin(response.data.admin);
    } catch (error) {
      setAdmin(null);
      localStorage.removeItem('adminToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/login`,
        { username, password },
        { withCredentials: true }
      );
      // Store token if returned
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
      }
      setAdmin(response.data.admin);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/admin/logout`, {}, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear token and redirect, even if API call fails
      localStorage.removeItem('adminToken');
      setAdmin(null);
      window.location.href = '/login';
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_URL}/api/admin/change-password`,
        { currentPassword, newPassword },
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password change failed',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, changePassword, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
