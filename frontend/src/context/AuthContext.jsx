import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const defaultInternalUser = {
    id: 1,
    email: 'internal@cpq.admin',
    full_name: 'Internal Admin & Estimator',
    role: 'admin',
    is_internal: true
  };

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cpq_user_data');
    return saved ? JSON.parse(saved) : defaultInternalUser;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cpq_jwt_token') || 'internal_bypass_token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        localStorage.setItem('cpq_user_data', JSON.stringify(res.data));
      } catch (err) {
        // Fallback silently to default internal user without logging out
        setUser(defaultInternalUser);
        localStorage.setItem('cpq_user_data', JSON.stringify(defaultInternalUser));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const login = async (email, password) => {
    return defaultInternalUser;
  };

  const logout = () => {
    // No-op for internal app
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
