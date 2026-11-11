const express = require('express');
const router = express.Router();
const path = require('path');

// Middleware de autenticación
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// ── Login ──────────────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, '../../views/login.html'));
});

router.get('/', (req, res) => res.redirect('/login'));

// ── Dashboard principal (SPA Shell) ───────────────────────────────────────────
router.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/dashboard.html'));
});

// Rutas de secciones de la SPA (todas sirven el mismo shell)
const spaRoutes = [
  '/inicio', '/mapa-incendios', '/incendio-vivo', '/memoria-fuego',
  '/vigilancia-reactivacion', '/semaforo-atencion', '/ojos-del-bosque',
  '/firetrace-explica', '/bitacora-bosque', '/admin', '/admin/usuarios',
  '/admin/incendios', '/rol/bombero', '/rol/ambulancia'
];

spaRoutes.forEach(route => {
  router.get(route, requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/dashboard.html'));
  });
});

module.exports = router;
