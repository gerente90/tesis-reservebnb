require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/api/ping', (req, res) => {
  console.log('Ping endpoint called');
  res.json({ message: 'Backend is running!' });
});

try {
  // Inicializar base de datos (solo para verificar que conecta bien)
  const pool = require('./config/db');
  console.log('Database pool initialized');

  // Rutas
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/listings', require('./routes/listings'));
  app.use('/api/reservations', require('./routes/reservations'));
  app.use('/api/tours', require('./routes/tours'));
  app.use('/api/booking-requests', require('./routes/bookingRequests'));
} catch (err) {
  console.error('Error loading routes or database:', err);
}

// Levantar servidor
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Esto es un comentario
