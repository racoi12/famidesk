const { sequelize } = require('../config/database');
const models = require('../models');

/**
 * Inicializa la base de datos, sincronizando los modelos
 */
const initDatabase = async () => {
  try {
    console.log('Inicializando base de datos...');
    
    // Sincronizar modelos con la base de datos
    // force: true borrará todas las tablas y las recreará (solo para desarrollo)
    // alter: true modifica las tablas existentes según sea necesario
    await sequelize.sync({ alter: true });
    
    console.log('Base de datos sincronizada correctamente');
    
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
};

module.exports = initDatabase;
