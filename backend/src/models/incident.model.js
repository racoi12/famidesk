const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('bug', 'error', 'request', 'issue', 'other'),
    defaultValue: 'issue',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'escalated', 'resolved', 'closed'),
    defaultValue: 'open',
  },
  reportedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  dueDate: {
    type: DataTypes.DATE,
  },
  slaHours: {
    type: DataTypes.INTEGER,
    defaultValue: 24, // Por defecto, 24 horas para resolver
  },
  isEscalated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  escalatedAt: {
    type: DataTypes.DATE,
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
  },
  resolvedAt: {
    type: DataTypes.DATE,
  },
  closedAt: {
    type: DataTypes.DATE,
  },
  // Campos para relaciones que se definirán en las asociaciones
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedToId: {
    type: DataTypes.INTEGER,
  },
  escalatedToId: {
    type: DataTypes.INTEGER,
  },
  projectId: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'incidents',
  hooks: {
    beforeCreate: (incident) => {
      // Calcular fecha de vencimiento basado en SLA
      if (!incident.dueDate && incident.slaHours) {
        const dueDate = new Date(incident.reportedAt);
        dueDate.setHours(dueDate.getHours() + incident.slaHours);
        incident.dueDate = dueDate;
      }
    },
    beforeUpdate: (incident) => {
      // Si el incidente se resuelve, guardar la fecha de resolución
      if (incident.changed('status') && incident.status === 'resolved' && !incident.resolvedAt) {
        incident.resolvedAt = new Date();
      }
      
      // Si el incidente se cierra, guardar la fecha de cierre
      if (incident.changed('status') && incident.status === 'closed' && !incident.closedAt) {
        incident.closedAt = new Date();
      }
      
      // Si el incidente se escala, marcar como escalado y guardar la fecha
      if (incident.changed('isEscalated') && incident.isEscalated && !incident.escalatedAt) {
        incident.escalatedAt = new Date();
        incident.status = 'escalated';
      }
    },
  },
});

module.exports = Incident;
