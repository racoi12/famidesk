const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Inicializar express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Importar rutas
try {
  const authRoutes = require('./src/routes/auth.routes');
  const userRoutes = require('./src/routes/user.routes');
  const incidentRoutes = require('./src/routes/incident.routes');

  // Usar rutas
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/incidents', incidentRoutes);
} catch (error) {
  console.error('Error al cargar las rutas:', error);
}

// Ruta para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Ruta principal que sirve la aplicación frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejar errores 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Inicializar la base de datos y luego iniciar el servidor
const initDatabase = require('./src/utils/initDatabase');

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la aplicación:', err);
});

module.exports = app;
