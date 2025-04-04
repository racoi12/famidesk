import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al cargar la aplicación
    const checkLoggedIn = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const userData = await authService.login(username, password);
      setCurrentUser(userData);
      navigate('/');
      return userData;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      setCurrentUser(response);
      navigate('/');
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar usuario');
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
