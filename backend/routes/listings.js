const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      console.log('User not admin:', decoded);
      return res.status(403).json({ message: 'Not admin' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Invalid token:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Obtener todos los listings
router.get('/', async (req, res) => {
  try {
    console.log('Fetching listings');
    const result = await pool.query('SELECT * FROM listings');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching listings:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Crear un listing (protegido)
router.post('/', authMiddleware, async (req, res) => {
  const { nombre, descripcion, imagen, capacidad, camas, precio, servicios } = req.body;
  try {
    console.log('Creating listing:', nombre);
    const serviciosJson = JSON.stringify(servicios); // Convertir array a cadena JSON
    const result = await pool.query(
      'INSERT INTO listings (nombre, descripcion, imagen, capacidad, camas, precio, servicios) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nombre, descripcion, imagen, capacidad, camas, precio, serviciosJson]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating listing:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Actualizar un listing (protegido)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen, capacidad, camas, precio, servicios } = req.body;
  try {
    console.log('Updating listing:', id);
    const serviciosJson = JSON.stringify(servicios); // Convertir array a cadena JSON
    const result = await pool.query(
      'UPDATE listings SET nombre=$1, descripcion=$2, imagen=$3, capacidad=$4, camas=$5, precio=$6, servicios=$7 WHERE id=$8 RETURNING *',
      [nombre, descripcion, imagen, capacidad, camas, precio, serviciosJson, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating listing:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Eliminar un listing (protegido)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Deleting listing:', id);
    await pool.query('DELETE FROM listings WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting listing:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;