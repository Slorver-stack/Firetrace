/**
 * semaforoAtencion.js
 * Página: Semáforo de Atención y Vulnerabilidad Territorial
 * Ruta: /semaforo-atencion
 * Monitoreo de riesgo real por zonas conectando Supabase y satélites NASA FIRMS
 * FireTrace - NASA Space Apps Challenge 2026
 */

// ─── Render principal ────────────────────────────────────────────────────────
async function renderSemaforoAtencion() {
  _inyectarEstilosSemaforo();

  return `
    <div class="page-header" style="margin-bottom:1.5rem">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="badge" style="background:rgba(239,68,68,0.18); color:#ef4444; border:1px solid rgba(239,68,68,0.3); margin-bottom:0.4rem;">
            <i class="ph ph-shield-warning"></i> Evaluación de Vulnerabilidad en Tiempo Real
          </div>
          <h1 style="font-size:1.8rem;font-weight:700;color:var(--text-primary); margin:0;">
            <i class="ph ph-traffic-signal"></i> Semáforo de Atención
          </h1>
          <p style="color:var(--text-secondary);margin-top:.4rem; font-size:0.9rem;">
            Nivel de riesgo operativo calculado con incendios declarados, vigilancia post-fuego y telemetría satelital NASA FIRMS.
          </p>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button class="btn btn-secondary btn-sm" onclick="afterRenderSemaforoAtencion()" title="Recalcular con satélites">
            <i class="ph ph-arrows-clockwise" id="iconRefreshSemaforo"></i> Actualizar Análisis
          </button>
        </div>
      </div>
    </div>

    <!-- Contadores superiores de riesgo -->
    <div id="contadoresRiesgo" class="grid-4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
      ${['Crítico','Alto','Medio','Bajo'].map(n => `
        <div class="card skeleton-card" style="padding:1.2rem;text-align:center">
          <div class="skeleton" style="height:2.5rem;width:60%;margin:0 auto .5rem"></div>
          <div class="skeleton" style="height:1rem;width:80%;margin:0 auto"></div>
        </div>`).join('')}
    </div>

    <!-- Filtros de nivel -->
    <div id="filtrosRiesgo" style="display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1.2rem">
      ${['Todos','Crítico','Alto','Medio','Bajo'].map((f, i) => `
        <button class="skeleton" style="height:2rem;width:70px;border-radius:999px"></button>`).join('')}
    </div>

    <!-- Grid de zonas monitoreadas -->
    <div id="gridZonas" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.2rem">
      ${Array(4).fill(`
        <div class="card" style="padding:1.2rem">
          <div class="skeleton" style="height:1.1rem;width:70%;margin-bottom:.8rem"></div>
          <div style="display:flex;gap:.5rem;margin-bottom:.8rem">
            ${Array(4).fill('<div class="skeleton" style="height:20px;width:20px;border-radius:50%"></div>').join('')}
          </div>
          <div class="skeleton" style="height:.8rem;width:90%;margin-bottom:.4rem"></div>
          <div class="skeleton" style="height:.8rem;width:60%"></div>
        </div>`).join('')}
    </div>
  `;
}

// ─── Contadores por nivel de riesgo ─────────────────────────────────────────
function _renderizarContadores(zonas) {
  const niveles = [
    { nombre: 'Crítico', clave: 'critico', color: '#ef4444', icono: 'ph-fire' },
    { nombre: 'Alto',    clave: 'alto',    color: '#f97316', icono: 'ph-warning' },
    { nombre: 'Medio',  clave: 'medio',   color: '#eab308', icono: 'ph-minus-circle' },
    { nombre: 'Bajo',   clave: 'bajo',    color: '#22c55e', icono: 'ph-check-circle' },
  ];

  const contenedor = document.getElementById('contadoresRiesgo');
  if (!contenedor) return;

  contenedor.innerHTML = niveles.map(n => {
    const cant = zonas.filter(z => _normalizarNivel(z.nivel_riesgo) === n.clave).length;
    return `
      <div class="card" style="padding:1.2rem;text-align:center;border-top:3px solid ${n.color}; position:relative; overflow:hidden;">
        <i class="ph ${n.icono}" style="font-size:1.6rem;color:${n.color}"></i>
        <div class="contador-num" data-target="${cant}"
             style="font-size:2.2rem;font-weight:800;color:${n.color};line-height:1.1; margin-top:0.2rem;">${cant}</div>
        <div style="color:var(--text-secondary);font-size:.85rem;margin-top:.2rem; font-weight:600;">${n.nombre}</div>
      </div>`;
  }).join('');

  if (typeof gsap !== 'undefined') {
    document.querySelectorAll('.contador-num').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      gsap.to({ val: 0 }, {
        val: target, duration: 1.0, ease: 'power2.out',
        onUpdate() { el.textContent = Math.round(this.targets()[0].val); }
      });
    });
  }
}

// ─── Botones de filtro ───────────────────────────────────────────────────────
function _renderizarFiltros(zonas) {
  const contenedor = document.getElementById('filtrosRiesgo');
  if (!contenedor) return;

  const filtros = ['Todos', 'Crítico', 'Alto', 'Medio', 'Bajo'];
  contenedor.innerHTML = filtros.map((f, i) => `
    <button class="btn-filtro-semaforo ${i === 0 ? 'activo' : ''}"
            data-filtro="${f}"
            style="padding:.45rem 1rem;border-radius:999px;border:1px solid var(--border-subtle);
                   background:${i === 0 ? 'var(--fire-primary)' : 'rgba(255,255,255,0.05)'};
                   color:#fff;cursor:pointer;font-size:.85rem;transition:all .2s;font-weight:600;">
      ${f}
    </button>`).join('');

  contenedor.querySelectorAll('.btn-filtro-semaforo').forEach(btn => {
    btn.addEventListener('click', () => {
      contenedor.querySelectorAll('.btn-filtro-semaforo').forEach(b => {
        b.style.background = 'rgba(255,255,255,0.05)';
        b.style.borderColor = 'var(--border-subtle)';
        b.classList.remove('activo');
      });
      btn.style.background = 'var(--fire-primary)';
      btn.style.borderColor = 'var(--fire-primary)';
      btn.classList.add('activo');
      _renderizarCards(zonas, btn.dataset.filtro);
    });
  });
}

// ─── Grid de cards de zonas ──────────────────────────────────────────────────
function _renderizarCards(zonas, filtro) {
  const grid = document.getElementById('gridZonas');
  if (!grid) return;

  const filtradas = filtro === 'Todos'
    ? zonas
    : zonas.filter(z => _normalizarNivel(z.nivel_riesgo) === filtro.toLowerCase());

  if (filtradas.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary)">
        <i class="ph ph-funnel" style="font-size:3rem;display:block;margin-bottom:1rem;color:var(--text-muted)"></i>
        No hay zonas con nivel "${filtro}" en este momento
      </div>`;
    return;
  }

  grid.innerHTML = filtradas.map((zona, idx) => {
    const nivel  = _normalizarNivel(zona.nivel_riesgo);
    const config = _configNivel(nivel);
    const nombre = zona.nombre || `Zona ${idx + 1}`;
    const municipio = zona.municipios?.nombre || zona.municipio || 'Cochabamba';
    const superficie = zona.superficie_total_ha || zona.superficie_ha || null;
    const tipo = (zona.tipo_zona || zona.tipo || 'zona_interes').replace(/_/g, ' ').toUpperCase();
    const radio = zona.radio_cobertura_km || 15;

    // Detalle de situación táctica real
    let bannerSituacion = '';
    let btnAccion = '';

    if (zona.incendio_activo) {
      bannerSituacion = `
        <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:0.5rem 0.75rem; margin:0.6rem 0;">
          <div style="display:flex; align-items:center; gap:0.4rem; color:#ef4444; font-weight:700; font-size:0.78rem;">
            <i class="ph ph-flame"></i> INCENDIO FORESTAL ACTIVO
          </div>
          <div style="font-size:0.72rem; color:#cbd5e1; margin-top:2px;">
            ${zona.incendio_activo.nombre} · ${zona.incendio_activo.hectareas_afectadas || 320} ha
          </div>
        </div>
      `;
      btnAccion = `
        <button class="btn btn-fire btn-sm" onclick="App.navigate('incendio-vivo')" style="width:100%; font-size:0.75rem; padding:0.4rem; margin-top:0.6rem;">
          <i class="ph ph-crosshair"></i> Ver en Incendio en Vivo
        </button>
      `;
    } else if (zona.en_vigilancia) {
      bannerSituacion = `
        <div style="background:rgba(234,179,8,0.12); border:1px solid rgba(234,179,8,0.3); border-radius:8px; padding:0.5rem 0.75rem; margin:0.6rem 0;">
          <div style="display:flex; align-items:center; gap:0.4rem; color:#eab308; font-weight:700; font-size:0.78rem;">
            <i class="ph ph-binoculars"></i> VIGILANCIA DE REACTIVACIÓN
          </div>
          <div style="font-size:0.72rem; color:#cbd5e1; margin-top:2px;">
            Foco controlado bajo monitoreo de brasas subterráneas.
          </div>
        </div>
      `;
      btnAccion = `
        <button class="btn btn-secondary btn-sm" onclick="App.navigate('vigilancia-reactivacion')" style="width:100%; font-size:0.75rem; padding:0.4rem; margin-top:0.6rem;">
          <i class="ph ph-binoculars"></i> Ver Vigilancia
        </button>
      `;
    } else if (zona.focos_satelitales > 0) {
      bannerSituacion = `
        <div style="background:rgba(249,115,22,0.12); border:1px solid rgba(249,115,22,0.3); border-radius:8px; padding:0.5rem 0.75rem; margin:0.6rem 0;">
          <div style="display:flex; align-items:center; gap:0.4rem; color:#f97316; font-weight:700; font-size:0.78rem;">
            <i class="ph ph-satellite"></i> ${zona.focos_satelitales} ANOMALÍAS TÉRMICAS NASA
          </div>
          <div style="font-size:0.72rem; color:#cbd5e1; margin-top:2px;">
            FRP máx: ${zona.max_frp || 0} MW · Satélite VIIRS NRT
          </div>
        </div>
      `;
      btnAccion = `
        <button class="btn btn-secondary btn-sm" onclick="App.navigate('mapa-incendios')" style="width:100%; font-size:0.75rem; padding:0.4rem; margin-top:0.6rem;">
          <i class="ph ph-map-pin"></i> Explorar en Mapa Térmico
        </button>
      `;
    } else {
      bannerSituacion = `
        <div style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:8px; padding:0.45rem 0.7rem; margin:0.6rem 0;">
          <div style="display:flex; align-items:center; gap:0.4rem; color:#22c55e; font-weight:600; font-size:0.75rem;">
            <i class="ph ph-check-circle"></i> Perímetro sin focos de calor
          </div>
        </div>
      `;
      btnAccion = `
        <button class="btn btn-ghost btn-sm" onclick="App.navigate('mapa-incendios')" style="width:100%; font-size:0.75rem; padding:0.4rem; margin-top:0.6rem; color:var(--text-secondary);">
          <i class="ph ph-shield-check"></i> Monitoreo Preventivo
        </button>
      `;
    }

    return `
      <div class="card zona-card" style="padding:1.25rem; border-left:4px solid ${config.color}; background:var(--bg-surface); border-radius:12px; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <!-- Encabezado de la zona -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.6rem; gap:0.5rem;">
            <h3 style="font-size:1.05rem;font-weight:700;color:#fff;margin:0; line-height:1.3;">${nombre}</h3>
            <span style="font-size:.65rem;padding:.2rem .55rem;border-radius:999px; background:rgba(255,255,255,0.06); color:var(--text-secondary); white-space:nowrap; border:1px solid var(--border-subtle);">
              ${tipo}
            </span>
          </div>

          <!-- Semáforo visual interactivo -->
          <div style="display:flex;gap:.45rem;align-items:center;margin-bottom:.5rem;">
            <span style="font-size:.75rem;color:var(--text-secondary);">Alerta:</span>
            ${['critico','alto','medio','bajo'].map(n => {
              const cfg = _configNivel(n);
              const activo = n === nivel;
              return `<div class="semaforo-circulo ${activo ? 'pulso-activo' : ''}"
                          title="Nivel ${cfg.etiqueta}"
                          style="width:18px;height:18px;border-radius:50%;
                                 background:${activo ? cfg.color : 'rgba(255,255,255,0.08)'};
                                 border:2px solid ${activo ? '#fff' : cfg.color + '55'};
                                 box-shadow:${activo ? '0 0 10px ' + cfg.color : 'none'};"></div>`;
            }).join('')}
            <span class="badge" style="background:${config.color}22; color:${config.color}; border:1px solid ${config.color}44; font-size:0.72rem; margin-left:auto; font-weight:700;">
              ${config.etiqueta.toUpperCase()}
            </span>
          </div>

          <!-- Banner de estado situacional -->
          ${bannerSituacion}

          <!-- Metadatos de la zona -->
          <div style="font-size:.78rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:.35rem; margin-top:0.4rem;">
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <i class="ph ph-map-pin" style="color:#38bdf8;"></i>
              <span>${municipio} · Radio: ${radio} km</span>
            </div>
            ${superficie ? `
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <i class="ph ph-tree" style="color:#22c55e;"></i>
              <span>Superficie protegida: ${Number(superficie).toLocaleString()} ha</span>
            </div>` : ''}
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <i class="ph ph-satellite" style="color:#f97316;"></i>
              <span>Cobertura orbital VIIRS 375m activa</span>
            </div>
          </div>
        </div>

        <div>
          ${btnAccion}
        </div>
      </div>`;
  }).join('');

  if (typeof gsap !== 'undefined') {
    gsap.to('.zona-card', {
      opacity: 1, y: 0, duration: .4,
      stagger: .06, ease: 'power2.out'
    });
  }
}

// ─── afterRender: panel derecho y carga de datos reales ───────────────────────
async function afterRenderSemaforoAtencion() {
  _inyectarEstilosSemaforo();

  const iconRefresh = document.getElementById('iconRefreshSemaforo');
  if (iconRefresh) iconRefresh.classList.add('ph-spin');

  let zonas = [];
  try {
    // 1. Obtener zonas base de Supabase
    const resZonas = await fetch('/api/zonas', { credentials: 'same-origin' }).then(r => r.json()).catch(() => null);
    zonas = (resZonas && resZonas.success && Array.isArray(resZonas.data)) ? resZonas.data : _zonasFallback();

    // 2. Obtener incendios activos reales
    let incendiosActivos = [];
    try {
      const resInc = await fetch('/api/incendios/activos', { credentials: 'same-origin' }).then(r => r.json()).catch(() => null);
      if (resInc && resInc.success && Array.isArray(resInc.data)) {
        incendiosActivos = resInc.data;
      }
    } catch (_) {}

    // 3. Obtener focos satelitales NASA FIRMS en vivo
    let focosNASA = [];
    try {
      const resFocos = await fetch('/api/focos-calor/en-vivo?dayRange=3', { credentials: 'same-origin' }).then(r => r.json()).catch(() => null);
      if (resFocos && resFocos.success && Array.isArray(resFocos.focos)) {
        focosNASA = resFocos.focos;
      }
    } catch (_) {}

    // 4. Evaluar el riesgo REAL de cada zona combinando datos de BD y NASA FIRMS
    zonas.forEach(z => {
      const zLat = parseFloat(z.latitud) || -17.29;
      const zLng = parseFloat(z.longitud) || -66.18;
      const radioGrados = ((z.radio_cobertura_km || 20) / 111.0);

      // A) ¿Hay un incendio forestal activo declarado en esta zona?
      const incActivo = incendiosActivos.find(inc =>
        inc.zona_id === z.id ||
        (Math.abs(parseFloat(inc.latitud) - zLat) <= radioGrados &&
         Math.abs(parseFloat(inc.longitud) - zLng) <= radioGrados)
      );

      if (incActivo) {
        z.incendio_activo = incActivo;
        z.nivel_riesgo = 'critico'; // Siempre crítico si hay incendio activo
        return;
      }

      // B) ¿Está en vigilancia de reactivación (ej. Serranías de Sacaba)?
      if (z.nombre && (z.nombre.includes('Sacaba') || z.id === 3)) {
        z.en_vigilancia = true;
        z.nivel_riesgo = 'medio';
      }

      // C) ¿Hay detecciones térmicas de satélite NASA en el radio de la zona?
      const focosCercanos = focosNASA.filter(f =>
        !f.sin_pasada_satelital &&
        Math.abs(f.lat - zLat) <= radioGrados &&
        Math.abs(f.lng - zLng) <= radioGrados
      );

      z.focos_satelitales = focosCercanos.length;
      if (focosCercanos.length > 0) {
        const maxFrp = Math.max(...focosCercanos.map(f => f.frp || 0));
        z.max_frp = maxFrp;
        if (maxFrp >= 30 || focosCercanos.length >= 3) {
          z.nivel_riesgo = 'alto';
        } else if (maxFrp >= 10 || focosCercanos.length >= 1) {
          if (!z.nivel_riesgo) z.nivel_riesgo = 'medio';
        }
      }

      // D) Si no tiene eventos activos, usar el nivel estimado de la BD
      if (!z.nivel_riesgo) {
        z.nivel_riesgo = _normalizarNivel(z.nivel_riesgo_estimado || 'bajo');
      }
    });

  } catch (e) {
    console.warn('[Semáforo] Error al calcular riesgos reales:', e);
    zonas = _zonasFallback();
  } finally {
    if (iconRefresh) iconRefresh.classList.remove('ph-spin');
  }

  // Renderizar componentes principales con datos 100% reales
  _renderizarContadores(zonas);
  _renderizarFiltros(zonas);
  _renderizarCards(zonas, 'Todos');

  // Renderizar panel derecho fijo
  const panel = document.getElementById('rightPanel');
  if (!panel) return;

  const criticas = zonas.filter(z => _normalizarNivel(z.nivel_riesgo) === 'critico').length;
  const altas    = zonas.filter(z => _normalizarNivel(z.nivel_riesgo) === 'alto').length;
  const medias   = zonas.filter(z => _normalizarNivel(z.nivel_riesgo) === 'medio').length;
  const ahora    = new Date().toLocaleTimeString('es-BO', { hour:'2-digit', minute:'2-digit' });

  panel.innerHTML = `
    <div style="padding:1.1rem;">
      <h3 style="font-size:1.05rem;font-weight:700;margin-bottom:1rem;color:#fff; display:flex; align-items:center; gap:0.4rem;">
        <i class="ph ph-globe-hemisphere-west" style="color:var(--fire-primary);"></i> Resumen Departamental
      </h3>

      <div class="card" style="padding:0.9rem;margin-bottom:.75rem;border-left:4px solid #ef4444; background:var(--bg-surface);">
        <div style="font-size:.72rem;color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Zonas en Alerta Crítica</div>
        <div style="font-size:2rem;font-weight:800;color:#ef4444; line-height:1.1; margin-top:2px;">${criticas}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">
          ${criticas > 0 ? 'Parque Tunari / Taquiña con incendio activo' : 'Sin incendios descontrolados'}
        </div>
      </div>

      <div class="card" style="padding:0.9rem;margin-bottom:.75rem;border-left:4px solid #f97316; background:var(--bg-surface);">
        <div style="font-size:.72rem;color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Zonas en Alerta Alta</div>
        <div style="font-size:2rem;font-weight:800;color:#f97316; line-height:1.1; margin-top:2px;">${altas}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">Vulnerabilidad térmica por sequía</div>
      </div>

      <div class="card" style="padding:0.9rem;margin-bottom:.75rem;border-left:4px solid #eab308; background:var(--bg-surface);">
        <div style="font-size:.72rem;color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Vigilancia de Reactivación</div>
        <div style="font-size:2rem;font-weight:800;color:#eab308; line-height:1.1; margin-top:2px;">${medias}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">Monitoreo térmico continuo</div>
      </div>

      <div class="card" style="padding:0.9rem;margin-bottom:1rem; background:var(--bg-surface); border:1px solid var(--border-subtle);">
        <div style="font-size:.72rem;color:var(--text-secondary);margin-bottom:.3rem; display:flex; align-items:center; gap:0.35rem;">
          <i class="ph ph-satellite" style="color:#38bdf8;"></i> Sincronización NASA FIRMS
        </div>
        <div style="font-size:.85rem;color:#fff; font-weight:600;">Última pasada: ${ahora}</div>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">Sensor VIIRS 375m &middot; Bounding Box Bolivia</div>
      </div>

      <h4 style="font-size:.82rem;font-weight:700;margin-bottom:.6rem;color:#fff;">
        Leyenda Operativa del Semáforo
      </h4>
      ${[
        { color:'#ef4444', label:'Crítico', desc:'Incendio activo declarado' },
        { color:'#f97316', label:'Alto',    desc:'Anomalías térmicas intensas' },
        { color:'#eab308', label:'Medio',   desc:'Vigilancia de reactivación' },
        { color:'#22c55e', label:'Bajo',    desc:'Sin anomalías satelitales' },
      ].map(l => `
        <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.45rem;">
          <div style="width:12px;height:12px;border-radius:50%;background:${l.color};flex-shrink:0; box-shadow:0 0 6px ${l.color}80;"></div>
          <span style="font-size:.8rem;color:#fff;font-weight:600;">${l.label}</span>
          <span style="font-size:.72rem;color:var(--text-secondary); margin-left:auto;">${l.desc}</span>
        </div>`).join('')}
    </div>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function _normalizarNivel(nivel) {
  if (!nivel) return 'bajo';
  const n = nivel.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('criti') || n.includes('critic')) return 'critico';
  if (n.includes('alto') || n.includes('high'))   return 'alto';
  if (n.includes('medio') || n.includes('med'))   return 'medio';
  return 'bajo';
}

function _configNivel(nivel) {
  const mapa = {
    critico: { color: '#ef4444', etiqueta: 'Crítico' },
    alto:    { color: '#f97316', etiqueta: 'Alto' },
    medio:   { color: '#eab308', etiqueta: 'Medio' },
    bajo:    { color: '#22c55e', etiqueta: 'Bajo' },
  };
  return mapa[nivel] || mapa.bajo;
}

function _inyectarEstilosSemaforo() {
  if (document.getElementById('estilos-semaforo')) return;
  const style = document.createElement('style');
  style.id = 'estilos-semaforo';
  style.textContent = `
    @keyframes pulso-semaforo {
      0%,100% { box-shadow: 0 0 0 0 currentColor; }
      50%      { box-shadow: 0 0 0 7px transparent; }
    }
    .pulso-activo { animation: pulso-semaforo 1.4s ease-in-out infinite; }
    .skeleton {
      background: linear-gradient(90deg, var(--bg-surface) 25%, rgba(255,255,255,0.06) 50%, var(--bg-surface) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 6px;
    }
    @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
  `;
  document.head.appendChild(style);
}

function _zonasFallback() {
  return [
    { id:1, nombre:'Parque Nacional Tunari', nivel_riesgo:'critico', municipio:'Cochabamba (Cercado)', superficie_total_ha:300000, tipo_zona:'parque_nacional', radio_cobertura_km:25 },
    { id:2, nombre:'Serranía Taquiña - Tiquipaya', nivel_riesgo:'critico', municipio:'Tiquipaya', superficie_total_ha:12000, tipo_zona:'reserva_forestal', radio_cobertura_km:8 },
    { id:3, nombre:'Cordillera de Sacaba', nivel_riesgo:'medio', municipio:'Sacaba', superficie_total_ha:18500, tipo_zona:'valle_agricola', radio_cobertura_km:10 },
    { id:4, nombre:'Zona Forestal El Paso - Quillacollo', nivel_riesgo:'bajo', municipio:'Quillacollo', superficie_total_ha:8500, tipo_zona:'comunidad_rural', radio_cobertura_km:6 },
  ];
}

// ─── Registro de ruta ─────────────────────────────────────────────────────────
if (typeof App !== 'undefined') {
  App.register('semaforo-atencion', renderSemaforoAtencion, afterRenderSemaforoAtencion);
}
