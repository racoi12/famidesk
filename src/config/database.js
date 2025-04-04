const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Ruta a la base de datos SQLite
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

// Crear la instancia de Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true, // Añadir automáticamente createdAt y updatedAt
    underscored: true, // Usar snake_case en lugar de camelCase para los nombres de columnas
  }
});

// Función para probar la conexión a la base de datos
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};
