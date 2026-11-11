/**
 * FireTrace - Monitor de Incendios Bolivia
 * Vista: Vigilancia de Reactivación
 * public/js/pages/vigilanciaReactivacion.js
 */

const VigilanciaReactivacionView = {
  mapInstance: null,
  chartEvolucion: null,
  vigilanciaData: [],
  currentSatIndex: 0,
  satImages: [
    {
      url: '/IMG/FONDO%20PAGINA/Incendio%20forestal%20reflejado%20en%20el%20r%C3%ADo.png',
      caption: 'Análisis Infrarrojo VIIRS - Brazas subterráneas en Serranías de Sacaba',
      time: 'Última pasada: 11:30'
    },
    {
      url: '/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif',
      caption: 'Foco residual en estrato radicular - Sector Taquiña Baja',
      time: 'Última pasada: 09:15'
    }
  ],

  async render() {
    return `
      <div class="vigilancia-page">
        <!-- HEADER DE LA SECCIÓN -->
        <div class="card-header-flex" style="flex-wrap: wrap; gap: 1rem; align-items: center;">
          <div>
            <div class="badge" style="background: rgba(249,115,22,0.15); color: #f97316; border: 1px solid rgba(249,115,22,0.3); margin-bottom: 0.4rem;">
              <i class="ph ph-radar"></i> Monitoreo Post-Incendio y Brazas Subterráneas
            </div>
            <h1 style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: #fff;">
              Vigilancia de Reactivación de Focos
            </h1>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.2rem;">
              Monitoreo continuo de áreas controladas o en liquidación para prevenir rebrotes por vientos de ladera y raíces incandescentes.
            </p>
          </div>

          <div style="display: flex; gap: 0.65rem;">
            <button class="btn btn-secondary" onclick="VigilanciaReactivacionView.refreshData()">
              <i class="ph ph-arrows-clockwise"></i> Actualizar Sensores
            </button>
            <button class="btn btn-fire" onclick="VigilanciaReactivacionView.crearInspeccionModal()">
              <i class="ph ph-plus-circle"></i> Nueva Inspección
            </button>
          </div>
        </div>

        <!-- 1. CUATRO KPIS SUPERIORES -->
        <div class="stats-grid" style="margin-top: 1.5rem;">
          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Zonas en Vigilancia</span>
              <div class="stats-card-icon" style="background: rgba(56,189,248,0.15); color: #38bdf8;">
                <i class="ph ph-binoculars"></i>
              </div>
            </div>
            <div class="stats-card-value" style="color: #38bdf8;">12</div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-shield-check"></i> Cuencas y serranías
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Posibles Reactivaciones</span>
              <div class="stats-card-icon" style="background: rgba(239,68,68,0.2); color: #ef4444;">
                <i class="ph ph-flame"></i>
              </div>
            </div>
            <div class="stats-card-value" style="color: #ef4444;">4</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-warning"></i> En verificación de campo
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Tiempo Promedio Detección</span>
              <div class="stats-card-icon" style="background: rgba(234,179,8,0.15); color: #eab308;">
                <i class="ph ph-timer"></i>
              </div>
            </div>
            <div class="stats-card-value" style="color: #eab308;">5.4 h</div>
            <div class="stats-card-trend trend-down">
              <i class="ph ph-check-circle"></i> Ventana satelital VIIRS
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Nivel de Riesgo General</span>
              <div class="stats-card-icon" style="background: rgba(249,115,22,0.15); color: #f97316;">
                <i class="ph ph-gauge"></i>
              </div>
            </div>
            <div class="stats-card-value" style="font-size: 1.8rem; color: #f97316;">ALTO</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-wind"></i> Ráfagas vespertinas
            </div>
          </div>
        </div>

        <!-- 2. MAPA DE REACTIVACIONES Y PRONÓSTICO 24H -->
        <div class="dashboard-grid-2col" style="margin-top: 1.5rem;">
          <!-- MAPA DE VIGILANCIA -->
          <div class="side-card" style="padding: 1.25rem;">
            <div class="card-header-flex">
              <div>
                <span class="card-section-title"><i class="ph ph-map-pin"></i> Focos Bajo Vigilancia Espacial</span>
                <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Perímetros bajo control y puntos térmicos sospechosos</span>
              </div>
              <span class="badge badge-live"><span class="live-dot"></span> Radar Activo</span>
            </div>
            <div id="mapaVigilancia" style="height: 560px; width: 100%; border-radius: 12px; margin-top: 0.85rem;"></div>

            <!-- Leyenda específica de vigilancia -->
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.85rem; font-size: 0.75rem;">
              <span style="display: flex; align-items: center; gap: 0.35rem;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e;"></span> Sin Riesgo
              </span>
              <span style="display: flex; align-items: center; gap: 0.35rem;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #eab308;"></span> Riesgo Bajo
              </span>
              <span style="display: flex; align-items: center; gap: 0.35rem;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #f97316;"></span> Riesgo Medio
              </span>
              <span style="display: flex; align-items: center; gap: 0.35rem;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444;"></span> Riesgo Alto
              </span>
              <span style="display: flex; align-items: center; gap: 0.35rem;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #991b1b; box-shadow: 0 0 6px #ef4444;"></span> Reactivación Detectada
              </span>
            </div>
          </div>

          <!-- PRONÓSTICO DE RIESGO PRÓXIMAS 24H & IMÁGENES SATELITALES -->
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <!-- CARD PRONÓSTICO 24H -->
            <div class="weather-card" style="padding: 1.25rem;">
              <div class="card-header-flex">
                <span class="card-section-title"><i class="ph ph-thermometer"></i> Pronóstico de Riesgo (24h)</span>
                <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444;">ALERTA SECA</span>
              </div>
              <div class="weather-grid" style="margin-top: 0.75rem;">
                <div class="weather-item">
                  <span class="weather-label">Temp Máxima</span>
                  <span class="weather-val" style="color: #ef4444;"><i class="ph ph-sun"></i> 33.5 °C</span>
                </div>
                <div class="weather-item">
                  <span class="weather-label">Humedad Mínima</span>
                  <span class="weather-val" style="color: #f97316;"><i class="ph ph-drop"></i> 26.0 %</span>
                </div>
                <div class="weather-item">
                  <span class="weather-label">Viento Predominante</span>
                  <span class="weather-val" style="color: #eab308;"><i class="ph ph-wind"></i> 18-24 km/h NO</span>
                </div>
                <div class="weather-item">
                  <span class="weather-label">Prob. Rebrotes</span>
                  <span class="weather-val" style="color: #ef4444;"><i class="ph ph-warning"></i> 78% Crítico</span>
                </div>
              </div>
              <p style="font-size: 0.78rem; color: #cbd5e1; margin-top: 0.85rem; line-height: 1.4; border-left: 3px solid #ef4444; padding-left: 0.75rem;">
                Atención brigadas: Horas críticas entre las 13:00 y 17:30. Los vientos descendentes de montaña pueden reanimar brazas en raíces secas de eucalipto en Sacaba y Taquiña.
              </p>
            </div>

            <!-- CARROUSEL IMÁGENES SATELITALES RECIENTES -->
            <div class="side-card" style="padding: 1.25rem; flex: 1; display: flex; flex-direction: column;">
              <div class="card-header-flex">
                <span class="card-section-title"><i class="ph ph-satellite"></i> Detección Térmica Reciente</span>
                <div style="display: flex; gap: 0.35rem;">
                  <button class="btn btn-secondary btn-sm" onclick="VigilanciaReactivacionView.prevSatImage()" style="padding: 0.2rem 0.5rem;">
                    <i class="ph ph-caret-left"></i>
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="VigilanciaReactivacionView.nextSatImage()" style="padding: 0.2rem 0.5rem;">
                    <i class="ph ph-caret-right"></i>
                  </button>
                </div>
              </div>
              <div style="flex: 1; border-radius: 10px; overflow: hidden; position: relative; min-height: 150px; margin-top: 0.5rem;">
                <img id="satImgEl" src="${this.satImages[0].url}" alt="Satelite" style="width: 100%; height: 100%; object-fit: cover;">
                <div style="position: absolute; bottom: 0; inset-inline: 0; background: linear-gradient(0deg, rgba(5,8,15,0.95) 0%, transparent 100%); padding: 0.75rem;">
                  <span class="badge" style="background: rgba(239,68,68,0.3); color: #fca5a5; font-size: 0.65rem;" id="satTime">${this.satImages[0].time}</span>
                  <div style="font-size: 0.78rem; color: #fff; font-weight: 600; margin-top: 0.2rem;" id="satCaption">
                    ${this.satImages[0].caption}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. LISTA DE ZONAS EN VIGILANCIA (ORDENADAS POR MAYOR RIESGO PRIMERO) -->
        <div style="margin-top: 2rem;">
          <div class="card-header-flex">
            <div>
              <h2 class="card-section-title"><i class="ph ph-shield-warning"></i> Zonas Prioritarias en Vigilancia</h2>
              <span class="card-section-sub">Ordenadas automáticamente por nivel de riesgo y actividad térmica reciente</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Mostrando 4 áreas activas
            </div>
          </div>

          <div id="zonasVigilanciaGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-top: 1rem;">
            <!-- Tarjetas de zonas renderizadas dinámicamente -->
          </div>
        </div>

        <!-- 4. GRÁFICO DE EVOLUCIÓN (ÚLTIMOS 7 DÍAS) & ACCIONES / VOLUNTARIOS -->
        <div class="dashboard-grid-2col" style="margin-top: 2rem;">
          <!-- GRÁFICO DE EVOLUCIÓN (7 DÍAS) -->
          <div class="chart-container" style="height: 380px;">
            <div class="chart-header">
              <span class="chart-title"><i class="ph ph-chart-line-up"></i> Evolución de Reactivaciones (Últimos 7 días)</span>
              <span class="badge" style="background: rgba(255,255,255,0.06); font-size: 0.7rem;">Focos térmicos vs Zonas</span>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="chartVigilancia7dCanvas"></canvas>
            </div>
          </div>

          <!-- ACCIONES RECOMENDADAS & VOLUNTARIOS -->
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <!-- ACCIONES RECOMENDADAS -->
            <div class="side-card" style="padding: 1.25rem; border: 1px solid rgba(249,115,22,0.4);">
              <span class="card-section-title" style="color: var(--fire-amber);">
                <i class="ph ph-check-square"></i> Acciones Recomendadas de Vigilancia
              </span>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
                <button class="action-btn" onclick="VigilanciaReactivacionView.accion('patrullaje')">
                  <i class="ph ph-binoculars"></i>
                  <div>
                    <div style="font-weight: 700;">Desplegar Patrulla Terrestre</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Ronda preventiva en sector Serranías Sacaba</div>
                  </div>
                </button>
                <button class="action-btn" onclick="VigilanciaReactivacionView.accion('camara')">
                  <i class="ph ph-thermometer-hot"></i>
                  <div>
                    <div style="font-weight: 700;">Inspección con Cámara Térmica</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Medición de temperatura en raíces subterráneas</div>
                  </div>
                </button>
                <button class="action-btn" onclick="VigilanciaReactivacionView.accion('humectacion')">
                  <i class="ph ph-drop"></i>
                  <div>
                    <div style="font-weight: 700;">Línea de Enfriamiento y Humectación</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Aplicar agua en franja cortafuego perimetral</div>
                  </div>
                </button>
                <button class="action-btn" onclick="VigilanciaReactivacionView.accion('comunidad')">
                  <i class="ph ph-broadcast"></i>
                  <div>
                    <div style="font-weight: 700;">Aviso a Guardianes Comunales</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Activar vigías vecinales en puntos altos</div>
                  </div>
                </button>
              </div>
            </div>

            <!-- VOLUNTARIOS DISPONIBLES EN LA ZONA -->
            <div class="side-card" style="padding: 1.25rem;">
              <div class="card-header-flex">
                <span class="card-section-title"><i class="ph ph-users"></i> Voluntarios para Monitoreo</span>
                <span class="badge" style="background: rgba(34,197,94,0.15); color: #22c55e;">Disponibles</span>
              </div>
              <div id="vigilanciaVoluntariosContainer" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
                <!-- Dinámico -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    // 1. Cargar datos de vigilancia
    await this.loadVigilanciaData();

    // 2. Inicializar Mapa Leaflet
    this.initMap();

    // 3. Inicializar Gráfico de 7 Días
    this.initChart7Dias();

    // 4. Renderizar Voluntarios
    this.renderVoluntarios();
  },

  async loadVigilanciaData() {
    try {
      const res = await window.FireTraceAPI.get('/vigilancia');
      this.vigilanciaData = res?.data || res || [];
    } catch (err) {
      console.warn('[VigilanciaReactivacionView] Fallback a datos simulados:', err);
      this.vigilanciaData = [];
    }

    if (!this.vigilanciaData.length) {
      this.vigilanciaData = [
        {
          id: 1,
          nombre_zona: 'Serranía Tunari Norte (Sector Taquiña)',
          nivel_riesgo_actual: 'alto',
          estado_vigilancia: 'reactivacion_detectada',
          puntos_calientes_detectados: 5,
          fecha_declarado_controlado: '2026-08-11 18:00',
          tiempo_deteccion_horas: 3.2,
          bg_img: '/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif',
          latitud: -17.2954,
          longitud: -66.1789
        },
        {
          id: 2,
          nombre_zona: 'Serranías de Sacaba (Pastizales Altos)',
          nivel_riesgo_actual: 'medio',
          estado_vigilancia: 'posible_reactivacion',
          puntos_calientes_detectados: 2,
          fecha_declarado_controlado: '2026-08-11 15:30',
          tiempo_deteccion_horas: 5.4,
          bg_img: '/IMG/BARRA%20LATERAL/Bosque%20Incendio%20(BARRA%20LATERAL).jfif',
          latitud: -17.3780,
          longitud: -66.0250
        },
        {
          id: 3,
          nombre_zona: 'Cuenca Taquiña - Tiquipaya',
          nivel_riesgo_actual: 'medio',
          estado_vigilancia: 'en_vigilancia',
          puntos_calientes_detectados: 1,
          fecha_declarado_controlado: '2026-08-10 12:00',
          tiempo_deteccion_horas: 8.1,
          bg_img: '/IMG/BARRA%20LATERAL/Paisaje%20sereno%20de%20monta%C3%B1as%20y%20bosque%20(BARRA%20LATERAL).png',
          latitud: -17.3125,
          longitud: -66.2050
        },
        {
          id: 4,
          nombre_zona: 'Franja Forestal El Paso - Quillacollo',
          nivel_riesgo_actual: 'bajo',
          estado_vigilancia: 'en_vigilancia',
          puntos_calientes_detectados: 0,
          fecha_declarado_controlado: '2026-08-09 17:00',
          tiempo_deteccion_horas: 14.5,
          bg_img: '/IMG/BARRA%20LATERAL/Bosque%20Verde%20bonito%20(BARRA%20LATERAL).jfif',
          latitud: -17.3450,
          longitud: -66.2650
        }
      ];
    }

    // Ordenar: mayor riesgo primero
    const ordenRiesgo = { 'reactivacion_detectada': 4, 'alto': 3, 'posible_reactivacion': 3, 'medio': 2, 'bajo': 1 };
    this.vigilanciaData.sort((a, b) => {
      const pA = ordenRiesgo[a.estado_vigilancia] || ordenRiesgo[a.nivel_riesgo_actual] || 0;
      const pB = ordenRiesgo[b.estado_vigilancia] || ordenRiesgo[b.nivel_riesgo_actual] || 0;
      return pB - pA;
    });

    this.renderZonasGrid();
  },

  renderZonasGrid() {
    const grid = document.getElementById('zonasVigilanciaGrid');
    if (!grid) return;

    grid.innerHTML = this.vigilanciaData.map(z => {
      const esReactivacion = z.estado_vigilancia === 'reactivacion_detectada';
      const esPosible = z.estado_vigilancia === 'posible_reactivacion';
      const badgeColor = esReactivacion ? '#ef4444' : esPosible ? '#f97316' : '#22c55e';
      const badgeText = esReactivacion ? 'Reactivación Confirmada' : esPosible ? 'Posible Reactivación' : 'Bajo Control';
      const bg = z.bg_img || '/IMG/FONDO%20PAGINA/Valle%20monta%C3%B1oso%20al%20atardecer.png';

      return `
        <div class="zona-vigilancia-card" style="position: relative; border-radius: 14px; overflow: hidden; padding: 1.25rem; min-height: 220px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(180deg, rgba(5,8,15,0.4) 0%, rgba(5,8,15,0.95) 100%), url('${bg}'); background-size: cover; background-position: center; border: 1px solid ${badgeColor}60; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="badge" style="background: ${badgeColor}25; color: ${badgeColor}; border: 1px solid ${badgeColor}60; font-weight: 700;">
              ${badgeText}
            </span>
            <span style="font-size: 0.8rem; font-weight: 700; color: #fecaca; display: flex; align-items: center; gap: 0.3rem;">
              <i class="ph ph-flame" style="color: #ef4444;"></i> ${z.puntos_calientes_detectados} focos
            </span>
          </div>

          <div>
            <h3 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: #fff; margin-top: 0.5rem; line-height: 1.3;">
              ${z.nombre_zona || z.zonas_interes?.nombre || 'Zona Tunari'}
            </h3>
            <div style="font-size: 0.75rem; color: #cbd5e1; margin-top: 0.3rem; display: flex; flex-direction: column; gap: 0.15rem;">
              <span><i class="ph ph-clock"></i> Última señal: hace ${z.tiempo_deteccion_horas || 5} horas</span>
              <span><i class="ph ph-check-circle"></i> Controlado el: ${z.fecha_declarado_controlado || 'Recientemente'}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.85rem;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="VigilanciaReactivacionView.centrarEnMapa(${z.latitud}, ${z.longitud})">
                <i class="ph ph-map-pin"></i> Ubicar
              </button>
              <button class="btn btn-fire btn-sm" onclick="App.navigate('incendio-vivo')">
                <i class="ph ph-eye"></i> Inspeccionar
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  initMap() {
    const mapEl = document.getElementById('mapaVigilancia');
    if (!mapEl || typeof L === 'undefined') return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    this.mapInstance = L.map('mapaVigilancia', {
      zoomControl: true,
      attributionControl: false
    }).setView([-17.34, -66.16], 11);

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

    this.vigilanciaData.forEach(z => {
      const lat = parseFloat(z.latitud);
      const lng = parseFloat(z.longitud);
      if (isNaN(lat) || isNaN(lng)) return;

      const colors = {
        'reactivacion_detectada': '#991b1b',
        'alto': '#ef4444',
        'posible_reactivacion': '#f97316',
        'medio': '#eab308',
        'bajo': '#22c55e'
      };

      const color = colors[z.estado_vigilancia] || colors[z.nivel_riesgo_actual] || '#f97316';

      const circle = L.circle([lat, lng], {
        radius: 1800,
        color: color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 2
      }).addTo(this.mapInstance);

      circle.bindPopup(`
        <div class="map-popup">
          <strong style="color: #fff;">${z.nombre_zona}</strong>
          <span style="font-size: 0.75rem; color: ${color}; font-weight: 700;">
            ${(z.estado_vigilancia || z.nivel_riesgo_actual).toUpperCase().replace('_', ' ')}
          </span>
          <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
            Puntos calientes: ${z.puntos_calientes_detectados}<br>
            Tiempo señal: hace ${z.tiempo_deteccion_horas} h
          </p>
          <button class="btn btn-fire btn-sm" style="width: 100%; margin-top: 0.35rem;" onclick="App.navigate('incendio-vivo')">
            Ver detalle
          </button>
        </div>
      `);
    });

    setTimeout(() => {
      if (this.mapInstance) this.mapInstance.invalidateSize();
    }, 250);
  },

  centrarEnMapa(lat, lng) {
    if (this.mapInstance && !isNaN(lat) && !isNaN(lng)) {
      this.mapInstance.setView([lat, lng], 13);
      showToast('Mapa centrado en la zona seleccionada', 'info');
    }
  },

  initChart7Dias() {
    const canvas = document.getElementById('chartVigilancia7dCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.chartEvolucion) {
      this.chartEvolucion.destroy();
    }

    const labels = ['Día -6', 'Día -5', 'Día -4', 'Día -3', 'Día -2', 'Ayer', 'Hoy'];
    const dataFocos = [14, 9, 4, 2, 6, 8, 12];
    const dataZonas = [6, 4, 2, 2, 3, 3, 4];

    this.chartEvolucion = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Focos Residuales Térmicos',
            data: dataFocos,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'Zonas con Alerta de Rebrote',
            data: dataZonas,
            borderColor: '#f97316',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
        },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: 'Cantidad', font: { size: 10 } } },
          x: { grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  },

  renderVoluntarios() {
    const container = document.getElementById('vigilanciaVoluntariosContainer');
    if (!container) return;

    const vols = [
      { nombre: 'Elena Rocha (Vol. Habilitada)', zona: 'Sector Taquiña', tel: '+591 72298765' },
      { nombre: 'Patrulla SAR Grupo 2', zona: 'Cordillera Sacaba', tel: '+591 70712345' },
      { nombre: 'Vigías Comunales Tunari', zona: 'Tiquipaya Alto', tel: '+591 79700011' }
    ];

    container.innerHTML = vols.map(v => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px;">
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #fff;">${v.nombre}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${v.zona}</div>
        </div>
        <a href="tel:${v.tel}" class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
          <i class="ph ph-phone"></i>
        </a>
      </div>
    `).join('');
  },

  nextSatImage() {
    this.currentSatIndex = (this.currentSatIndex + 1) % this.satImages.length;
    this.updateSatImageView();
  },

  prevSatImage() {
    this.currentSatIndex = (this.currentSatIndex - 1 + this.satImages.length) % this.satImages.length;
    this.updateSatImageView();
  },

  updateSatImageView() {
    const item = this.satImages[this.currentSatIndex];
    const imgEl = document.getElementById('satImgEl');
    const capEl = document.getElementById('satCaption');
    const timeEl = document.getElementById('satTime');
    if (imgEl) imgEl.src = item.url;
    if (capEl) capEl.textContent = item.caption;
    if (timeEl) timeEl.textContent = item.time;
  },

  accion(tipo) {
    const msgs = {
      'patrullaje': 'Patrulla motorizada desplegada hacia Serranías de Sacaba.',
      'camara': 'Equipo termográfico FLIR activado para escaneo de raíces.',
      'humectacion': 'Solicitud de cisterna enviada a la Alcaldía de Tiquipaya.',
      'comunidad': 'Mensaje de alerta preventiva difundido a dirigentes comunales.'
    };
    showToast(msgs[tipo] || 'Acción registrada con éxito', 'success', 5000);
  },

  refreshData() {
    showToast('Consultando última pasada orbital VIIRS / MODIS...', 'info');
    setTimeout(() => {
      this.loadVigilanciaData();
      showToast('Datos satelitales actualizados con éxito.', 'success');
    }, 800);
  },

  crearInspeccionModal() {
    showToast('Abriendo formulario de reporte técnico de campo...', 'info');
  }
};

// Registro en el Router SPA
if (typeof App !== 'undefined') {
  App.register('vigilancia-reactivacion', () => VigilanciaReactivacionView.render(), () => VigilanciaReactivacionView.afterRender());
}
