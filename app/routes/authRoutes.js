const express = require('express');
const router = express.Router();
const UsuarioModel = require('../models/usuarioModel');

// ── POST /auth/login ───────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { usuario, password, invitado } = req.body;

    if (invitado === 'true' || invitado === true) {
      req.session.user = {
        id: 0,
        nombre_completo: 'Vigilante Ojos Del Bosque',
        usuario: 'ojos_del_bosque',
        rol: 'ojos_del_bosque',
        email: 'ojosdelbosque@firetrace.bo'
      };
      return res.json({ success: true, user: req.session.user, redirect: '/ojos-del-bosque' });
    }

    if (!usuario || !password) {
      return res.status(400).json({ success: false, error: 'Usuario y contraseña son requeridos.' });
    }

    const user = await UsuarioModel.findByCredentials(usuario.trim(), password);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas o usuario inactivo.' });
    }

    req.session.user = {
      id: user.id,
      nombre_completo: user.nombre_completo,
      usuario: user.usuario,
      email: user.email,
      rol: user.rol,
      telefono: user.telefono,
      latitud_actual: user.latitud_actual,
      longitud_actual: user.longitud_actual
    };

    res.json({ success: true, user: req.session.user, redirect: '/dashboard' });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    res.status(500).json({ success: false, error: 'Error del servidor al iniciar sesión.' });
  }
});

// ── POST /auth/logout ──────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false });
    res.clearCookie('connect.sid');
    res.json({ success: true, redirect: '/login' });
  });
});

// ── GET /auth/me ───────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user: req.session.user });
});

// ── POST /auth/update-location ─────────────────────────────────────────────────
router.post('/update-location', async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ success: false });
  }
  const { lat, lng } = req.body;
  try {
    await UsuarioModel.updateUbicacion(req.session.user.id, lat, lng);
    req.session.user.latitud_actual = lat;
    req.session.user.longitud_actual = lng;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
