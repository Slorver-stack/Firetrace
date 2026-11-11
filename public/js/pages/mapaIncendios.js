/**
 * mapaIncendios.js
 * Página: Mapa de Incendios · Dashboard de Monitoreo, Vigilancia y Prevención
 * Conexión en Tiempo Real con NASA FIRMS (VIIRS / MODIS) y Supabase
 * 
 * Cumple con la Sección 4.2 del documento de especificaciones:
 * - Módulo 1: Incendios Activos y Focos de Calor Satelitales (Heatmap)
 * - Módulo 2: Vigilancia de Reactivaciones
 * - Módulo 3: Posibles Incendios y Detección Temprana
 * 
 * FireTrace - NASA Space Apps Challenge 2026
 */

(function () {
  'use strict';

  const MapaIncendiosView = {
    map: null,
    heatLayer: null,
    markersLayer: null,
    incendiosLayer: null,
    recursosLayer: null,
    currentSubmodule: 'activos', // 'activos' | 'vigilancia' | 'posibles'
    viewMode: 'heat', // 'heat' | 'markers' | 'both'
    selectedSource: 'VIIRS_SNPP_NRT',
    selectedDayRange: 3,
    focosData: [],
    statsData: null,
    isLoading: false,

    async render() {
      return `
        <div class="mapa-dashboard-wrapper">
          
          <!-- 1. HEADER Y SELECTOR DE LOS 3 SUBMÓDULOS (PDF 4.2.1) -->
          <div class="mapa-header-panel">
            <div class="mapa-title-row">
              <div>
                <div class="badge" style="background: rgba(239,68,68,0.18); color: #ef4444; border: 1px solid rgba(239,68,68,0.35); margin-bottom: 0.35rem;">
                  <i class="ph ph-planet"></i> Telemetría Satelital Orbital · NASA FIRMS NRT
                </div>
                <h1 style="font-family: var(--font-display); font-size: 1.65rem; font-weight: 800; color: #fff; margin: 0;">
                  Mapa de Incendios y Anomalías Térmicas
                </h1>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.25rem 0 0;">
                  Detección orbital en tiempo casi real mediante instrumentos VIIRS (375m) y MODIS (1km) sobre Bolivia.
                </p>
              </div>

              <!-- Selector de los 3 Submódulos -->
              <div class="submodule-tabs" id="submoduleTabs" style="display:flex; gap:0.4rem; background:rgba(255,255,255,0.04); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle);">
                <button class="submodule-btn active" data-sub="activos" onclick="MapaIncendiosView.setSubmodule('activos')">
                  <i class="ph ph-flame"></i> Incendios Activos
                </button>
                <button class="submodule-btn" data-sub="vigilancia" onclick="MapaIncendiosView.setSubmodule('vigilancia')">
                  <i class="ph ph-binoculars"></i> Vigilancia Reactivaciones
                </button>
                <button class="submodule-btn" data-sub="posibles" onclick="MapaIncendiosView.setSubmodule('posibles')">
                  <i class="ph ph-shield-warning"></i> Posibles Incendios
                </button>
              </div>
            </div>

            <!-- 2. TELEMETRÍA HUD SUPERIOR (KPIS EN VIVO DE LA NASA) -->
            <div class="stats-grid" id="hudStatsGrid" style="margin-top: 1rem; grid-template-columns: repeat(4, 1fr);">
              <div class="stats-card" style="padding: 0.85rem 1rem; border-left: 3px solid #ef4444;">
                <div class="stats-card-header">
                  <span class="stats-card-title">Focos Satelitales Activos</span>
                  <div class="stats-card-icon" style="background: rgba(239,68,68,0.18); color: #ef4444; width:30px; height:30px;">
                    <i class="ph ph-satellite"></i>
                  </div>
                </div>
                <div class="stats-card-value" id="hudTotalFocos" style="font-size: 1.6rem; color: #ef4444;">
                  <i class="ph ph-spinner ph-spin" style="font-size:1.2rem;"></i>
                </div>
                <div class="stats-card-trend trend-neutral" id="hudSatSource" style="font-size: 0.72rem;">
                  Sensor VIIRS 375m NRT
                </div>
              </div>

              <div class="stats-card" style="padding: 0.85rem 1rem; border-left: 3px solid #f97316;">
                <div class="stats-card-header">
                  <span class="stats-card-title">Focos Parque Tunari / Cbba</span>
                  <div class="stats-card-icon" style="background: rgba(249,115,22,0.18); color: #f97316; width:30px; height:30px;">
                    <i class="ph ph-tree"></i>
                  </div>
                </div>
                <div class="stats-card-value" id="hudFocosTunari" style="font-size: 1.6rem; color: #f97316;">--</div>
                <div class="stats-card-trend trend-up" style="font-size: 0.72rem;">
                  <i class="ph ph-warning"></i> Cuenca Taquiña prioritaria
                </div>
              </div>

              <div class="stats-card" style="padding: 0.85rem 1rem; border-left: 3px solid #eab308;">
                <div class="stats-card-header">
                  <span class="stats-card-title">Potencia Radiativa Máx (FRP)</span>
                  <div class="stats-card-icon" style="background: rgba(234,179,8,0.18); color: #eab308; width:30px; height:30px;">
                    <i class="ph ph-lightning"></i>
                  </div>
                </div>
                <div class="stats-card-value" id="hudMaxFrp" style="font-size: 1.6rem; color: #eab308;">-- MW</div>
                <div class="stats-card-trend trend-neutral" style="font-size: 0.72rem;">
                  Energía térmica emitida
                </div>
              </div>

              <div class="stats-card" style="padding: 0.85rem 1rem; border-left: 3px solid #38bdf8;">
                <div class="stats-card-header">
                  <span class="stats-card-title">Última Pasada Orbital</span>
                  <div class="stats-card-icon" style="background: rgba(56,189,248,0.18); color: #38bdf8; width:30px; height:30px;">
                    <i class="ph ph-clock"></i>
                  </div>
                </div>
                <div class="stats-card-value" id="hudUltimaPasada" style="font-size: 1.6rem; color: #38bdf8;">--</div>
                <div class="stats-card-trend trend-neutral" id="hudCacheStatus" style="font-size: 0.72rem;">
                  Caché NRT actualizada
                </div>
              </div>
            </div>
          </div>

          <!-- 3. BARRA DE HERRAMIENTAS Y CONTROLES DEL MAPA -->
          <div class="mapa-controls-toolbar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem; margin: 1rem 0; background:rgba(20,28,45,0.7); padding:0.65rem 1rem; border-radius:10px; border:1px solid var(--border-subtle);">
            
            <!-- Grupo 1: Selector de Capa Térmica -->
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Modo Visual:</span>
              <div class="btn-group-toggle" style="display:inline-flex; background:rgba(0,0,0,0.3); border-radius:8px; padding:2px;">
                <button class="btn btn-sm btn-view-mode active" id="btnModeHeat" onclick="MapaIncendiosView.setViewMode('heat')">
                  <i class="ph ph-fire"></i> Mapa de Calor
                </button>
                <button class="btn btn-sm btn-view-mode" id="btnModeMarkers" onclick="MapaIncendiosView.setViewMode('markers')">
                  <i class="ph ph-map-pin"></i> Marcadores
                </button>
                <button class="btn btn-sm btn-view-mode" id="btnModeBoth" onclick="MapaIncendiosView.setViewMode('both')">
                  <i class="ph ph-stack"></i> Ambos
                </button>
              </div>
            </div>

            <!-- Grupo 2: Enfoque Geográfico Rápido -->
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Enfocar:</span>
              <button class="btn btn-ghost btn-sm" onclick="MapaIncendiosView.flyToTunari()" title="Centrar en Parque Nacional Tunari y Taquiña">
                <i class="ph ph-tree"></i> Parque Tunari
              </button>
              <button class="btn btn-ghost btn-sm" onclick="MapaIncendiosView.flyToCochabamba()" title="Centrar en departamento de Cochabamba">
                <i class="ph ph-crosshair"></i> Cochabamba
              </button>
              <button class="btn btn-ghost btn-sm" onclick="MapaIncendiosView.flyToBolivia()" title="Vista general de Bolivia">
                <i class="ph ph-globe-hemisphere-west"></i> Todo Bolivia
              </button>
            </div>

            <!-- Grupo 3: Filtro de Satélite y Actualizar -->
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <select id="selSensorFirms" class="ft-select" style="font-size:0.78rem; padding:0.35rem 0.65rem;" onchange="MapaIncendiosView.onSensorChange(this.value)">
                <option value="VIIRS_SNPP_NRT" selected>🛰️ Suomi NPP VIIRS (375m)</option>
                <option value="VIIRS_NOAA20_NRT">🛰️ NOAA-20 VIIRS (375m)</option>
                <option value="MODIS_NRT">🛰️ NASA Aqua/Terra MODIS (1km)</option>
              </select>

              <button class="btn btn-fire btn-sm" id="btnRefreshFirms" onclick="MapaIncendiosView.refreshData(true)" title="Forzar sincronización directa con satélites NASA">
                <i class="ph ph-arrows-clockwise" id="iconRefresh"></i> Actualizar NASA
              </button>
            </div>
          </div>

          <!-- 4. CONTENEDOR PRINCIPAL DEL MAPA Y PANEL LATERAL (GRID) -->
          <div class="mapa-viewport-grid" style="display:grid; grid-template-columns: 1fr 340px; gap: 1rem; height: calc(100vh - 210px); min-height: 640px;">
            
            <!-- Columna Izquierda: Mapa Leaflet Interactivo -->
            <div class="mapa-canvas-card" style="position:relative; border-radius:12px; overflow:hidden; border:1px solid var(--border-subtle); background:#0c121e;">
              
              <!-- Mapa Leaflet -->
              <div id="leafletMapaIncendios" style="width:100%; height:100%; z-index:1;"></div>

              <!-- Overlay: Leyenda Térmica Flotante -->
              <div class="mapa-floating-legend" style="position:absolute; bottom:16px; left:16px; z-index:999; background:rgba(10,16,28,0.88); backdrop-filter:blur(8px); padding:0.65rem 0.9rem; border-radius:10px; border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; color:#fff; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
                <div style="font-weight:700; margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; box-shadow:0 0 6px #ef4444;"></span>
                  Intensidad Térmica FRP (MW)
                </div>
                <div style="display:flex; height:6px; width:190px; border-radius:3px; overflow:hidden; margin-bottom:0.3rem; background:linear-gradient(90deg, #22c55e 0%, #eab308 30%, #f97316 65%, #ef4444 85%, #7f1d1d 100%);"></div>
                <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--text-muted);">
                  <span>&lt; 10 MW</span>
                  <span>30 MW</span>
                  <span>&gt; 60 MW Crítico</span>
                </div>
              </div>

              <!-- Overlay: Indicador de Carga Flotante -->
              <div id="mapaLoadingOverlay" style="display:none; position:absolute; top:16px; left:50%; transform:translateX(-50%); z-index:999; background:rgba(15,23,42,0.9); padding:0.5rem 1rem; border-radius:20px; border:1px solid #f97316; color:#fed7aa; font-size:0.78rem; display:flex; align-items:center; gap:0.5rem; box-shadow:0 4px 20px rgba(0,0,0,0.6);">
                <i class="ph ph-spinner ph-spin" style="color:#f97316;"></i> Sincronizando con satélites NASA...
              </div>
            </div>

            <!-- Columna Derecha: Panel Táctico de Focos e Incidentes -->
            <div class="mapa-sidebar-card" style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:12px; display:flex; flex-direction:column; overflow:hidden;">
              
              <!-- Pestaña Header del Panel Lateral -->
              <div style="padding:0.9rem 1rem; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="font-size:0.95rem; font-weight:700; color:#fff; margin:0;">
                    <i class="ph ph-fire-simple" style="color:#f97316;"></i> Focos de Mayor Intensidad
                  </h3>
                  <span style="font-size:0.72rem; color:var(--text-secondary);" id="sidebarFocosSubtitle">Top detecciones satelitales</span>
                </div>
                <span class="badge" id="badgeTotalLista" style="background:rgba(239,68,68,0.2); color:#ef4444; font-size:0.72rem;">0</span>
              </div>

              <!-- Lista scrolleable de focos -->
              <div class="mapa-focos-list" id="mapaFocosList" style="flex:1; overflow-y:auto; padding:0.75rem; display:flex; flex-direction:column; gap:0.6rem;">
                <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.8rem;">
                  <i class="ph ph-spinner ph-spin" style="font-size:1.5rem; color:#f97316; margin-bottom:0.5rem; display:block;"></i>
                  Cargando telemetría satelital...
                </div>
              </div>

              <!-- Footer del Panel: Acciones Tácticas -->
              <div style="padding:0.75rem 1rem; border-top:1px solid var(--border-subtle); background:rgba(0,0,0,0.2);">
                <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center;" onclick="MapaIncendiosView.irAIncendioVivo()">
                  <i class="ph ph-flame"></i> Abrir Modo Incendio en Vivo
                </button>
              </div>

            </div>

          </div>

        </div>
      `;
    },

    async afterRender() {
      _inyectarEstilosMapaIncendios();
      await this.initMap();
      await this.loadFirmsData();
    },

    async initMap() {
      const container = document.getElementById('leafletMapaIncendios');
      if (!container || typeof L === 'undefined') return;

      // Centrado por defecto en Cochabamba / Parque Tunari
      this.map = L.map('leafletMapaIncendios', {
        center: [-17.3895, -66.1568],
        zoom: 10,
        zoomControl: true,
        attributionControl: true
      });

      // Añadir capas base de Google Maps vía MapHelper
      if (window.MapHelper) {
        window.MapHelper.getGoogleHybrid().addTo(this.map);
        window.MapHelper.addLayerSwitcher(this.map);
      } else {
        L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps &middot; NASA FIRMS'
        }).addTo(this.map);
      }

      // Capas de grupo
      this.markersLayer = L.layerGroup().addTo(this.map);
      this.incendiosLayer = L.layerGroup().addTo(this.map);
      this.recursosLayer = L.layerGroup().addTo(this.map);

      // Cargar polígono perimetral del Parque Nacional Tunari
      this.dibujarPerimetroTunari();

      // Cargar infraestructura y recursos hídricos cercanos
      await this.cargarRecursosCercanos();
    },

    dibujarPerimetroTunari() {
      if (!this.map) return;

      // Coordenadas aproximadas de la cuenca y franja protegida del Parque Nacional Tunari
      const tunariCoords = [
        [-17.2000, -66.3500],
        [-17.2200, -66.2800],
        [-17.2500, -66.2200],
        [-17.2800, -66.1800], // Sector Taquiña
        [-17.3000, -66.1400],
        [-17.3200, -66.0800],
        [-17.3500, -66.0200], // Hacia Sacaba
        [-17.4000, -66.0500],
        [-17.3700, -66.1800],
        [-17.3400, -66.2800],
        [-17.3100, -66.3600],
        [-17.2000, -66.3500]
      ];

      const tunariPolygon = L.polygon(tunariCoords, {
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(this.map);

      tunariPolygon.bindPopup(`
        <div style="font-size:0.8rem; color:#fff;">
          <strong style="color:#86efac;"><i class="ph ph-shield"></i> Parque Nacional Tunari</strong><br>
          Área Natural Protegida y principal recarga hídrica de Cochabamba.<br>
          <span style="color:var(--text-muted); font-size:0.75rem;">Superficie: 300.000 ha · Alto riesgo de chaqueos</span>
        </div>
      `);
    },

    async cargarRecursosCercanos() {
      try {
        const res = await fetch('/api/recursos');
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          this.recursosLayer.clearLayers();

          data.data.forEach(rec => {
            const isAgua = rec.tipo_recurso === 'fuente_agua';
            const iconHtml = isAgua 
              ? `<div style="background:#0284c7; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4);"><i class="ph ph-drop" style="font-size:14px;"></i></div>`
              : `<div style="background:#16a34a; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4);"><i class="ph ph-first-aid" style="font-size:14px;"></i></div>`;

            const icon = L.divIcon({
              html: iconHtml,
              className: 'recurso-custom-marker',
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            });

            const m = L.marker([rec.latitud, rec.longitud], { icon });
            m.bindPopup(`
              <div style="font-size:0.8rem; color:#fff; min-width:180px;">
                <strong style="color:${isAgua ? '#38bdf8' : '#4ade80'};">${rec.nombre}</strong><br>
                <span style="font-size:0.72rem; color:var(--text-muted);">${rec.subtipo || rec.tipo_recurso}</span>
                <hr style="border-color:rgba(255,255,255,0.1); margin:4px 0;">
                <div><strong>Disponibilidad:</strong> ${rec.disponibilidad_real}</div>
                <div><strong>Distancia:</strong> ${rec.distancia_km} km</div>
                ${rec.detalles_capacidad ? `<div style="font-size:0.7rem; color:#cbd5e1; margin-top:2px;">${rec.detalles_capacidad}</div>` : ''}
              </div>
            `);
            this.recursosLayer.addLayer(m);
          });
        }
      } catch (e) {
        console.warn('[MapaIncendios] Error cargando recursos:', e);
      }
    },

    async loadFirmsData(forceRefresh = false) {
      this.isLoading = true;
      const loader = document.getElementById('mapaLoadingOverlay');
      const iconRefresh = document.getElementById('iconRefresh');
      if (loader) loader.style.display = 'flex';
      if (iconRefresh) iconRefresh.classList.add('ph-spin');

      try {
        const url = `/api/focos-calor/en-vivo?source=${this.selectedSource}&dayRange=${this.selectedDayRange}&forceRefresh=${forceRefresh}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.success) {
          this.focosData = data.focos || [];
          this.statsData = data.stats || {};

          this.updateHUD(this.statsData, data.fromCache);
          this.renderHeatmap(data.heatmapPoints || []);
          this.renderMarkers(this.focosData);
          this.renderSidebarList(this.focosData);
        } else {
          throw new Error((data && data.error) || 'Respuesta no exitosa');
        }
      } catch (err) {
        console.error('[MapaIncendios] Error obteniendo focos NASA FIRMS:', err);
        if (window.App && App.toast) {
          App.toast('Error al consultar satélites NASA. Usando telemetría local.', 'warning');
        }
      } finally {
        this.isLoading = false;
        if (loader) loader.style.display = 'none';
        if (iconRefresh) iconRefresh.classList.remove('ph-spin');
      }
    },

    updateHUD(stats, fromCache) {
      const elTotal = document.getElementById('hudTotalFocos');
      const elTunari = document.getElementById('hudFocosTunari');
      const elFrp = document.getElementById('hudMaxFrp');
      const elPasada = document.getElementById('hudUltimaPasada');
      const elCache = document.getElementById('hudCacheStatus');

      if (elTotal) elTotal.textContent = (stats.total_focos_detectados || 0).toLocaleString();
      if (elTunari) elTunari.textContent = (stats.focos_cochabamba_tunari || 0).toLocaleString();
      if (elFrp) elFrp.textContent = `${stats.frp_maximo_mw || 0} MW`;
      if (elPasada) elPasada.textContent = stats.ultima_pasada || '--:--';
      if (elCache) elCache.textContent = fromCache ? 'Caché NRT activa' : 'Satélite sincronizado';
    },

    renderHeatmap(points) {
      if (!this.map) return;

      // Eliminar capa anterior si existe
      if (this.heatLayer) {
        this.map.removeLayer(this.heatLayer);
        this.heatLayer = null;
      }

      if (this.viewMode === 'markers') return;

      if (window.MapHelper && typeof window.MapHelper.createHeatmapLayer === 'function') {
        this.heatLayer = window.MapHelper.createHeatmapLayer(points);
        if (this.heatLayer) {
          this.heatLayer.addTo(this.map);
        }
      } else if (typeof L.heatLayer === 'function') {
        this.heatLayer = L.heatLayer(points, {
          radius: 26,
          blur: 16,
          maxZoom: 17,
          minOpacity: 0.35,
          gradient: {
            0.15: '#22c55e',
            0.35: '#eab308',
            0.60: '#f97316',
            0.85: '#ef4444',
            1.00: '#991b1b'
          }
        }).addTo(this.map);
      }
    },

    renderMarkers(focos) {
      if (!this.markersLayer) return;
      this.markersLayer.clearLayers();

      if (this.viewMode === 'heat') return;

      // Renderizar marcadores para los focos (limitando a los más intensos o según zoom para rendimiento)
      const topFocos = focos.slice(0, 150);

      topFocos.forEach(f => {
        const isTunari = f.region.includes('Tunari') || f.es_incendio_declarado;
        const color = f.riesgo_color || '#f97316';

        const markerHtml = `
          <div class="firms-marker-pulse" style="background:${color}; width:${isTunari ? '18px' : '12px'}; height:${isTunari ? '18px' : '12px'}; border-radius:50%; border:2px solid #fff; box-shadow:0 0 ${isTunari ? '12px' : '6px'} ${color}; cursor:pointer;">
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'firms-div-marker',
          iconSize: [isTunari ? 20 : 14, isTunari ? 20 : 14],
          iconAnchor: [isTunari ? 10 : 7, isTunari ? 10 : 7]
        });

        const m = L.marker([f.lat, f.lng], { icon });

        m.bindPopup(`
          <div class="firms-popup" style="font-size:0.825rem; color:#fff; min-width:210px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <span class="badge" style="background:${color}22; color:${color}; font-size:0.7rem; border:1px solid ${color}44;">
                ${f.riesgo_label || 'Foco Detectado'}
              </span>
              <span style="font-size:0.7rem; color:var(--text-muted);">${f.hora}</span>
            </div>

            <h4 style="font-size:0.95rem; font-weight:700; color:#fff; margin:0 0 0.35rem;">
              ${f.nombre_incendio || f.region}
            </h4>

            <div style="background:rgba(255,255,255,0.05); padding:0.5rem; border-radius:6px; margin-bottom:0.5rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span style="color:var(--text-muted); font-size:0.72rem;">Potencia FRP:</span>
                <strong style="color:#ef4444;">${f.frp} MW</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span style="color:var(--text-muted); font-size:0.72rem;">Temperatura estimada:</span>
                <strong style="color:#f97316;">${f.temperatura_c} °C (${f.temperatura_k} K)</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted); font-size:0.72rem;">Satélite Sensor:</span>
                <span style="font-size:0.72rem; color:#cbd5e1;">${f.instrumento || f.satelite}</span>
              </div>
            </div>

            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" style="flex:1; font-size:0.72rem; padding:0.3rem;" onclick="MapaIncendiosView.openRoute(${f.lat}, ${f.lng})">
                <i class="ph ph-navigation-arrow"></i> Navegar
              </button>
              ${f.es_incendio_declarado ? `
                <button class="btn btn-fire btn-sm" style="flex:1; font-size:0.72rem; padding:0.3rem;" onclick="App.navigate('incendio-vivo')">
                  <i class="ph ph-flame"></i> En Vivo
                </button>
              ` : ''}
            </div>
          </div>
        `);

        this.markersLayer.addLayer(m);
      });
    },

    renderSidebarList(focos) {
      const container = document.getElementById('mapaFocosList');
      const badge = document.getElementById('badgeTotalLista');
      if (!container) return;

      if (!focos || focos.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.8rem;">
            <i class="ph ph-shield-check" style="font-size:2rem; color:#22c55e; margin-bottom:0.5rem; display:block;"></i>
            No se registran anomalías térmicas críticas en el rango seleccionado.
          </div>
        `;
        if (badge) badge.textContent = '0';
        return;
      }

      // Ordenar por FRP descendente
      const sorted = [...focos].sort((a, b) => (b.frp || 0) - (a.frp || 0)).slice(0, 30);
      if (badge) badge.textContent = focos.length.toString();

      container.innerHTML = sorted.map((f, idx) => {
        const isTunari = f.region.includes('Tunari');
        return `
          <div class="foco-sidebar-item ${isTunari ? 'tunari-highlight' : ''}" onclick="MapaIncendiosView.focusCoords(${f.lat}, ${f.lng})" style="padding:0.65rem 0.8rem; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid ${isTunari ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'}; cursor:pointer; transition:all 0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; font-size:0.825rem; color:#fff;">
                ${isTunari ? '<i class="ph ph-warning" style="color:#ef4444;"></i> ' : ''}${f.region}
              </span>
              <span style="font-weight:800; font-size:0.85rem; color:${f.riesgo_color};">
                ${f.frp} MW
              </span>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">
              <span>${f.temperatura_c} °C</span>
              <span>${f.hora}</span>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.35rem; font-size:0.68rem;">
              <span style="color:#94a3b8;"><i class="ph ph-satellite"></i> ${f.satelite.split(' ')[0]}</span>
              <span style="color:${f.riesgo_color}; font-weight:600;">${f.riesgo_label}</span>
            </div>
          </div>
        `;
      }).join('');
    },

    setViewMode(mode) {
      this.viewMode = mode;

      document.querySelectorAll('.btn-view-mode').forEach(b => b.classList.remove('active'));
      if (mode === 'heat') document.getElementById('btnModeHeat')?.classList.add('active');
      else if (mode === 'markers') document.getElementById('btnModeMarkers')?.classList.add('active');
      else document.getElementById('btnModeBoth')?.classList.add('active');

      if (this.map && this.focosData) {
        const points = this.focosData.map(f => [f.lat, f.lng, Math.min(1.0, Math.max(0.25, f.frp / 50))]);
        this.renderHeatmap(points);
        this.renderMarkers(this.focosData);
      }
    },

    setSubmodule(sub) {
      this.currentSubmodule = sub;
      document.querySelectorAll('.submodule-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-sub') === sub);
      });

      if (sub === 'activos') {
        this.setViewMode('heat');
        this.flyToTunari();
      } else if (sub === 'vigilancia') {
        if (window.App && App.navigate) App.navigate('vigilancia-reactivacion');
      } else if (sub === 'posibles') {
        if (window.App && App.navigate) App.navigate('ojos-del-bosque');
      }
    },

    onSensorChange(sensor) {
      this.selectedSource = sensor;
      this.loadFirmsData(true);
    },

    refreshData(force = true) {
      this.loadFirmsData(force);
    },

    focusCoords(lat, lng) {
      if (!this.map) return;
      this.map.flyTo([lat, lng], 13, { duration: 1.2 });
    },

    flyToTunari() {
      if (!this.map) return;
      this.map.flyTo([-17.2954, -66.1789], 12, { duration: 1.5 });
    },

    flyToCochabamba() {
      if (!this.map) return;
      this.map.flyTo([-17.3895, -66.1568], 10, { duration: 1.5 });
    },

    flyToBolivia() {
      if (!this.map) return;
      this.map.flyTo([-16.5, -64.5], 6, { duration: 1.8 });
    },

    openRoute(lat, lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(url, '_blank');
    },

    irAIncendioVivo() {
      if (window.App && App.navigate) App.navigate('incendio-vivo');
    }
  };

  function _inyectarEstilosMapaIncendios() {
    if (document.getElementById('estilos-mapa-incendios')) return;
    const style = document.createElement('style');
    style.id = 'estilos-mapa-incendios';
    style.textContent = `
      .mapa-dashboard-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .submodule-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.9rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        transition: all 0.2s ease;
      }
      .submodule-btn:hover {
        color: #fff;
        background: rgba(255,255,255,0.06);
      }
      .submodule-btn.active {
        background: var(--fire-primary);
        color: #fff;
        box-shadow: 0 2px 10px rgba(255, 77, 46, 0.35);
      }
      .btn-view-mode {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.35rem 0.65rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-view-mode.active {
        background: rgba(255, 77, 46, 0.25);
        color: #ff6a4d;
        border: 1px solid rgba(255, 77, 46, 0.4);
      }
      .foco-sidebar-item:hover {
        background: rgba(255,255,255,0.08) !important;
        transform: translateX(3px);
      }
      .foco-sidebar-item.tunari-highlight {
        background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(16,24,40,0.6) 100%) !important;
      }
      .firms-popup .leaflet-popup-content-wrapper {
        background: #0f172a !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        border-radius: 10px !important;
        box-shadow: 0 10px 25px rgba(0,0,0,0.6) !important;
      }
      .firms-popup .leaflet-popup-tip {
        background: #0f172a !important;
      }
    `;
    document.head.appendChild(style);
  }

  window.MapaIncendiosView = MapaIncendiosView;

  // Registro en el Router SPA
  if (typeof App !== 'undefined') {
    App.register('mapa-incendios', () => MapaIncendiosView.render(), () => MapaIncendiosView.afterRender());
  }
})();
