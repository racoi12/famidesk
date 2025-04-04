const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Campo para indicar el tipo de entidad a la que pertenece el comentario (incident, ticket, request)
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // ID de la entidad a la que pertenece el comentario
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Usuario que creó el comentario
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'comments',
});

module.exports = Comment;
