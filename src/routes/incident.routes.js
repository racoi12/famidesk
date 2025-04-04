const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { check } = require('express-validator');

// Middleware para verificar autenticación en todas las rutas
router.use(authMiddleware.verifyToken);

// GET - Obtener todos los incidentes (con filtros opcionales)
router.get('/', incidentController.getAllIncidents);

// GET - Obtener un incidente por ID
router.get('/:id', incidentController.getIncidentById);

// POST - Crear un nuevo incidente
router.post('/', [
  // Validaciones
  check('title', 'El título es obligatorio').notEmpty(),
  check('description', 'La descripción es obligatoria').notEmpty(),
  check('type', 'El tipo debe ser válido').isIn(['bug', 'error', 'request', 'issue', 'other']),
  check('priority', 'La prioridad debe ser válida').isIn(['low', 'medium', 'high', 'critical']),
], incidentController.createIncident);

// PUT - Actualizar un incidente existente
router.put('/:id', [
  // Validaciones opcionales ya que pueden ser actualizaciones parciales
  check('type', 'El tipo debe ser válido').optional().isIn(['bug', 'error', 'request', 'issue', 'other']),
  check('priority', 'La prioridad debe ser válida').optional().isIn(['low', 'medium', 'high', 'critical']),
  check('status', 'El estado debe ser válido').optional().isIn(['open', 'in_progress', 'escalated', 'resolved', 'closed']),
], incidentController.updateIncident);

// DELETE - Eliminar un incidente
router.delete('/:id', incidentController.deleteIncident);

module.exports = router;
