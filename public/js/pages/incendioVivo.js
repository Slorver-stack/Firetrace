/**
 * FireTrace - Monitor de Incendios Bolivia
 * Vista: Incendio en Vivo (Monitoreo Táctico Espacial)
 * public/js/pages/incendioVivo.js
 */

const IncendioVivoView = {
  mapInstance: null,
  chartEvolucion: null,
  chartMeteo: null,
  incendioData: null,
  ashEffectInstance: null,
  layerGroups: {},
  heatLayer: null,
  vivoViewMode: 'heat', // 'heat' | 'markers' | 'both'
  vivoFocosData: [],
  selectedSource: 'VIIRS_SNPP_NRT',
  selectedDayRange: 3,
  autoRefreshTimer: null,
  currentCarouselIndex: 0,
  carouselImages: [
    {
      url: '/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif',
      caption: 'Satélite VIIRS Banda 7 - Foco térmico en cuenca Taquiña',
      time: 'Hace 18 min'
    },
    {
      url: '/IMG/FONDO%20PAGINA/Incendio%20forestal%20reflejado%20en%20el%20r%C3%ADo.png',
      caption: 'NASA Aqua MODIS 250m - Columna de humo hacia el sudeste',
      time: 'Hace 45 min'
    },
    {
      url: '/IMG/BARRA%20LATERAL/Atardecer%20entre%20monta%C3%B1as%20y%20brasas%20(BARRA%20LATERAL).png',
      caption: 'Observación crepuscular infrarroja - Sector Queñuas',
      time: 'Hace 1h 20 min'
    }
  ],

  async render() {
    return `
      <div class="incendio-vivo-page">
        <!-- 1. HEADER DE LA VISTA -->
        <div class="vivo-header-bar">
          <div class="vivo-header-left">
            <div class="vivo-badge-row">
              <span class="badge badge-live">
                <span class="live-dot"></span> ALERTA EN VIVO
              </span>
              <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4);">
                NIVEL CRÍTICO
              </span>
              <span class="vivo-code" id="incendioCodigo">INC-TUNARI-2026-01</span>
            </div>
            <h1 class="vivo-title" id="incendioNombre">Incendio Parque Nacional Tunari (Sector Taquiña)</h1>
            <p class="vivo-subtitle" id="incendioUbicacion">
              <i class="ph ph-map-pin"></i> Municipio de Cercado / Tiquipaya · Coord: -17.2954, -66.1789
            </p>
          </div>

          <div class="vivo-header-actions">
            <button class="btn btn-secondary" onclick="IncendioVivoView.openGoogleMapsRoute(-17.2954, -66.1789)">
              <i class="ph ph-navigation-arrow"></i> Ver ruta de acceso
            </button>
            <button class="btn btn-fire" onclick="IncendioVivoView.triggerAlertaComunitaria()">
              <i class="ph ph-broadcast"></i> Activar Protocolo SAR
            </button>
          </div>
        </div>

        <!-- 2. TARJETAS DE IMPACTO Y STATUS (CON ASH-ZONE EN ÁREAS AFECTADAS) -->
        <div class="stats-grid" style="margin-top: 1.25rem;">
          <div class="stats-card ash-zone" id="areaAfectadaCard" style="border: 1px solid rgba(239,68,68,0.4); background: linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(16,24,40,0.85) 100%);">
            <div class="stats-card-header">
              <span class="stats-card-title">Área Estimada Afectada</span>
              <div class="stats-card-icon" style="background: rgba(239,68,68,0.2); color: #ef4444;">
                <i class="ph ph-flame"></i>
              </div>
            </div>
            <div class="stats-card-value" id="incendioHectareas" style="color: #ef4444;">320.00 ha</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-trend-up"></i> +45 ha en últimas 2 horas
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Focos Térmicos en Cuenca / Sector</span>
              <div class="stats-card-icon" style="background: rgba(249,115,22,0.15); color: #f97316;">
                <i class="ph ph-broadcast"></i>
              </div>
            </div>
            <div class="stats-card-value" id="incendioFocos" style="color: #f97316;">--</div>
            <div class="stats-card-trend trend-up" id="incendioFocosSub">
              <i class="ph ph-satellite"></i> Detección satelital activa NASA
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Tiempo de Actividad</span>
              <div class="stats-card-icon" style="background: rgba(234,179,8,0.15); color: #eab308;">
                <i class="ph ph-clock"></i>
              </div>
            </div>
            <div class="stats-card-value" id="incendioDuracion">5h 12m</div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-calendar"></i> Detección: 09:30 AM
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Comunidades en Alerta</span>
              <div class="stats-card-icon" style="background: rgba(168,85,247,0.15); color: #c084fc;">
                <i class="ph ph-users-three"></i>
              </div>
            </div>
            <div class="stats-card-value" id="incendioComunidades">420 fam.</div>
            <div class="stats-card-trend trend-up" style="color: #c084fc;">
              <i class="ph ph-shield-warning"></i> Radio de evacuación 3.5 km
            </div>
          </div>
        </div>

        <!-- 3. MAPA PRINCIPAL TÁCTICO CON CONTROLES Y CAPAS -->
        <div class="tactical-map-section" style="margin-top: 1.5rem;">
          <div class="tactical-map-card" style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: 16px; overflow: hidden; position: relative;">
            <div class="map-toolbar" style="padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 0.65rem;">
              <!-- Título y badge de satélite -->
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; color: #fff;">
                  <i class="ph ph-crosshair" style="color: var(--fire-primary);"></i> Mapa Táctico de Operaciones
                </span>
                <span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">
                  Zoom 13 · EPSG:3857
                </span>
                <span class="badge" id="vivoFocosCountBadge" style="background: rgba(239,68,68,0.18); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); display:none;">
                  <i class="ph ph-satellite"></i> <span id="vivoFocosCountText">0</span> focos NASA
                </span>
              </div>

              <!-- Controles -->
              <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                <!-- Modo Visual -->
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">Modo:</span>
                  <div class="btn-group-toggle" style="display:inline-flex; background:rgba(0,0,0,0.3); border-radius:8px; padding:2px;">
                    <button class="btn btn-sm vivo-view-mode active" id="btnVivoModeHeat" onclick="IncendioVivoView.setVivoViewMode('heat')">
                      <i class="ph ph-fire"></i> Calor
                    </button>
                    <button class="btn btn-sm vivo-view-mode" id="btnVivoModeMarkers" onclick="IncendioVivoView.setVivoViewMode('markers')">
                      <i class="ph ph-map-pin"></i> Focos
                    </button>
                    <button class="btn btn-sm vivo-view-mode" id="btnVivoModeBoth" onclick="IncendioVivoView.setVivoViewMode('both')">
                      <i class="ph ph-stack"></i> Ambos
                    </button>
                  </div>
                </div>

                <!-- Enfoques rápidos -->
                <div style="display:flex; align-items:center; gap:0.35rem;">
                  <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">Enfocar:</span>
                  <button class="btn btn-ghost btn-sm" onclick="IncendioVivoView.flyToTunari()" title="Parque Nacional Tunari">
                    <i class="ph ph-tree"></i> Tunari
                  </button>
                  <button class="btn btn-ghost btn-sm" onclick="IncendioVivoView.flyToCochabamba()" title="Cochabamba">
                    <i class="ph ph-crosshair"></i> Cbba
                  </button>
                  <button class="btn btn-ghost btn-sm" onclick="IncendioVivoView.flyToBolivia()" title="Todo Bolivia">
                    <i class="ph ph-globe-hemisphere-west"></i> Bolivia
                  </button>
                </div>

                <!-- Capas adicionales -->
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <label style="display:flex; align-items:center; gap:0.3rem; cursor:pointer; font-size:0.78rem; color:var(--text-secondary);">
                    <input type="checkbox" id="chkRecursos" checked onchange="IncendioVivoView.toggleLayer('recursos', this.checked)">
                    <span style="color:#38bdf8;">Recursos</span>
                  </label>
                  <label style="display:flex; align-items:center; gap:0.3rem; cursor:pointer; font-size:0.78rem; color:var(--text-secondary);">
                    <input type="checkbox" id="chkRutas" checked onchange="IncendioVivoView.toggleLayer('rutas', this.checked)">
                    <span style="color:#a3e635;">Rutas</span>
                  </label>
                </div>

                <!-- Selector Sensor & Rango NASA -->
                <div style="display:flex; align-items:center; gap:0.3rem;">
                  <select id="selVivoSensor" onchange="IncendioVivoView.onSensorChange(this.value)"
                          style="font-size:0.73rem; padding:0.25rem 0.45rem; background:rgba(0,0,0,0.35); color:#fff; border:1px solid var(--border-subtle); border-radius:6px; cursor:pointer;">
                    <option value="VIIRS_SNPP_NRT" selected>🛰️ VIIRS Suomi (375m)</option>
                    <option value="VIIRS_NOAA20_NRT">🛰️ VIIRS NOAA-20 (375m)</option>
                    <option value="MODIS_NRT">🛰️ MODIS Aqua/Terra (1km)</option>
                  </select>
                  <select id="selVivoDayRange" onchange="IncendioVivoView.onDayRangeChange(this.value)"
                          style="font-size:0.73rem; padding:0.25rem 0.45rem; background:rgba(0,0,0,0.35); color:#fff; border:1px solid var(--border-subtle); border-radius:6px; cursor:pointer;">
                    <option value="1">⏱️ 24h</option>
                    <option value="2">⏱️ 48h</option>
                    <option value="3" selected>⏱️ 3 días</option>
                    <option value="5">⏱️ 5 días</option>
                    <option value="7">⏱️ 7 días</option>
                  </select>
                </div>

                <!-- Sincronizar NASA + Fullscreen -->
                <button class="btn btn-fire btn-sm" id="btnVivoSyncNASA" onclick="IncendioVivoView.loadNASAHeatmap(true)" title="Forzar sincronización con satélites NASA FIRMS">
                  <i class="ph ph-arrows-clockwise" id="vivoIconRefresh"></i> Sincronizar NASA
                </button>
                <button class="btn btn-secondary btn-sm" onclick="IncendioVivoView.toggleFullScreenMap()">
                  <i class="ph ph-arrows-out"></i> Pantalla Completa
                </button>
              </div>
            </div>

            <!-- Contenedor del Mapa Leaflet -->
            <div id="mapaIncendioVivo" style="height: 640px; width: 100%;"></div>

            <!-- Overlay de carga -->
            <div id="vivoMapLoadingOverlay" style="display:none; position:absolute; top:16px; left:50%; transform:translateX(-50%); z-index:999; background:rgba(15,23,42,0.9); padding:0.5rem 1rem; border-radius:20px; border:1px solid #f97316; color:#fed7aa; font-size:0.78rem; align-items:center; gap:0.5rem; box-shadow:0 4px 20px rgba(0,0,0,0.6);">
              <i class="ph ph-spinner ph-spin" style="color:#f97316;"></i> Sincronizando con satélites NASA FIRMS...
            </div>

            <!-- Leyenda térmica FRP NASA -->
            <div class="map-legend-overlay" style="position: absolute; bottom: 1.25rem; left: 1.25rem; z-index: 1000; background: rgba(10,15,29,0.88); backdrop-filter: blur(12px); border: 1px solid var(--border-light); border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.75rem; display: flex; flex-direction: column; gap: 0.45rem; min-width: 200px;">
              <span style="font-weight: 700; color: #fff; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.25rem; display:flex; align-items:center; gap:0.35rem;">
                <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 6px #ef4444;"></span>
                Intensidad Térmica FRP (MW)
              </span>
              <div style="height: 7px; border-radius: 3px; background: linear-gradient(90deg, #22c55e 0%, #eab308 30%, #f97316 65%, #ef4444 85%, #7f1d1d 100%); margin: 2px 0;"></div>
              <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--text-muted);">
                <span>&lt; 10 MW</span>
                <span>25 MW</span>
                <span>50 MW</span>
                <span style="color:#ef4444;">&gt; 60 MW</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.2rem; border-top: 1px solid var(--border-subtle); padding-top: 0.35rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: #c0392b; box-shadow: 0 0 6px #c0392b;"></span>
                  <span>Foco Activo Principal</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: #38bdf8;"></span>
                  <span>Punto de Agua / Hidratación</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e;"></span>
                  <span>Punto de Encuentro Seguro</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 12px; height: 3px; background: #ef4444;"></span>
                  <span>Vía Bloqueada por Fuego</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. PANEL DE 3 GRÁFICOS: EVOLUCIÓN, SATÉLITE EN TIEMPO REAL, VISIÓN EN VIVO -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-top: 1.5rem;">
          <!-- GRÁFICO 1: EVOLUCIÓN DEL INCENDIO -->
          <div class="chart-container" style="height: 380px;">
            <div class="chart-header">
              <span class="chart-title"><i class="ph ph-chart-line-up"></i> Evolución del Incendio</span>
              <span class="badge" style="background: rgba(255,255,255,0.06); font-size: 0.7rem;">Últimas 6 horas</span>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="chartEvolucionCanvas"></canvas>
            </div>
          </div>

          <!-- GRÁFICO 2: IMÁGENES SATELITALES EN TIEMPO REAL (CARROUSEL) -->
          <div class="chart-container" style="height: 380px; display: flex; flex-direction: column;">
            <div class="chart-header">
              <span class="chart-title"><i class="ph ph-planet"></i> Teledetección Orbital</span>
              <div style="display: flex; gap: 0.35rem;">
                <button class="btn btn-secondary btn-sm" onclick="IncendioVivoView.prevCarouselImage()" style="padding: 0.2rem 0.5rem;">
                  <i class="ph ph-caret-left"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="IncendioVivoView.nextCarouselImage()" style="padding: 0.2rem 0.5rem;">
                  <i class="ph ph-caret-right"></i>
                </button>
              </div>
            </div>
            <div id="satelliteCarouselContainer" style="flex: 1; border-radius: 10px; overflow: hidden; position: relative; background: #000;">
              <img id="satelliteImageEl" src="${this.carouselImages[0].url}" alt="Imagen Satelital" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;">
              <div style="position: absolute; bottom: 0; inset-inline: 0; background: linear-gradient(0deg, rgba(5,8,15,0.95) 0%, transparent 100%); padding: 1rem;">
                <span class="badge badge-live" style="font-size: 0.65rem;" id="carouselTime">${this.carouselImages[0].time}</span>
                <p id="carouselCaption" style="font-size: 0.8rem; color: #f8fafc; margin-top: 0.3rem; font-weight: 600;">
                  ${this.carouselImages[0].caption}
                </p>
              </div>
            </div>
          </div>

          <!-- GRÁFICO 3: CÁMARAS Y OBSERVACIÓN EN VIVO (VIDEO PLACEHOLDER / SIMULADOR) -->
          <div class="chart-container" style="height: 380px; display: flex; flex-direction: column;">
            <div class="chart-header">
              <span class="chart-title"><i class="ph ph-video-camera"></i> Cámaras y Observación Térmica</span>
              <span class="badge badge-live"><span class="live-dot"></span> FEED DIRECTO</span>
            </div>
            <div class="live-camera-feed" style="flex: 1; border-radius: 10px; position: relative; overflow: hidden; background: #05080f; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: 0; background-image: radial-gradient(circle at 70% 30%, rgba(239,68,68,0.4) 0%, transparent 60%), linear-gradient(180deg, rgba(16,24,40,0.4) 0%, rgba(5,8,15,0.9) 100%), url('/IMG/FONDO%20PAGINA/Valle%20monta%C3%B1oso%20al%20atardecer.png'); background-size: cover; background-position: center; filter: contrast(1.3) hue-rotate(-10deg);"></div>
              
              <!-- Retícula HUD de cámara térmica -->
              <div style="position: absolute; inset: 0; pointer-events: none; border: 1px dashed rgba(255,255,255,0.15); margin: 12px;">
                <div style="position: absolute; top: 8px; left: 8px; font-family: monospace; font-size: 0.7rem; color: #22c55e;">
                  ● CAM-TUNARI-02 [IR 10.8µm]
                </div>
                <div style="position: absolute; top: 8px; right: 8px; font-family: monospace; font-size: 0.7rem; color: #ef4444; font-weight: 700;">
                  MAX: 354.2 K (81.0°C)
                </div>
                <div style="position: absolute; bottom: 8px; left: 8px; font-family: monospace; font-size: 0.65rem; color: var(--text-muted);">
                  COORD: 17°17'43"S 66°10'44"W · ELEV: 3120m
                </div>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; border: 1px solid rgba(239,68,68,0.6); border-radius: 50%;">
                  <div style="position: absolute; top: 50%; left: -8px; right: -8px; height: 1px; background: rgba(239,68,68,0.6);"></div>
                  <div style="position: absolute; left: 50%; top: -8px; bottom: -8px; width: 1px; background: rgba(239,68,68,0.6);"></div>
                </div>
              </div>

              <div style="position: relative; z-index: 5; text-align: center;">
                <div style="display: inline-block; padding: 0.4rem 0.8rem; background: rgba(5,8,15,0.75); border-radius: 8px; border: 1px solid var(--border-light); font-size: 0.75rem; color: var(--text-secondary);">
                  <i class="ph ph-broadcast"></i> Torre de Vigilancia Taquiña Alta · Streaming Óptico
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. GRID METEOROLOGÍA, RECURSOS HÍDRICOS Y VOLUNTARIOS -->
        <div class="dashboard-grid-2col" style="margin-top: 1.5rem;">
          <!-- COLUMNA IZQUIERDA: METEOROLOGÍA Y RECURSOS DE AGUA -->
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <!-- METEOROLOGÍA -->
            <div class="weather-card" style="padding: 1.5rem;">
              <div class="card-header-flex">
                <span class="card-section-title"><i class="ph ph-cloud-sun"></i> Condiciones Meteorológicas en la Zona</span>
                <span class="badge" style="background: rgba(249,115,22,0.15); color: #f97316;">
                  Riesgo Propagación ALTO
                </span>
              </div>
              <div class="weather-grid" style="grid-template-columns: repeat(4, 1fr); margin-top: 1rem;">
                <div class="weather-item">
                  <span class="weather-label">Temperatura</span>
                  <span class="weather-val" id="meteoTemp" style="color: #ef4444;">
                    <i class="ph ph-thermometer-hot"></i> 32.0 °C
                  </span>
                </div>
                <div class="weather-item">
                  <span class="weather-label">Humedad Relativa</span>
                  <span class="weather-val" id="meteoHumedad" style="color: #38bdf8;">
                    <i class="ph ph-drop"></i> 35.0 %
                  </span>
                </div>
                <div class="weather-item">
                  <span class="weather-label">Velocidad Viento</span>
                  <span class="weather-val" id="meteoViento" style="color: #f97316;">
                    <i class="ph ph-wind"></i> 12 km/h (NO)
                  </span>
                </div>
                <div class="weather-item">
                  <span class="weather-label">Tendencia 6h</span>
                  <span class="weather-val" style="color: #eab308;">
                    <i class="ph ph-arrows-clockwise"></i> Seco / Ráfagas
                  </span>
                </div>
              </div>
              <div style="margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.8rem; color: #cbd5e1; border-left: 3px solid #f97316;">
                <strong>Pronóstico operativo:</strong> Incremento de ráfagas hacia las 17:00 con picos de 22 km/h. Probabilidad de lluvia 0%. Humedad descenderá a 28%.
              </div>
            </div>

            <!-- RECURSOS DE AGUA E INFRAESTRUCTURA CERCANA -->
            <div class="side-card" style="padding: 1.5rem;">
              <div class="card-header-flex">
                <span class="card-section-title"><i class="ph ph-drop-half-bottom"></i> Fuentes de Agua e Infraestructura Táctica</span>
                <span class="badge" style="background: rgba(56,189,248,0.15); color: #38bdf8;">Radio 5 km</span>
              </div>
              <div id="recursosContainer" style="display: flex; flex-direction: column; gap: 0.65rem; margin-top: 1rem;">
                <!-- Dinámico -->
              </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA: VOLUNTARIOS DISPONIBLES Y ACCIONES RECOMENDADAS -->
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <!-- ACCIONES RECOMENDADAS -->
            <div class="side-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(20,30,48,0.8) 0%, rgba(10,15,29,0.95) 100%); border: 1px solid rgba(255,77,46,0.3);">
              <span class="card-section-title" style="color: var(--fire-secondary);">
                <i class="ph ph-check-square"></i> Acciones Tácticas Inmediatas
              </span>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Protocolo estandarizado de respuesta rápida para el cuadrante Tunari Norte.
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1rem;">
                <button class="action-btn" onclick="IncendioVivoView.ejecutarAccion('bomberos')">
                  <i class="ph ph-siren"></i>
                  <div>
                    <div style="font-weight: 700;">Notificar Bomberos y SAR</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Confirmar cuadrillas de primera intervención</div>
                  </div>
                </button>
                <button class="action-btn" onclick="IncendioVivoView.ejecutarAccion('voluntarios')">
                  <i class="ph ph-users"></i>
                  <div>
                    <div style="font-weight: 700;">Activar Voluntarios Habilitados</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Asignar puntos de encuentro y tareas de apoyo</div>
                  </div>
                </button>
                <button class="action-btn" onclick="IncendioVivoView.ejecutarAccion('comunidades')">
                  <i class="ph ph-megaphone"></i>
                  <div>
                    <div style="font-weight: 700;">Coordinar con Comunidades</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Alertar comités de riego y juntas vecinales</div>
                  </div>
                </button>
                <button class="action-btn" onclick="IncendioVivoView.ejecutarAccion('agua')">
                  <i class="ph ph-waves"></i>
                  <div>
                    <div style="font-weight: 700;">Verificar Reservas de Agua</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Monitorear caudal en Laguna Taquiña y tomas</div>
                  </div>
                </button>
              </div>
            </div>

            <!-- VOLUNTARIOS CERCANOS -->
            <div class="side-card" style="padding: 1.5rem;">
              <div class="card-header-flex">
                <span class="card-section-title"><i class="ph ph-person-simple-walk"></i> Voluntarios en Proximidad</span>
                <span class="badge" style="background: rgba(34,197,94,0.15); color: #22c55e;">GPS Activo</span>
              </div>
              <div id="voluntariosContainer" style="display: flex; flex-direction: column; gap: 0.65rem; margin-top: 1rem;">
                <!-- Dinámico -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    // 1. Cargar datos del incendio en vivo
    try {
      const res = await window.FireTraceAPI.get('/incendios/vivo');
      this.incendioData = res?.data || res;
    } catch (err) {
      console.warn('[IncendioVivoView] Usando datos de respaldo:', err);
      this.incendioData = this.getFallbackIncendio();
    }

    if (!this.incendioData) {
      this.incendioData = this.getFallbackIncendio();
    }

    // 2. Poblar datos en header y tarjetas
    this.updateHeaderAndStats(this.incendioData);

    // 3. Inicializar el Mapa Leaflet
    this.initMap(this.incendioData);

    // 4. Inicializar Gráfico de Evolución
    await this.initEvolucionChart(this.incendioData);

    // 5. Cargar Recursos Cercanos y Voluntarios
    this.renderRecursosCercanos(this.incendioData.recursos_cercanos || []);
    this.renderVoluntariosCercanos();

    // 6. Configurar el RightPanel con información de situación
    this.populateRightPanel(this.incendioData);

    // 7. Efecto de cenizas en tarjeta de hectáreas
    const ashEl = document.getElementById('areaAfectadaCard');
    if (ashEl && typeof AshEffect !== 'undefined') {
      this.ashEffectInstance = new AshEffect(ashEl, { count: 16 });
      this.ashEffectInstance.init();
    }

    // 8. Suscripción en tiempo real
    if (window.FireTraceAPI && typeof window.FireTraceAPI.subscribeToIncendios === 'function') {
      window.FireTraceAPI.subscribeToIncendios(payload => {
        if (payload.new && payload.new.id === this.incendioData?.id) {
          showToast('Actualización satelital recibida para este incendio', 'fire');
          this.incendioData.hectareas_afectadas = payload.new.hectareas_afectadas;
          this.updateHeaderAndStats(this.incendioData);
        }
      });
    }

    // 9. Actualización periódica en tiempo real con satélites NASA (cada 60s)
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
    this.autoRefreshTimer = setInterval(() => {
      if (document.getElementById('mapaIncendioVivo')) {
        this.loadNASAHeatmap(false);
      } else {
        clearInterval(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
      }
    }, 60000);
  },

  updateHeaderAndStats(inc) {
    if (!inc) return;
    const codEl = document.getElementById('incendioCodigo');
    const nomEl = document.getElementById('incendioNombre');
    const ubiEl = document.getElementById('incendioUbicacion');
    const haEl = document.getElementById('incendioHectareas');

    if (codEl) codEl.textContent = inc.codigo_incendio || 'INC-TUNARI-2026-01';
    if (nomEl) nomEl.textContent = inc.nombre || 'Incendio Parque Nacional Tunari';
    if (ubiEl) ubiEl.innerHTML = `<i class="ph ph-map-pin"></i> ${inc.zonas_interes?.nombre || 'Parque Nacional Tunari'} · Coord: ${inc.latitud}, ${inc.longitud}`;
    if (haEl) haEl.textContent = `${Number(inc.hectareas_afectadas || 320).toLocaleString()} ha`;
  },

  initMap(incendio) {
    const mapEl = document.getElementById('mapaIncendioVivo');
    if (!mapEl || typeof L === 'undefined') return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    const lat = parseFloat(incendio.latitud) || -17.2954;
    const lng = parseFloat(incendio.longitud) || -66.1789;

    this.mapInstance = L.map('mapaIncendioVivo', {
      zoomControl: true,
      attributionControl: false
    }).setView([lat, lng], 13);

    // Capas agrupadas
    this.layerGroups.heat = L.layerGroup().addTo(this.mapInstance);
    this.layerGroups.focos = L.layerGroup().addTo(this.mapInstance);
    this.layerGroups.recursos = L.layerGroup().addTo(this.mapInstance);
    this.layerGroups.rutas = L.layerGroup().addTo(this.mapInstance);

    // Capa base Google Maps Satélite Híbrido en tiempo real
    if (window.MapHelper) {
      window.MapHelper.getGoogleHybrid().addTo(this.mapInstance);
      window.MapHelper.addLayerSwitcher(this.mapInstance, {
        "Mapa de Calor NASA": this.layerGroups.heat,
        "Focos de Calor VIIRS": this.layerGroups.focos,
        "Recursos de Agua": this.layerGroups.recursos,
        "Rutas Tácticas": this.layerGroups.rutas
      });
    } else {
      L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Imágenes Satelitales &copy; Google Maps'
      }).addTo(this.mapInstance);
    }

    // 1. Foco Activo Principal (Flame pulsante) — datos actualizados en tiempo real
    const flameIconHtml = `
      <div class="custom-fire-marker marker-extremo" style="width: 44px; height: 44px;">
        <div class="marker-inner" style="background: radial-gradient(circle, #fff 0%, #ff4d2e 60%, #991b1b 100%);">
          <i class="ph ph-flame" style="font-size: 24px;"></i>
        </div>
      </div>
    `;

    const mainFlameIcon = L.divIcon({
      html: flameIconHtml,
      className: 'leaflet-pulsing-fire',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    // Popup con contenido que se actualiza al cargarse datos reales de la API
    this._mainMarker = L.marker([lat, lng], { icon: mainFlameIcon }).addTo(this.layerGroups.focos);
    this._mainMarker.bindPopup(this._buildMainMarkerPopup({
      satelite: 'Cargando telemetría...',
      temperatura_k: '—',
      temperatura_c: '—',
      frp: '—',
      confianza: '—',
      hora: '—',
      fuente: 'NASA FIRMS',
      sin_pasada_satelital: true
    }), { maxWidth: 320 });

    // Actualizar el popup con datos reales tras cargar el heatmap
    this._mainMarkerLat = lat;
    this._mainMarkerLng = lng;

    // 2. Recursos cercanos (desde la API o fallback real)
    const recursos = incendio.recursos_cercanos || [
      { nombre: 'Laguna Tunari', tipo_recurso: 'fuente_agua', latitud: -17.2790, longitud: -66.1950, distancia_km: 2.3 },
      { nombre: 'Base Operativa SAR Cochabamba', tipo_recurso: 'estacion_bomberos_sar', latitud: -17.3620, longitud: -66.1700, distancia_km: 4.5 },
      { nombre: 'Punto de Encuentro Cruce Taquiña', tipo_recurso: 'punto_encuentro', latitud: -17.3100, longitud: -66.1850, distancia_km: 2.1 }
    ];

    recursos.forEach(rec => {
      const rLat = parseFloat(rec.latitud);
      const rLng = parseFloat(rec.longitud);
      if (isNaN(rLat) || isNaN(rLng)) return;

      let iconClass = 'ph-drop';
      let bgColor = '#38bdf8';

      if (rec.tipo_recurso === 'estacion_bomberos_sar') {
        iconClass = 'ph-shield';
        bgColor = '#ef4444';
      } else if (rec.tipo_recurso === 'punto_encuentro') {
        iconClass = 'ph-flag-banner';
        bgColor = '#22c55e';
      } else if (rec.tipo_recurso === 'centro_salud') {
        iconClass = 'ph-first-aid';
        bgColor = '#ec4899';
      }

      const recIcon = L.divIcon({
        html: `
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${bgColor}; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${bgColor}80; border: 2px solid #fff;">
            <i class="ph ${iconClass}" style="font-size: 16px;"></i>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([rLat, rLng], { icon: recIcon })
        .addTo(this.layerGroups.recursos)
        .bindPopup(`
          <div class="map-popup">
            <span style="font-weight:700; color:#fff;">${rec.nombre}</span>
            <span style="font-size:0.75rem; color:${bgColor}; font-weight:600;">${rec.tipo_recurso.replace('_', ' ').toUpperCase()}</span>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.3rem;">
              Distancia al fuego: <strong>${rec.distancia_km} km</strong><br>
              Estado: ${rec.disponibilidad_real || 'Operativo'}
            </p>
          </div>
        `);
    });

    // 4. Rutas de acceso reales
    const rutas = [
      {
        nombre: 'Avenida Ecológica a Cruce Taquiña (Despejada)',
        coords: [[-17.3500, -66.1600], [-17.3300, -66.1750], [-17.3100, -66.1850]],
        color: '#22c55e'
      },
      {
        nombre: 'Sendero Queñuas (Bloqueado por fuego)',
        coords: [[-17.3100, -66.1850], [-17.3000, -66.1820], [-17.2954, -66.1789]],
        color: '#ef4444',
        dashArray: '6, 6'
      }
    ];

    rutas.forEach(rt => {
      L.polyline(rt.coords, {
        color: rt.color,
        weight: 4,
        opacity: 0.85,
        dashArray: rt.dashArray || null
      }).addTo(this.layerGroups.rutas).bindPopup(`
        <div style="padding: 0.35rem; font-size: 0.8rem; color: #fff;">
          <strong>${rt.nombre}</strong>
        </div>
      `);
    });

    setTimeout(() => {
      if (this.mapInstance) this.mapInstance.invalidateSize();
    }, 300);

    // 5. Cargar mapa de calor NASA FIRMS en tiempo real
    this.loadNASAHeatmap(false);
  },

  /**
   * Carga / refresca la capa de mapa de calor NASA FIRMS sobre el mapa táctico.
   * Llama a /api/focos-calor/en-vivo para obtener los puntos heatmap reales y los
   * marcadores satelitales individuales (modo 'markers' / 'both').
   * @param {boolean} forceRefresh Forzar nueva consulta a la API NASA
   */
  async loadNASAHeatmap(forceRefresh = false) {
    if (!this.mapInstance) return;

    const loader = document.getElementById('vivoMapLoadingOverlay');
    const iconRefresh = document.getElementById('vivoIconRefresh');
    if (loader) loader.style.display = 'flex';
    if (iconRefresh) iconRefresh.classList.add('ph-spin');

    try {
      // 1. Cargar focos en vivo + heatmap points con el sensor y rango seleccionado
      const source = this.selectedSource || 'VIIRS_SNPP_NRT';
      const dayRange = this.selectedDayRange || 3;
      const url = `/api/focos-calor/en-vivo?source=${source}&dayRange=${dayRange}&forceRefresh=${forceRefresh}`;
      const res = await fetch(url, { credentials: 'same-origin' });
      const data = await res.json();

      if (data && data.success) {
        this.vivoFocosData = data.focos || [];
        const heatmapPoints = data.heatmapPoints || [];
        const stats = data.stats || {};

        // Calcular focos vinculados al sector del incendio (~40 km alrededor del fuego)
        const latInc = parseFloat(this.incendioData?.latitud) || -17.2954;
        const lngInc = parseFloat(this.incendioData?.longitud) || -66.1789;
        const radioGrados = 0.40; // ~44 km

        const focosSector = (this.vivoFocosData || []).filter(f =>
          Math.abs(parseFloat(f.lat || f.latitud) - latInc) <= radioGrados &&
          Math.abs(parseFloat(f.lng || f.longitud) - lngInc) <= radioGrados
        );

        const countSector = focosSector.length;
        const totalBolivia = stats.total_focos_detectados || this.vivoFocosData.length;

        // Actualizar badge de focos en la barra del mapa táctico
        const badge = document.getElementById('vivoFocosCountBadge');
        const countText = document.getElementById('vivoFocosCountText');
        if (badge && countText) {
          countText.textContent = `${countSector} en cuenca (${totalBolivia.toLocaleString()} en Bolivia)`;
          badge.style.display = 'inline-flex';
        }

        // Renderizar heatmap en capa heat
        this._renderVivoHeatmap(heatmapPoints);

        // Renderizar marcadores satelitales en modo markers/both
        this._renderVivoSatMarkers(this.vivoFocosData);

        // Aplicar modo visual actual
        this.setVivoViewMode(this.vivoViewMode);

        // 2. Actualizar el popup del marcador principal con el foco más intenso real
        await this._actualizarPopupPrincipal(forceRefresh);

        // 3. Actualizar telemetría en las tarjetas de stats superiores
        const focoEl = document.getElementById('incendioFocos');
        const focoSubEl = document.getElementById('incendioFocosSub');
        if (focoEl) {
          focoEl.textContent = countSector;
        }
        if (focoSubEl) {
          focoSubEl.innerHTML = `<i class="ph ph-satellite"></i> ${countSector} activos en sector &middot; ${totalBolivia.toLocaleString()} nacional`;
        }

        if (forceRefresh && window.App?.toast) {
          App.toast(`✅ NASA FIRMS sincronizado · ${countSector} en sector Tunari · ${totalBolivia.toLocaleString()} en Bolivia`, 'success', 4000);
        }

      } else {
        console.warn('[IncendioVivo] NASA FIRMS sin datos:', data?.error);
        if (data?.error === 'No autorizado') {
          console.warn('[IncendioVivo] Sesión expirada — redirigir a login');
        }
      }
    } catch (err) {
      console.warn('[IncendioVivo] Error cargando heatmap NASA:', err);
    } finally {
      if (loader) loader.style.display = 'none';
      if (iconRefresh) iconRefresh.classList.remove('ph-spin');
    }
  },

  /**
   * Consulta /api/focos-calor/principal y actualiza el popup del marcador principal
   * con los datos reales del satélite más cercano al incendio.
   */
  async _actualizarPopupPrincipal(forceRefresh = false) {
    if (!this._mainMarker || this._mainMarkerLat === undefined) return;
    try {
      // Radio 2.5 grados (~275km) para encontrar siempre el foco real más intenso de la región
      const url = `/api/focos-calor/principal?lat=${this._mainMarkerLat}&lng=${this._mainMarkerLng}&radio=2.5&forceRefresh=${forceRefresh}`;
      const res = await fetch(url, { credentials: 'same-origin' });
      const data = await res.json();
      if (data && data.success && data.foco) {
        this._mainMarker.setPopupContent(this._buildMainMarkerPopup(data.foco));
      }
    } catch (e) {
      // Silencioso — el popup seguirá mostrando los últimos datos conocidos
    }
  },

  /**
   * Construye el HTML del popup del marcador principal con datos reales del satélite.
   * @param {Object} foco Foco satelital de NASA FIRMS
   */
  _buildMainMarkerPopup(foco) {
    const tempK = foco.temperatura_k !== '—' ? `${foco.temperatura_k} K` : '— K';
    const tempC = foco.temperatura_c !== '—' ? `(${foco.temperatura_c} °C)` : '';
    const frp   = foco.frp !== '—' ? `${foco.frp} MW` : '— MW';
    const conf  = foco.confianza || '—';
    const hora  = foco.hora || '—';
    const fuente = foco.fuente || 'NASA FIRMS';
    const sat   = foco.satelite || '—';
    const region = foco.region || '';
    const esFallback = foco.sin_pasada_satelital;
    const frpNum = parseFloat(foco.frp) || 0;
    const frpColor = frpNum >= 60 ? '#ef4444' : frpNum >= 25 ? '#f97316' : '#eab308';

    return `
      <div class="map-popup" style="min-width:295px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <span style="font-weight:800;color:#ef4444;font-size:0.85rem;">
            <i class="ph ph-flame"></i> FOCO PRINCIPAL · NASA FIRMS
          </span>
          <span style="font-size:0.65rem;padding:2px 7px;border-radius:10px;font-weight:700;
            background:${esFallback ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)'};
            color:${esFallback ? '#eab308' : '#22c55e'};
            border:1px solid ${esFallback ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'};">
            ${esFallback ? '⚠ Sin pasada reciente' : '● EN VIVO'}
          </span>
        </div>
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:0.5rem 0.65rem;margin-bottom:0.45rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);">Potencia Radiativa (FRP)</span>
            <strong style="font-size:1.15rem;color:${frpColor};">${frp}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.72rem;color:var(--text-muted);">Temperatura de Brillo</span>
            <strong style="color:#ef4444;font-size:0.9rem;">${tempK} ${tempC}</strong>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.22rem;font-size:0.78rem;color:#fff;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted);">Satélite</span>
            <span style="text-align:right;max-width:175px;">${sat}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted);">Confianza</span>
            <span>${conf}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted);">Detección (UTC)</span>
            <span>${hora}</span>
          </div>
          ${region ? `<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Región</span><span>${region}</span></div>` : ''}
        </div>
        <div style="margin-top:0.45rem;padding:0.28rem 0.5rem;background:rgba(15,23,42,0.6);border-radius:6px;border:1px solid rgba(255,255,255,0.07);">
          <span style="font-size:0.67rem;color:var(--text-muted);">📡 ${fuente} · MAP KEY: ab247d…311f</span>
        </div>
        <button onclick="IncendioVivoView.loadNASAHeatmap(true)"
          style="width:100%;margin-top:0.5rem;padding:0.35rem;background:rgba(249,115,22,0.15);
          border:1px solid rgba(249,115,22,0.35);border-radius:6px;color:#f97316;font-size:0.73rem;
          cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:0.3rem;">
          <i class="ph ph-arrows-clockwise"></i> Sincronizar con NASA FIRMS
        </button>
      </div>
    `;
  },

  _renderVivoHeatmap(points) {
    if (!this.mapInstance) return;

    // Limpiar heatLayer anterior
    if (this.heatLayer) {
      this.mapInstance.removeLayer(this.heatLayer);
      this.heatLayer = null;
    }

    if (!points || !points.length) return;

    if (window.MapHelper && typeof window.MapHelper.createHeatmapLayer === 'function') {
      this.heatLayer = window.MapHelper.createHeatmapLayer(points, { radius: 30, blur: 20, minOpacity: 0.38 });
    } else if (typeof L.heatLayer === 'function') {
      this.heatLayer = L.heatLayer(points, {
        radius: 30, blur: 20, maxZoom: 17, minOpacity: 0.38,
        gradient: { 0.15: '#22c55e', 0.35: '#eab308', 0.60: '#f97316', 0.85: '#ef4444', 1.00: '#991b1b' }
      });
    }

    if (this.heatLayer) {
      this.heatLayer.addTo(this.layerGroups.heat);
    }
  },

  _renderVivoSatMarkers(focos) {
    if (!this.layerGroups.focos) return;

    // Quitar solo los marcadores satelitales (no el marcador principal — que tiene clase leaflet-pulsing-fire)
    // Usamos un sub-layerGroup para los sat markers
    if (this.layerGroups.satMarkers) {
      this.layerGroups.satMarkers.clearLayers();
    } else {
      this.layerGroups.satMarkers = L.layerGroup().addTo(this.layerGroups.focos);
    }

    const topFocos = (focos || []).slice(0, 120);

    topFocos.forEach(f => {
      const fLat = parseFloat(f.lat || f.latitud);
      const fLng = parseFloat(f.lng || f.longitud);
      if (isNaN(fLat) || isNaN(fLng)) return;

      const frp = parseFloat(f.frp || 0);
      const color = f.riesgo_color || (frp >= 60 ? '#ef4444' : frp >= 30 ? '#f97316' : frp >= 15 ? '#eab308' : '#22c55e');
      const size = (f.es_incendio_declarado || frp >= 60) ? 16 : 10;

      const icon = L.divIcon({
        html: `<div style="width:${size}px; height:${size}px; border-radius:50%; background:${color}; border:2px solid #fff; box-shadow:0 0 ${size}px ${color}80;"></div>`,
        className: 'vivo-sat-dot',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      L.marker([fLat, fLng], { icon })
        .addTo(this.layerGroups.satMarkers)
        .bindPopup(`
          <div style="font-size:0.8rem; color:#fff; min-width:190px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
              <span class="badge" style="background:${color}22; color:${color}; font-size:0.7rem; border:1px solid ${color}44;">${f.riesgo_label || 'Detección NASA'}</span>
              <span style="font-size:0.7rem; color:var(--text-muted);">${f.hora || ''}</span>
            </div>
            <strong>${f.nombre_incendio || f.region || 'Foco Satélite'}</strong>
            <div style="background:rgba(255,255,255,0.05); padding:0.4rem; border-radius:6px; margin-top:0.35rem;">
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted); font-size:0.72rem;">FRP:</span>
                <strong style="color:#ef4444;">${frp} MW</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted); font-size:0.72rem;">Confianza:</span>
                <span>${f.confianza || '--'}%</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted); font-size:0.72rem;">Sensor:</span>
                <span>${f.satelite || 'VIIRS'}</span>
              </div>
            </div>
          </div>
        `);
    });
  },

  setVivoViewMode(mode) {
    this.vivoViewMode = mode;

    // Actualizar clases de botones activos
    document.querySelectorAll('.vivo-view-mode').forEach(b => b.classList.remove('active'));
    if (mode === 'heat') document.getElementById('btnVivoModeHeat')?.classList.add('active');
    else if (mode === 'markers') document.getElementById('btnVivoModeMarkers')?.classList.add('active');
    else document.getElementById('btnVivoModeBoth')?.classList.add('active');

    if (!this.mapInstance) return;

    // Mostrar / ocultar capa de calor
    if (this.heatLayer) {
      if (mode === 'markers') {
        this.mapInstance.removeLayer(this.heatLayer);
      } else {
        if (!this.mapInstance.hasLayer(this.heatLayer)) {
          this.heatLayer.addTo(this.layerGroups.heat);
        }
      }
    }

    // Mostrar / ocultar marcadores satelitales NASA
    if (this.layerGroups.satMarkers) {
      if (mode === 'heat') {
        this.layerGroups.focos.removeLayer(this.layerGroups.satMarkers);
      } else {
        if (!this.layerGroups.focos.hasLayer(this.layerGroups.satMarkers)) {
          this.layerGroups.satMarkers.addTo(this.layerGroups.focos);
        }
      }
    }
  },

  flyToTunari() {
    if (!this.mapInstance) return;
    this.mapInstance.flyTo([-17.2954, -66.1789], 12, { duration: 1.5 });
  },

  flyToCochabamba() {
    if (!this.mapInstance) return;
    this.mapInstance.flyTo([-17.3895, -66.1568], 10, { duration: 1.5 });
  },

  flyToBolivia() {
    if (!this.mapInstance) return;
    this.mapInstance.flyTo([-16.5, -64.5], 6, { duration: 1.8 });
  },

  onSensorChange(source) {
    this.selectedSource = source;
    this.loadNASAHeatmap(true);
  },

  onDayRangeChange(range) {
    this.selectedDayRange = parseInt(range, 10) || 3;
    this.loadNASAHeatmap(true);
  },

  toggleLayer(layerName, isVisible) {
    if (!this.mapInstance || !this.layerGroups[layerName]) return;
    if (isVisible) {
      this.mapInstance.addLayer(this.layerGroups[layerName]);
    } else {
      this.mapInstance.removeLayer(this.layerGroups[layerName]);
    }
  },

  toggleFullScreenMap() {
    const card = document.querySelector('.tactical-map-card');
    if (!card) return;
    if (!document.fullscreenElement) {
      card.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  },

  async initEvolucionChart(incendio) {
    const canvas = document.getElementById('chartEvolucionCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.chartEvolucion) {
      this.chartEvolucion.destroy();
      this.chartEvolucion = null;
    }

    let evolData = [];
    try {
      const res = await window.FireTraceAPI.get(`/incendios/${incendio.id || 1}/evolucion`);
      evolData = res?.data || res || [];
    } catch {
      evolData = [];
    }

    if (!evolData.length) {
      evolData = [
        { hora: '09:30', ha: 35, focos: 3, riesgo: 2 },
        { hora: '11:00', ha: 110, focos: 7, riesgo: 3 },
        { hora: '12:30', ha: 220, focos: 12, riesgo: 3 },
        { hora: '14:32', ha: 320, focos: 15, riesgo: 4 }
      ];
    }

    const labels = evolData.map(d => d.hora || d.fecha_hora_registro?.slice(11, 16) || 'H');
    const dataHa = evolData.map(d => parseFloat(d.hectareas_acumuladas || d.ha || 0));
    const dataFocos = evolData.map(d => parseInt(d.focos_calor_detectados || d.focos || 0));
    const dataRiesgo = evolData.map(d => {
      if (typeof d.riesgo === 'number') return d.riesgo;
      const map = { 'bajo': 1, 'medio': 2, 'alto': 3, 'critico': 4 };
      return map[d.nivel_riesgo_momento] || 3;
    });

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';

    this.chartEvolucion = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Área Afectada (ha)',
            data: dataHa,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: 'Focos de Calor',
            data: dataFocos,
            borderColor: '#f97316',
            backgroundColor: 'transparent',
            borderDash: [4, 4],
            tension: 0.25,
            yAxisID: 'y1'
          },
          {
            label: 'Nivel Riesgo (1-4)',
            data: dataRiesgo,
            borderColor: '#eab308',
            backgroundColor: 'transparent',
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 10 } }
          }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Hectáreas', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Focos / Nivel', font: { size: 10 } }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  },

  nextCarouselImage() {
    this.currentCarouselIndex = (this.currentCarouselIndex + 1) % this.carouselImages.length;
    this.updateCarouselView();
  },

  prevCarouselImage() {
    this.currentCarouselIndex = (this.currentCarouselIndex - 1 + this.carouselImages.length) % this.carouselImages.length;
    this.updateCarouselView();
  },

  updateCarouselView() {
    const item = this.carouselImages[this.currentCarouselIndex];
    const imgEl = document.getElementById('satelliteImageEl');
    const capEl = document.getElementById('carouselCaption');
    const timeEl = document.getElementById('carouselTime');

    if (imgEl) imgEl.src = item.url;
    if (capEl) capEl.textContent = item.caption;
    if (timeEl) timeEl.textContent = item.time;
  },

  renderRecursosCercanos(recursos = []) {
    const container = document.getElementById('recursosContainer');
    if (!container) return;

    if (!recursos.length) {
      recursos = [
        { nombre: 'Laguna Tunari (Embalse principal)', tipo: 'fuente_agua', dist: '2.30 km', estado: 'Operativo para Cisternas', icono: 'ph-drop' },
        { nombre: 'Comunidad Taquiña Norte (420 familias)', tipo: 'comunidad', dist: '3.80 km', estado: 'Evacuación Preventiva', icono: 'ph-users-three' },
        { nombre: 'Base Operativa SAR Cochabamba', tipo: 'estacion_bomberos_sar', dist: '4.50 km', estado: '25 rescatistas en alerta', icono: 'ph-shield' },
        { nombre: 'Hospital del Norte (Sacaba)', tipo: 'centro_salud', dist: '5.20 km', estado: '12 camas traumatología disponibles', icono: 'ph-first-aid' }
      ];
    }

    container.innerHTML = recursos.map(rec => {
      const nombre = rec.nombre;
      const dist = rec.distancia_km ? `${rec.distancia_km} km` : (rec.dist || '3.0 km');
      const subtipo = rec.detalles_capacidad || rec.estado || 'Disponible';
      const icono = rec.tipo_recurso === 'fuente_agua' || rec.tipo === 'fuente_agua' ? 'ph-drop' : 'ph-buildings';

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(56,189,248,0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">
              <i class="ph ${icono}"></i>
            </div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #fff;">${nombre}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${subtipo}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.825rem; font-weight: 700; color: var(--fire-amber);">${dist}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderVoluntariosCercanos() {
    const container = document.getElementById('voluntariosContainer');
    if (!container) return;

    const voluntarios = [
      { nombre: 'Elena Rocha (Vol. Habilitada)', dist: '2.8 km', estado: 'En camino al Punto Taquiña', tel: '+591 72298765' },
      { nombre: 'Marcos Quiroga (Brigadista SAR)', dist: '3.4 km', estado: 'Disponible en Base', tel: '+591 70711223' },
      { nombre: 'Comité de Riego Taquiña', dist: '1.9 km', estado: 'Organizando cuadrilla', tel: '+591 79700011' }
    ];

    container.innerHTML = voluntarios.map(vol => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: rgba(34,197,94,0.15); color: #22c55e; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            <i class="ph ph-user"></i>
          </div>
          <div>
            <div style="font-size: 0.85rem; font-weight: 700; color: #fff;">${vol.nombre}</div>
            <div style="font-size: 0.72rem; color: #86efac;">${vol.estado}</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #22c55e;">${vol.dist}</span>
          <a href="tel:${vol.tel}" style="font-size: 0.7rem; color: var(--text-secondary); text-decoration: none;">
            <i class="ph ph-phone"></i> Contactar
          </a>
        </div>
      </div>
    `).join('');
  },

  populateRightPanel(incendio) {
    const rightPanel = document.getElementById('rightPanel');
    if (!rightPanel) return;

    rightPanel.innerHTML = `
      <div class="panel-section-title">
        <i class="ph ph-warning-octagon"></i> Situación Táctica Crítica
      </div>

      <div class="alert-card-critical" onclick="App.navigate('incendio-vivo')">
        <div class="alert-card-header">
          <span class="alert-card-title"><i class="ph ph-flame"></i> ALERTA CRÍTICA</span>
          <span class="badge badge-live"><span class="live-dot"></span> EN VIVO</span>
        </div>
        <p style="font-size: 0.8rem; color: #fecaca; line-height: 1.4;">
          Propagación violenta en pendiente escarpada. Se solicita no aproximarse a menos de 2 km sin equipo autónomo de respiración.
        </p>
        <div class="alert-card-meta">
          <span>Área activa: 320 ha</span>
          <span>Riesgo inmediato: Sector Taquiña</span>
        </div>
      </div>

      <div class="panel-section-title" style="margin-top: 1rem;">
        <i class="ph ph-cloud"></i> Condiciones del Momento
      </div>

      <div class="side-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Índice de Combustible</span>
          <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444;">EXTREMO</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Vegetación</span>
          <span style="font-size: 0.8rem; font-weight: 600; color: #fff;">Pajonal seco / Queñua</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Pendiente media</span>
          <span style="font-size: 0.8rem; font-weight: 600; color: #fff;">38° (Muy escarpado)</span>
        </div>
      </div>

      <div class="panel-section-title" style="margin-top: 1rem;">
        <i class="ph ph-quotes"></i> Reflexión Operativa
      </div>

      <div class="side-card" style="border-left: 3px solid var(--fire-secondary);">
        <p style="font-size: 0.8rem; font-style: italic; color: #cbd5e1; line-height: 1.45;">
          "El Parque Tunari es el pulmón hídrico de Cochabamba. Protegerlo hoy es asegurar el agua para las próximas generaciones."
        </p>
        <span style="font-size: 0.72rem; color: var(--fire-secondary); margin-top: 0.4rem; display: block;">
          — Cuerpo de Bomberos y Guardaparques
        </span>
      </div>
    `;
  },

  openGoogleMapsRoute(lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  },

  triggerAlertaComunitaria() {
    showToast('Protocolo SAR activado: Alertas enviadas a cuadrillas y comités vecinales', 'fire', 6000);
  },

  ejecutarAccion(tipo) {
    const msgs = {
      'bomberos': 'Cuartel Central SAR y Bomberos de la Policía notificados con coordenadas exactas.',
      'voluntarios': 'Convocatoria emitida a 8 voluntarios habilitados en el radio de 5 km.',
      'comunidades': 'Canal de radio y WhatsApp activado con dirigentes de Taquiña y Tiquipaya.',
      'agua': 'Telemetría confirmada: Laguna Tunari disponible con 45,000L operativos para cisternas.'
    };
    showToast(msgs[tipo] || 'Acción táctica procesada con éxito.', 'success', 5000);
  },

  getFallbackIncendio() {
    return {
      id: 1,
      codigo_incendio: 'INC-TUNARI-2026-01',
      nombre: 'Incendio Parque Nacional Tunari (Sector Taquiña)',
      latitud: -17.2954,
      longitud: -66.1789,
      hectareas_afectadas: 320.0,
      nivel_riesgo: 'critico',
      estado: 'activo',
      zonas_interes: { nombre: 'Parque Nacional Tunari' }
    };
  }
};

// Registro en el Router SPA
if (typeof App !== 'undefined') {
  App.register('incendio-vivo', () => IncendioVivoView.render(), () => IncendioVivoView.afterRender());
}
