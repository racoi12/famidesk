const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('assignment', 'comment', 'status_change', 'escalation', 'due_date', 'mention'),
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // El usuario que debe recibir la notificación
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Indicar si la notificación ha sido leída
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Indicar si la notificación ha sido enviada por correo
  isEmailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Campo para indicar el tipo de entidad relacionada (incident, ticket, request)
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // ID de la entidad relacionada
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Datos adicionales en formato JSON (opcional)
  data: {
    type: DataTypes.JSON,
  },
}, {
  tableName: 'notifications',
});

module.exports = Notification;
