const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    console.log('Fetching reservations');
    const result = await pool.query('SELECT * FROM reservations');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reservations:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { listing_id, check_in, check_out, huespedes, nombre, email, precio_total } = req.body;
  try {
    console.log('Creating reservation for listing:', listing_id);
    const result = await pool.query(
      'INSERT INTO reservations (listing_id, check_in, check_out, huespedes, nombre, email, precio_total, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [listing_id, check_in, check_out, huespedes, nombre, email, precio_total, 'confirmada']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating reservation:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;