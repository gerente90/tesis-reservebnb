const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const parseIcalDate = (value) => {
  if (!value) return null;
  const datePart = value.split('T')[0];
  const year = datePart.slice(0, 4);
  const month = datePart.slice(4, 6);
  const day = datePart.slice(6, 8);
  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
};

const parseIcalRanges = (icsText) => {
  const lines = icsText.split(/\r?\n/);
  const ranges = [];
  let currentStart = null;
  let currentEnd = null;
  let inEvent = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentStart = null;
      currentEnd = null;
      continue;
    }
    if (line === 'END:VEVENT') {
      if (currentStart && currentEnd) {
        ranges.push({ start: currentStart, end: currentEnd });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;
    if (line.startsWith('DTSTART')) {
      const value = line.split(':')[1];
      currentStart = parseIcalDate(value);
    }
    if (line.startsWith('DTEND')) {
      const value = line.split(':')[1];
      currentEnd = parseIcalDate(value);
    }
  }
  return ranges.filter((range) => range.start && range.end);
};

const fetchBlockedRanges = async (icalUrl) => {
  if (!icalUrl) return [];
  const response = await fetch(icalUrl);
  if (!response.ok) return [];
  const text = await response.text();
  return parseIcalRanges(text);
};

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

// Obtener un listing por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Fetching listing:', id);
    const result = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching listing:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Fechas bloqueadas por iCal
router.get('/:id/blocked-dates', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT airbnb_ical_url FROM listings WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    const { airbnb_ical_url: icalUrl } = result.rows[0];
    const ranges = await fetchBlockedRanges(icalUrl);
    res.json({ ranges });
  } catch (err) {
    console.error('Error fetching blocked dates:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Crear un listing (protegido)
router.post('/', authMiddleware, async (req, res) => {
  const {
    nombre,
    descripcion,
    imagen,
    ciudad,
    capacidad,
    camas,
    precio_base,
    tarifa_huesped_adicional,
    adicional_desde,
    airbnb_ical_url,
    servicios,
    airbnb_link
  } = req.body;
  try {
    console.log('Creating listing:', nombre, 'Airbnb link:', airbnb_link);
    const serviciosJson = JSON.stringify(servicios);
    const result = await pool.query(
      `INSERT INTO listings 
        (nombre, descripcion, imagen, ciudad, capacidad, camas, precio_base, tarifa_huesped_adicional, adicional_desde, airbnb_ical_url, servicios, airbnb_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        nombre,
        descripcion,
        imagen,
        ciudad || null,
        capacidad,
        camas,
        precio_base,
        tarifa_huesped_adicional || 0,
        adicional_desde || 1,
        airbnb_ical_url || null,
        serviciosJson,
        airbnb_link
      ]
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
  const {
    nombre,
    descripcion,
    imagen,
    ciudad,
    capacidad,
    camas,
    precio_base,
    tarifa_huesped_adicional,
    adicional_desde,
    airbnb_ical_url,
    servicios,
    airbnb_link
  } = req.body;
  try {
    console.log('Updating listing:', id, 'Airbnb link:', airbnb_link);
    const serviciosJson = JSON.stringify(servicios);
    const result = await pool.query(
      `UPDATE listings 
       SET nombre=$1,
           descripcion=$2,
           imagen=$3,
           ciudad=$4,
           capacidad=$5,
           camas=$6,
           precio_base=$7,
           tarifa_huesped_adicional=$8,
           adicional_desde=$9,
           airbnb_ical_url=$10,
           servicios=$11,
           airbnb_link=$12
       WHERE id=$13
       RETURNING *`,
      [
        nombre,
        descripcion,
        imagen,
        ciudad || null,
        capacidad,
        camas,
        precio_base,
        tarifa_huesped_adicional || 0,
        adicional_desde || 1,
        airbnb_ical_url || null,
        serviciosJson,
        airbnb_link,
        id
      ]
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
    const result = await pool.query('DELETE FROM listings WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting listing:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
