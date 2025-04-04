const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Campo para indicar el tipo de entidad a la que pertenece el adjunto (incident, ticket, request)
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // ID de la entidad a la que pertenece el adjunto
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Usuario que subió el adjunto
  uploadedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'attachments',
});

module.exports = Attachment;
