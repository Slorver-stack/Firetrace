process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./app/routes/authRoutes');
const apiRoutes = require('./app/routes/apiRoutes');
const viewRoutes = require('./app/routes/viewRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad y middlewares globales ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", "'unsafe-inline'", "'unsafe-eval'",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://www.googletagmanager.com"
      ],
      styleSrc: [
        "'self'", "'unsafe-inline'",
        "https://unpkg.com",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "https://maps.gstatic.com", "https://maps.googleapis.com"],
      connectSrc: [
        "'self'",
        "https://drviqnxgfcdhaawsixgn.supabase.co",
        "wss://drviqnxgfcdhaawsixgn.supabase.co",
        "https://firms.modaps.eosdis.nasa.gov",
        "https://maps.googleapis.com",
        "https://api.openweathermap.org"
      ],
      frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"],
      workerSrc: ["'self'", "blob:"],
      mediaSrc: ["'self'", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Sesiones ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'firetrace_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// ── Archivos estáticos ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/IMG', express.static(path.join(__dirname, 'IMG'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jfif')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
  }
}));
app.use('/FONDO PAGINA', express.static(path.join(__dirname, 'IMG', 'FONDO PAGINA'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jfif')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
  }
}));
app.use('/LogoFireTrace.png', express.static(path.join(__dirname, 'IMG', 'LogoFireTrace.png')));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

// ── Manejo de errores 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ── Manejo de errores globales ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[FireTrace Error]', err.stack);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🔥 FireTrace Server - Puerto ${PORT}    ║
║   NASA Space Apps Challenge 2026       ║
║   http://localhost:${PORT}               ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
