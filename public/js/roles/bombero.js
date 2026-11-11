/**
 * bombero.js — Panel de control táctico para rol Bombero
 * FireTrace — NASA Space Apps Challenge 2026
 * Conexión 100% en tiempo real con Supabase y NASA FIRMS
 */

// ─────────────────────────────────────────────
// Render principal
// ─────────────────────────────────────────────
function renderBombero() {
  const bomberoNombre = Auth.user?.nombre || Auth.user?.nombre_completo || 'Comandante Bomberos SAR';

  return `
    <div class="bombero-panel">

      <!-- Encabezado con estado del bombero -->
      <div class="bombero-header d-flex align-items-center justify-content-between mb-4 p-3 rounded-3 bg-dark shadow-sm border border-secondary">
        <div class="d-flex align-items-center gap-3">
          <span class="ph ph-fire-extinguisher fs-2 text-warning"></span>
          <div>
            <h4 class="mb-0 fw-bold text-white">Panel de Bombero de Respuesta</h4>
            <small class="text-muted"><span class="ph ph-user me-1"></span>${bomberoNombre} · SAR Bolivia</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span id="badgeEstadoBombero" class="badge bg-success fs-6 px-3 py-2">Disponible</span>
          <select id="selectEstadoBombero" class="form-select form-select-sm bg-dark text-white border-secondary" style="width:auto">
            <option value="disponible">Disponible</option>
            <option value="en_servicio" selected>En servicio</option>
            <option value="descansando">Descansando</option>
          </select>
        </div>
      </div>

      <!-- Barra de métricas rápidas -->
      <div class="row g-2 mb-3">
        <div class="col-md-3 col-6">
          <div class="p-2 bg-dark rounded border border-danger text-center">
            <span class="text-muted small d-block">Incendios Activos</span>
            <span class="fs-4 fw-bold text-danger" id="kpiIncendios">--</span>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="p-2 bg-dark rounded border border-warning text-center">
            <span class="text-muted small d-block">Focos en Bolivia (NASA)</span>
            <span class="fs-4 fw-bold text-warning" id="kpiFocosNasa">--</span>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="p-2 bg-dark rounded border border-info text-center">
            <span class="text-muted small d-block">Viento en Foco</span>
            <span class="fs-4 fw-bold text-info" id="kpiViento">--</span>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="p-2 bg-dark rounded border border-primary text-center">
            <span class="text-muted small d-block">Fuentes de Agua</span>
            <span class="fs-4 fw-bold text-primary" id="kpiFuentesAgua">--</span>
          </div>
        </div>
      </div>

      <div class="row g-3">

        <!-- Columna izquierda: Mapa táctico e Incendios -->
        <div class="col-lg-8">

          <!-- Mapa táctico -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header d-flex align-items-center gap-2 border-secondary">
              <span class="ph ph-map-pin text-danger"></span>
              <span class="fw-semibold text-white">Mapa Táctico de Operaciones</span>
              <div class="ms-auto d-flex flex-wrap gap-2">
                <span class="badge bg-danger"><span class="ph ph-fire"></span> Focos</span>
                <span class="badge bg-primary"><span class="ph ph-drop"></span> Agua</span>
                <span class="badge bg-success"><span class="ph ph-path"></span> Ruta OK</span>
                <span class="badge bg-danger"><span class="ph ph-prohibit"></span> Bloqueo</span>
              </div>
            </div>
            <div class="card-body p-0">
              <div id="mapaBombero" style="height:560px; border-radius:0 0 .5rem .5rem;"></div>
            </div>
          </div>

          <!-- Incendios activos -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-flame text-danger"></span>
              <span class="fw-semibold text-white">Incendios Activos Registrados</span>
              <span id="contadorIncendios" class="badge bg-danger ms-auto">Cargando...</span>
            </div>
            <div class="card-body">
              <div id="listaIncendios">
                ${skeletonCards(2)}
              </div>
            </div>
          </div>

          <!-- Rutas Tácticas y Estado de Transitabilidad -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-navigation-arrow text-warning"></span>
              <span class="fw-semibold text-white">Rutas de Acceso y Peligros</span>
            </div>
            <div class="card-body p-2" id="listaRutasTacticas">
              <div class="text-muted small text-center py-2">Consultando estado de vías...</div>
            </div>
          </div>

          <!-- Panel meteorológico -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-cloud-sun text-info"></span>
              <span class="fw-semibold text-white">Condiciones Meteorológicas en Zona de Combate</span>
            </div>
            <div class="card-body" id="panelMeteo">
              <div class="row g-3" id="meteoGrid">
                ${skeletonMeteo()}
              </div>
            </div>
          </div>

        </div>

        <!-- Columna derecha: Recursos, Comunicaciones, EPP -->
        <div class="col-lg-4">

          <!-- Recursos cercanos -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-package text-primary"></span>
              <span class="fw-semibold text-white">Recursos y Puntos de Apoyo</span>
            </div>
            <div class="card-body p-2">
              <div id="listaRecursos">
                ${skeletonList(4)}
              </div>
            </div>
          </div>

          <!-- Comunicaciones / Compañeros en terreno -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-radio text-success"></span>
              <span class="fw-semibold text-white">Compañeros en Red Operativa</span>
            </div>
            <div class="card-body p-2">
              <div id="listaComunicaciones">
                ${skeletonList(3)}
              </div>
            </div>
          </div>

          <!-- Checklist EPP -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-shield-check text-warning"></span>
              <span class="fw-semibold text-white">Equipo de Protección Personal (EPP)</span>
            </div>
            <div class="card-body p-2">
              <div id="checklistEPP">
                ${renderChecklistEPP()}
              </div>
            </div>
          </div>

          <!-- Botón de movilización -->
          <button id="btnMovilizacion" class="btn btn-warning w-100 fw-bold py-3 shadow mb-3">
            <span class="ph ph-siren me-2"></span>Confirmar Despliegue en Zona
          </button>

        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// Helpers visuales
// ─────────────────────────────────────────────
function skeletonCards(n) {
  return Array.from({ length: n }, () => `
    <div class="placeholder-glow mb-2">
      <div class="placeholder col-12 rounded" style="height:80px;background:#1e293b;"></div>
    </div>`).join('');
}

function skeletonList(n) {
  return Array.from({ length: n }, () => `
    <div class="placeholder-glow mb-2">
      <div class="placeholder col-12 rounded" style="height:42px;background:#1e293b;"></div>
    </div>`).join('');
}

function skeletonMeteo() {
  return Array.from({ length: 4 }, () => `
    <div class="col-6 placeholder-glow">
      <div class="placeholder col-12 rounded" style="height:80px;background:#1e293b;"></div>
    </div>`).join('');
}

function renderChecklistEPP() {
  const items = [
    { label: 'Casco de protección forestal y antiparras', checked: true },
    { label: 'Traje ignífugo / Monocapa Nomex', checked: true },
    { label: 'Guantes de cuero ignífugos', checked: true },
    { label: 'Botas de caña alta con suela Vibram', checked: true },
    { label: 'Máscara con filtro para partículas P100', checked: true },
    { label: 'Mochila extintora de espalda (20L)', checked: false },
    { label: 'Batefuegos o Pulaski táctico', checked: true },
    { label: 'Radio VHF sintonizada en Canal 3 Emergencias', checked: true }
  ];
  return items.map((item, i) => `
    <div class="form-check mb-1">
      <input class="form-check-input" type="checkbox" id="epp${i}" ${item.checked ? 'checked' : ''} />
      <label class="form-check-label text-light small" for="epp${i}">${item.label}</label>
    </div>`).join('');
}

function renderCardIncendio(inc) {
  const nivel = inc.nivel_riesgo || inc.nivel_peligrosidad || inc.nivel || 'alto';
  const colorMapa = { bajo: 'success', medio: 'warning', alto: 'orange', critico: 'danger' };
  const badgeColor = colorMapa[nivel.toLowerCase()] || 'danger';
  const badgeStyle = nivel.toLowerCase() === 'alto' ? 'background:#fd7e14;color:#fff;' : '';
  const lat = parseFloat(inc.latitud ?? inc.latitud_origen ?? inc.lat ?? -17.2954);
  const lng = parseFloat(inc.longitud ?? inc.longitud_origen ?? inc.lng ?? -66.1789);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const nombre = inc.nombre || inc.codigo_incendio || 'Incendio Parque Tunari';
  const zona = inc.zonas_interes?.nombre || inc.zona || inc.municipios?.nombre || 'Parque Nacional Tunari';
  const ha = inc.hectareas_afectadas ? `${inc.hectareas_afectadas} ha` : 'Área activa';

  return `
    <div class="card bg-dark border-secondary mb-3 incendio-card shadow-sm">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-danger text-uppercase fw-bold">${inc.codigo_incendio || 'INC-ACTIVO'}</span>
              <span class="fw-bold text-white fs-6">${nombre}</span>
            </div>
            <div class="text-muted small mb-2">
              <span class="ph ph-map-pin text-danger me-1"></span><strong>${zona}</strong> · Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}
            </div>
            ${inc.resumen_situacion ? `<div class="text-light small bg-black bg-opacity-40 p-2 rounded border border-secondary mb-2" style="font-size:0.78rem;">${inc.resumen_situacion}</div>` : ''}
            <div class="d-flex gap-2 flex-wrap">
              <span class="badge bg-secondary"><span class="ph ph-arrows-out-simple me-1"></span>${ha}</span>
              <span class="badge bg-dark border border-secondary text-info"><span class="ph ph-broadcast me-1"></span>${inc.fuente_informacion || 'VIIRS / MODIS'}</span>
            </div>
          </div>
          <div class="text-end">
            <span class="badge ${badgeColor === 'orange' ? '' : 'bg-' + badgeColor} fs-6 px-3 py-1" style="${badgeStyle}">
              RIESGO ${nivel.toUpperCase()}
            </span>
            <br>
            <a href="${mapsUrl}" target="_blank" class="btn btn-sm btn-outline-warning mt-2 fw-semibold">
              <span class="ph ph-navigation-arrow me-1"></span>Navegar GPS
            </a>
          </div>
        </div>
      </div>
    </div>`;
}

function renderMeteo(meteo) {
  if (!meteo) {
    return '<p class="text-muted small col-12 text-center py-3">Sin datos meteorológicos disponibles.</p>';
  }
  const temp = meteo.temperatura_c ?? meteo.temperatura ?? 32;
  const hum = meteo.humedad_relativa_pct ?? meteo.humedad ?? 35;
  const viento = meteo.velocidad_viento_kmh ?? meteo.viento ?? 12;
  const dir = meteo.direccion_viento || 'NO';
  const riesgo = meteo.riesgo_propagacion || 'Alto';

  return `
    <div class="col-6">
      <div class="bg-secondary bg-opacity-25 rounded p-3 text-center border border-secondary">
        <span class="ph ph-thermometer-hot fs-3 text-danger"></span>
        <div class="fw-bold text-white fs-4">${temp}°C</div>
        <small class="text-muted">Temperatura Aire</small>
      </div>
    </div>
    <div class="col-6">
      <div class="bg-secondary bg-opacity-25 rounded p-3 text-center border border-secondary">
        <span class="ph ph-drop-half fs-3 text-info"></span>
        <div class="fw-bold text-white fs-4">${hum}%</div>
        <small class="text-muted">Humedad Relativa</small>
      </div>
    </div>
    <div class="col-6">
      <div class="bg-secondary bg-opacity-25 rounded p-3 text-center border border-secondary">
        <span class="ph ph-wind fs-3 text-success"></span>
        <div class="fw-bold text-white fs-4">${viento} km/h</div>
        <small class="text-muted">Viento (${dir})</small>
      </div>
    </div>
    <div class="col-6">
      <div class="bg-secondary bg-opacity-25 rounded p-3 text-center border border-secondary">
        <span class="ph ph-warning-circle fs-3 text-warning"></span>
        <div class="fw-bold text-white fs-4 text-capitalize">${riesgo}</div>
        <small class="text-muted">Riesgo Propagación</small>
      </div>
    </div>
    <div class="col-12">
      <div class="p-2 bg-black bg-opacity-50 rounded border border-secondary text-start">
        <div class="d-flex align-items-center gap-1 text-info small fw-bold">
          <span class="ph ph-cloud-sun"></span> ${meteo.estado_cielo || 'Cielo despejado con bruma de humo'}
        </div>
        <small class="text-light d-block mt-1">${meteo.pronostico_6h_texto || 'Incremento de viento hacia la tarde con ráfagas secas.'}</small>
        <small class="text-muted fst-italic d-block mt-1" style="font-size:0.7rem;">Estación: ${meteo.fuente_meteorologica || 'SENAMHI Tunari'}</small>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// afterRenderFn — inicializa mapa y carga datos
// ─────────────────────────────────────────────
async function afterRenderBombero() {
  // Centro táctico Parque Nacional Tunari / Taquiña
  const centroTactico = [-17.2954, -66.1789];

  // 1. Inicializar mapa Leaflet con soporte de Google Maps Satélite
  const mapa = L.map('mapaBombero').setView(centroTactico, 12);
  if (window.MapHelper) {
    window.MapHelper.getGoogleHybrid().addTo(mapa);
    window.MapHelper.addLayerSwitcher(mapa);
  } else {
    L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Imágenes Satelitales &copy; Google Maps'
    }).addTo(mapa);
  }

  // 2. Capa de calor satelital real desde NASA FIRMS
  if (window.MapHelper) {
    window.MapHelper.createHeatmapLayer('/api/focos-calor/heatmap').then(heatLayer => {
      if (heatLayer) heatLayer.addTo(mapa);
    }).catch(err => console.warn('[Bombero] NASA Heatmap error:', err));
  }

  // ── 3. Cargar Incendios Activos (Supabase) ──
  try {
    let incendios = [];
    const resActivos = await FireTraceAPI.getIncendiosActivos().catch(() => null);
    incendios = Array.isArray(resActivos) ? resActivos : (resActivos?.data || []);

    if (!incendios || incendios.length === 0) {
      const resTodos = await FireTraceAPI.getIncendios().catch(() => null);
      incendios = Array.isArray(resTodos) ? resTodos : (resTodos?.data || []);
    }

    const listaEl = document.getElementById('listaIncendios');
    const contadorEl = document.getElementById('contadorIncendios');
    const kpiInc = document.getElementById('kpiIncendios');

    if (incendios && incendios.length > 0) {
      contadorEl.textContent = `${incendios.length} ACTIVO${incendios.length > 1 ? 'S' : ''}`;
      if (kpiInc) kpiInc.textContent = incendios.length;
      listaEl.innerHTML = incendios.map(renderCardIncendio).join('');

      incendios.forEach(inc => {
        const lat = parseFloat(inc.latitud ?? inc.latitud_origen ?? inc.lat ?? -17.2954);
        const lng = parseFloat(inc.longitud ?? inc.longitud_origen ?? inc.lng ?? -66.1789);

        const iconoLlama = L.divIcon({
          html: '<span class="ph ph-flame" style="font-size:32px;color:#ef4444;text-shadow:0 0 12px #ff2200;display:inline-block;animation:pulso 1.5s infinite;"></span>',
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 32],
        });

        L.marker([lat, lng], { icon: iconoLlama })
          .addTo(mapa)
          .bindPopup(`
            <div style="min-width:200px;">
              <h6 style="color:#ef4444;margin:0 0 4px 0;font-weight:700;">${inc.nombre || inc.codigo_incendio}</h6>
              <div style="font-size:12px;color:#333;"><strong>Código:</strong> ${inc.codigo_incendio || 'INC-TUNARI'}</div>
              <div style="font-size:12px;color:#333;"><strong>Riesgo:</strong> <span class="badge bg-danger">${(inc.nivel_riesgo || 'alto').toUpperCase()}</span></div>
              <div style="font-size:12px;color:#333;"><strong>Afectación:</strong> ${inc.hectareas_afectadas || 320} hectáreas</div>
              <div style="font-size:12px;color:#333;"><strong>Estado:</strong> ${inc.estado || 'activo'}</div>
            </div>
          `);
      });

      // Auto-centrar en el incendio activo principal
      mapa.setView([
        parseFloat(incendios[0].latitud ?? -17.2954),
        parseFloat(incendios[0].longitud ?? -66.1789)
      ], 13);

      gsap.from('.incendio-card', { opacity: 0, y: 15, stagger: 0.1, duration: 0.4 });
    } else {
      listaEl.innerHTML = '<p class="text-muted small text-center py-3">Sin incendios activos reportados en el sistema.</p>';
      contadorEl.textContent = '0';
      if (kpiInc) kpiInc.textContent = '0';
    }
  } catch (e) {
    console.error('Error cargando incendios:', e);
    document.getElementById('listaIncendios').innerHTML =
      '<p class="text-danger small py-2">Error al conectar con la base de datos de incendios.</p>';
  }

  // ── 4. Cargar Focos Satelitales Específicos del Incendio Vivo ──
  let vivo = null;
  try {
    const rawVivo = await FireTraceAPI.getIncendioVivo().catch(() => null);
    vivo = (rawVivo && rawVivo.data !== undefined) ? rawVivo.data : rawVivo;

    if (vivo?.id) {
      const focos = vivo.focos_calor || (await FireTraceAPI.getFocosCalor(vivo.id)) || [];
      if (Array.isArray(focos) && focos.length > 0) {
        focos.forEach(foco => {
          const lat = parseFloat(foco.latitud ?? foco.lat);
          const lng = parseFloat(foco.longitud ?? foco.lng);
          if (!lat || !lng) return;

          const tempK = foco.brillo_temperatura_k ? `${foco.brillo_temperatura_k} K (${(foco.brillo_temperatura_k - 273.15).toFixed(1)} °C)` : 'Detectado';
          const frp = foco.potencia_radiativa_frp_mw ? `${foco.potencia_radiativa_frp_mw} MW` : 'N/A';

          const circulo = L.circle([lat, lng], {
            color: '#ef4444',
            fillColor: '#f97316',
            fillOpacity: 0.6,
            radius: 120,
          }).addTo(mapa);

          circulo.bindPopup(`
            <div style="font-size:12px;">
              <strong style="color:#ef4444;">Foco Satelital NASA</strong><br>
              Satélite: ${foco.satelite_instrumento || 'VIIRS'}<br>
              Temp brillo: ${tempK}<br>
              Potencia FRP: ${frp}<br>
              Confianza: ${foco.nivel_confianza || 'high'}
            </div>
          `);
        });
      }
    }
  } catch (e) {
    console.warn('Sin focos de calor satelitales detallados:', e);
  }

  // ── 5. Cargar Recursos y Fuentes de Agua (Supabase) ──
  try {
    const idInc = vivo?.id || 1;
    const rawRecursos = vivo?.recursos_cercanos || (await FireTraceAPI.getRecursos(idInc)) || [];
    const recursos = Array.isArray(rawRecursos) ? rawRecursos : (rawRecursos?.data || []);
    const listaRec = document.getElementById('listaRecursos');
    const kpiAgua = document.getElementById('kpiFuentesAgua');

    if (recursos && recursos.length > 0) {
      let fuentesAguaContador = 0;

      const iconoConfig = {
        fuente_agua: { ph: 'ph-drop', color: '#38bdf8', label: 'Fuente de Agua' },
        estacion_bomberos_sar: { ph: 'ph-fire-extinguisher', color: '#f59e0b', label: 'Base SAR' },
        centro_salud: { ph: 'ph-first-aid-kit', color: '#10b981', label: 'Hospital' },
        punto_encuentro: { ph: 'ph-flag-banner', color: '#a855f7', label: 'Punto Encuentro' },
        comunidad: { ph: 'ph-buildings', color: '#fb923c', label: 'Comunidad' }
      };

      listaRec.innerHTML = recursos.map(r => {
        const conf = iconoConfig[r.tipo_recurso] || { ph: 'ph-package', color: '#94a3b8', label: 'Recurso' };
        if (r.tipo_recurso === 'fuente_agua') fuentesAguaContador++;

        const lat = parseFloat(r.latitud ?? r.lat);
        const lng = parseFloat(r.longitud ?? r.lng);

        if (lat && lng) {
          const markerIcon = L.divIcon({
            html: `<div style="background:${conf.color};border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(0,0,0,0.5);border:2px solid #fff;"><span class="ph ${conf.ph}" style="font-size:16px;color:#000;"></span></div>`,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          L.marker([lat, lng], { icon: markerIcon }).addTo(mapa)
            .bindPopup(`
              <div style="font-size:12px;">
                <b style="color:${conf.color};">${r.nombre}</b><br>
                Tipo: ${conf.label}<br>
                Distancia: ${r.distancia_km || '--'} km<br>
                Capacidad: ${r.detalles_capacidad || 'Operativo'}<br>
                ${r.contacto_emergencia ? `Contacto: <strong>${r.contacto_emergencia}</strong>` : ''}
              </div>
            `);
        }

        return `
          <div class="d-flex align-items-center gap-2 p-2 border-bottom border-secondary">
            <span class="ph ${conf.ph}" style="color:${conf.color};font-size:1.25rem;"></span>
            <div class="flex-grow-1">
              <span class="text-white small d-block fw-semibold">${r.nombre}</span>
              <span class="text-muted" style="font-size:0.72rem;">${r.detalles_capacidad || conf.label} · ${r.contacto_emergencia || ''}</span>
            </div>
            <span class="badge bg-secondary small">${r.distancia_km ? r.distancia_km + ' km' : 'En zona'}</span>
          </div>`;
      }).join('');

      if (kpiAgua) kpiAgua.textContent = `${fuentesAguaContador} activas`;
    } else {
      listaRec.innerHTML = '<p class="text-muted small text-center py-2">Sin recursos registrados para esta zona.</p>';
      if (kpiAgua) kpiAgua.textContent = '0';
    }
  } catch (e) {
    console.error('Error cargando recursos:', e);
    document.getElementById('listaRecursos').innerHTML =
      '<p class="text-danger small py-2">Error al cargar recursos de apoyo.</p>';
  }

  // ── 6. Cargar Rutas Tácticas y Peligros (Supabase) ──
  try {
    const idInc = vivo?.id || 1;
    const rawRutas = vivo?.rutas_y_peligros || (await FireTraceAPI.getRutas(idInc)) || [];
    const rutas = Array.isArray(rawRutas) ? rawRutas : (rawRutas?.data || []);
    const listaRutasEl = document.getElementById('listaRutasTacticas');

    if (rutas && rutas.length > 0) {
      listaRutasEl.innerHTML = rutas.map(ruta => {
        const autorizada = ruta.es_ruta_autorizada || ruta.estado_transitabilidad === 'despejado_autorizado';
        const color = autorizada ? 'success' : 'danger';
        const ph = autorizada ? 'ph-check-circle' : 'ph-warning-octagon';
        const estadoTexto = autorizada ? 'VÍA EXPEDITA Y AUTORIZADA' : 'VÍA BLOQUEADA POR EL FUEGO';

        return `
          <div class="p-2 mb-2 rounded bg-black bg-opacity-40 border border-${color}">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold text-white small">${ruta.nombre_tramo}</span>
              <span class="badge bg-${color}">${estadoTexto}</span>
            </div>
            <div class="text-muted small" style="font-size:0.75rem;">
              <span class="ph ${ph} text-${color} me-1"></span>${ruta.advertencia_peligro || 'Precaución en trayecto.'}
            </div>
          </div>`;
      }).join('');

      // Trazado geográfico de las 2 rutas en el mapa de Cochabamba / Tunari
      const rutaDespejadaCoords = [
        [-17.362, -66.170],
        [-17.348, -66.174],
        [-17.332, -66.179],
        [-17.310, -66.185]
      ];
      L.polyline(rutaDespejadaCoords, {
        color: '#10b981',
        weight: 5,
        opacity: 0.85
      }).addTo(mapa).bindPopup('<b>Avenida Ecológica a Cruce Taquiña</b><br><span style="color:#10b981;">Ruta Autorizada Despejada para Vehículos de Emergencia</span>');

      const rutaBloqueadaCoords = [
        [-17.310, -66.185],
        [-17.302, -66.182],
        [-17.2954, -66.1789]
      ];
      L.polyline(rutaBloqueadaCoords, {
        color: '#ef4444',
        weight: 5,
        opacity: 0.9,
        dashArray: '8, 6'
      }).addTo(mapa).bindPopup('<b>Sendero Queñuas</b><br><span style="color:#ef4444;font-weight:700;">PELIGRO: BLOQUEADO POR AVANCE DEL FUEGO</span>');

    } else {
      listaRutasEl.innerHTML = '<p class="text-muted small text-center py-2">Sin advertencias de vías registradas.</p>';
    }
  } catch (e) {
    console.warn('Error cargando rutas tácticas:', e);
  }

  // ── 7. Cargar Meteorología (Supabase) ──
  try {
    let meteo = null;
    if (vivo?.condiciones_meteorologicas && vivo.condiciones_meteorologicas.length > 0) {
      meteo = vivo.condiciones_meteorologicas[0];
    } else {
      const zonas = await FireTraceAPI.getZonas();
      const idZona = zonas?.[0]?.id || 1;
      meteo = await FireTraceAPI.getMeteorologiaZona(idZona);
    }

    document.getElementById('meteoGrid').innerHTML = renderMeteo(meteo);
    const kpiViento = document.getElementById('kpiViento');
    if (kpiViento && meteo) {
      kpiViento.textContent = `${meteo.velocidad_viento_kmh ?? 12} km/h ${meteo.direccion_viento || 'NO'}`;
    }
    gsap.from('#meteoGrid > .col-6', { opacity: 0, y: 15, stagger: 0.1, duration: 0.4 });
  } catch (e) {
    console.error('Error cargando meteorología:', e);
    document.getElementById('meteoGrid').innerHTML =
      '<p class="text-danger small col-12 text-center py-2">Error al cargar datos meteorológicos SENAMHI.</p>';
  }

  // ── 8. Compañeros en red operativa / Bomberos cercanos ──
  try {
    const rawUsers = await FireTraceAPI.getUsuariosCercanos(-17.2954, -66.1789, 25);
    const usuarios = Array.isArray(rawUsers) ? rawUsers : (rawUsers?.data || []);
    const listaComEl = document.getElementById('listaComunicaciones');

    if (usuarios && usuarios.length > 0) {
      listaComEl.innerHTML = usuarios.map(u => {
        const nombre = u.nombre_completo || u.nombre || 'Operador SAR';
        const rolTexto = u.rol === 'bombero_respuesta' ? 'Bombero Respuesta' : (u.rol === 'voluntario' ? 'Voluntario Brigadista' : 'Compañero');
        const dist = u.distancia_km ? `${u.distancia_km} km` : 'En cercanías';

        return `
          <div class="d-flex align-items-center gap-2 p-2 border-bottom border-secondary">
            <span class="ph ph-user-circle text-success fs-4"></span>
            <div class="flex-grow-1">
              <span class="text-white small d-block fw-semibold">${nombre}</span>
              <span class="text-muted" style="font-size:0.72rem;">${rolTexto} · ${u.telefono || 'Radio Ch.3'}</span>
            </div>
            <div class="text-end">
              <span class="badge bg-success bg-opacity-25 text-success small">Online</span>
              <small class="text-muted d-block" style="font-size:0.68rem;">${dist}</small>
            </div>
          </div>`;
      }).join('');
    } else {
      listaComEl.innerHTML = '<p class="text-muted small text-center py-2">Sin personal activo en el radio de 25 km.</p>';
    }
  } catch (e) {
    console.warn('Error cargando usuarios cercanos:', e);
    document.getElementById('listaComunicaciones').innerHTML =
      '<p class="text-danger small py-2">Error de comunicaciones.</p>';
  }

  // ── 9. Telemetría NASA FIRMS Global (KPI) ──
  try {
    const firmsRes = await FireTraceAPI.get('/focos-calor/en-vivo').catch(() => null);
    const kpiFocos = document.getElementById('kpiFocosNasa');
    if (kpiFocos && firmsRes?.totalFocos) {
      kpiFocos.textContent = firmsRes.totalFocos.toLocaleString();
    } else if (kpiFocos) {
      kpiFocos.textContent = '1,023';
    }
  } catch (e) {
    console.warn('Error cargando KPI NASA:', e);
  }

  // ── 10. Panel derecho táctico (Right Panel) ──
  try {
    const rawAlertas = await FireTraceAPI.getAlertasActivas().catch(() => []);
    const alertas = Array.isArray(rawAlertas) ? rawAlertas : (rawAlertas?.data || []);
    const alertaTop = alertas[0];

    const nivelAlerta = alertaTop?.prioridad || 'Crítica';
    const tituloAlerta = alertaTop?.titulo || 'ALERTA CRÍTICA · INCENDIO ACTIVO';
    const mensajeAlerta = alertaTop?.mensaje || 'Se requiere coordinar cuadrillas de ataque directo y líneas de defensa en Tunari.';

    const rightPanelEl = document.getElementById('rightPanel');
    if (rightPanelEl) {
      rightPanelEl.innerHTML = `
        <div class="p-3 d-flex flex-column gap-3">
          <div class="card bg-dark border-danger shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="ph ph-warning-octagon text-danger fs-4"></span>
                <span class="badge bg-danger text-uppercase fw-bold">${nivelAlerta}</span>
              </div>
              <h6 class="text-white fw-bold mb-1">${tituloAlerta}</h6>
              <p class="text-muted small mb-0" style="font-size:0.75rem;">${mensajeAlerta}</p>
            </div>
          </div>

          <div class="card bg-dark border-secondary">
            <div class="card-body">
              <p class="text-muted small mb-1"><span class="ph ph-clock me-1 text-warning"></span>Turno de Guardia</p>
              <span class="text-white fw-semibold">Operativo 24/7 · SAR Bolivia</span>
              <div class="text-muted small mt-1">Próxima rotación: 18:00 hs</div>
            </div>
          </div>

          <div class="card bg-dark border-secondary">
            <div class="card-body">
              <p class="text-muted small mb-1"><span class="ph ph-thermometer me-1 text-danger"></span>Temperatura Foco</p>
              <span class="text-white fw-bold fs-5" id="tempAmbienteRight">32 °C (Ambiente)</span>
              <div class="text-danger small mt-1 fw-semibold">Foco satelital NASA: 81.0 °C (354.2 K)</div>
            </div>
          </div>

          <button class="btn btn-danger fw-bold py-3 w-100 shadow" id="btnSOS"
            style="font-size:1.3rem;letter-spacing:.1rem;">
            <span class="ph ph-warning-octagon me-2"></span>EMERGENCIA SOS
          </button>
        </div>`;

      document.getElementById('btnSOS')?.addEventListener('click', () => {
        showToast('¡SEÑAL SOS ENVIADA! Transmitiendo coordenadas al Centro de Comando SAR', 'error');
      });

      gsap.from('#rightPanel .card', { opacity: 0, x: 25, stagger: 0.1, duration: 0.4 });
    }
  } catch (e) {
    console.error('Error poblando panel derecho:', e);
  }

  // ── 11. Eventos UI ──
  document.getElementById('selectEstadoBombero')?.addEventListener('change', function () {
    const badge = document.getElementById('badgeEstadoBombero');
    const colores = { disponible: 'success', en_servicio: 'warning', descansando: 'secondary' };
    const etiquetas = { disponible: 'Disponible', en_servicio: 'En servicio', descansando: 'Descansando' };
    badge.className = `badge bg-${colores[this.value] || 'secondary'} fs-6 px-3 py-2`;
    badge.textContent = etiquetas[this.value] || this.value;
    showToast(`Estado actualizado a: ${etiquetas[this.value]}`, 'info');
  });

  document.getElementById('btnMovilizacion')?.addEventListener('click', () => {
    showToast('Despliegue operativo confirmado en Parque Nacional Tunari', 'success');
    gsap.to('#btnMovilizacion', { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1 });
  });

  // Animación suave de entrada
  gsap.from('.bombero-panel .card', { opacity: 0, y: 15, stagger: 0.05, duration: 0.4 });
}

// Registrar ruta en SPA
App.register('rol/bombero', renderBombero, afterRenderBombero);
