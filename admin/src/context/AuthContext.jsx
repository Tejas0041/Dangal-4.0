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
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/me`, {
        withCredentials: true,
      });
      setAdmin(response.data.admin);
    } catch (error) {
      setAdmin(null);
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
      await axios.post(`${API_URL}/api/admin/logout`, {}, {
        withCredentials: true,
      });
      setAdmin(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/change-password`,
        { currentPassword, newPassword },
        { withCredentials: true }
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
