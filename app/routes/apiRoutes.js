const express = require('express');
const router = express.Router();
const IncendioModel = require('../models/incendioModel');
const UsuarioModel = require('../models/usuarioModel');
const AlertaModel = require('../models/alertaModel');
const supabase = require('../models/supabaseClient');
const firmsService = require('../services/firmsService');

// Middleware auth API
function apiAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

function adminOnly(req, res, next) {
  if (!req.session.user || req.session.user.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
  }
  next();
}

// ════════════════════════════════════════
//  INCENDIOS
// ════════════════════════════════════════

router.get('/incendios', apiAuth, async (req, res) => {
  try {
    const { estado, nivel_riesgo, departamento_id } = req.query;
    const data = await IncendioModel.getAll({ estado, nivel_riesgo, departamento_id });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/incendios/activos', apiAuth, async (req, res) => {
  try {
    const data = await IncendioModel.getActivos();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/incendios/vivo', apiAuth, async (req, res) => {
  try {
    const data = await IncendioModel.getEnVivo();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/incendios/:id', apiAuth, async (req, res) => {
  try {
    const data = await IncendioModel.getById(req.params.id);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/incendios/:id/evolucion', apiAuth, async (req, res) => {
  try {
    const data = await IncendioModel.getEvolucion(req.params.id);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/incendios', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('incendios').insert([req.body]).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/incendios/:id', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('incendios').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  FOCOS DE CALOR (NASA FIRMS & BD)
// ════════════════════════════════════════

// Focos satelitales en vivo desde NASA FIRMS (con mapa de calor y telemetría)
router.get('/focos-calor/en-vivo', apiAuth, async (req, res) => {
  try {
    const { source, dayRange, forceRefresh } = req.query;
    const data = await firmsService.getLiveFocos({
      source: source || 'VIIRS_SNPP_NRT',
      dayRange: dayRange ? parseInt(dayRange) : 3,
      forceRefresh: forceRefresh === 'true'
    });
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Foco satelital más intenso cerca de un incendio (actualiza popup del mapa táctico)
router.get('/focos-calor/principal', apiAuth, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || -17.2954;
    const lng = parseFloat(req.query.lng) || -66.1789;
    const radio = parseFloat(req.query.radio) || 0.5;
    const forceRefresh = req.query.forceRefresh === 'true';

    // Refrescar si se solicita
    if (forceRefresh) {
      await firmsService.getLiveFocos({ dayRange: 3, forceRefresh: true });
    }

    const foco = await firmsService.getFocoPrincipal(lat, lng, radio);
    if (!foco) {
      return res.json({ success: false, message: 'Sin detección satelital en el área' });
    }
    res.json({ success: true, foco });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Puntos directos para Leaflet.heat ([lat, lng, intensidad])
router.get('/focos-calor/heatmap', apiAuth, async (req, res) => {
  try {
    const data = await firmsService.getLiveFocos({
      source: req.query.source || 'VIIRS_SNPP_NRT',
      dayRange: req.query.dayRange ? parseInt(req.query.dayRange) : 3
    });
    res.json({
      success: true,
      count: data.heatmapPoints ? data.heatmapPoints.length : 0,
      points: data.heatmapPoints || [],
      stats: data.stats
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/focos-calor', apiAuth, async (req, res) => {
  try {
    if (req.query.en_vivo === 'true') {
      const liveData = await firmsService.getLiveFocos();
      return res.json({ success: true, data: liveData.focos });
    }
    const data = await IncendioModel.getFocosCalor(req.query.incendio_id);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  ESTADÍSTICAS Y DASHBOARD
// ════════════════════════════════════════

router.get('/estadisticas/dashboard', apiAuth, async (req, res) => {
  try {
    const data = await IncendioModel.getEstadisticasDashboard();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/estadisticas/historicas', apiAuth, async (req, res) => {
  try {
    const data = await IncendioModel.getEstadisticasHistoricas(req.query.departamento_id || 1);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  VIGILANCIA DE REACTIVACIONES
// ════════════════════════════════════════

router.get('/vigilancia', apiAuth, async (req, res) => {
  try {
    const data = await IncendioModel.getVigilanciaReactivaciones();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  ALERTAS Y NOTIFICACIONES
// ════════════════════════════════════════

router.get('/alertas', apiAuth, async (req, res) => {
  try {
    const data = await AlertaModel.getActivas();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/alertas', apiAuth, async (req, res) => {
  try {
    const data = await AlertaModel.create(req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  REPORTES CIUDADANOS
// ════════════════════════════════════════

router.get('/reportes', apiAuth, async (req, res) => {
  try {
    const data = await AlertaModel.getReportesCiudadanos(req.query.estado);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reportes', apiAuth, async (req, res) => {
  try {
    const data = await AlertaModel.createReporte(req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/reportes/:id', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('reportes_ciudadanos').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  USUARIOS (SOLO ADMIN)
// ════════════════════════════════════════

router.get('/usuarios', apiAuth, adminOnly, async (req, res) => {
  try {
    const data = await UsuarioModel.getAll();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/usuarios', apiAuth, adminOnly, async (req, res) => {
  try {
    const data = await UsuarioModel.create(req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/usuarios/:id', apiAuth, adminOnly, async (req, res) => {
  try {
    const data = await UsuarioModel.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/usuarios/:id', apiAuth, adminOnly, async (req, res) => {
  try {
    await UsuarioModel.delete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/usuarios/cercanos', apiAuth, async (req, res) => {
  try {
    const { lat, lng, radio } = req.query;
    const data = await UsuarioModel.getCercanos(parseFloat(lat), parseFloat(lng), parseFloat(radio) || 15);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  RECURSOS CERCANOS Y ZONAS
// ════════════════════════════════════════

router.get('/recursos', apiAuth, async (req, res) => {
  try {
    let query = supabase.from('recursos_cercanos').select('*');
    if (req.query.incendio_id) query = query.eq('incendio_id', req.query.incendio_id);
    if (req.query.tipo) query = query.eq('tipo_recurso', req.query.tipo);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/zonas', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('zonas_interes')
      .select('*, municipios(nombre)')
      .eq('activa', true);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  METEOROLOGÍA
// ════════════════════════════════════════

router.get('/meteorologia/:zonaId', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('condiciones_meteorologicas')
      .select('*')
      .eq('zona_id', req.params.zonaId)
      .order('fecha_hora_registro', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  BITÁCORA DEL BOSQUE
// ════════════════════════════════════════

router.get('/bitacora', apiAuth, async (req, res) => {
  try {
    let query = supabase
      .from('bitacora_informes')
      .select('*, departamentos(nombre), zonas_interes(nombre)')
      .order('fecha_elaboracion', { ascending: false });
    if (req.query.tipo) query = query.eq('tipo_informe', req.query.tipo);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  HISTORIAS Y BIODIVERSIDAD
// ════════════════════════════════════════

router.get('/historias', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('historias_biodiversidad')
      .select('*')
      .order('creado_el', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  RUTAS Y PELIGROS
// ════════════════════════════════════════

router.get('/rutas/:incendioId', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rutas_y_peligros')
      .select('*')
      .eq('incendio_id', req.params.incendioId);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  MOVILIZACIÓN (BOMBEROS/RESCATISTAS)
// ════════════════════════════════════════

router.post('/movilizacion', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movilizacion_respuesta')
      .insert([{ ...req.body, usuario_id: req.session.user.id }])
      .select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/movilizacion/:id', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movilizacion_respuesta')
      .update(req.body)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  DEPARTAMENTOS Y MUNICIPIOS
// ════════════════════════════════════════

router.get('/departamentos', async (req, res) => {
  try {
    const { data, error } = await supabase.from('departamentos').select('*');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/municipios', async (req, res) => {
  try {
    let query = supabase.from('municipios').select('*');
    if (req.query.departamento_id) query = query.eq('departamento_id', req.query.departamento_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════
//  VOLUNTARIADO
// ════════════════════════════════════════

router.get('/voluntariado', apiAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_voluntariado')
      .select('*')
      .order('fecha_solicitud', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/voluntariado', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_voluntariado')
      .insert([req.body])
      .select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
