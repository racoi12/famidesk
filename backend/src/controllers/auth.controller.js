const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { username, email, password, fullName, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: {
        username
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Verificar si el email ya está en uso
    const existingEmail = await User.findOne({
      where: {
        email
      }
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está en uso'
      });
    }

    // Crear nuevo usuario
    const user = await User.create({
      username,
      email,
      password, // Se encripta automáticamente en el hook beforeCreate
      fullName,
      role: role || 'colaborador' // Por defecto es colaborador si no se especifica
    });

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar el usuario',
      error: error.message
    });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Buscar usuario por nombre de usuario
    const user = await User.findOne({
      where: {
        username
      }
    });

    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si la contraseña es correcta
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacta al administrador.'
      });
    }

    // Actualizar fecha del último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Obtener información del usuario actual
exports.me = async (req, res) => {
  try {
    // El middleware de autenticación ya ha verificado y decodificado el token
    const userId = req.user.id;

    // Buscar usuario por ID
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // Excluir la contraseña de la respuesta
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario',
      error: error.message
    });
  }
};

module.exports = exports;
