require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  console.log('Ping endpoint called');
  res.json({ message: 'Backend is running!' });
});

try {
  const pool = require('./config/db');
  console.log('Database pool initialized');
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/listings', require('./routes/listings'));
  app.use('/api/reservations', require('./routes/reservations'));
} catch (err) {
  console.error('Error loading routes or database:', err);
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));