import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AuthContext);
  
  // Si está cargando, mostrar indicador de carga
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Si no hay usuario autenticado, redirigir a login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Si el usuario está autenticado, mostrar el contenido protegido
  return children;
};

export default PrivateRoute;
