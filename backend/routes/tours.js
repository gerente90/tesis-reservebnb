const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware de autenticación (igualito que en listings.js)
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

// Obtener todos los tours
router.get('/', async (req, res) => {
  try {
    console.log('Fetching tours');
    const result = await pool.query('SELECT * FROM tours ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tours:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Obtener un tour por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Fetching tour:', id);
    const result = await pool.query('SELECT * FROM tours WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching tour:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Crear un tour (protegido)
router.post('/', authMiddleware, async (req, res) => {
  const {
    nombre,
    descripcion,
    imagen,
    duracion_horas,
    precio,
    cupo_maximo,
    punto_encuentro,
    servicios_incluidos,
    activo
  } = req.body;

  try {
    console.log('Creating tour:', nombre);

    // Validaciones mínimas para NOT NULL
    if (!nombre || !descripcion || precio === undefined || precio === null) {
      return res.status(400).json({ message: 'nombre, descripcion y precio son obligatorios' });
    }

    // jsonb NOT NULL → si no viene, ponemos [].
    const serviciosIncluidosJson = JSON.stringify(servicios_incluidos || []);

    // activo NOT NULL → si no viene, true
    const activoValue = typeof activo === 'boolean' ? activo : true;

    const result = await pool.query(
      `INSERT INTO tours 
        (nombre, descripcion, imagen, duracion_horas, precio, cupo_maximo, punto_encuentro, servicios_incluidos, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        nombre,
        descripcion,
        imagen || null,
        duracion_horas || null,
        precio,
        cupo_maximo || null,
        punto_encuentro || null,
        serviciosIncluidosJson,
        activoValue
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating tour:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Actualizar un tour (protegido)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    imagen,
    duracion_horas,
    precio,
    cupo_maximo,
    punto_encuentro,
    servicios_incluidos,
    activo
  } = req.body;

  try {
    console.log('Updating tour:', id);

    // Si viene servicios_incluidos en el body, lo convertimos a json,
    // si no, dejamos que se mantenga lo que ya hay en la BD.
    const serviciosIncluidosJson =
      typeof servicios_incluidos !== 'undefined'
        ? JSON.stringify(servicios_incluidos)
        : null;

    const result = await pool.query(
      `UPDATE tours 
       SET 
         nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         imagen = COALESCE($3, imagen),
         duracion_horas = COALESCE($4, duracion_horas),
         precio = COALESCE($5, precio),
         cupo_maximo = COALESCE($6, cupo_maximo),
         punto_encuentro = COALESCE($7, punto_encuentro),
         servicios_incluidos = COALESCE($8, servicios_incluidos),
         activo = COALESCE($9, activo)
       WHERE id = $10
       RETURNING *`,
      [
        nombre || null,
        descripcion || null,
        imagen || null,
        duracion_horas || null,
        precio || null,
        cupo_maximo || null,
        punto_encuentro || null,
        serviciosIncluidosJson,
        typeof activo === 'boolean' ? activo : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating tour:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Eliminar un tour (protegido)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Deleting tour:', id);
    const result = await pool.query('DELETE FROM tours WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting tour:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
