import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

function setAxiosToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lembur_user');
      const token = localStorage.getItem('lembur_token');
      if (stored && token) {
        setAxiosToken(token);
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  });

  const logoutRef = useRef(null);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('lembur_user', JSON.stringify(userData));
    localStorage.setItem('lembur_token', token);
    setAxiosToken(token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lembur_user');
    localStorage.removeItem('lembur_token');
    setAxiosToken(null);
  };

  logoutRef.current = logout;

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          logoutRef.current?.();
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
