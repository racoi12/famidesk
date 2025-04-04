import React, { useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { login, currentUser, error } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validación
    if (!username || !password) {
      setMessage('Por favor ingrese usuario y contraseña');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      await login(username, password);
    } catch (error) {
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      setMessage(resMessage);
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario ya está autenticado, redirigir al Dashboard
  if (currentUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="form-container">
      <h2 className="text-center">Iniciar sesión</h2>
      
      {message && (
        <div className="alert alert-danger">
          {message}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="username">Usuario</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button 
            className="btn btn-primary w-100" 
            disabled={loading}
            type="submit"
          >
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
