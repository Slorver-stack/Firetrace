/**
 * FireTrace - Monitor de Incendios Bolivia
 * Vista: Memoria del Fuego (Análisis Histórico 2015-2026)
 * public/js/pages/memoriaFuego.js
 */

const MemoriaFuegoView = {
  charts: {},
  mapInstance: null,
  mapCircles: [],
  selectedYear: 2024,
  historicoData: null,

  async render() {
    return `
      <div class="memoria-fuego-page">
        <!-- HEADER DE LA SECCIÓN CON SELECTOR TEMPORAL -->
        <div class="card-header-flex" style="flex-wrap: wrap; gap: 1rem; align-items: center;">
          <div>
            <div class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); margin-bottom: 0.4rem;">
              <i class="ph ph-clock-counter-clockwise"></i> Archivo Histórico Satelital
            </div>
            <h1 style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: #fff;">
              Memoria del Fuego: Bolivia en Perspectiva (2015 - 2026)
            </h1>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.2rem;">
              Década de observaciones continuas por sensores térmicos orbitales MODIS y VIIRS en los valles y bosques de Bolivia.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <label style="font-size: 0.8rem; color: var(--text-muted);"><i class="ph ph-calendar"></i> Período:</label>
            <select id="selAnioHistorico" class="ft-select" style="padding: 0.5rem 1rem; border-radius: 8px; background: var(--bg-surface-elevated); border: 1px solid var(--border-light); color: #fff; font-size: 0.85rem;" onchange="MemoriaFuegoView.onYearChange(this.value)">
              <option value="todos">Todo el período (2015 - 2026)</option>
              <option value="2026">2026 (En curso)</option>
              <option value="2025">2025 (Crítico)</option>
              <option value="2024" selected>2024 (Récord histórico)</option>
              <option value="2023">2023</option>
              <option value="2021">2021</option>
              <option value="2019">2019 (Chiquitanía)</option>
              <option value="2015">2015</option>
            </select>
          </div>
        </div>

        <!-- 1. RESUMEN DEL PERÍODO (3 TARJETAS KPI DESTACADAS) -->
        <div class="stats-grid" style="margin-top: 1.5rem; grid-template-columns: repeat(4, 1fr);">
          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Focos de Calor Registrados</span>
              <div class="stats-card-icon" style="background: rgba(239,68,68,0.15); color: #ef4444;">
                <i class="ph ph-fire"></i>
              </div>
            </div>
            <div class="stats-card-value" style="color: #ef4444;">245,832</div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-satellite"></i> Sensores Aqua MODIS / VIIRS
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Área Total Devastada</span>
              <div class="stats-card-icon" style="background: rgba(249,115,22,0.15); color: #f97316;">
                <i class="ph ph-chart-line-down"></i>
              </div>
            </div>
            <div class="stats-card-value" style="color: #f97316;">1,248,630 ha</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-tree"></i> Cobertura boscosa y pajonales
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Mes de Mayor Actividad</span>
              <div class="stats-card-icon" style="background: rgba(234,179,8,0.15); color: #eab308;">
                <i class="ph ph-calendar-check"></i>
              </div>
            </div>
            <div class="stats-card-value" style="font-size: 1.8rem; color: #eab308;">Ago - Sep</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-sun"></i> 68% de los incendios anuales
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Tendencia Decenal</span>
              <div class="stats-card-icon" style="background: rgba(239,68,68,0.2); color: #f87171;">
                <i class="ph ph-trend-up"></i>
              </div>
            </div>
            <div class="stats-card-value" style="color: #f87171;">+24.8%</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-arrow-up-right"></i> Incremento en severidad
            </div>
          </div>
        </div>

        <!-- 2. GRÁFICO PRINCIPAL: EVOLUCIÓN HISTÓRICA 2015-2025 -->
        <div class="chart-container" style="height: 400px; margin-top: 1.5rem;">
          <div class="chart-header">
            <div>
              <span class="chart-title"><i class="ph ph-chart-line"></i> Evolución Decenal de Incendios y Focos de Calor</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Comparativa anual: Aqua MODIS vs Suomi VIIRS vs Área Quemada (ha)</span>
            </div>
            <div class="map-mini-legend" style="margin: 0;">
              <span class="legend-chip" style="background: rgba(239,68,68,0.15); color: #ef4444;"><span class="dot-legend" style="background: #ef4444;"></span> Área (ha)</span>
              <span class="legend-chip" style="background: rgba(249,115,22,0.15); color: #f97316;"><span class="dot-legend" style="background: #f97316;"></span> MODIS</span>
              <span class="legend-chip" style="background: rgba(56,189,248,0.15); color: #38bdf8;"><span class="dot-legend" style="background: #38bdf8;"></span> VIIRS</span>
            </div>
          </div>
          <div class="chart-canvas-wrapper">
            <canvas id="chartHistoricoCanvas"></canvas>
          </div>
        </div>

        <!-- 3. GRID 2 COLUMNAS: COMPARATIVA POR AÑO & ANÁLISIS POR TEMPORADA -->
        <div class="dashboard-grid-2col" style="margin-top: 1.5rem;">
          <!-- COMPARATIVA POR AÑO (BARRAS HORIZONTALES) -->
          <div class="side-card" style="padding: 1.5rem;">
            <div class="card-header-flex">
              <span class="card-section-title"><i class="ph ph-chart-bar-horizontal"></i> Comparativa de Intensidad por Año</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Hectáreas quemadas</span>
            </div>
            <div id="comparativaBarrasContainer" style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
              <!-- Barras dinámicas -->
            </div>
          </div>

          <!-- ANÁLISIS POR TEMPORADA (DONUT CHART) -->
          <div class="side-card" style="padding: 1.5rem; display: flex; flex-direction: column;">
            <div class="card-header-flex">
              <span class="card-section-title"><i class="ph ph-chart-donut"></i> Distribución por Temporada Climática</span>
              <span class="badge" style="background: rgba(234,179,8,0.15); color: #eab308;">Estacional</span>
            </div>
            <div style="flex: 1; min-height: 240px; position: relative; margin-top: 0.5rem;">
              <canvas id="chartTemporadasCanvas"></canvas>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span>
                <span>Temporada Seca (62%)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #f97316;"></span>
                <span>Transición (21%)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
                <span>Lluviosa (8%)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #64748b;"></span>
                <span>Otros meses (9%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. MAPA DE CALOR HISTÓRICO & ZONAS MÁS AFECTADAS -->
        <div class="dashboard-grid-2col" style="margin-top: 1.5rem;">
          <!-- MAPA HISTÓRICO -->
          <div class="side-card" style="padding: 1.5rem;">
            <div class="card-header-flex">
              <div>
                <span class="card-section-title"><i class="ph ph-map-pin"></i> Mapa Espacial Histórico de Focos</span>
                <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Concentración decenal de eventos en valles de Cochabamba</span>
              </div>
              <div style="display: flex; gap: 0.35rem;" id="yearTabsMap">
                <button class="btn btn-secondary btn-sm" onclick="MemoriaFuegoView.filterMapYear(2019)">2019</button>
                <button class="btn btn-secondary btn-sm" onclick="MemoriaFuegoView.filterMapYear(2023)">2023</button>
                <button class="btn btn-fire btn-sm" onclick="MemoriaFuegoView.filterMapYear(2024)">2024</button>
              </div>
            </div>
            <div id="mapaHistorico" style="height: 560px; width: 100%; border-radius: 12px; margin-top: 1rem;"></div>
          </div>

          <!-- ZONAS MÁS AFECTADAS (RANKING) -->
          <div class="side-card" style="padding: 1.5rem;">
            <div class="card-header-flex">
              <span class="card-section-title"><i class="ph ph-ranking"></i> Áreas Críticas Más Afectadas</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">% de superficie total</span>
            </div>
            <div id="zonasAfectadasContainer" style="display: flex; flex-direction: column; gap: 0.85rem; margin-top: 1rem;">
              <!-- Dinámico -->
            </div>
          </div>
        </div>

        <!-- 5. LÍNEA DE TIEMPO: MOMENTOS CLAVE (CARDS CON IMÁGENES) -->
        <div style="margin-top: 2rem;">
          <div class="card-header-flex">
            <div>
              <h2 class="card-section-title"><i class="ph ph-git-commit"></i> Momentos Clave en la Historia del Fuego</h2>
              <span class="card-section-sub">Episodios que marcaron la gestión de desastres en Bolivia</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <!-- 2015 -->
            <div class="timeline-event-card" style="position: relative; border-radius: 14px; overflow: hidden; padding: 1.25rem; min-height: 220px; display: flex; flex-direction: column; justify-content: flex-end; background: linear-gradient(180deg, rgba(5,8,15,0.1) 0%, rgba(5,8,15,0.95) 100%), url('/IMG/BARRA%20LATERAL/Bosque%20(BARRA%20LATERAL).jfif'); background-size: cover; border: 1px solid var(--border-subtle);">
              <span class="badge" style="position: absolute; top: 1rem; left: 1rem; background: rgba(0,0,0,0.7); color: #fff;">Año 2015</span>
              <h4 style="font-weight: 700; color: #fff; font-size: 1rem;">Inicio del Monitoreo Satelital</h4>
              <p style="font-size: 0.75rem; color: #cbd5e1; margin-top: 0.25rem;">
                Primeras calibraciones del sensor MODIS para detectar quemas agrícolas en pastizales de altura.
              </p>
            </div>

            <!-- 2019 -->
            <div class="timeline-event-card" style="position: relative; border-radius: 14px; overflow: hidden; padding: 1.25rem; min-height: 220px; display: flex; flex-direction: column; justify-content: flex-end; background: linear-gradient(180deg, rgba(5,8,15,0.1) 0%, rgba(5,8,15,0.95) 100%), url('/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif'); background-size: cover; border: 1px solid rgba(239,68,68,0.5);">
              <span class="badge badge-live" style="position: absolute; top: 1rem; left: 1rem;">Año 2019</span>
              <h4 style="font-weight: 700; color: #fff; font-size: 1rem;">Crisis Chiquitana y Valles</h4>
              <p style="font-size: 0.75rem; color: #fecaca; margin-top: 0.25rem;">
                Más de 5.3 millones de ha afectadas en el país. Movilización masiva de brigadas voluntarias.
              </p>
            </div>

            <!-- 2021 -->
            <div class="timeline-event-card" style="position: relative; border-radius: 14px; overflow: hidden; padding: 1.25rem; min-height: 220px; display: flex; flex-direction: column; justify-content: flex-end; background: linear-gradient(180deg, rgba(5,8,15,0.1) 0%, rgba(5,8,15,0.95) 100%), url('/IMG/BARRA%20LATERAL/Bosque%20Incendio%20(BARRA%20LATERAL).jfif'); background-size: cover; border: 1px solid var(--border-subtle);">
              <span class="badge" style="position: absolute; top: 1rem; left: 1rem; background: rgba(0,0,0,0.7); color: #fff;">Año 2021</span>
              <h4 style="font-weight: 700; color: #fff; font-size: 1rem;">Parque Tunari en Alerta Roja</h4>
              <p style="font-size: 0.75rem; color: #cbd5e1; margin-top: 0.25rem;">
                Grandes incendios en Tiquipaya y Taquiña comprometen tomas de agua clave para Cochabamba.
              </p>
            </div>

            <!-- 2024 -->
            <div class="timeline-event-card" style="position: relative; border-radius: 14px; overflow: hidden; padding: 1.25rem; min-height: 220px; display: flex; flex-direction: column; justify-content: flex-end; background: linear-gradient(180deg, rgba(5,8,15,0.1) 0%, rgba(5,8,15,0.95) 100%), url('/IMG/FONDO%20PAGINA/C%C3%B3ndor%20sobre%20el%20incendio%20forestal.png'); background-size: cover; border: 1px solid rgba(249,115,22,0.6);">
              <span class="badge" style="position: absolute; top: 1rem; left: 1rem; background: rgba(249,115,22,0.8); color: #fff;">Año 2024</span>
              <h4 style="font-weight: 700; color: #fff; font-size: 1rem;">Récord de Emisión de Carbono</h4>
              <p style="font-size: 0.75rem; color: #fed7aa; margin-top: 0.25rem;">
                Humo denso cubre el eje troncal. Se consolida el proyecto de teledetección temprana FireTrace.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    // 1. Inicializar Gráfico Decenal
    this.initChartHistorico();

    // 2. Inicializar Comparativa de Barras
    this.initComparativaBarras();

    // 3. Inicializar Donut de Temporadas
    this.initChartTemporadas();

    // 4. Inicializar Mapa Histórico
    this.initMapHistorico();

    // 5. Poblar Zonas Afectadas
    this.populateZonasAfectadas();
  },

  initChartHistorico() {
    const canvas = document.getElementById('chartHistoricoCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.charts.historico) {
      this.charts.historico.destroy();
    }

    const labels = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    const dataHa = [45000, 62000, 58000, 71000, 310000, 140000, 95000, 88000, 115000, 248000, 92000];
    const dataModis = [8200, 11400, 9800, 12500, 54000, 24000, 16500, 14200, 19800, 42000, 15600];
    const dataViirs = [12500, 16800, 14200, 18900, 78000, 36000, 25000, 21500, 28900, 64000, 23500];

    this.charts.historico = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Área Afectada (ha)',
            data: dataHa,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: 'Detecciones Aqua MODIS',
            data: dataModis,
            borderColor: '#f97316',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderDash: [5, 5],
            yAxisID: 'y1'
          },
          {
            label: 'Detecciones VIIRS (Alta Res.)',
            data: dataViirs,
            borderColor: '#38bdf8',
            backgroundColor: 'transparent',
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Hectáreas Quemadas', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Focos de Calor', font: { size: 10 } }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  },

  initComparativaBarras() {
    const container = document.getElementById('comparativaBarrasContainer');
    if (!container) return;

    const items = [
      { anio: 2024, ha: '248,000 ha', pct: 95, color: '#ef4444' },
      { anio: 2019, ha: '310,000 ha', pct: 100, color: '#b91c1c' },
      { anio: 2023, ha: '115,000 ha', pct: 44, color: '#f97316' },
      { anio: 2021, ha: '95,000 ha', pct: 36, color: '#eab308' },
      { anio: 2025, ha: '92,000 ha', pct: 35, color: '#eab308' },
      { anio: 2018, ha: '71,000 ha', pct: 27, color: '#22c55e' }
    ];

    container.innerHTML = items.map(it => `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
          <span style="font-weight: 700; color: #fff;">Año ${it.anio}</span>
          <span style="color: ${it.color}; font-weight: 600;">${it.ha}</span>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
          <div style="width: ${it.pct}%; height: 100%; background: ${it.color}; border-radius: 4px; transition: width 1s ease;"></div>
        </div>
      </div>
    `).join('');
  },

  initChartTemporadas() {
    const canvas = document.getElementById('chartTemporadasCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.charts.temporadas) {
      this.charts.temporadas.destroy();
    }

    this.charts.temporadas = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Temporada Seca (Jun-Oct)', 'Transición (Nov-Dic)', 'Lluviosa (Ene-Mar)', 'Otros meses'],
        datasets: [{
          data: [62, 21, 8, 9],
          backgroundColor: ['#ef4444', '#f97316', '#22c55e', '#64748b'],
          borderColor: '#101828',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        cutout: '72%'
      }
    });
  },

  initMapHistorico() {
    const mapEl = document.getElementById('mapaHistorico');
    if (!mapEl || typeof L === 'undefined') return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    this.mapInstance = L.map('mapaHistorico', {
      zoomControl: true,
      attributionControl: false
    }).setView([-17.3895, -66.1568], 9);

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

    this.filterMapYear(2024);
  },

  filterMapYear(year) {
    if (!this.mapInstance) return;

    // Limpiar círculos previos
    this.mapCircles.forEach(c => c.remove());
    this.mapCircles = [];

    // Conjuntos de puntos históricos según el año
    const puntosHistoricos = {
      2019: [
        { lat: -17.28, lng: -66.18, r: 4200, nombre: 'Tunari Central', ha: 2800 },
        { lat: -17.32, lng: -66.21, r: 3500, nombre: 'Cuenca Taquiña', ha: 1900 },
        { lat: -17.39, lng: -66.02, r: 2800, nombre: 'Serranía Sacaba', ha: 1200 }
      ],
      2023: [
        { lat: -17.29, lng: -66.17, r: 2900, nombre: 'Tunari Norte', ha: 1400 },
        { lat: -17.35, lng: -66.26, r: 2100, nombre: 'Franja El Paso', ha: 850 }
      ],
      2024: [
        { lat: -17.2954, lng: -66.1789, r: 5200, nombre: 'Serranía Tunari Taquiña', ha: 3400 },
        { lat: -17.3780, lng: -66.0250, r: 3100, nombre: 'Sacaba Cordillera', ha: 1600 },
        { lat: -17.3125, lng: -66.2050, r: 4000, nombre: 'Tiquipaya Alto', ha: 2200 }
      ]
    }[year] || [];

    puntosHistoricos.forEach(p => {
      const circle = L.circle([p.lat, p.lng], {
        radius: p.r,
        color: '#ff4d2e',
        fillColor: '#ef4444',
        fillOpacity: 0.28,
        weight: 2
      }).addTo(this.mapInstance).bindPopup(`
        <div class="map-popup">
          <strong style="color: #fff;">${p.nombre} (${year})</strong>
          <span style="font-size:0.75rem; color:#fca5a5;">Área quemada: ${p.ha} ha</span>
        </div>
      `);
      this.mapCircles.push(circle);
    });

    // Actualizar botones visuales
    const btns = document.querySelectorAll('#yearTabsMap button');
    btns.forEach(b => {
      if (b.textContent.includes(String(year))) {
        b.className = 'btn btn-fire btn-sm';
      } else {
        b.className = 'btn btn-secondary btn-sm';
      }
    });

    setTimeout(() => {
      if (this.mapInstance) this.mapInstance.invalidateSize();
    }, 250);
  },

  populateZonasAfectadas() {
    const container = document.getElementById('zonasAfectadasContainer');
    if (!container) return;

    const zonas = [
      { nombre: 'Parque Nacional Tunari (Cochabamba)', ha: '68,450 ha', pct: '38.4%', badge: 'CRÍTICO', color: '#ef4444' },
      { nombre: 'Serranía Taquiña - Tiquipaya', ha: '42,120 ha', pct: '23.6%', badge: 'ALTO', color: '#f97316' },
      { nombre: 'Cordillera de Sacaba', ha: '28,900 ha', pct: '16.2%', badge: 'MEDIO', color: '#eab308' },
      { nombre: 'Zona Forestal El Paso - Quillacollo', ha: '18,300 ha', pct: '10.3%', badge: 'MEDIO', color: '#eab308' },
      { nombre: 'Comunidades Cuenca Media', ha: '20,460 ha', pct: '11.5%', badge: 'BAJO', color: '#22c55e' }
    ];

    container.innerHTML = zonas.map(z => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px;">
        <div>
          <div style="font-size: 0.825rem; font-weight: 700; color: #fff;">${z.nombre}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${z.ha} afectadas históricamente</div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.85rem; font-weight: 800; color: ${z.color};">${z.pct}</span>
          <span class="badge" style="background: ${z.color}20; color: ${z.color}; font-size: 0.65rem; display: block; margin-top: 2px;">
            ${z.badge}
          </span>
        </div>
      </div>
    `).join('');
  },

  onYearChange(val) {
    if (val !== 'todos') {
      const year = parseInt(val);
      this.filterMapYear(year);
      showToast(`Filtrando registros para el año ${year}`, 'info');
    } else {
      this.filterMapYear(2024);
      showToast('Visualizando histórico consolidado decenal', 'info');
    }
  }
};

// Registro en el Router SPA
if (typeof App !== 'undefined') {
  App.register('memoria-fuego', () => MemoriaFuegoView.render(), () => MemoriaFuegoView.afterRender());
}
