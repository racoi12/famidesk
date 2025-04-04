const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware para verificar token JWT
exports.verifyToken = async (req, res, next) => {
  try {
    // Obtener el token del encabezado Authorization
    const bearerHeader = req.headers['authorization'];
    
    if (!bearerHeader) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Token no proporcionado.'
      });
    }
    
    // Verificar formato del token
    const bearer = bearerHeader.split(' ');
    if (bearer.length !== 2 || bearer[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use "Bearer [token]".'
      });
    }
    
    const token = bearer[1];
    
    try {
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Buscar el usuario en la base de datos
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo. Contacta al administrador.'
        });
      }
      
      // Añadir el usuario decodificado a la solicitud
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };
      
      // Continuar con la siguiente función
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado. Por favor, inicie sesión nuevamente.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  } catch (error) {
    console.error('Error en la autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la autenticación',
      error: error.message
    });
  }
};

// Middleware para verificar roles
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Debe iniciar sesión primero.'
      });
    }
    
    // Si roles es un string, convertirlo a array
    const allowedRoles = typeof roles === 'string' ? [roles] : roles;
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso prohibido. No tiene los permisos necesarios.'
      });
    }
    
    next();
  };
};

module.exports = exports;
