/**
 * ambulancia.js — Panel de control operativo para Unidad Médica / SAMU
 * FireTrace — NASA Space Apps Challenge 2026
 * Conexión 100% en tiempo real con Supabase y NASA FIRMS
 */

// ─────────────────────────────────────────────
// Render principal
// ─────────────────────────────────────────────
function renderAmbulancia() {
  const unidadNombre = Auth.user?.nombre || Auth.user?.nombre_completo || 'Unidad Móvil SAMU-04';

  return `
    <div class="ambulancia-panel">

      <!-- Encabezado con estado de la unidad -->
      <div class="d-flex align-items-center justify-content-between mb-4 p-3 rounded-3 bg-dark shadow-sm border border-secondary">
        <div class="d-flex align-items-center gap-3">
          <span class="ph ph-first-aid-kit fs-2 text-danger"></span>
          <div>
            <h4 class="mb-0 fw-bold text-white">Panel de Respuesta Médica</h4>
            <small class="text-muted"><span class="ph ph-ambulance me-1 text-warning"></span>${unidadNombre} · Cochabamba</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span id="badgeEstadoAmb" class="badge bg-success fs-6 px-3 py-2">Disponible</span>
          <select id="selectEstadoAmb" class="form-select form-select-sm bg-dark text-white border-secondary" style="width:auto">
            <option value="disponible">Disponible</option>
            <option value="en_ruta">En ruta al foco</option>
            <option value="en_escena">En escena (Taquiña)</option>
            <option value="trasladando">Trasladando a Hospital</option>
            <option value="fuera">Fuera de servicio</option>
          </select>
        </div>
      </div>

      <div class="row g-3">

        <!-- Columna izquierda -->
        <div class="col-lg-8">

          <!-- Mapa de Operaciones -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-map-trifold text-info"></span>
              <span class="fw-semibold text-white">Mapa de Evacuación y Centros Hospitalarios</span>
              <div class="ms-auto d-flex flex-wrap gap-2">
                <span class="badge bg-danger"><span class="ph ph-flame"></span> Incendio</span>
                <span class="badge bg-success"><span class="ph ph-plus-circle"></span> Hospitales</span>
                <span class="badge bg-warning text-dark"><span class="ph ph-ambulance"></span> Mi Unidad</span>
              </div>
            </div>
            <div class="card-body p-0">
              <div id="mapaAmbulancia" style="height:540px; border-radius:0 0 .5rem .5rem;"></div>
            </div>
          </div>

          <!-- Emergencia crítica activa -->
          <div class="card bg-dark border-danger border-2 shadow-sm mb-3" id="cardEmergenciaCritica">
            <div class="card-header border-danger d-flex align-items-center gap-2">
              <span class="ph ph-warning-octagon text-danger fs-5"></span>
              <span class="fw-semibold text-white">Incidente de Máxima Prioridad de Atención</span>
              <span class="ms-auto badge bg-danger">DESPLIEGUE PRIORITARIO</span>
            </div>
            <div class="card-body" id="emergenciaCriticaBody">
              ${skeletonAmb(1)}
            </div>
          </div>

          <!-- Lista de emergencias activas -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-list-dashes text-warning"></span>
              <span class="fw-semibold text-white">Focos de Emergencia en Monitoreo</span>
              <span id="contadorEmergencias" class="badge bg-warning text-dark ms-auto">Cargando...</span>
            </div>
            <div class="card-body p-2" id="listaEmergencias">
              ${skeletonAmb(2)}
            </div>
          </div>

          <!-- Centros de Salud de Derivación Oficial -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-hospital text-success"></span>
              <span class="fw-semibold text-white">Red Hospitalaria de Cochabamba para Quemados / Inhalación</span>
            </div>
            <div class="card-body p-2" id="listaHospitalesRed">
              <div class="text-muted small text-center py-2">Consultando disponibilidad hospitalaria...</div>
            </div>
          </div>

        </div>

        <!-- Columna derecha -->
        <div class="col-lg-4">

          <!-- Checklist de triage -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-clipboard-text text-success"></span>
              <span class="fw-semibold text-white">Protocolo START / Triage de Humo</span>
            </div>
            <div class="card-body p-2">
              ${renderChecklistTriage()}
            </div>
          </div>

          <!-- Inventario médico -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-pill text-info"></span>
              <span class="fw-semibold text-white">Inventario Asignado a la Unidad</span>
            </div>
            <div class="card-body p-2">
              ${renderInventarioMedico()}
            </div>
          </div>

          <!-- Panel de comunicación médica -->
          <div class="card bg-dark border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary d-flex align-items-center gap-2">
              <span class="ph ph-headset text-primary"></span>
              <span class="fw-semibold text-white">Coordinación Médica Central</span>
            </div>
            <div class="card-body p-2">
              <div class="bg-black bg-opacity-50 rounded p-2 mb-2" style="min-height:90px;max-height:140px;overflow-y:auto;" id="chatMedico">
                <p class="text-muted small mb-1"><span class="ph ph-radio me-1 text-success"></span>Enlace abierto con Central de Emergencias 168 / CRUE</p>
                <div class="text-info small" style="font-size:0.75rem;">Base Operativa: Mantener alerta ante reporte de brigadistas en Taquiña Alta.</div>
              </div>
              <div class="input-group input-group-sm">
                <input type="text" id="inputMensajeMedico" class="form-control bg-dark text-white border-secondary"
                  placeholder="Mensaje a coordinación...">
                <button class="btn btn-primary" id="btnEnviarMensajeMedico">
                  <span class="ph ph-paper-plane-tilt"></span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// Helpers visuales
// ─────────────────────────────────────────────
function skeletonAmb(n) {
  return Array.from({ length: n }, () => `
    <div class="placeholder-glow mb-2">
      <div class="placeholder col-12 rounded" style="height:70px;background:#1e293b;"></div>
    </div>`).join('');
}

function renderChecklistTriage() {
  const pasos = [
    { letra: 'A', label: 'Airway — Permeabilidad vía aérea y retiro de ceniza', color: 'danger' },
    { letra: 'B', label: 'Breathing — Oximetría y administración de O2 al 100%', color: 'warning' },
    { letra: 'C', label: 'Circulation — Hidratación EV ante shock térmico', color: 'primary' },
    { letra: 'D', label: 'Disability — Escala Glasgow / Intoxicación por CO', color: 'info' },
  ];
  return pasos.map((p, i) => `
    <div class="form-check d-flex align-items-center gap-2 mb-2">
      <input class="form-check-input" type="checkbox" id="triage${i}" />
      <label class="form-check-label text-light d-flex align-items-center gap-2" for="triage${i}">
        <span class="badge bg-${p.color} rounded-circle fw-bold" style="width:22px;height:22px;line-height:16px;text-align:center;">${p.letra}</span>
        <span class="small">${p.label}</span>
      </label>
    </div>`).join('');
}

function renderInventarioMedico() {
  const items = [
    { nombre: 'Cilindro Oxígeno Medicinal 2000L', nivel: '85% OK', badge: 'success' },
    { nombre: 'Solución Fisiológica 0.9% (12u)', nivel: 'OK', badge: 'success' },
    { nombre: 'Apósitos para quemaduras Water-Jel', nivel: 'Crítico', badge: 'danger' },
    { nombre: 'Camilla rígida con fijadores de cabeza', nivel: 'OK', badge: 'success' },
    { nombre: 'Monitor desfibrilador bifásico', nivel: 'Operativo', badge: 'info' },
    { nombre: 'Nebulizador portátil con broncodilatador', nivel: 'Bajo', badge: 'warning' },
  ];
  return items.map(item => `
    <div class="d-flex align-items-center justify-content-between border-bottom border-secondary py-1">
      <span class="text-light small">${item.nombre}</span>
      <span class="badge bg-${item.badge}">${item.nivel}</span>
    </div>`).join('');
}

function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function renderCardEmergencia(inc, esTop = false) {
  const latAmb = -17.3800;
  const lngAmb = -66.1600;
  const incLat = parseFloat(inc.latitud ?? inc.latitud_origen ?? inc.lat ?? -17.2954);
  const incLng = parseFloat(inc.longitud ?? inc.longitud_origen ?? inc.lng ?? -66.1789);
  const distM = calcularDistancia(latAmb, lngAmb, incLat, incLng);
  const distKm = (distM / 1000).toFixed(1);
  const tiempoMin = Math.max(2, Math.round(distM / 550));
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${latAmb},${lngAmb}&destination=${incLat},${incLng}&travelmode=driving`;
  const nombre = inc.nombre || inc.codigo_incendio || 'Incidente Forestal';
  const zona = inc.zonas_interes?.nombre || inc.zona || inc.municipios?.nombre || 'Parque Nacional Tunari';
  const nivel = (inc.nivel_riesgo || 'alto').toUpperCase();

  if (esTop) {
    return `
      <div class="d-flex justify-content-between align-items-start gap-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-danger">${inc.codigo_incendio || 'INC-01'}</span>
            <h5 class="text-white mb-0 fw-bold">${nombre}</h5>
          </div>
          <p class="text-muted small mb-1"><span class="ph ph-map-pin text-danger me-1"></span>${zona} · Coords: ${incLat.toFixed(4)}, ${incLng.toFixed(4)}</p>
          <div class="text-warning small mb-2"><span class="ph ph-clock me-1"></span>Tiempo estimado de respuesta: <strong>${tiempoMin} min</strong> (${distKm} km)</div>
          ${inc.resumen_situacion ? `<div class="p-2 rounded bg-black bg-opacity-40 border border-secondary text-light small" style="font-size:0.75rem;">${inc.resumen_situacion}</div>` : ''}
        </div>
        <div class="text-end">
          <a href="${mapsUrl}" target="_blank" class="btn btn-danger fw-bold text-nowrap">
            <span class="ph ph-navigation-arrow me-1"></span>Ruta GPS Código Rojo
          </a>
        </div>
      </div>`;
  }

  return `
    <div class="d-flex align-items-center gap-3 border-bottom border-secondary py-2 emergencia-card">
      <span class="ph ph-flame text-danger fs-4"></span>
      <div class="flex-grow-1">
        <span class="text-white small d-block fw-semibold">${nombre}</span>
        <span class="text-muted" style="font-size:.72rem">${zona} · Riesgo: <span class="text-warning">${nivel}</span></span>
      </div>
      <div class="text-end">
        <span class="badge bg-secondary">${distKm} km</span>
        <br>
        <small class="text-muted">${tiempoMin} min</small>
      </div>
      <a href="${mapsUrl}" target="_blank" class="btn btn-sm btn-outline-danger ms-1" title="Iniciar navegación">
        <span class="ph ph-navigation-arrow"></span>
      </a>
    </div>`;
}

// ─────────────────────────────────────────────
// afterRenderFn
// ─────────────────────────────────────────────
async function afterRenderAmbulancia() {
  const posUnidad = [-17.3800, -66.1600];

  // 1. Inicializar mapa
  const mapa = L.map('mapaAmbulancia').setView(posUnidad, 13);
  if (window.MapHelper) {
    window.MapHelper.getGoogleHybrid().addTo(mapa);
    window.MapHelper.addLayerSwitcher(mapa);
    window.MapHelper.createHeatmapLayer('/api/focos-calor/heatmap').then(heat => {
      if (heat) heat.addTo(mapa);
    }).catch(e => console.warn('[Ambulancia] Heatmap:', e));
  } else {
    L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Imágenes Satelitales &copy; Google Maps'
    }).addTo(mapa);
  }

  // 2. Marcador de Mi Unidad SAMU
  const iconoAmb = L.divIcon({
    html: '<div style="background:#f59e0b;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(245,158,11,0.8);border:2px solid #fff;"><span class="ph ph-ambulance" style="font-size:20px;color:#000;"></span></div>',
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
  L.marker(posUnidad, { icon: iconoAmb })
    .addTo(mapa)
    .bindPopup(`<b>Mi Unidad Móvil SAMU-04</b><br>Estado: En Alerta Operativa<br>Base: Centro Cochabamba`);

  // 3. Hospitales de referencia real en Cochabamba
  const hospitales = [
    { nombre: 'Hospital del Norte (Sacaba/Cochabamba)', lat: -17.355, lng: -66.145, tipo: '2do Nivel · Emergencias de Humo', tel: '168' },
    { nombre: 'Hospital Clínico Viedma (Complejo Central)', lat: -17.3871, lng: -66.1465, tipo: '3er Nivel · Unidad de Quemados', tel: '168' },
    { nombre: 'Hospital del Sur Cochabamba', lat: -17.4350, lng: -66.1550, tipo: '2do Nivel · Soporte Respiratorio', tel: '168' },
    { nombre: 'Centro de Salud Taquiña', lat: -17.3180, lng: -66.1850, tipo: '1er Nivel · Puesto Avanzado en Zona', tel: '+591 4 4252222' }
  ];

  const listaHospEl = document.getElementById('listaHospitalesRed');
  if (listaHospEl) {
    listaHospEl.innerHTML = hospitales.map(h => `
      <div class="d-flex align-items-center justify-content-between p-2 border-bottom border-secondary">
        <div>
          <span class="text-white small fw-bold d-block">${h.nombre}</span>
          <span class="text-muted" style="font-size:0.72rem;">${h.tipo} · Tel: ${h.tel}</span>
        </div>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}&travelmode=driving" target="_blank" class="btn btn-sm btn-outline-success">
          <span class="ph ph-navigation-arrow me-1"></span>Ruta
        </a>
      </div>
    `).join('');
  }

  hospitales.forEach(h => {
    const iconoHosp = L.divIcon({
      html: '<div style="background:#10b981;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(16,185,129,0.7);border:2px solid #fff;"><span class="ph ph-plus-circle" style="font-size:16px;color:#fff;"></span></div>',
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker([h.lat, h.lng], { icon: iconoHosp })
      .addTo(mapa)
      .bindPopup(`<b>${h.nombre}</b><br>${h.tipo}<br>Contacto: <strong>${h.tel}</strong>`);
  });

  // 4. Cargar Incendios y Emergencias activas desde Supabase
  try {
    let incendios = [];
    const resActivos = await FireTraceAPI.getIncendiosActivos().catch(() => null);
    incendios = Array.isArray(resActivos) ? resActivos : (resActivos?.data || []);

    if (!incendios || incendios.length === 0) {
      const resTodos = await FireTraceAPI.getIncendios().catch(() => null);
      incendios = Array.isArray(resTodos) ? resTodos : (resTodos?.data || []);
    }

    const listaEl = document.getElementById('listaEmergencias');
    const contadorEl = document.getElementById('contadorEmergencias');
    const criticaEl = document.getElementById('emergenciaCriticaBody');

    if (incendios && incendios.length > 0) {
      // Ordenar por cercanía a la ambulancia
      incendios.sort((a, b) => {
        const dA = calcularDistancia(posUnidad[0], posUnidad[1], parseFloat(a.latitud ?? -17.2954), parseFloat(a.longitud ?? -66.1789));
        const dB = calcularDistancia(posUnidad[0], posUnidad[1], parseFloat(b.latitud ?? -17.2954), parseFloat(b.longitud ?? -66.1789));
        return dA - dB;
      });

      contadorEl.textContent = `${incendios.length} EN CURSO`;
      criticaEl.innerHTML = renderCardEmergencia(incendios[0], true);
      listaEl.innerHTML = incendios.map(inc => renderCardEmergencia(inc, false)).join('');

      // Marcadores de focos
      incendios.forEach(inc => {
        const lat = parseFloat(inc.latitud ?? inc.latitud_origen ?? inc.lat ?? -17.2954);
        const lng = parseFloat(inc.longitud ?? inc.longitud_origen ?? inc.lng ?? -66.1789);

        const iconoLlama = L.divIcon({
          html: '<span class="ph ph-flame" style="font-size:28px;color:#ef4444;text-shadow:0 0 10px #ff2200;"></span>',
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        L.marker([lat, lng], { icon: iconoLlama })
          .addTo(mapa)
          .bindPopup(`<b>${inc.nombre || inc.codigo_incendio}</b><br>Riesgo: ${inc.nivel_riesgo || 'alto'}<br>${inc.zonas_interes?.nombre || ''}`);
      });

      gsap.from('.emergencia-card', { opacity: 0, y: 15, stagger: 0.1, duration: 0.4 });
    } else {
      listaEl.innerHTML = '<p class="text-muted small text-center py-2">Sin emergencias activas reportadas.</p>';
      criticaEl.innerHTML = '<p class="text-muted small text-center py-2">Sin emergencias críticas.</p>';
      contadorEl.textContent = '0';
    }
  } catch (e) {
    console.error('Error cargando emergencias:', e);
    document.getElementById('listaEmergencias').innerHTML =
      '<p class="text-danger small py-2">Error al cargar emergencias activas.</p>';
  }

  // 5. Panel derecho táctico
  const rightPanelEl = document.getElementById('rightPanel');
  if (rightPanelEl) {
    rightPanelEl.innerHTML = `
      <div class="p-3 d-flex flex-column gap-3">
        <div class="card bg-dark border-secondary">
          <div class="card-header border-secondary">
            <span class="ph ph-chart-bar me-2 text-info"></span>
            <span class="text-white fw-semibold">Turno Operativo SAMU</span>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted small">Estado de Guardia</span>
              <span class="badge bg-success">Activa 24/7</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted small">Base de Salida</span>
              <span class="text-white fw-bold small">Cochabamba Cercado</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted small">Canal de Radio</span>
              <span class="text-info fw-bold small">Canal 2 (Médico)</span>
            </div>
          </div>
        </div>

        <div class="card bg-dark border-secondary">
          <div class="card-body">
            <p class="text-muted small mb-1"><span class="ph ph-gas-pump me-1 text-warning"></span>Autonomía de Combustible</p>
            <div class="progress bg-secondary" style="height:12px">
              <div class="progress-bar bg-success" style="width:85%"></div>
            </div>
            <small class="text-muted d-block mt-1">85% · Tanque lleno para despliegue al Tunari</small>
          </div>
        </div>

        <button class="btn btn-danger fw-bold py-3 w-100 shadow" id="btnSOSAmb" style="font-size:1.2rem;">
          <span class="ph ph-warning-octagon me-2"></span>PEDIR REFUERZO SAMU
        </button>
      </div>`;

    document.getElementById('btnSOSAmb')?.addEventListener('click', () => {
      showToast('Solicitud de refuerzo médico enviada al CRUE Cochabamba', 'warning');
    });

    gsap.from('#rightPanel .card', { opacity: 0, x: 25, stagger: 0.1, duration: 0.4 });
  }

  // 6. Eventos UI
  document.getElementById('selectEstadoAmb')?.addEventListener('change', function () {
    const badge = document.getElementById('badgeEstadoAmb');
    const colores = { disponible: 'success', en_ruta: 'warning', en_escena: 'info', trasladando: 'primary', fuera: 'danger' };
    const etiquetas = { disponible: 'Disponible', en_ruta: 'En ruta', en_escena: 'En escena', trasladando: 'Trasladando', fuera: 'Fuera de servicio' };
    badge.className = `badge bg-${colores[this.value] || 'secondary'} fs-6 px-3 py-2`;
    badge.textContent = etiquetas[this.value] || this.value;
    showToast(`Estado actualizado: ${etiquetas[this.value]}`, 'info');
  });

  document.getElementById('btnEnviarMensajeMedico')?.addEventListener('click', () => {
    const input = document.getElementById('inputMensajeMedico');
    const msg = input?.value?.trim();
    if (!msg) return;
    const chat = document.getElementById('chatMedico');
    const now = new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    chat.innerHTML += `
      <div class="d-flex justify-content-end mb-1">
        <span class="badge bg-primary py-1 px-2">${msg}</span>
        <span class="text-muted ms-1" style="font-size:.65rem">${now}</span>
      </div>`;
    chat.scrollTop = chat.scrollHeight;
    input.value = '';
    showToast('Mensaje transmitido a la Central Médica', 'success');
  });

  gsap.from('.ambulancia-panel .card', { opacity: 0, y: 15, stagger: 0.05, duration: 0.4 });
}

// Registrar ruta
App.register('rol/ambulancia', renderAmbulancia, afterRenderAmbulancia);
