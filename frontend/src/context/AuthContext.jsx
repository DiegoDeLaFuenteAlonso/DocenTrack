import { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  }, []);

  const checkToken = useCallback(async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        logout();
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('me/');
        setUser(res.data);
      } catch {
        logout();
      }
    } catch {
      logout();
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('token/', { username, password });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      const me = await api.get('me/');
      setUser(me.data);
      setLoading(false);
      return true;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser: checkToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
