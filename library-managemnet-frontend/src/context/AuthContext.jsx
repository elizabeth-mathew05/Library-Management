import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('library_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const persistSession = (nextToken) => {
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem('library_token', nextToken);
    } else {
      localStorage.removeItem('library_token');
      setUser(null);
    }
  };

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    persistSession(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    persistSession(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    persistSession(null);
  };

  const refreshProfile = async () => {
    if (!localStorage.getItem('library_token')) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      persistSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
