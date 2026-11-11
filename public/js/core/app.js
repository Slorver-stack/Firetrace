/**
 * FireTrace - Monitor de Incendios Bolivia
 * NASA Space Apps Challenge 2026
 * Router SPA Principal y Controlador de la Aplicación (app.js)
 */

(function () {
  'use strict';

  const App = {
    routes: {},
    currentRoute: null,
    currentView: null,
    activeIncendioVivo: null,

    // Títulos y subtítulos por sección
    sectionHeaders: {
      'inicio': {
        title: 'Monitor de Incendios Bolivia',
        subtitle: 'Detección satelital NASA FIRMS y monitoreo en tiempo real'
      },
      'mapa-incendios': {
        title: 'Mapa Interactivo de Incendios',
        subtitle: 'Capas espaciales, focos de calor y perímetros en territorio boliviano'
      },
      'incendio-vivo': {
        title: 'Incendio en Vivo · Monitoreo Táctico',
        subtitle: 'Propagación activa, velocidad del viento y unidades de respuesta'
      },
      'memoria-fuego': {
        title: 'Memoria del Fuego · Análisis Histórico',
        subtitle: 'Cicatrices de quema y patrones multianuales en la Chiquitanía y Amazonía'
      },
      'semaforo-atencion': {
        title: 'Semáforo de Atención y Vulnerabilidad',
        subtitle: 'Índice de riesgo por municipio, biomasa seca y condiciones atmosféricas'
      },
      'ojos-del-bosque': {
        title: 'Ojos del Bosque · Red Comunitaria',
        subtitle: 'Reportes ciudadanos verificados y alertas tempranas en comunidades'
      },
      'firetrace-explica': {
        title: 'FireTrace Explica · Ciencia Satelital',
        subtitle: 'Cómo los sensores VIIRS, MODIS y Landsat protegen los bosques'
      },
      'bitacora-bosque': {
        title: 'Bitácora del Bosque · Bitácora de Campo',
        subtitle: 'Registro de intervenciones, daños evaluados y planes de regeneración'
      },
      'vigilancia-reactivacion': {
        title: 'Vigilancia de Reactivación · Monitoreo Post-Incendio',
        subtitle: 'Detección de puntos calientes latentes y control de reinicio de focos'
      },
      'admin': {
        title: 'Panel de Administración',
        subtitle: 'Gestión central de usuarios, roles e incendios declarados'
      },
      'rol/bombero': {
        title: 'Panel Táctico · Bombero de Respuesta',
        subtitle: 'Despliegue operativo, focos activos y rutas autorizadas'
      },
      'rol/ambulancia': {
        title: 'Panel de Respuesta Médica · Ambulancias',
        subtitle: 'Atención de emergencias, traslados y centros de salud cercanos'
      }
    },

    register(route, renderFn, afterRenderFn) {
      if (typeof renderFn === 'function') {
        this.routes[route] = {
          render: renderFn,
          afterRender: afterRenderFn || null
        };
      } else if (typeof renderFn === 'object' && renderFn !== null) {
        this.routes[route] = renderFn;
      }
    },

    async navigate(route, params = {}, pushState = true) {
      if (!route) route = 'inicio';
      // Limpiar ruta de leading/trailing slashes
      route = route.replace(/^\/+|\/+$/g, '');
      if (route === '' || route === 'dashboard') route = 'inicio';

      // Verificar permiso con Auth si existe
      if (window.Auth && !window.Auth.canAccess(route)) {
        this.toast('No tienes permiso para acceder a esta sección.', 'error');
        return;
      }

      const contentEl = document.getElementById('ftContent');
      if (!contentEl) return;

      // 1. Fade out del contenido actual
      if (window.Transitions && typeof window.Transitions.fadeOut === 'function') {
        await window.Transitions.fadeOut(contentEl, 0.2);
      }

      // 2. Mostrar skeleton loader
      this.showLoader(contentEl);

      // 3. Actualizar Sidebar, Fondo de Página y Header
      this.currentRoute = route;
      if (window.Sidebar && typeof window.Sidebar.setActive === 'function') {
        window.Sidebar.setActive(route);
      }
      if (window.PageBg && typeof window.PageBg.setActive === 'function') {
        window.PageBg.setActive(route);
      }
      this.updateHeader(route);

      // 4. Actualizar URL en historial si se solicita
      if (pushState) {
        const targetUrl = route === 'inicio' ? '/dashboard' : `/${route}`;
        window.history.pushState({ route, params }, '', targetUrl);
      }

      // 5. Cargar la vista registrada o la vista predeterminada
      try {
        let viewHtml = '';
        const routeHandler = this.routes[route];

        if (routeHandler) {
          if (typeof routeHandler === 'function') {
            viewHtml = await routeHandler(params, contentEl);
          } else if (typeof routeHandler.render === 'function') {
            viewHtml = await routeHandler.render(params, contentEl);
          }
        } else {
          viewHtml = await this.renderDefaultView(route, params);
        }

        if (viewHtml && typeof viewHtml === 'string') {
          contentEl.innerHTML = viewHtml;
        }

        // 6. Actualizar panel derecho por defecto primero
        this.updateRightPanel(route);

        // 7. Ejecutar afterRender específico de la vista si existe
        if (routeHandler && typeof routeHandler.afterRender === 'function') {
          try {
            await routeHandler.afterRender(params, contentEl);
          } catch (errAfter) {
            console.warn(`[afterRender Error en ${route}]:`, errAfter);
          }
        }

        // 8. Ejecutar efectos secundarios generales de la vista
        this.postRenderView(route, contentEl);

        // 9. Fade in del nuevo contenido
        if (window.Transitions && typeof window.Transitions.fadeIn === 'function') {
          await window.Transitions.fadeIn(contentEl, 0.35);
        }

      } catch (err) {
        console.error(`[App Navigate Error] Error al cargar la ruta ${route}:`, err);
        contentEl.innerHTML = `
          <div class="fire-card" style="text-align:center; padding: 3rem 1.5rem;">
            <i class="ph ph-warning-octagon" style="font-size: 3rem; color: var(--risk-critico);"></i>
            <h2 style="margin: 1rem 0 0.5rem; color: var(--text-main);">Error al cargar la sección</h2>
            <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 1.5rem;">
              ${err.message || 'No se pudo renderizar la vista solicitada.'}
            </p>
            <button class="btn btn-fire" onclick="window.App.navigate('inicio')">
              <i class="ph ph-arrow-left"></i> Volver al Inicio
            </button>
          </div>
        `;
        if (window.Transitions) window.Transitions.fadeIn(contentEl, 0.2);
      }
    },

    showLoader(container) {
      container.innerHTML = `
        <div class="loading-skeleton" id="contentLoader">
          <div class="skeleton-line" style="width: 30%;"></div>
          <div class="skeleton-card" style="height: 120px;"></div>
          <div class="skeleton-line" style="width: 60%;"></div>
          <div class="skeleton-card" style="height: 260px;"></div>
        </div>
      `;
    },

    updateHeader(route) {
      const titleEl = document.getElementById('pageTitle');
      const subtitleEl = document.getElementById('pageSubtitle');
      const headerInfo = this.sectionHeaders[route] || {
        title: 'FireTrace · Bolivia',
        subtitle: 'Sistema de Información y Monitoreo de Incendios Forestales'
      };

      if (titleEl) titleEl.textContent = headerInfo.title;
      if (subtitleEl) subtitleEl.textContent = headerInfo.subtitle;
    },

    // ── VISTAS PREDETERMINADAS RICAS DE LA SPA ───────────────────
    async renderDefaultView(route, params) {
      switch (route) {
        case 'inicio':
          return this.viewInicio();
        case 'mapa-incendios':
          return this.viewMapaIncendios();
        case 'incendio-vivo':
          return this.viewIncendioVivo();
        case 'memoria-fuego':
          return this.viewMemoriaFuego();
        case 'semaforo-atencion':
          return this.viewSemaforo();
        case 'ojos-del-bosque':
          return this.viewOjosBosque();
        case 'firetrace-explica':
          return this.viewExplica();
        case 'bitacora-bosque':
          return this.viewBitacora();
        default:
          return `
            <div class="fire-card">
              <h2>Sección en Construcción</h2>
              <p>La ruta <code>/${route}</code> está lista para conectar con sus módulos específicos.</p>
            </div>
          `;
      }
    },

    viewInicio() {
      return `
        <!-- STATS GRID SUPERIOR (4 COLUMNAS) -->
        <div class="stats-grid" id="statsGrid">
          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Incendios Activos</span>
              <div class="stats-card-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">
                <i class="ph ph-flame"></i>
              </div>
            </div>
            <div class="stats-card-value" id="statIncendios">14</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-trend-up"></i>
              <span>+3 reportados hoy en Santa Cruz y Beni</span>
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Focos de Calor (24h)</span>
              <div class="stats-card-icon" style="background: rgba(249, 115, 22, 0.15); color: #f97316;">
                <i class="ph ph-planet"></i>
              </div>
            </div>
            <div class="stats-card-value" id="statFocos">1,842</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-trend-up"></i>
              <span>VIIRS + MODIS NASA</span>
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Área en Riesgo Estimada</span>
              <div class="stats-card-icon" style="background: rgba(234, 179, 8, 0.15); color: #eab308;">
                <i class="ph ph-tree"></i>
              </div>
            </div>
            <div class="stats-card-value">28,450 <span style="font-size:1.1rem; font-weight:500;">ha</span></div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-clock"></i>
              <span>Cálculo satelital acumulado</span>
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Cuadrillas Desplegadas</span>
              <div class="stats-card-icon" style="background: rgba(34, 197, 94, 0.15); color: #22c55e;">
                <i class="ph ph-users-three"></i>
              </div>
            </div>
            <div class="stats-card-value">32</div>
            <div class="stats-card-trend trend-down">
              <i class="ph ph-check-circle"></i>
              <span>Bomberos, SAR y Voluntarios</span>
            </div>
          </div>
        </div>

        <!-- FILA PRINCIPAL: INCENDIO CRÍTICO DESTACADO + GRÁFICA -->
        <div class="dashboard-grid-2col">
          <div class="fire-card ash-zone">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
              <div>
                <span class="badge badge-live"><span class="live-dot"></span> Emergencia Activa</span>
                <h2 style="font-size:1.4rem; margin-top:0.4rem; color:var(--text-main);">
                  Incendio Reserva San Matías - Chiquitanía
                </h2>
                <p style="font-size:0.85rem; color:var(--text-secondary);">
                  Municipio San Matías, Depto. Santa Cruz · Alerta Máxima
                </p>
              </div>
              <button class="btn btn-fire" onclick="window.App.navigate('incendio-vivo')">
                <i class="ph ph-broadcast"></i> Ver en Vivo
              </button>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; margin:1.25rem 0;">
              <div style="background:rgba(255,255,255,0.03); padding:0.85rem; border-radius:var(--radius-md);">
                <div style="font-size:0.75rem; color:var(--text-muted);">Velocidad de Avance</div>
                <div style="font-size:1.25rem; font-weight:700; color:#ef4444;">2.4 km/h</div>
                <div style="font-size:0.7rem; color:var(--text-secondary);">Viento SO a 38 km/h</div>
              </div>
              <div style="background:rgba(255,255,255,0.03); padding:0.85rem; border-radius:var(--radius-md);">
                <div style="font-size:0.75rem; color:var(--text-muted);">Humedad Relativa</div>
                <div style="font-size:1.25rem; font-weight:700; color:#f97316;">16%</div>
                <div style="font-size:0.7rem; color:var(--text-secondary);">Severa sequía de biomasa</div>
              </div>
              <div style="background:rgba(255,255,255,0.03); padding:0.85rem; border-radius:var(--radius-md);">
                <div style="font-size:0.75rem; color:var(--text-muted);">Nivel de Contención</div>
                <div style="font-size:1.25rem; font-weight:700; color:#eab308;">22%</div>
                <div style="font-size:0.7rem; color:var(--text-secondary);">Línea de defensa norte</div>
              </div>
            </div>

            <!-- Barra de Contención -->
            <div style="margin-top:0.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.35rem;">
                <span>Progreso de Línea Cortafuego</span>
                <span>22% completado</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">
                <div style="width:22%; height:100%; background:linear-gradient(90deg, #ff4d2e, #f59e0b); border-radius:4px;"></div>
              </div>
            </div>
          </div>

          <!-- GRÁFICA DE FOCOS DE CALOR (CHART.JS) -->
          <div class="chart-container">
            <div class="chart-header">
              <span class="chart-title">Focos Satelitales (Últimos 7 días)</span>
              <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-secondary);">Bolivia</span>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="focosWeekChart"></canvas>
            </div>
          </div>
        </div>

        <!-- SECCIÓN INFERIOR: ACCIONES RECOMENDADAS -->
        <div class="recommended-actions">
          <div class="actions-header">
            <h3 class="actions-title">
              <i class="ph ph-shield-check"></i> Acciones Recomendadas y Protocolos de Respuesta
            </h3>
            <span class="badge" style="background:rgba(245, 158, 11, 0.15); color:#f59e0b;">Prioridad Alta</span>
          </div>

          <div class="actions-list">
            <div class="action-recommendation-card">
              <span class="badge badge-live rec-badge">Evacuación Preventiva</span>
              <h4 class="rec-title">Comunidad Candelaria</h4>
              <p class="rec-desc">Viento dirección hacia el asentamiento. Distancia al fuego: 4.8 km. Activar refugio temporal municipal.</p>
              <button class="btn btn-secondary" style="margin-top:auto;" onclick="window.App.toast('Alerta de evacuación enviada a líderes comunitarios.', 'success')">
                <i class="ph ph-megaphone"></i> Notificar Comunidad
              </button>
            </div>

            <div class="action-recommendation-card">
              <span class="badge rec-badge" style="background:rgba(249, 115, 22, 0.2); color:#f97316;">Refuerzo Hídrico</span>
              <h4 class="rec-title">Sector Laguna Concepción</h4>
              <p class="rec-desc">Despacho de cisterna de 10,000L y motobombas portátiles para frenar avance sobre pastizales secos.</p>
              <button class="btn btn-secondary" style="margin-top:auto;" onclick="window.App.toast('Solicitud de apoyo hídrico registrada.', 'info')">
                <i class="ph ph-drop"></i> Asignar Recurso
              </button>
            </div>

            <div class="action-recommendation-card">
              <span class="badge rec-badge" style="background:rgba(34, 197, 94, 0.2); color:#22c55e;">Vigilancia Aérea</span>
              <h4 class="rec-title">Patrullaje Satelital y Dron</h4>
              <p class="rec-desc">Próximo paso satélite Landsat 9 sobre la zona: 14:22 UTC. Verificación de nuevos focos secundarios.</p>
              <button class="btn btn-secondary" style="margin-top:auto;" onclick="window.App.navigate('mapa-incendios')">
                <i class="ph ph-planet"></i> Abrir Capas
              </button>
            </div>
          </div>
        </div>
      `;
    },

    viewMapaIncendios() {
      return `
        <div class="fire-card" style="padding: 1rem; height: calc(100vh - var(--header-height) - 4rem); min-height: 540px; display:flex; flex-direction:column; position:relative;">
          <!-- Panel Flotante de Controles sobre el Mapa -->
          <div class="map-info-panel">
            <div class="map-info-header">
              <h3 class="map-info-title"><i class="ph ph-map-pin"></i> Monitoreo Espacial</h3>
              <span class="badge badge-live"><span class="live-dot"></span> NASA FIRMS</span>
            </div>
            <p style="font-size:0.75rem; color:var(--text-secondary);">
              Filtro de focos detectados por sensores espaciales en las últimas 48 horas en Bolivia.
            </p>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <button class="btn btn-fire" style="font-size:0.75rem; padding:0.4rem 0.75rem;" id="btnFocusBolivia">
                <i class="ph ph-crosshair"></i> Centrar Bolivia
              </button>
              <button class="btn btn-secondary" style="font-size:0.75rem; padding:0.4rem 0.75rem;" id="btnToggleHeatmap">
                <i class="ph ph-fire"></i> Capa Calor
              </button>
            </div>

            <!-- Leyenda de Mapa de Calor -->
            <div class="heatmap-legend">
              <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">Intensidad Térmica (FRP - MW)</span>
              <div class="heatmap-bar"></div>
              <div class="heatmap-labels">
                <span>Bajo (&lt;10 MW)</span>
                <span>Moderado</span>
                <span>Crítico (&gt;100 MW)</span>
              </div>
            </div>
          </div>

          <!-- Leyenda de Marcadores de Riesgo -->
          <div class="map-legend">
            <div class="map-legend-title">Nivel de Riesgo</div>
            <div class="legend-item"><span class="legend-color-dot" style="background:#ef4444; box-shadow:0 0 6px #ef4444;"></span> Extremo / Descontrolado</div>
            <div class="legend-item"><span class="legend-color-dot" style="background:#f97316;"></span> Alto / En Combate</div>
            <div class="legend-item"><span class="legend-color-dot" style="background:#eab308;"></span> Medio / En Observación</div>
            <div class="legend-item"><span class="legend-color-dot" style="background:#22c55e;"></span> Controlado / En Guardia</div>
          </div>

          <!-- Contenedor del Mapa Leaflet -->
          <div id="leafletMap" style="flex:1; width:100%; border-radius:var(--radius-md);"></div>
        </div>
      `;
    },

    viewIncendioVivo() {
      return `
        <div class="dashboard-grid-2col ash-zone" style="grid-template-columns: 1.8fr 1.2fr;">
          <div class="fire-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
              <div>
                <span class="badge badge-live"><span class="live-dot"></span> Transmisión Telemetría</span>
                <h2 style="font-size:1.5rem; color:var(--text-main); margin-top:0.35rem;">Sector San Ignacio - Chiquitanía</h2>
                <p style="font-size:0.85rem; color:var(--text-secondary);">Coord: -16.3762, -60.9578 · Detección Satelital activa</p>
              </div>
              <button class="btn btn-fire" onclick="window.App.openModal('Declarar Incremento de Alerta', '<p>¿Confirmar elevación de alerta a Nivel Rojo para este sector?</p><br><button class=\\'btn btn-fire\\' onclick=\\'window.App.closeModal(); window.App.toast(\\'Alerta Roja emitida\\', \\'error\\')\\'>Confirmar</button>')">
                <i class="ph ph-warning"></i> Elevar Alerta
              </button>
            </div>

            <div style="height:340px; border-radius:var(--radius-md); overflow:hidden; margin-bottom:1.25rem;" id="liveMiniMap"></div>

            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem;">
              <div class="stats-card" style="padding:1rem;">
                <span class="stats-card-title">Temperatura en Foco</span>
                <div class="stats-card-value" style="font-size:1.6rem; color:#ef4444;">680 °C</div>
                <span style="font-size:0.75rem; color:var(--text-muted);">Sensor Infrarrojo VIIRS</span>
              </div>
              <div class="stats-card" style="padding:1rem;">
                <span class="stats-card-title">Ráfagas de Viento</span>
                <div class="stats-card-value" style="font-size:1.6rem; color:#f97316;">42 km/h</div>
                <span style="font-size:0.75rem; color:var(--text-muted);">Dirección Sur-Oeste</span>
              </div>
              <div class="stats-card" style="padding:1rem;">
                <span class="stats-card-title">Área Quemada (24h)</span>
                <div class="stats-card-value" style="font-size:1.6rem; color:#f59e0b;">3,210 ha</div>
                <span style="font-size:0.75rem; color:var(--text-muted);">Expansión +18%</span>
              </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <div class="side-card">
              <h3 style="font-size:1rem; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:0.5rem;">
                <i class="ph ph-radio-button" style="color:#ef4444;"></i> Registro de Radio y Campo
              </h3>
              <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.8rem; margin-top:0.5rem;">
                <div style="background:rgba(255,255,255,0.03); padding:0.65rem; border-radius:var(--radius-sm); border-left:3px solid #ef4444;">
                  <strong>16:40</strong> · Cuadrilla Alfa reporta salto de fuego a copa de árboles por viento cruzado.
                </div>
                <div style="background:rgba(255,255,255,0.03); padding:0.65rem; border-radius:var(--radius-sm); border-left:3px solid #f97316;">
                  <strong>16:15</strong> · Cisterna de refuerzo abastecida en toma de agua comunitaria.
                </div>
                <div style="background:rgba(255,255,255,0.03); padding:0.65rem; border-radius:var(--radius-sm); border-left:3px solid #22c55e;">
                  <strong>15:30</strong> · Perímetro sur asegurado con zanja cortafuego de 6 metros.
                </div>
              </div>
            </div>

            <div class="side-card">
              <h3 style="font-size:1rem; font-weight:700; color:var(--text-main);">Personal y Recursos Asignados</h3>
              <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem; font-size:0.825rem;">
                <div style="display:flex; justify-content:space-between; padding-bottom:0.4rem; border-bottom:1px solid var(--border-subtle);">
                  <span>Bomberos Forestales (SAR / FFAA)</span>
                  <span style="font-weight:700; color:var(--text-main);">48 efectivos</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding-bottom:0.4rem; border-bottom:1px solid var(--border-subtle);">
                  <span>Camiones Cisterna</span>
                  <span style="font-weight:700; color:var(--text-main);">3 unidades</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span>Helicóptero Bambi Bucket</span>
                  <span style="font-weight:700; color:#22c55e;">1 en aproximación</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    viewMemoriaFuego() {
      return `
        <div class="fire-card">
          <h2>Memoria del Fuego · Registro Histórico Multianual</h2>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem;">
            Análisis satelital comparativo de áreas quemadas en Bolivia entre 2019 y 2026.
          </p>
          <div class="chart-container" style="height:360px;">
            <div class="chart-canvas-wrapper">
              <canvas id="historicalChart"></canvas>
            </div>
          </div>
        </div>
      `;
    },

    viewSemaforo() {
      return `
        <div class="fire-card">
          <h2>Semáforo de Atención y Vulnerabilidad Municipal</h2>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem;">
            Clasificación de riesgo de propagación calculada a partir de sequedad de combustible y viento.
          </p>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1.25rem;">
            <div style="background:rgba(239, 68, 68, 0.15); border:1px solid #ef4444; border-radius:var(--radius-md); padding:1.25rem;">
              <h3 style="color:#fca5a5; font-size:1.1rem; margin-bottom:0.75rem;"><i class="ph ph-warning-octagon"></i> Rojo · Crítico</h3>
              <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:0.75rem;">Condiciones extremas para ignición y avance incontrolable.</p>
              <ul style="font-size:0.825rem; color:var(--text-main); padding-left:1.2rem;">
                <li>San Matías</li>
                <li>Concepción</li>
                <li>Roboré</li>
                <li>San Ignacio de Velasco</li>
              </ul>
            </div>

            <div style="background:rgba(249, 115, 22, 0.15); border:1px solid #f97316; border-radius:var(--radius-md); padding:1.25rem;">
              <h3 style="color:#fdba74; font-size:1.1rem; margin-bottom:0.75rem;"><i class="ph ph-warning"></i> Naranja · Alto</h3>
              <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:0.75rem;">Alta inflamabilidad, prohibición total de quemas.</p>
              <ul style="font-size:0.825rem; color:var(--text-main); padding-left:1.2rem;">
                <li>San José de Chiquitos</li>
                <li>Ascensión de Guarayos</li>
                <li>Rurrenabaque</li>
              </ul>
            </div>

            <div style="background:rgba(34, 197, 94, 0.15); border:1px solid #22c55e; border-radius:var(--radius-md); padding:1.25rem;">
              <h3 style="color:#86efac; font-size:1.1rem; margin-bottom:0.75rem;"><i class="ph ph-shield-check"></i> Verde · Moderado</h3>
              <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:0.75rem;">Humedad favorable, monitoreo preventivo regular.</p>
              <ul style="font-size:0.825rem; color:var(--text-main); padding-left:1.2rem;">
                <li>Buena Vista</li>
                <li>Villa Tunari</li>
                <li>Caranavi</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    },

    viewOjosBosque() {
      return `
        <div class="fire-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
              <h2>Ojos del Bosque · Red de Alerta Temprana Comunitaria</h2>
              <p style="color:var(--text-secondary);">Reportes enviados por pobladores, guardaparques y voluntarios de campo.</p>
            </div>
            <button class="btn btn-fire" onclick="window.App.openModal('Nuevo Reporte Ciudadano', '<label style=\\'font-size:0.85rem; color:var(--text-secondary);\\'>Lugar / Comunidad:</label><input class=\\'btn btn-secondary\\' style=\\'width:100%; margin:0.4rem 0 1rem; text-align:left;\\' placeholder=\\'Ej. Comunidad El Tinto\\'><label style=\\'font-size:0.85rem; color:var(--text-secondary);\\'>Descripción del Foco:</label><textarea class=\\'btn btn-secondary\\' style=\\'width:100%; height:80px; margin:0.4rem 0 1rem; text-align:left;\\' placeholder=\\'Humo denso visible hacia el este...\\'></textarea><button class=\\'btn btn-fire\\' style=\\'width:100%;\\' onclick=\\'window.App.closeModal(); window.App.toast(\\'Reporte enviado a central de verificación\\', \\'success\\')\\'>Enviar Reporte</button>')">
              <i class="ph ph-plus"></i> Enviar Reporte
            </button>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.85rem;">
            <div class="side-card" style="display:flex; flex-direction:row; justify-content:space-between; align-items:center;">
              <div>
                <span class="badge" style="background:rgba(34, 197, 94, 0.2); color:#22c55e;">Verificado por Guardaparque</span>
                <h4 style="margin-top:0.35rem; color:var(--text-main);">Columna de humo visible en Reserva Noel Kempff Mercado</h4>
                <p style="font-size:0.8rem; color:var(--text-secondary);">Enviado hace 24 min por Guardaparque Carlos M. · Coordenadas verificadas</p>
              </div>
              <button class="btn btn-secondary" onclick="window.App.navigate('mapa-incendios')">Ver en Mapa</button>
            </div>

            <div class="side-card" style="display:flex; flex-direction:row; justify-content:space-between; align-items:center;">
              <div>
                <span class="badge" style="background:rgba(234, 179, 8, 0.2); color:#eab308;">En Proceso de Verificación</span>
                <h4 style="margin-top:0.35rem; color:var(--text-main);">Quema de pastizal cerca de línea eléctrica</h4>
                <p style="font-size:0.8rem; color:var(--text-secondary);">Enviado hace 1 hora por Poblador local · Cuadrilla en camino</p>
              </div>
              <button class="btn btn-secondary" onclick="window.App.navigate('mapa-incendios')">Ver en Mapa</button>
            </div>
          </div>
        </div>
      `;
    },

    viewExplica() {
      return `
        <div class="fire-card">
          <h2>FireTrace Explica · La Ciencia Detrás de la Detección</h2>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem;">
            Cómo transformamos datos orbitales de la NASA en decisiones críticas para proteger Bolivia.
          </p>

          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1.25rem;">
            <div class="side-card">
              <i class="ph ph-satellite" style="font-size:2.5rem; color:var(--fire-secondary);"></i>
              <h3 style="color:var(--text-main); font-size:1.1rem; margin-top:0.5rem;">Sensores VIIRS y MODIS</h3>
              <p style="font-size:0.825rem; color:var(--text-secondary); line-height:1.4;">
                Detección térmica en bandas infrarrojas de 375m y 1km. Capaces de medir la potencia radiativa del fuego (FRP) incluso a través de humo espeso.
              </p>
            </div>

            <div class="side-card">
              <i class="ph ph-wind" style="font-size:2.5rem; color:#38bdf8;"></i>
              <h3 style="color:var(--text-main); font-size:1.1rem; margin-top:0.5rem;">Modelado de Viento</h3>
              <p style="font-size:0.825rem; color:var(--text-secondary); line-height:1.4;">
                Integración de vectores de velocidad y dirección de viento en tiempo real para predecir el rumbo de la línea de fuego en las próximas 6 a 12 horas.
              </p>
            </div>

            <div class="side-card">
              <i class="ph ph-plant" style="font-size:2.5rem; color:#22c55e;"></i>
              <h3 style="color:var(--text-main); font-size:1.1rem; margin-top:0.5rem;">Índice de Combustible Vivo</h3>
              <p style="font-size:0.825rem; color:var(--text-secondary); line-height:1.4;">
                Cálculo de estrés hídrico de la vegetación (NDVI / NDWI) para evaluar qué zonas boscosas actuarán como combustible seco o barrera húmeda.
              </p>
            </div>
          </div>
        </div>
      `;
    },

    viewBitacora() {
      return `
        <div class="fire-card">
          <h2>Bitácora del Bosque · Registro Oficial de Incidentes</h2>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem;">
            Historial documentado de despachos, control de incendios y regeneración ecológica en Bolivia.
          </p>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem; color:var(--text-secondary);">
              <thead>
                <tr style="border-bottom:1px solid var(--border-light); color:var(--text-main); text-align:left;">
                  <th style="padding:0.75rem;">Código</th>
                  <th style="padding:0.75rem;">Zona / Departamento</th>
                  <th style="padding:0.75rem;">Fecha Inicio</th>
                  <th style="padding:0.75rem;">Estado</th>
                  <th style="padding:0.75rem;">Área Afectada</th>
                  <th style="padding:0.75rem;">Comandante de Incidente</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:0.75rem; font-weight:700; color:var(--text-main);">INC-2026-089</td>
                  <td style="padding:0.75rem;">San Matías (Santa Cruz)</td>
                  <td style="padding:0.75rem;">26/10/2026</td>
                  <td style="padding:0.75rem;"><span class="badge badge-live">Activo</span></td>
                  <td style="padding:0.75rem;">8,420 ha</td>
                  <td style="padding:0.75rem;">Cap. R. Vargas</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:0.75rem; font-weight:700; color:var(--text-main);">INC-2026-084</td>
                  <td style="padding:0.75rem;">Laguna Concepción (Santa Cruz)</td>
                  <td style="padding:0.75rem;">22/10/2026</td>
                  <td style="padding:0.75rem;"><span class="badge" style="background:rgba(234,179,8,0.2); color:#eab308;">Controlado</span></td>
                  <td style="padding:0.75rem;">3,150 ha</td>
                  <td style="padding:0.75rem;">Tte. J. Flores</td>
                </tr>
                <tr>
                  <td style="padding:0.75rem; font-weight:700; color:var(--text-main);">INC-2026-079</td>
                  <td style="padding:0.75rem;">Rurrenabaque (Beni)</td>
                  <td style="padding:0.75rem;">18/10/2026</td>
                  <td style="padding:0.75rem;"><span class="badge" style="background:rgba(34,197,94,0.2); color:#22c55e;">Extinguido</span></td>
                  <td style="padding:0.75rem;">1,200 ha</td>
                  <td style="padding:0.75rem;">Sgto. M. Condori</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // ── EFECTOS Y GRÁFICOS POST-RENDER ───────────────────────────
    postRenderView(route, container) {
      // Iniciar efecto de cenizas en zonas con clase .ash-zone
      if (typeof window.initAshEffects === 'function') {
        window.initAshEffects();
      }

      // Animar stats cards si existen
      if (window.Transitions && typeof window.Transitions.animateStatsCards === 'function') {
        window.Transitions.animateStatsCards(container);
      }

      // Iniciar mapa Leaflet si estamos en 'mapa-incendios' o 'incendio-vivo'
      if (route === 'mapa-incendios') {
        this.initLeafletMap();
      } else if (route === 'incendio-vivo') {
        this.initLiveMiniMap();
      }

      // Iniciar gráficos Chart.js si estamos en 'inicio' o 'memoria-fuego'
      if (route === 'inicio') {
        this.initInicioChart();
      } else if (route === 'memoria-fuego') {
        this.initHistoricalChart();
      }
    },

    initLeafletMap() {
      const mapEl = document.getElementById('leafletMap');
      if (!mapEl || typeof L === 'undefined') return;

      const map = L.map('leafletMap', {
        center: [-16.5, -63.5], // Centro de Bolivia (Santa Cruz / Chiquitanía)
        zoom: 6,
        zoomControl: true
      });

      // Capa base Google Maps Satélite Híbrido en tiempo real por defecto
      if (window.MapHelper) {
        window.MapHelper.getGoogleHybrid().addTo(map);
        window.MapHelper.addLayerSwitcher(map);
      } else {
        L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Satélite en Tiempo Real &copy; Google Maps &middot; NASA FIRMS'
        }).addTo(map);
      }

      // Marcadores de muestra de incendios en Bolivia
      const sampleFires = [
        { lat: -16.3762, lng: -60.9578, name: 'Reserva San Matías', nivel: 'extremo', frp: '142 MW', desc: 'Foco activo con avance rápido.' },
        { lat: -15.8234, lng: -62.0125, name: 'Concepción Sector Norte', nivel: 'alto', frp: '68 MW', desc: 'Cuadrillas en combate.' },
        { lat: -17.8421, lng: -59.7543, name: 'Parque Nacional Otuquis', nivel: 'medio', frp: '24 MW', desc: 'Foco en pastizal inundable.' },
        { lat: -14.4532, lng: -64.8912, name: 'Trinidad Periferia (Beni)', nivel: 'medio', frp: '18 MW', desc: 'Quema controlada bajo observación.' }
      ];

      sampleFires.forEach(f => {
        const markerHtml = `<div class="marker-inner"><i class="ph ph-flame"></i></div>`;
        const icon = L.divIcon({
          className: `custom-fire-marker marker-${f.nivel}`,
          html: markerHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const popupContent = `
          <div class="map-popup">
            <div class="map-popup-header">
              <span class="map-popup-title">${f.name}</span>
              <span class="badge badge-live">${f.nivel.toUpperCase()}</span>
            </div>
            <div class="map-popup-body">
              <div class="map-popup-stat">
                <span class="map-popup-stat-label">Intensidad Térmica (FRP):</span>
                <span class="map-popup-stat-val" style="color:#ef4444;">${f.frp}</span>
              </div>
              <div class="map-popup-stat">
                <span class="map-popup-stat-label">Detalle:</span>
                <span class="map-popup-stat-val">${f.desc}</span>
              </div>
              <button class="btn btn-fire" style="font-size:0.75rem; padding:0.35rem 0.5rem; margin-top:0.4rem;" onclick="window.App.navigate('incendio-vivo')">
                <i class="ph ph-binoculars"></i> Monitorear
              </button>
            </div>
          </div>
        `;

        L.marker([f.lat, f.lng], { icon }).addTo(map).bindPopup(popupContent);
      });

      // Botón centrar Bolivia
      const btnFocus = document.getElementById('btnFocusBolivia');
      if (btnFocus) {
        btnFocus.addEventListener('click', () => {
          map.flyTo([-16.5, -63.5], 6);
        });
      }

      this._leafletMapInstance = map;
    },

    initLiveMiniMap() {
      const mapEl = document.getElementById('liveMiniMap');
      if (!mapEl || typeof L === 'undefined') return;

      const map = L.map('liveMiniMap', {
        center: [-16.3762, -60.9578],
        zoom: 11,
        zoomControl: false
      });

      if (window.MapHelper) {
        window.MapHelper.getGoogleHybrid().addTo(map);
      } else {
        L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps Satélite'
        }).addTo(map);
      }

      // Círculo de perímetro del incendio activo
      L.circle([-16.3762, -60.9578], {
        color: '#ef4444',
        fillColor: '#ff4d2e',
        fillOpacity: 0.35,
        radius: 4200
      }).addTo(map);

      L.marker([-16.3762, -60.9578], {
        icon: L.divIcon({
          className: 'custom-fire-marker marker-extremo',
          html: '<div class="marker-inner"><i class="ph ph-flame"></i></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(map);
    },

    initInicioChart() {
      const ctx = document.getElementById('focosWeekChart');
      if (!ctx || typeof Chart === 'undefined') return;

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jue 22', 'Vie 23', 'Sáb 24', 'Dom 25', 'Lun 26', 'Mar 27', 'Hoy 28'],
          datasets: [{
            label: 'Focos de Calor Detectados',
            data: [920, 1150, 1420, 1310, 1680, 1790, 1842],
            borderColor: '#ff4d2e',
            backgroundColor: 'rgba(255, 77, 46, 0.15)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#ff7728',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(16, 24, 40, 0.95)',
              titleColor: '#fff',
              bodyColor: '#cbd5e1',
              borderColor: 'rgba(255, 77, 46, 0.4)',
              borderWidth: 1,
              padding: 10,
              displayColors: false
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
            }
          }
        }
      });
    },

    initHistoricalChart() {
      const ctx = document.getElementById('historicalChart');
      if (!ctx || typeof Chart === 'undefined') return;

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026 (Activo)'],
          datasets: [{
            label: 'Hectáreas Afectadas (Millones ha)',
            data: [5.3, 2.1, 1.8, 2.4, 3.6, 6.8, 4.1, 2.8],
            backgroundColor: [
              'rgba(239, 68, 68, 0.7)',
              'rgba(249, 115, 22, 0.7)',
              'rgba(234, 179, 8, 0.7)',
              'rgba(249, 115, 22, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(185, 28, 28, 0.85)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(255, 77, 46, 0.9)'
            ],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    },

    // ── PANEL DERECHO DINÁMICO ───────────────────────────────────
    updateRightPanel(route) {
      const panel = document.getElementById('rightPanel');
      if (!panel) return;

      panel.innerHTML = `
        <div class="panel-section-title">
          <span>Alertas Críticas</span>
          <span class="badge badge-live">1 Activa</span>
        </div>

        <!-- Card de Alerta Crítica Pulsante -->
        <div class="alert-card-critical" onclick="window.App.navigate('incendio-vivo')">
          <div class="alert-card-header">
            <span class="alert-card-title"><i class="ph ph-warning"></i> Nivel Crítico</span>
            <span style="font-size:0.7rem; color:#fca5a5;">Hace 12 min</span>
          </div>
          <div class="alert-card-meta">
            <strong style="color:#fff;">San Matías · Zona El Carmen</strong>
            <span>Avance rápido hacia comunidad. Foco FRP 142 MW.</span>
          </div>
        </div>

        <div class="panel-section-title" style="margin-top:0.75rem;">
          <span>Meteorología en Foco</span>
          <span style="font-size:0.7rem; color:var(--text-muted);">Estación Chiquitos</span>
        </div>

        <!-- Card de Condiciones Meteorológicas -->
        <div class="weather-card">
          <div class="weather-grid">
            <div class="weather-item">
              <span class="weather-label">Temperatura</span>
              <span class="weather-val" style="color:#ef4444;"><i class="ph ph-thermometer-hot"></i> 38.5 °C</span>
            </div>
            <div class="weather-item">
              <span class="weather-label">Humedad</span>
              <span class="weather-val" style="color:#f97316;"><i class="ph ph-drop"></i> 14%</span>
            </div>
            <div class="weather-item">
              <span class="weather-label">Viento</span>
              <span class="weather-val" style="color:#38bdf8;"><i class="ph ph-wind"></i> 34 km/h SO</span>
            </div>
            <div class="weather-item">
              <span class="weather-label">Índice Ignición</span>
              <span class="weather-val" style="color:#ef4444;"><i class="ph ph-fire"></i> Extremo</span>
            </div>
          </div>
        </div>

        <div class="panel-section-title" style="margin-top:0.75rem;">
          <span>Infraestructura en Riesgo</span>
        </div>

        <!-- Card de Infraestructura -->
        <div class="infra-card">
          <div class="infra-item">
            <span>Comunidad El Tinto (120 hab)</span>
            <span class="badge badge-live" style="font-size:0.65rem;">3.2 km</span>
          </div>
          <div class="infra-item">
            <span>Torre de Alta Tensión T-42</span>
            <span class="badge" style="font-size:0.65rem; background:rgba(234,179,8,0.2); color:#eab308;">1.1 km</span>
          </div>
          <div class="infra-item">
            <span>Cuenca Quebrada Honda</span>
            <span class="badge" style="font-size:0.65rem; background:rgba(34,197,94,0.2); color:#22c55e;">A salvo</span>
          </div>
        </div>

        <div class="panel-section-title" style="margin-top:0.75rem;">
          <span>Acciones Rápidas</span>
        </div>

        <!-- Acciones Rápidas -->
        <div class="action-card">
          <button class="action-btn" onclick="window.App.openModal('Declarar Incidente', '<p>Seleccione el nivel del incidente:</p><br><button class=\\'btn btn-fire\\' style=\\'width:100%;\\' onclick=\\'window.App.closeModal(); window.App.toast(\\'Incidente emitido a COE Departamental\\', \\'success\\')\\'>Emitir Alerta a COE</button>')">
            <i class="ph ph-plus-circle"></i> Declarar Incidente
          </button>
          <button class="action-btn" onclick="window.App.toast('Descargando reporte KML satelital...', 'info')">
            <i class="ph ph-download-simple"></i> Exportar Capa GeoJSON / KML
          </button>
          <a class="action-btn" href="tel:119" style="color:#ef4444; border-color:rgba(239,68,68,0.3);">
            <i class="ph ph-phone-call" style="color:#ef4444;"></i> Línea de Emergencia (119)
          </a>
        </div>
      `;

      if (window.Transitions && typeof window.Transitions.animateAlerts === 'function') {
        window.Transitions.animateAlerts(panel);
      }
    },

    // ── CONTROL DE PANEL DERECHO DESLIZABLE Y REDIBUJADO DE MAPAS ─
    initRightPanel() {
      const savedCollapsed = localStorage.getItem('ft_right_panel_collapsed');
      if (savedCollapsed === 'true') {
        document.body.classList.add('right-panel-collapsed');
      }

      const toggleBtn = document.getElementById('rightPanelToggle');
      const headerBtn = document.getElementById('headerToggleRightPanel');

      const handleToggle = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.toggleRightPanel();
      };

      if (toggleBtn) toggleBtn.addEventListener('click', handleToggle);
      if (headerBtn) headerBtn.addEventListener('click', handleToggle);
    },

    toggleRightPanel() {
      const isCollapsed = document.body.classList.toggle('right-panel-collapsed');
      localStorage.setItem('ft_right_panel_collapsed', isCollapsed);

      // Invalida tamaño de todos los mapas Leaflet para que se adapten de inmediato al nuevo ancho disponible
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        this.invalidateAllMaps();
      }, 360);
    },

    invalidateAllMaps() {
      try {
        if (window.InicioView && window.InicioView.mapInstance) {
          window.InicioView.mapInstance.invalidateSize();
        }
        if (window.MapaIncendiosView && window.MapaIncendiosView.mapInstance) {
          window.MapaIncendiosView.mapInstance.invalidateSize();
        }
        if (window.IncendioVivoView && window.IncendioVivoView.mapInstance) {
          window.IncendioVivoView.mapInstance.invalidateSize();
        }
        if (window.VigilanciaReactivacionView && window.VigilanciaReactivacionView.mapInstance) {
          window.VigilanciaReactivacionView.mapInstance.invalidateSize();
        }
        if (window.MemoriaFuegoView && window.MemoriaFuegoView.mapInstance) {
          window.MemoriaFuegoView.mapInstance.invalidateSize();
        }
        if (window.OjosBosqueState && window.OjosBosqueState.map) {
          window.OjosBosqueState.map.invalidateSize();
        }
        if (this._leafletMapInstance) {
          this._leafletMapInstance.invalidateSize();
        }
      } catch (err) {
        console.warn('[InvalidateMaps Error]', err);
      }
    },

    // ── GESTIÓN DE NOTIFICACIONES Y ALERTAS ───────────────────────
    async updateNotifs() {
      try {
        let alertas = [];
        if (window.FireTraceAPI) {
          const res = await window.FireTraceAPI.getAlertas().catch(() => null);
          if (res && res.data) alertas = res.data;
        }

        const badge = document.getElementById('notifBadge');
        const notifList = document.getElementById('notifList');
        const alertBanner = document.getElementById('alertBanner');
        const alertLocation = document.getElementById('alertBannerLocation');

        // Consultar incendio activo para actualizar el banner en tiempo real
        let incendioActivo = null;
        try {
          const resInc = await fetch('/api/incendios/activos', { credentials: 'same-origin' }).then(r => r.json()).catch(() => null);
          if (resInc && resInc.success && resInc.data && resInc.data.length > 0) {
            incendioActivo = resInc.data[0];
          }
        } catch (_) {}

        // Si hay un incendio activo en seguimiento, actualizar el texto del banner
        if (alertLocation && incendioActivo) {
          alertLocation.textContent = `${incendioActivo.zonas_interes?.nombre || 'Parque Nacional Tunari'} · Foco Activo`;
        }

        const unreadCount = alertas.filter(a => !a.leida).length;
        if (badge) badge.textContent = unreadCount || (incendioActivo ? 1 : 0);

        // Actualizar banner en header si hay alerta crítica o incendio activo
        if (alertBanner) {
          const hayAlerta = (unreadCount > 0) || (incendioActivo !== null);
          alertBanner.style.display = hayAlerta ? 'flex' : 'none';
          if (hayAlerta && window.Transitions) {
            window.Transitions.pulseAlert(alertBanner);
          }
        }

        if (notifList) {
          if (alertas.length > 0) {
            notifList.innerHTML = alertas.map(a => `
              <div class="notif-item ${!a.leida ? 'unread' : ''}" onclick="window.App.navigate('incendio-vivo')">
                <i class="ph ph-warning-circle" style="font-size:1.3rem; color:var(--fire-primary); flex-shrink:0;"></i>
                <div>
                  <strong style="font-size:0.85rem; color:var(--text-main); display:block;">${a.titulo}</strong>
                  <span style="font-size:0.75rem; color:var(--text-secondary);">${a.mensaje}</span>
                </div>
              </div>
            `).join('');
          } else if (incendioActivo) {
            notifList.innerHTML = `
              <div class="notif-item unread" onclick="window.App.navigate('incendio-vivo')">
                <i class="ph ph-flame" style="font-size:1.3rem; color:#ef4444; flex-shrink:0;"></i>
                <div>
                  <strong style="font-size:0.85rem; color:var(--text-main); display:block;">${incendioActivo.nombre}</strong>
                  <span style="font-size:0.75rem; color:var(--text-secondary);">${incendioActivo.resumen_situacion || 'Incendio activo bajo monitoreo'}</span>
                </div>
              </div>
            `;
          } else {
            notifList.innerHTML = `
              <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                No hay alertas activas en este momento.
              </div>
            `;
          }
        }
      } catch (e) {
        console.warn('[App Notifs Error]', e);
      }
    },

    // ── MODAL Y TOAST HELPERS ────────────────────────────────────
    openModal(title, htmlContent) {
      const overlay = document.getElementById('modalOverlay');
      const container = document.getElementById('modalContent');
      if (!overlay || !container) return;

      container.innerHTML = `
        <h2 style="font-family:var(--font-display); font-size:1.35rem; color:var(--text-main); margin-bottom:1rem;">
          ${title}
        </h2>
        <div style="color:var(--text-secondary); line-height:1.5;">
          ${htmlContent}
        </div>
      `;
      overlay.style.display = 'flex';

      const closeBtn = document.getElementById('modalClose');
      if (closeBtn) closeBtn.onclick = () => this.closeModal();

      overlay.onclick = (e) => {
        if (e.target === overlay) this.closeModal();
      };
    },

    closeModal() {
      const overlay = document.getElementById('modalOverlay');
      if (overlay) overlay.style.display = 'none';
    },

    toast(message, type = 'info', duration = 4000) {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      const iconMap = {
        'info': 'ph-info',
        'success': 'ph-check-circle',
        'warning': 'ph-warning',
        'error': 'ph-warning-octagon',
        'critico': 'ph-flame'
      };
      const icon = iconMap[type] || 'ph-bell';

      toast.innerHTML = `
        <i class="ph ${icon}" style="font-size:1.35rem; flex-shrink:0; color:var(--fire-secondary);"></i>
        <div style="flex:1; font-size:0.85rem; line-height:1.35;">${message}</div>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    // ── INICIALIZACIÓN GLOBAL ────────────────────────────────────
    async init() {
      // 1. Inicializar Autenticación
      if (window.Auth && typeof window.Auth.init === 'function') {
        await window.Auth.init();
      }

      // 2. Inicializar Sidebar y Panel Derecho Deslizable
      if (window.Sidebar && typeof window.Sidebar.init === 'function') {
        window.Sidebar.init();
      }
      this.initRightPanel();

      // 3. Inicializar Efecto de Chispas de fondo
      const sparksContainer = document.getElementById('sparksContainer');
      if (sparksContainer && window.Transitions && typeof window.Transitions.initSparks === 'function') {
        window.Transitions.initSparks(sparksContainer, 28);
      }

      // 4. Configurar eventos de header (notificaciones y banners)
      const notifBtn = document.getElementById('notifBtn');
      const notifPanel = document.getElementById('notifPanel');
      const clearNotifsBtn = document.getElementById('clearNotifsBtn');
      const alertBanner = document.getElementById('alertBanner');

      if (notifBtn && notifPanel) {
        notifBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isVisible = notifPanel.style.display === 'block';
          notifPanel.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
          if (!notifBtn.contains(e.target) && !notifPanel.contains(e.target)) {
            notifPanel.style.display = 'none';
          }
        });
      }

      if (clearNotifsBtn && notifPanel) {
        clearNotifsBtn.addEventListener('click', () => {
          notifPanel.style.display = 'none';
        });
      }

      if (alertBanner) {
        alertBanner.addEventListener('click', () => {
          this.navigate('incendio-vivo');
        });
      }

      // 5. Manejo del historial del navegador (popstate)
      window.addEventListener('popstate', (e) => {
        const state = e.state;
        const route = (state && state.route) || window.location.pathname.replace(/^\/+|\/+$/g, '') || 'inicio';
        this.navigate(route, (state && state.params) || {}, false);
      });

      // 6. Conectar suscripciones en tiempo real con Supabase
      if (window.FireTraceAPI && typeof window.FireTraceAPI.subscribeToIncendios === 'function') {
        window.FireTraceAPI.subscribeToIncendios((payload) => {
          this.toast('Actualización de incendios recibida en tiempo real.', 'warning');
          this.updateNotifs();
        });
        window.FireTraceAPI.subscribeToAlertas((payload) => {
          this.toast('Nueva alerta de emergencia emitida por el sistema.', 'critico');
          this.updateNotifs();
        });
      }

      // 7. Cargar notificaciones
      await this.updateNotifs();

      // 8. Navegar a la ruta inicial según la URL actual
      const pathRoute = window.location.pathname.replace(/^\/+|\/+$/g, '') || 'inicio';
      await this.navigate(pathRoute, {}, false);
    }
  };

  window.App = App;

  // Auto-arranque al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();
