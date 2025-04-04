import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          FamiDesk
        </Link>
        
        <div className="navbar-links">
          {currentUser ? (
            <>
              <Link to="/">Dashboard</Link>
              <Link to="/incidents">Incidentes</Link>
              <button 
                onClick={logout} 
                className="btn btn-danger"
                style={{ marginLeft: '1rem' }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/login">Iniciar sesión</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
