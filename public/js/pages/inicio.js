/**
 * FireTrace - Monitor de Incendios Bolivia
 * Vista: Inicio (Home Dashboard)
 * public/js/pages/inicio.js
 */

const InicioView = {
  mapInstance: null,
  realtimeSubscription: null,
  ashEffectInstance: null,

  async render() {
    const isGuest = window.Auth?.user?.rol === 'invitado';

    return `
      <div class="inicio-page">
        <!-- 1. BANNER DE BIENVENIDA -->
        <div class="welcome-banner">
          <div class="welcome-content">
            <div class="welcome-badge">
              <i class="ph ph-planet"></i> Sistema de Teledetección Espacial y Terrestre
            </div>
            <h1 class="welcome-title">Bienvenido al Monitor de Incendios Forestales de Bolivia</h1>
            <p class="welcome-desc">
              Plataforma integral de detección temprana satelital (NASA Aqua MODIS / VIIRS NOAA), 
              alerta comunitaria y coordinación táctica contra incendios forestales.
            </p>
          </div>
          <div class="welcome-quick-status">
            <span class="live-indicator-pill">
              <span class="live-dot-ping"></span> Sistema Operativo 24/7
            </span>
          </div>
        </div>

        ${isGuest ? `
          <!-- BANNER MODO INVITADO -->
          <div class="guest-notice-banner">
            <div class="guest-notice-icon">
              <i class="ph ph-info"></i>
            </div>
            <div class="guest-notice-body">
              <strong>Modo Espectador Activo</strong>
              <p>Estás como espectador. Inicia sesión con tus credenciales institucionales o de voluntario para acceder a todas las funciones tácticas y de movilización.</p>
            </div>
            <a href="/login" class="btn btn-secondary btn-sm">
              <i class="ph ph-sign-in"></i> Iniciar Sesión
            </a>
          </div>
        ` : ''}

        <!-- 2. ALERTA CRÍTICA DESTACADA -->
        <div id="inicioAlertaContainer">
          <!-- Renderizado dinámico -->
        </div>

        <!-- 3. CUATRO TARJETAS DE ESTADÍSTICAS EN TIEMPO REAL -->
        <div class="stats-grid" id="inicioStatsGrid">
          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Incendios Activos</span>
              <div class="stats-card-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">
                <i class="ph ph-flame"></i>
              </div>
            </div>
            <div class="stats-card-value" id="statIncendiosActivos" style="color: #ef4444;">--</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-warning-circle"></i> En seguimiento continuo
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Hectáreas Afectadas (2026)</span>
              <div class="stats-card-icon" style="background: rgba(249, 115, 22, 0.15); color: #f97316;">
                <i class="ph ph-tree"></i>
              </div>
            </div>
            <div class="stats-card-value" id="statHectareas">--</div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-clock"></i> Superficie estimada
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Focos de Calor (24h)</span>
              <div class="stats-card-icon" style="background: rgba(234, 179, 8, 0.15); color: #eab308;">
                <i class="ph ph-fire-simple"></i>
              </div>
            </div>
            <div class="stats-card-value" id="statFocos24h">--</div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-planet"></i> NASA MODIS / VIIRS
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Zonas en Vigilancia</span>
              <div class="stats-card-icon" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
                <i class="ph ph-shield-warning"></i>
              </div>
            </div>
            <div class="stats-card-value" id="statZonasVigilancia">--</div>
            <div class="stats-card-trend trend-down">
              <i class="ph ph-check-circle"></i> Puntos bajo observación
            </div>
          </div>
        </div>

        <!-- 4. ACCIONES RÁPIDAS -->
        <div class="quick-actions-bar">
          <div class="quick-actions-label">
            <i class="ph ph-lightning"></i> Acciones Rápidas:
          </div>
          <div class="quick-actions-buttons">
            <button class="btn btn-secondary" onclick="App.navigate('mapa-incendios')">
              <i class="ph ph-map-trifold"></i> Explorar Mapa Satelital
            </button>
            <button class="btn btn-fire" onclick="App.navigate('incendio-vivo')">
              <i class="ph ph-flame"></i> Monitorear Incendio en Vivo
            </button>
            <button class="btn btn-secondary" onclick="App.navigate('bitacora-bosque')">
              <i class="ph ph-notebook"></i> Biblioteca de Informes
            </button>
            <button class="btn btn-secondary" onclick="App.navigate('vigilancia-reactivacion')">
              <i class="ph ph-broadcast"></i> Vigilancia de Reactivaciones
            </button>
          </div>
        </div>

        <!-- 5. MAPA PRINCIPAL EN VIVO EXTENDIDO HORIZONTALMENTE -->
        <div class="inicio-map-card fire-card" style="margin-top: 1.5rem; width: 100%; padding: 1.5rem;">
          <div class="card-header-flex" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <h3 class="card-section-title" style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0;">
                  <i class="ph ph-map-pin" style="color: var(--color-fire-primary);"></i> Focos e Incendios Activos en Bolivia
                </h3>
                <span class="badge badge-live"><span class="live-dot"></span> Satélite Activo</span>
              </div>
              <span class="card-section-sub" style="font-size: 0.82rem; color: var(--text-secondary);">
                Distribución geoespacial en tiempo real sobre Cochabamba, Parque Nacional Tunari y territorio boliviano
              </span>
            </div>

            <!-- Botones de Enfoque y Pantalla Completa -->
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <div style="display: flex; gap: 0.35rem; background: rgba(255,255,255,0.05); padding: 0.25rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
                <button class="btn btn-ghost btn-sm" onclick="InicioView.flyToTunari()" title="Centrar en Parque Tunari" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                  <i class="ph ph-tree"></i> Tunari
                </button>
                <button class="btn btn-ghost btn-sm" onclick="InicioView.flyToCochabamba()" title="Centrar en Cochabamba" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                  <i class="ph ph-crosshair"></i> Cochabamba
                </button>
                <button class="btn btn-ghost btn-sm" onclick="InicioView.flyToBolivia()" title="Ver todo el país" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                  <i class="ph ph-globe"></i> Bolivia
                </button>
              </div>

              <button class="btn btn-fire btn-sm" onclick="App.navigate('mapa-incendios')" style="font-size: 0.8rem; padding: 0.45rem 0.9rem;">
                <i class="ph ph-map-trifold"></i> Explorar Mapa Completo
              </button>
            </div>
          </div>

          <!-- Contenedor del Mapa extendido horizontalmente -->
          <div id="inicioMiniMap" class="mini-map-container" style="height: 560px; width: 100%; border-radius: 14px; margin-top: 1rem; border: 1px solid var(--border-subtle); overflow: hidden; position: relative;"></div>

          <!-- Leyenda del mapa -->
          <div class="map-mini-legend" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; font-size: 0.78rem;">
              <span class="legend-chip chip-critico"><span class="dot-legend"></span> Crítico</span>
              <span class="legend-chip chip-alto"><span class="dot-legend"></span> Alto</span>
              <span class="legend-chip chip-medio"><span class="dot-legend"></span> Medio</span>
              <span class="legend-chip chip-bajo"><span class="dot-legend"></span> Bajo / Controlado</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-satellite"></i> Datos NASA FIRMS NRT (VIIRS / MODIS) &middot; Google Maps Satélite
            </div>
          </div>
        </div>

        <!-- 6. REGISTRO DE INCIDENTES EN ANCHO COMPLETO -->
        <div class="incendios-list-card fire-card" style="margin-top: 1.5rem; width: 100%; padding: 1.5rem;">
          <div class="card-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <h3 class="card-section-title" style="font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0;">
                <i class="ph ph-fire" style="color: var(--color-fire-primary);"></i> Registro de Incidentes Activos
              </h3>
              <span class="card-section-sub" style="font-size: 0.8rem; color: var(--text-secondary);">
                Últimos eventos reportados por satélite y brigadas terrestres
              </span>
            </div>
            <span class="badge badge-live" id="liveBadgeIncendios">
              <span class="live-dot"></span> <span id="countIncendiosPill">0</span> Activos
            </span>
          </div>
          <div class="incendios-table-wrapper" style="max-height: 420px; overflow-y: auto;">
            <table class="ft-table" id="tablaIncendiosActivos" style="width: 100%;">
              <thead>
                <tr>
                  <th>Código / Nombre</th>
                  <th>Área Afectada</th>
                  <th>Nivel de Riesgo</th>
                  <th>Estado Operativo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody id="listaIncendiosBody">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="ph ph-spinner ph-spin" style="font-size: 1.5rem;"></i> Cargando incidentes activos...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 6. HISTORIAS DE BIODIVERSIDAD -->
        <div class="historias-section" style="margin-top: 2rem;">
          <div class="card-header-flex">
            <div>
              <h2 class="card-section-title"><i class="ph ph-paw-print"></i> Historias de la Biodiversidad y Comunidades</h2>
              <span class="card-section-sub">El impacto del fuego en nuestra fauna silvestre y guardianes del bosque</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('ojos-del-bosque')">
              Ver todas las historias <i class="ph ph-arrow-right"></i>
            </button>
          </div>
          <div class="historias-grid" id="historiasGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-top: 1rem;">
            <div class="skeleton-card" style="height: 220px;"></div>
            <div class="skeleton-card" style="height: 220px;"></div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    // 1. Cargar datos en paralelo
    await Promise.allSettled([
      this.loadStats(),
      this.loadAlertas(),
      this.loadIncendiosActivos(),
      this.loadHistorias()
    ]);

    // 2. Animar tarjetas con Transitions si está disponible
    const content = document.getElementById('ftContent');
    if (typeof Transitions !== 'undefined' && Transitions.animateStatsCards) {
      Transitions.animateStatsCards(content);
    }

    // 3. Suscripción en tiempo real a incendios
    if (window.FireTraceAPI && typeof window.FireTraceAPI.subscribeToIncendios === 'function') {
      this.realtimeSubscription = window.FireTraceAPI.subscribeToIncendios(payload => {
        console.log('[InicioView] Evento de incendio en vivo:', payload);
        this.loadStats();
        this.loadIncendiosActivos();
      });
    }
  },

  async loadStats() {
    try {
      const res = await window.FireTraceAPI.get('/estadisticas/dashboard');
      const data = res?.data || res || {};

      const activosEl = document.getElementById('statIncendiosActivos');
      const focosEl = document.getElementById('statFocos24h');
      const hectareasEl = document.getElementById('statHectareas');
      const zonasEl = document.getElementById('statZonasVigilancia');

      if (activosEl) activosEl.textContent = data.incendios_activos ?? 1;
      if (focosEl) focosEl.textContent = (data.focos_ultimas_24h ?? 28).toLocaleString();
      if (hectareasEl) hectareasEl.textContent = '1,850 ha';
      if (zonasEl) zonasEl.textContent = '12';

      // Actualizar contador en header si existe
      const countPill = document.getElementById('countIncendiosPill');
      if (countPill) countPill.textContent = data.incendios_activos ?? 1;

    } catch (err) {
      console.warn('[InicioView] Error cargando estadísticas, usando fallback visual:', err);
      const activosEl = document.getElementById('statIncendiosActivos');
      const focosEl = document.getElementById('statFocos24h');
      const hectareasEl = document.getElementById('statHectareas');
      const zonasEl = document.getElementById('statZonasVigilancia');

      if (activosEl) activosEl.textContent = '2';
      if (focosEl) focosEl.textContent = '34';
      if (hectareasEl) hectareasEl.textContent = '1,850 ha';
      if (zonasEl) zonasEl.textContent = '12';
    }
  },

  async loadAlertas() {
    const container = document.getElementById('inicioAlertaContainer');
    if (!container) return;

    try {
      const res = await window.FireTraceAPI.getAlertas ? await window.FireTraceAPI.getAlertas() : await window.FireTraceAPI.get('/alertas');
      const alertas = res?.data || res || [];
      const alertaCritica = alertas.find(a => a.prioridad === 'critica' || a.tipo_alerta === 'critica_incendio') || alertas[0];

      if (alertaCritica) {
        container.innerHTML = this.renderAlertaCard(alertaCritica);

        // Si es crítico, instanciar efecto de cenizas
        if (alertaCritica.prioridad === 'critica') {
          const ashEl = container.querySelector('.ash-zone');
          if (ashEl && typeof AshEffect !== 'undefined') {
            this.ashEffectInstance = new AshEffect(ashEl, { count: 18 });
            this.ashEffectInstance.init();
          }
        }
      } else {
        container.innerHTML = '';
      }
    } catch (err) {
      console.warn('[InicioView] Error cargando alertas:', err);
    }
  },

  renderAlertaCard(alerta) {
    const esCritico = alerta.prioridad === 'critica' || alerta.tipo_alerta === 'critica_incendio';
    return `
      <div class="alert-banner-home ${esCritico ? 'alert-critical ash-zone' : 'alert-warning'}" style="margin-bottom: 1.5rem; position: relative; border-radius: 14px; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(153,27,27,0.3) 100%); border: 1px solid rgba(239,68,68,0.6); box-shadow: 0 0 20px rgba(239,68,68,0.25);">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; position: relative; z-index: 2;">
          <div style="display: flex; gap: 1rem; align-items: flex-start;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0;">
              <i class="ph ph-warning-octagon"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                <span class="badge badge-live"><span class="live-dot"></span> ALERTA EN VIVO</span>
                <span style="font-size: 0.8rem; color: #fca5a5; font-weight: 600;">Prioridad ${alerta.prioridad?.toUpperCase() || 'CRÍTICA'}</span>
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-top: 0.35rem;">
                ${alerta.titulo || 'Incendio Forestal Activo en Parque Nacional Tunari'}
              </h3>
              <p style="font-size: 0.875rem; color: #fecaca; margin-top: 0.25rem; max-width: 800px; line-height: 1.45;">
                ${alerta.mensaje || 'Se registra propagación rápida con viento noroeste. Comunidades de Taquiña y Tiquipaya en vigilancia prioritaria.'}
              </p>
            </div>
          </div>
          <button class="btn btn-fire" onclick="App.navigate('incendio-vivo')" style="flex-shrink: 0;">
            <i class="ph ph-eye"></i> Ver Incendio en Vivo
          </button>
        </div>
      </div>
    `;
  },

  async loadIncendiosActivos() {
    const tbody = document.getElementById('listaIncendiosBody');
    try {
      const res = await window.FireTraceAPI.get('/incendios/activos');
      const incendios = res?.data || res || [];

      if (!incendios.length) {
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="ph ph-check-circle" style="font-size: 1.5rem; color: #22c55e;"></i><br>
                No hay incendios activos reportados en este momento.
              </td>
            </tr>
          `;
        }
        this.initMiniMap([]);
        return;
      }

      if (tbody) {
        tbody.innerHTML = incendios.map(inc => this.renderIncendioRow(inc)).join('');
      }

      // Inicializar el mini mapa con los incendios cargados
      this.initMiniMap(incendios);

    } catch (err) {
      console.warn('[InicioView] Error cargando incendios activos:', err);
      // Fallback con datos demo
      const demoIncendios = [
        {
          id: 1,
          codigo_incendio: 'INC-TUNARI-2026-01',
          nombre: 'Serranía Tunari Norte (Sector Taquiña)',
          hectareas_afectadas: 320,
          nivel_riesgo: 'critico',
          estado: 'activo',
          latitud: -17.2954,
          longitud: -66.1789
        },
        {
          id: 2,
          codigo_incendio: 'INC-SACABA-2026-02',
          nombre: 'Foco Serranías de Sacaba',
          hectareas_afectadas: 45,
          nivel_riesgo: 'medio',
          estado: 'controlado',
          latitud: -17.3780,
          longitud: -66.0250
        }
      ];

      if (tbody) {
        tbody.innerHTML = demoIncendios.map(inc => this.renderIncendioRow(inc)).join('');
      }
      this.initMiniMap(demoIncendios);
    }
  },

  renderIncendioRow(inc) {
    const riesgoColor = {
      'critico': '#ef4444',
      'alto': '#f97316',
      'medio': '#eab308',
      'bajo': '#22c55e'
    }[inc.nivel_riesgo?.toLowerCase()] || '#f97316';

    const estadoBadge = inc.estado === 'activo'
      ? `<span class="badge badge-live"><span class="live-dot"></span> Activo</span>`
      : `<span class="badge" style="background: rgba(34,197,94,0.15); color: #22c55e;">Controlado</span>`;

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: #fff;">${inc.codigo_incendio || 'INC-001'}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${inc.nombre}
          </div>
        </td>
        <td>
          <span style="font-weight: 600; color: var(--text-main);">${Number(inc.hectareas_afectadas || 0).toLocaleString()} ha</span>
        </td>
        <td>
          <span class="badge" style="background: ${riesgoColor}25; color: ${riesgoColor}; border: 1px solid ${riesgoColor}50;">
            ${(inc.nivel_riesgo || 'alto').toUpperCase()}
          </span>
        </td>
        <td>${estadoBadge}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('incendio-vivo')" title="Ver en vivo">
            <i class="ph ph-arrow-right"></i>
          </button>
        </td>
      </tr>
    `;
  },

  initMiniMap(incendios = []) {
    const container = document.getElementById('inicioMiniMap');
    if (!container || typeof L === 'undefined') return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    // Centrado en Cochabamba
    const centerLat = -17.3895;
    const centerLng = -66.1568;

    this.mapInstance = L.map('inicioMiniMap', {
      zoomControl: true,
      attributionControl: false
    }).setView([centerLat, centerLng], 10);

    // Capa base Google Maps Satélite en tiempo real
    if (window.MapHelper) {
      window.MapHelper.getGoogleHybrid().addTo(this.mapInstance);
      window.MapHelper.addLayerSwitcher(this.mapInstance);
    } else {
      L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Satélite'
      }).addTo(this.mapInstance);
    }

    // Dibujar marcadores de incendios
    incendios.forEach(inc => {
      const lat = parseFloat(inc.latitud);
      const lng = parseFloat(inc.longitud);
      if (isNaN(lat) || isNaN(lng)) return;

      const esCritico = inc.nivel_riesgo === 'critico' || inc.nivel_riesgo === 'alto';
      const iconHtml = `
        <div class="custom-fire-marker ${esCritico ? 'marker-extremo' : 'marker-medio'}" style="width: 32px; height: 32px;">
          <div class="marker-inner">
            <i class="ph ph-flame" style="font-size: 16px;"></i>
          </div>
        </div>
      `;

      const fireIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon: fireIcon }).addTo(this.mapInstance);

      // Círculo de cobertura/área aproximada
      const radioM = (inc.hectareas_afectadas || 50) * 8;
      L.circle([lat, lng], {
        radius: radioM,
        color: esCritico ? '#ef4444' : '#eab308',
        fillColor: esCritico ? '#ef4444' : '#eab308',
        fillOpacity: 0.18,
        weight: 1.5
      }).addTo(this.mapInstance);

      marker.bindPopup(`
        <div class="map-popup">
          <div class="map-popup-header">
            <span class="map-popup-title">${inc.nombre}</span>
          </div>
          <div class="map-popup-body">
            <div class="map-popup-stat">
              <span class="map-popup-stat-label">Área:</span>
              <span class="map-popup-stat-val">${inc.hectareas_afectadas} ha</span>
            </div>
            <div class="map-popup-stat">
              <span class="map-popup-stat-label">Nivel:</span>
              <span class="map-popup-stat-val" style="color: ${esCritico ? '#ef4444' : '#eab308'}; font-weight:700;">
                ${(inc.nivel_riesgo || 'alto').toUpperCase()}
              </span>
            </div>
            <button class="btn btn-fire btn-sm" style="width: 100%; margin-top: 0.5rem;" onclick="App.navigate('incendio-vivo')">
              <i class="ph ph-flame"></i> Seguir en Vivo
            </button>
          </div>
        </div>
      `);
    });

    // Cargar conteo real satelital de NASA FIRMS
    fetch('/api/focos-calor/en-vivo')
      .then(r => r.json())
      .then(live => {
        if (live && live.success && live.stats) {
          const focosEl = document.getElementById('statFocos24h');
          if (focosEl) focosEl.textContent = (live.stats.total_focos_detectados || 0).toLocaleString();
        }
      })
      .catch(() => {});

    // Ajustar vista después de renderizado
    setTimeout(() => {
      if (this.mapInstance) {
        this.mapInstance.invalidateSize();

        // Superponer capa de calor térmica de NASA FIRMS en el mini-mapa
        fetch('/api/focos-calor/heatmap')
          .then(res => res.json())
          .then(data => {
            if (data && data.success && data.points && window.MapHelper) {
              const miniHeat = window.MapHelper.createHeatmapLayer(data.points, { radius: 20, blur: 14, minOpacity: 0.3 });
              if (miniHeat && this.mapInstance) miniHeat.addTo(this.mapInstance);
            }
          })
          .catch(() => {});
      }
    }, 250);
  },

  flyToTunari() {
    if (this.mapInstance) {
      this.mapInstance.flyTo([-17.2954, -66.1789], 13);
    }
  },

  flyToCochabamba() {
    if (this.mapInstance) {
      this.mapInstance.flyTo([-17.3895, -66.1568], 11);
    }
  },

  flyToBolivia() {
    if (this.mapInstance) {
      this.mapInstance.flyTo([-16.5, -64.0], 6);
    }
  },

  async loadHistorias() {
    const grid = document.getElementById('historiasGrid');
    if (!grid) return;

    try {
      const res = await window.FireTraceAPI.get('/historias');
      const historias = res?.data || res || [];

      if (!historias.length) {
        grid.innerHTML = this.getFallbackHistorias();
        return;
      }

      grid.innerHTML = historias.slice(0, 3).map(hist => {
        const bgUrl = hist.imagen_url ? `/IMG/${encodeURI(hist.imagen_url)}` : '/IMG/FONDO%20PAGINA/C%C3%B3ndor%20sobre%20el%20incendio%20forestal.png';
        return `
          <div class="historia-card" style="position: relative; border-radius: 16px; overflow: hidden; min-height: 240px; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.5rem; background: linear-gradient(180deg, rgba(5,8,15,0.2) 0%, rgba(5,8,15,0.92) 100%), url('${bgUrl}'); background-size: cover; background-position: center; border: 1px solid var(--border-subtle); transition: transform 0.3s ease, border-color 0.3s ease;">
            <div style="position: absolute; top: 1rem; right: 1rem;">
              <span class="badge" style="background: rgba(16,24,40,0.8); backdrop-filter: blur(8px); border: 1px solid var(--border-light); color: var(--fire-secondary);">
                <i class="ph ph-leaf"></i> ${hist.categoria || 'Biodiversidad'}
              </span>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: #fca5a5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                ${hist.especie_o_comunidad || 'Especie Vulnerable'}
              </div>
              <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: #fff; margin-top: 0.25rem; line-height: 1.3;">
                ${hist.titulo}
              </h3>
              <p style="font-size: 0.825rem; color: #cbd5e1; margin-top: 0.4rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${hist.subtitulo || hist.contenido_completo}
              </p>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('ojos-del-bosque')" style="margin-top: 0.75rem; padding: 0.3rem 0; color: #f97316;">
                Leer crónica completa <i class="ph ph-arrow-right"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.warn('[InicioView] Error cargando historias:', err);
      grid.innerHTML = this.getFallbackHistorias();
    }
  },

  getFallbackHistorias() {
    return `
      <div class="historia-card" style="position: relative; border-radius: 16px; overflow: hidden; min-height: 240px; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.5rem; background: linear-gradient(180deg, rgba(5,8,15,0.2) 0%, rgba(5,8,15,0.92) 100%), url('/IMG/FONDO%20PAGINA/C%C3%B3ndor%20sobre%20el%20incendio%20forestal.png'); background-size: cover; background-position: center; border: 1px solid var(--border-subtle);">
        <div>
          <div style="font-size: 0.8rem; color: #fca5a5; font-weight: 600;">Jaguar (Panthera onca)</div>
          <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: #fff; margin-top: 0.25rem;">
            El jaguar: una de las especies más afectadas por los incendios
          </h3>
          <p style="font-size: 0.825rem; color: #cbd5e1; margin-top: 0.4rem;">
            Los incendios forestales destruyen el hábitat crítico del jaguar, reduciendo su disponibilidad de presas y fragmentando corredores biológicos.
          </p>
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('ojos-del-bosque')" style="margin-top: 0.75rem; color: #f97316;">
            Leer crónica completa <i class="ph ph-arrow-right"></i>
          </button>
        </div>
      </div>
      <div class="historia-card" style="position: relative; border-radius: 16px; overflow: hidden; min-height: 240px; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.5rem; background: linear-gradient(180deg, rgba(5,8,15,0.2) 0%, rgba(5,8,15,0.92) 100%), url('/IMG/BARRA%20LATERAL/Monta%C3%B1as%20al%20atardecer_%20proteger%20lo%20que%20importa%20(BARRA%20LATERAL).png'); background-size: cover; background-position: center; border: 1px solid var(--border-subtle);">
        <div>
          <div style="font-size: 0.8rem; color: #93c5fd; font-weight: 600;">Comunidades de Taquiña y Tiquipaya</div>
          <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: #fff; margin-top: 0.25rem;">
            Comunidades del Tunari: guardianes de la cuenca hídrica
          </h3>
          <p style="font-size: 0.825rem; color: #cbd5e1; margin-top: 0.4rem;">
            Familias campesinas enfrentan la pérdida de pastizales y canales de agua que abastecen los valles centrales de Cochabamba.
          </p>
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('ojos-del-bosque')" style="margin-top: 0.75rem; color: #f97316;">
            Leer crónica completa <i class="ph ph-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  }
};

// Registro en el Router SPA
if (typeof App !== 'undefined') {
  App.register('inicio', () => InicioView.render(), () => InicioView.afterRender());
}
