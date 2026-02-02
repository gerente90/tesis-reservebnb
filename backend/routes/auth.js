const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/auth/register  (registro huésped)
router.post('/register', async (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  try {
    console.log('Registro endpoint called:', email);

    // ¿Ya existe el email?
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (nombre, email, password_hash, role, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, role`,
      [nombre, email, passwordHash, 'huesped', telefono || null]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, role: user.role, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Error en register:', err.message);
    res.status(500).json({ message: 'Error en el registro' });
  }
});

// POST /api/auth/login  (login admin o huésped)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login endpoint called:', email);

    const result = await pool.query(
      'SELECT id, nombre, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generated for user:', email);
    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error in login:', err.message);
    res.status(500).json({ message: 'Error en el login' });
  }
});

module.exports = router;
