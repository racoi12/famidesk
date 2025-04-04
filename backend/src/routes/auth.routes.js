const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { check } = require('express-validator');

// POST - Registrar un nuevo usuario
router.post('/register', [
  // Validaciones
  check('username', 'El nombre de usuario es obligatorio').notEmpty(),
  check('email', 'Por favor incluya un email válido').isEmail(),
  check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
  check('fullName', 'El nombre completo es obligatorio').notEmpty(),
  check('role', 'El rol debe ser válido').optional().isIn(['admin', 'coordinador', 'colaborador']),
], authController.register);

// POST - Iniciar sesión
router.post('/login', [
  // Validaciones
  check('username', 'El nombre de usuario es obligatorio').notEmpty(),
  check('password', 'La contraseña es obligatoria').notEmpty(),
], authController.login);

// GET - Obtener información del usuario actual
router.get('/me', authMiddleware.verifyToken, authController.me);

module.exports = router;
