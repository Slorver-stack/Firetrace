/**
 * firetracExplica.js
 * Página: FireTrace Explica
 * Ruta: /firetrace-explica
 * Misión, tecnología, equipo y FAQ del proyecto FireTrace
 */

// ─── Render principal ────────────────────────────────────────────────────────
async function renderFiretraceExplica() {
  _inyectarEstilosExplica();

  return `
    <!-- Hero -->
    <div class="firetrace-hero" style="text-align:center;padding:2.5rem 1rem 2rem;margin-bottom:2rem;
         border-radius:12px;background:linear-gradient(135deg,#1a0a00 0%,#3b1000 50%,#1a0a00 100%);
         position:relative;overflow:hidden">
      <div class="sparks-cont" id="sparksCont"></div>
      <i class="ph ph-fire" style="font-size:4rem;color:#f97316;display:block;margin-bottom:.8rem"></i>
      <h1 style="font-size:2.2rem;font-weight:800;color:#fff;margin-bottom:.6rem">
        🔥 FireTrace
      </h1>
      <p style="color:#fed7aa;font-size:1.05rem;max-width:600px;margin:0 auto .8rem">
        Sistema inteligente de monitoreo y respuesta ante incendios forestales en Bolivia —
        apoyado en datos satelitales NASA para proteger la vida, la biodiversidad y las comunidades.
      </p>
      <div style="display:flex;justify-content:center;gap:.6rem;flex-wrap:wrap;margin-top:1rem">
        ${['NASA Space Apps 2026','Bolivia','Código Abierto'].map(b =>
          `<span style="background:rgba(249,115,22,.2);color:#fed7aa;padding:.3rem .8rem;
                        border-radius:999px;font-size:.78rem;border:1px solid #f97316">${b}</span>`
        ).join('')}
      </div>
    </div>

    <!-- Estadísticas animadas -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem">
      ${[
        { id:'st-ha',  target:12400000, label:'Hectáreas protegidas', suf:'ha', color:'#f97316', icono:'ph-tree' },
        { id:'st-zo',  target:47,       label:'Zonas monitoreadas',   suf:'',   color:'#3b82f6', icono:'ph-map-pin' },
        { id:'st-res', target:8,        label:'Min. tiempo de alerta',suf:'min',color:'#22c55e', icono:'ph-clock' },
      ].map(s => `
        <div class="card stat-card" style="padding:1.2rem;text-align:center;border-top:3px solid ${s.color};opacity:0">
          <i class="ph ${s.icono}" style="font-size:1.6rem;color:${s.color}"></i>
          <div id="${s.id}" data-target="${s.target}" data-suf="${s.suf}"
               style="font-size:1.9rem;font-weight:800;color:${s.color};margin:.3rem 0">0</div>
          <div style="font-size:.8rem;color:var(--text-secondary)">${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Cómo funciona -->
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary)">
      <i class="ph ph-flow-arrow"></i> Cómo Funciona FireTrace
    </h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-bottom:2rem">
      ${[
        { paso:1, icono:'ph-satellite', titulo:'Detección',   color:'#3b82f6',
          desc:'Satélites NASA MODIS y VIIRS detectan anomalías térmicas y puntos de calor en tiempo casi real (cada 2-12 hs).' },
        { paso:2, icono:'ph-bell-ringing', titulo:'Alerta',   color:'#f97316',
          desc:'El sistema procesa los datos y notifica automáticamente a equipos de respuesta, municipios y autoridades ambientales.' },
        { paso:3, icono:'ph-fire-truck', titulo:'Respuesta',   color:'#ef4444',
          desc:'Coordinación integrada de bomberos, rescatistas, ambulancias y comunidades indígenas usando el mapa en tiempo real.' },
        { paso:4, icono:'ph-leaf', titulo:'Recuperación',      color:'#22c55e',
          desc:'Monitoreo post-incendio con índices de vegetación (NDVI) para seguir la recuperación del ecosistema y la fauna.' },
      ].map(c => `
        <div class="card paso-card" style="padding:1.3rem;border-top:3px solid ${c.color};opacity:0;position:relative">
          <div style="position:absolute;top:.8rem;right:.8rem;font-size:.7rem;font-weight:800;
               color:${c.color};opacity:.4;font-size:2rem">${c.paso}</div>
          <i class="ph ${c.icono}" style="font-size:2.2rem;color:${c.color};display:block;margin-bottom:.8rem"></i>
          <h3 style="font-size:.95rem;font-weight:700;color:var(--text-primary);margin-bottom:.5rem">${c.titulo}</h3>
          <p style="font-size:.8rem;color:var(--text-secondary);line-height:1.5;margin:0">${c.desc}</p>
        </div>`).join('')}
    </div>

    <!-- Fuentes de datos -->
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary)">
      <i class="ph ph-database"></i> Fuentes de Datos
    </h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:2rem">
      ${[
        { nombre:'NASA FIRMS',        desc:'Fire Information for Resource Management System — puntos de calor globales',           color:'#ef4444', icono:'ph-fire' },
        { nombre:'MODIS Terra/Aqua',  desc:'Imágenes multi-espectrales, temperatura superficial y cobertura de tierra',            color:'#3b82f6', icono:'ph-satellite' },
        { nombre:'VIIRS Suomi NPP',   desc:'Detección de fuego nocturno con resolución de 375m — datos cada 12 horas',            color:'#f97316', icono:'ph-moon' },
        { nombre:'SENAMHI Bolivia',   desc:'Datos meteorológicos: temperatura, viento, humedad y pronóstico regional',             color:'#22c55e', icono:'ph-cloud-sun' },
      ].map(f => `
        <div class="card fuente-card" style="padding:1rem;border-left:3px solid ${f.color};opacity:0">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
            <i class="ph ${f.icono}" style="color:${f.color};font-size:1.3rem"></i>
            <strong style="font-size:.85rem;color:var(--text-primary)">${f.nombre}</strong>
          </div>
          <p style="font-size:.75rem;color:var(--text-secondary);margin:0;line-height:1.4">${f.desc}</p>
        </div>`).join('')}
    </div>

    <!-- Tecnologías -->
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary)">
      <i class="ph ph-code"></i> Tecnologías Utilizadas
    </h2>
    <div style="display:flex;flex-wrap:wrap;gap:.6rem;margin-bottom:2rem">
      ${[
        { nombre:'Node.js',    color:'#22c55e' }, { nombre:'Supabase',   color:'#3ecf8e' },
        { nombre:'Leaflet.js', color:'#00a550' }, { nombre:'Chart.js',   color:'#ff6384' },
        { nombre:'GSAP',       color:'#88ce02' }, { nombre:'NASA FIRMS', color:'#ef4444' },
        { nombre:'MODIS API',  color:'#3b82f6' }, { nombre:'Phosphor Icons', color:'#a855f7' },
      ].map(t => `
        <span style="padding:.35rem .9rem;border-radius:999px;background:${t.color}22;
                     color:${t.color};border:1px solid ${t.color};font-size:.8rem;font-weight:600">
          ${t.nombre}
        </span>`).join('')}
    </div>

    <!-- Equipo -->
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary)">
      <i class="ph ph-users"></i> Equipo FireTrace
    </h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-bottom:2rem">
      ${[
        { nombre:'Valentina Ríos',   rol:'Líder de Proyecto',   avatar:'ph-user-circle', color:'#f97316' },
        { nombre:'Diego Mamani',     rol:'Desarrollador Full Stack', avatar:'ph-user-circle', color:'#3b82f6' },
        { nombre:'Sofía Torrico',    rol:'Análisis de Datos GIS',  avatar:'ph-user-circle', color:'#22c55e' },
        { nombre:'Luis Chávez',      rol:'Diseño UX/UI',           avatar:'ph-user-circle', color:'#a855f7' },
        { nombre:'Ana Condori',      rol:'Ciencias Ambientales',   avatar:'ph-user-circle', color:'#eab308' },
      ].map(m => `
        <div class="card miembro-card" style="padding:1rem;text-align:center;opacity:0">
          <i class="ph ${m.avatar}" style="font-size:3rem;color:${m.color};display:block;margin-bottom:.5rem"></i>
          <div style="font-size:.85rem;font-weight:600;color:var(--text-primary)">${m.nombre}</div>
          <div style="font-size:.72rem;color:var(--text-secondary);margin-top:.2rem">${m.rol}</div>
        </div>`).join('')}
    </div>

    <!-- FAQ Acordeón -->
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary)">
      <i class="ph ph-question"></i> Preguntas Frecuentes
    </h2>
    <div id="faqContenedor" style="margin-bottom:2rem;display:flex;flex-direction:column;gap:.6rem">
      ${[
        { p:'¿Qué es MODIS y cómo detecta incendios?',
          r:'MODIS (Moderate Resolution Imaging Spectroradiometer) es un sensor a bordo de los satélites Terra y Aqua de la NASA. Detecta temperaturas superficiales anómalas usando bandas infrarrojas, identificando "puntos de calor" activos con resolución de 1 km.' },
        { p:'¿Con qué frecuencia se actualiza el mapa de incendios?',
          r:'Los datos MODIS se actualizan cada 12-24 horas; los datos VIIRS cada 2-12 horas. El sistema FireTrace procesa y publica estas actualizaciones automáticamente.' },
        { p:'¿Por qué los incendios son tan devastadores en Bolivia?',
          r:'La combinación de sequía extrema, vientos secos del Chaco, expansión agrícola y quemas para habilitación de tierras crea condiciones ideales para incendios que pueden durar semanas y arrasar millones de hectáreas.' },
        { p:'¿Qué significa el nivel "Crítico" en el semáforo?',
          r:'Nivel Crítico indica incendio activo confirmado o condiciones de riesgo extremo (temperatura >38°C, humedad <15%, viento >40km/h). Requiere respuesta inmediata de brigadas.' },
        { p:'¿Cómo puedo reportar un incendio?',
          r:'Puedes reportarlo al 800-10-4000 (línea gratuita del SERNAP), usar el botón SOS en la aplicación, o contactar a Defensa Civil al 110.' },
        { p:'¿FireTrace reemplaza a los bomberos o equipos de campo?',
          r:'No. FireTrace es una herramienta de apoyo para la toma de decisiones. Los equipos de respuesta en campo siguen siendo esenciales y FireTrace les proporciona información satelital para optimizar su trabajo.' },
      ].map((faq, i) => `
        <div class="card faq-item" data-idx="${i}" style="overflow:hidden;cursor:pointer">
          <div class="faq-preg" style="padding:.9rem 1rem;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:.88rem;font-weight:600;color:var(--text-primary)">${faq.p}</span>
            <i class="ph ph-caret-down faq-icono" style="color:var(--accent-color);transition:.3s;flex-shrink:0;margin-left:.5rem"></i>
          </div>
          <div class="faq-resp" style="max-height:0;overflow:hidden;transition:.35s ease">
            <div style="padding:0 1rem 1rem;font-size:.82rem;color:var(--text-secondary);line-height:1.6">${faq.r}</div>
          </div>
        </div>`).join('')}
    </div>

    <!-- Contacto -->
    <div class="card" style="padding:1.5rem;background:linear-gradient(135deg,#1a0a00,#2d1000);
         border:1px solid #f97316;margin-bottom:1rem">
      <h3 style="font-size:1rem;font-weight:700;color:#fed7aa;margin-bottom:1rem">
        <i class="ph ph-headset"></i> Contacto de Emergencias
      </h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div>
          <div style="font-size:.75rem;color:#fb923c;margin-bottom:.3rem">
            <i class="ph ph-envelope"></i> Email
          </div>
          <div style="font-size:.85rem;color:#fed7aa">emergencias@firetrace.bo</div>
        </div>
        <div>
          <div style="font-size:.75rem;color:#fb923c;margin-bottom:.3rem">
            <i class="ph ph-phone"></i> Coordinación
          </div>
          <div style="font-size:.85rem;color:#fed7aa">+591 3 333-0099</div>
        </div>
      </div>
    </div>
  `;
}

// ─── Animaciones GSAP de entrada ─────────────────────────────────────────────
function _animarEntradaElementos() {
  if (typeof gsap === 'undefined') {
    ['.stat-card', '.paso-card', '.fuente-card', '.miembro-card'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.style.opacity = 1; });
    });
    return;
  }
  gsap.to('.stat-card',    { opacity:1, y:0, duration:.5, stagger:.1, ease:'power2.out', delay:.1 });
  gsap.to('.paso-card',    { opacity:1, y:0, duration:.5, stagger:.1, ease:'back.out(1.4)', delay:.3 });
  gsap.to('.fuente-card',  { opacity:1, x:0, duration:.4, stagger:.08, ease:'power2.out', delay:.5 });
  gsap.to('.miembro-card', { opacity:1, scale:1, duration:.4, stagger:.07, ease:'back.out(1.2)', delay:.6 });

  // Pasos: efecto de entrada con transformación
  gsap.from('.paso-card', { y: 40, duration:.5, stagger:.1, ease:'power2.out', delay:.3 });
}

// ─── Animación contadores ─────────────────────────────────────────────────────
function _animarEstadisticas() {
  setTimeout(() => {
    document.querySelectorAll('[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const suf    = el.dataset.suf || '';
      if (typeof gsap !== 'undefined') {
        gsap.to({ val: 0 }, {
          val: target, duration: 2, ease: 'power2.out',
          onUpdate() {
            const v = Math.round(this.targets()[0].val);
            el.textContent = v >= 10000 ? (v / 1000000).toFixed(1) + 'M' + suf : v + suf;
          }
        });
      } else {
        el.textContent = target >= 10000
          ? (target / 1000000).toFixed(1) + 'M' + suf
          : target + suf;
      }
    });
  }, 400);
}

// ─── FAQ acordeón ────────────────────────────────────────────────────────────
function _inicializarFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      const resp    = item.querySelector('.faq-resp');
      const icono   = item.querySelector('.faq-icono');
      const abierto = resp.style.maxHeight && resp.style.maxHeight !== '0px';

      // Cerrar todos
      document.querySelectorAll('.faq-resp').forEach(r => { r.style.maxHeight = '0'; });
      document.querySelectorAll('.faq-icono').forEach(i => { i.style.transform = 'rotate(0)'; });

      if (!abierto) {
        resp.style.maxHeight = resp.scrollHeight + 'px';
        icono.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// ─── Chispas del hero ─────────────────────────────────────────────────────────
function _generarChispas() {
  const cont = document.getElementById('sparksCont');
  if (!cont) return;
  for (let i = 0; i < 25; i++) {
    const sp = document.createElement('div');
    sp.className = 'chispa';
    sp.style.cssText = `
      left:${Math.random() * 100}%;
      animation-duration:${2 + Math.random() * 4}s;
      animation-delay:${Math.random() * 4}s;
      width:${2 + Math.random() * 4}px;height:${2 + Math.random() * 4}px;
    `;
    cont.appendChild(sp);
  }
}

// ─── afterRender: panel derecho ───────────────────────────────────────────────
function afterRenderFiretraceExplica() {
  // Inicializaciones interactivas de la vista
  _generarChispas();
  _animarEstadisticas();
  _animarEntradaElementos();
  _inicializarFAQ();

  const panel = document.getElementById('rightPanel');
  if (!panel) return;

  panel.innerHTML = `
    <div style="padding:1rem">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary)">
        <i class="ph ph-rocket-launch"></i> Misión NASA Space Apps
      </h3>
      <div class="card" style="padding:1rem;margin-bottom:.8rem;border-left:3px solid #3b82f6">
        <div style="font-size:.75rem;color:var(--text-secondary)">Desafío</div>
        <div style="font-size:.85rem;color:var(--text-primary);margin-top:.2rem;line-height:1.5">
          "Uso de datos abiertos NASA para respuesta a desastres naturales en América Latina"
        </div>
      </div>
      <div class="card" style="padding:1rem;margin-bottom:1rem">
        <div style="font-size:.75rem;color:var(--text-secondary);margin-bottom:.5rem">
          <i class="ph ph-calendar"></i> NASA Space Apps Challenge 2026
        </div>
        <div style="font-size:.8rem;color:var(--text-primary)">Santa Cruz de la Sierra, Bolivia</div>
      </div>

      <h4 style="font-size:.85rem;font-weight:600;margin-bottom:.6rem;color:var(--text-primary)">
        <i class="ph ph-books"></i> Documentación
      </h4>
      ${[
        { label:'NASA FIRMS Docs',    url:'https://firms.modaps.eosdis.nasa.gov/', icono:'ph-file-text' },
        { label:'MODIS Active Fire',  url:'https://modis.gsfc.nasa.gov/',          icono:'ph-satellite' },
        { label:'VIIRS Fire Docs',    url:'https://www.earthdata.nasa.gov/',       icono:'ph-fire' },
        { label:'Leaflet.js Docs',    url:'https://leafletjs.com/reference.html',  icono:'ph-map' },
      ].map(l => `
        <a href="${l.url}" target="_blank" rel="noopener"
           style="display:flex;align-items:center;gap:.5rem;padding:.5rem;border-radius:6px;
                  color:var(--accent-color);font-size:.8rem;text-decoration:none;
                  transition:.2s;margin-bottom:.3rem"
           onmouseover="this.style.background='var(--bg-secondary)'"
           onmouseout="this.style.background='transparent'">
          <i class="ph ${l.icono}"></i>${l.label}
          <i class="ph ph-arrow-square-out" style="margin-left:auto;font-size:.7rem;opacity:.6"></i>
        </a>`).join('')}
    </div>`;
}

// ─── Estilos propios ──────────────────────────────────────────────────────────
function _inyectarEstilosExplica() {
  if (document.getElementById('estilos-explica')) return;
  const style = document.createElement('style');
  style.id = 'estilos-explica';
  style.textContent = `
    .sparks-cont { position:absolute;inset:0;pointer-events:none;overflow:hidden; }
    .chispa {
      position:absolute;bottom:0;border-radius:50%;
      background:radial-gradient(#f97316,#ef4444);
      animation:subir linear infinite;
    }
    @keyframes subir {
      0%   { transform:translateY(0) scale(1); opacity:1; }
      100% { transform:translateY(-250px) scale(0); opacity:0; }
    }
    .faq-resp { transition: max-height .35s ease; }
    .faq-icono { transition: transform .3s ease; }
    .stat-card  { transform: translateY(20px); }
    .fuente-card { transform: translateX(-20px); }
    .miembro-card { transform: scale(0.9); }
  `;
  document.head.appendChild(style);
}

// ─── Registro de ruta ─────────────────────────────────────────────────────────
App.register('firetrace-explica', renderFiretraceExplica, afterRenderFiretraceExplica);
