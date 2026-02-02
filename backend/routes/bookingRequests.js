const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Invalid token:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not admin' });
  }
  next();
};

const normalizePeopleCount = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

const calculateNights = (start, end) => {
  if (!start || !end) return 1;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 1;
  const diff = endDate.getTime() - startDate.getTime();
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
};

router.post('/', authMiddleware, async (req, res) => {
  const {
    tipo,
    itemId,
    fechaInicio,
    fechaFin,
    personas,
    monto,
    notas
  } = req.body;

  if (!['listing', 'tour'].includes(tipo)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }
  if (!itemId) {
    return res.status(400).json({ message: 'itemId es obligatorio' });
  }

  try {
    const tableName = tipo === 'listing' ? 'listings' : 'tours';
    const itemResult = await pool.query(
      tipo === 'listing'
        ? `SELECT id, nombre, precio_base, tarifa_huesped_adicional, adicional_desde, capacidad FROM ${tableName} WHERE id = $1`
        : `SELECT id, nombre, precio FROM ${tableName} WHERE id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }

    const item = itemResult.rows[0];
    const precioBase = Number(item.precio) || 0;
    const precioBaseListing = Number(item.precio_base) || 0;
    const tarifaAdicional = Number(item.tarifa_huesped_adicional) || 0;
    const adicionalDesde = Number(item.adicional_desde) || 1;
    const personasValue = normalizePeopleCount(personas);
    let montoCalculado = Number(monto);

    if (Number.isNaN(montoCalculado) || montoCalculado <= 0) {
      if (tipo === 'listing') {
        const noches = calculateNights(fechaInicio, fechaFin);
        const adicionales = Math.max(0, personasValue - adicionalDesde);
        const tarifaNoche = precioBaseListing + (adicionales * tarifaAdicional);
        montoCalculado = noches * tarifaNoche;
      } else {
        montoCalculado = personasValue * precioBase;
      }
    }

    const result = await pool.query(
      `INSERT INTO booking_requests 
        (user_id, tipo, item_id, item_nombre, fecha_inicio, fecha_fin, personas, estado, monto_estimado, metodo_pago, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        tipo,
        itemId,
        item.nombre,
        fechaInicio || null,
        fechaFin || null,
        personasValue,
        montoCalculado,
        'transferencia',
        notas || null
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating booking request:', err.message);
    res.status(500).json({ message: 'Error al crear la solicitud' });
  }
});

router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM booking_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my requests:', err.message);
    res.status(500).json({ message: 'Error al obtener tus solicitudes' });
  }
});

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, u.nombre AS solicitante_nombre, u.email AS solicitante_email
       FROM booking_requests br
       JOIN users u ON br.user_id = u.id
       ORDER BY br.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching booking requests:', err.message);
    res.status(500).json({ message: 'Error al obtener solicitudes' });
  }
});

router.patch('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { estado } = req.body;
  if (!['aceptada', 'rechazada'].includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  try {
    const result = await pool.query(
      `UPDATE booking_requests 
       SET estado = $1 
       WHERE id = $2
       RETURNING *`,
      [estado, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating booking request:', err.message);
    res.status(500).json({ message: 'Error al actualizar la solicitud' });
  }
});

module.exports = router;
