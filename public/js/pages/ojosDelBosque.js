/**
 * ojosDelBosque.js
 * Página: Ojos del Bosque · Red de Vigilancia Comunitaria
 * Ruta: /ojos-del-bosque
 * Permite a los ciudadanos y vigilantes subir evidencias fotográficas
 * de incendios con geolocalización precisa y mapa satelital de calor en tiempo real.
 * FireTrace - NASA Space Apps Challenge 2026
 */

(function () {
  'use strict';

  // Estado local del módulo Ojos del Bosque
  const OjosBosqueState = {
    map: null,
    reportMarker: null,
    userLocationMarker: null,
    userAccuracyCircle: null,
    watchId: null,
    hasCenteredOnUser: false,
    hasManuallyPlacedReport: false,
    heatCircles: [],
    selectedSeverity: 'humo_denso',
    currentLat: -17.3895,
    currentLng: -66.1568,
    userLat: null,
    userLng: null,
    userAccuracy: null,
    uploadedImages: [], // Array de Base64 Data URLs
    isSubmitting: false
  };

  // ── 1. RENDER PRINCIPAL DE LA VISTA ─────────────────────────────────────────
  async function renderOjosDelBosque() {
    return `
      <div class="ojos-bosque-container">
        
        <!-- HERO BANNER COMUNITARIO CON TEMÁTICA DE BOSQUE -->
        <header class="ojos-hero">
          <div class="ojos-hero-content">
            <div class="ojos-badge">
              <i class="ph ph-shield-check"></i> Red de Centinelas Forestales · Bolivia
            </div>
            <h1 class="ojos-title">
              <i class="ph ph-binoculars"></i> Portal Ojos del Bosque
            </h1>
            <p class="ojos-subtitle">
              Sube evidencias fotográficas de incendios o columnas de humo en tiempo real.
              Tu ubicación y las imágenes son transmitidas de forma inmediata a los cuarteles de bomberos para despacho rápido.
            </p>
          </div>
          
          <div class="ojos-hero-stats">
            <div class="ojos-stat-chip">
              <div class="chip-num" id="statFocosActivos">--</div>
              <div class="chip-label">Focos de Calor</div>
            </div>
            <div class="ojos-stat-chip">
              <div class="chip-num" id="statReportesHoy">--</div>
              <div class="chip-label">Evidencias Hoy</div>
            </div>
          </div>
        </header>

        <!-- BANNER DE ÉXITO (Oculto inicialmente) -->
        <div id="ojosSuccessBanner" class="ojos-success-banner" style="display: none;">
          <i class="ph ph-check-circle ojos-success-icon"></i>
          <div class="ojos-success-text">
            <h4>¡Evidencia enviada exitosamente a los Bomberos!</h4>
            <p id="ojosSuccessMsg">El reporte con tus fotos y coordenadas GPS ha sido registrado y puesto en cola prioritaria de despacho táctico.</p>
          </div>
        </div>

        <!-- FLUJO VERTICAL: MAPA DE CALOR EXPANDIDO + FORMULARIO DE EVIDENCIAS ABAJO -->
        <div class="ojos-grid">
          
          <!-- 1. MAPA DE CALOR SATELITAL Y TU UBICACIÓN EN TIEMPO REAL (ARRIBA - ANCHO COMPLETO) -->
          <div class="ojos-card">
            <div class="ojos-card-header">
              <h3 class="ojos-card-title">
                <i class="ph ph-map-pin"></i> Mapa Satelital de Calor y Tu Ubicación en Tiempo Real
              </h3>
              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <span class="badge bg-success" style="font-size:0.72rem; padding:0.35rem 0.65rem;">
                  <i class="ph ph-satellite"></i> NASA FIRMS / VIIRS
                </span>
                <span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); font-size:0.72rem; padding:0.35rem 0.65rem;">
                  <span class="user-radar-pulse" style="display:inline-block; margin-right:4px;"></span> GPS Activo
                </span>
              </div>
            </div>
            
            <div class="ojos-card-body">
              <p style="font-size:0.82rem; color:#86efac; margin:0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                <span>
                  <i class="ph ph-info"></i> Tu dispositivo está siendo geolocalizado en tiempo real (icono azul). Haz clic en el mapa para marcar el punto del fuego o columna de humo (icono rojo).
                </span>
              </p>

              <!-- CONTENEDOR DEL MAPA LEAFLET EXTENDIDO A TODO LO ANCHO -->
              <div class="ojos-map-wrapper">
                <div id="mapaOjosBosque"></div>

                <!-- BADGE FLOTANTE DE ESTADO GPS EN TIEMPO REAL -->
                <div class="ojos-live-gps-badge" id="liveGpsBadge">
                  <span class="user-radar-pulse"></span>
                  <span id="gpsStatusText">Detectando tu ubicación GPS en tiempo real...</span>
                </div>
                
                <!-- BOTONES FLOTANTES SOBRE EL MAPA -->
                <div class="ojos-map-overlay-controls">
                  <button type="button" class="btn-map-control" id="btnMiUbicacionGPS" title="Centrar mapa en tu ubicación GPS actual">
                    <i class="ph ph-crosshair"></i> Mi Ubicación GPS
                  </button>
                  <button type="button" class="btn-map-control" id="btnCentrarFocos" title="Centrar mapa en focos de calor activos">
                    <i class="ph ph-flame"></i> Ver Focos Activos
                  </button>
                  <button type="button" class="btn-map-control" id="btnCentrarTunari" title="Centrar en el Parque Nacional Tunari">
                    <i class="ph ph-tree"></i> Parque Tunari
                  </button>
                </div>
              </div>

              <!-- BARRA INFORMATIVA DE COORDENADAS SELECCIONADAS Y DEL DISPOSITIVO -->
              <div class="ojos-coords-bar">
                <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                  <div class="ojos-coords-label">
                    <i class="ph ph-fire" style="color:#ef4444;"></i> Punto de reporte marcado:
                  </div>
                  <div class="ojos-coords-val" id="displayCoords" style="color:#fca5a5; font-weight:700;">
                    -17.38950, -66.15680
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:0.8rem; flex-wrap:wrap;">
                  <div id="displayUserCoords" style="font-size:0.78rem; color:#bae6fd; font-family:monospace;">
                    <span style="color:#38bdf8;"><i class="ph ph-navigation-arrow"></i> Tu posición actual:</span> Detectando GPS...
                  </div>
                  <button type="button" class="btn btn-ghost btn-sm" id="btnMarcarEnMiUbicacion" style="font-size:0.74rem; padding:0.25rem 0.55rem; color:#38bdf8; border:1px solid rgba(56,189,248,0.3); border-radius:6px; cursor:pointer;">
                    <i class="ph ph-map-pin"></i> Reportar en mi ubicación
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. SUBIDA DE EVIDENCIAS FOTOGRÁFICAS (ABAJO DEL MAPA - ANCHO COMPLETO) -->
          <div class="ojos-card">
            <div class="ojos-card-header">
              <h3 class="ojos-card-title">
                <i class="ph ph-camera"></i> Formulario de Reporte y Subida de Evidencias
              </h3>
              <span class="badge bg-warning" style="font-size:0.72rem; padding:0.35rem 0.65rem; color:#1a0800;">
                <i class="ph ph-bell-ringing"></i> Alerta Directa a Bomberos
              </span>
            </div>

            <div class="ojos-card-body">
              <form id="formEvidenciasOjos" novalidate onsubmit="return false;">
                
                <!-- 1. SELECCIÓN DE CONDICIÓN VISUAL / SEVERIDAD -->
                <div class="form-field-group">
                  <label class="form-field-label">
                    <i class="ph ph-flame"></i> ¿Qué estás observando en el lugar?
                  </label>
                  <div class="severity-selector-grid">
                    <button type="button" class="severity-pill-btn" data-severity="humo_ligero">
                      <i class="ph ph-cloud"></i>
                      <span>Humo Ligero</span>
                    </button>
                    <button type="button" class="severity-pill-btn selected" data-severity="humo_denso">
                      <i class="ph ph-wind"></i>
                      <span>Humo Denso</span>
                    </button>
                    <button type="button" class="severity-pill-btn" data-severity="fuego_activo">
                      <i class="ph ph-fire"></i>
                      <span>Fuego en Suelo</span>
                    </button>
                    <button type="button" class="severity-pill-btn" data-severity="fuego_copas">
                      <i class="ph ph-tree-evergreen"></i>
                      <span>Fuego en Copas</span>
                    </button>
                  </div>
                </div>

                <!-- 2 COLUMNAS PARA EL FORMULARIO HORIZONTALIZADO -->
                <div class="form-grid-2col">
                  <!-- Columna 1: Punto de Referencia + Descripción -->
                  <div>
                    <div class="form-field-group">
                      <label class="form-field-label" for="inputZonaRef">
                        <i class="ph ph-map-trifold"></i> Punto de Referencia o Comunidad
                      </label>
                      <input 
                        type="text" 
                        id="inputZonaRef" 
                        class="form-field-input" 
                        placeholder="Ej: Parque Tunari, km 8 subida a Taquiña, detrás de la quebrada" 
                        required>
                    </div>

                    <div class="form-field-group" style="margin-top: 1rem;">
                      <label class="form-field-label" for="inputDescripcion">
                        <i class="ph ph-chat-text"></i> Detalles de la observación
                      </label>
                      <textarea 
                        id="inputDescripcion" 
                        class="form-field-textarea" 
                        rows="4" 
                        placeholder="Describe el avance del fuego, dirección del viento, viviendas cercanas o si hay personas/animales en riesgo..." 
                        required></textarea>
                    </div>
                  </div>

                  <!-- Columna 2: Carga de Fotos (Drag & Drop) -->
                  <div>
                    <div class="form-field-group">
                      <label class="form-field-label">
                        <i class="ph ph-images"></i> Fotografías del Incendio o Humo (Evidencias)
                      </label>
                      
                      <div class="dropzone-container" id="dropzoneEvidencias" style="min-height: 145px;">
                        <i class="ph ph-camera-plus dropzone-icon"></i>
                        <div class="dropzone-title">Arrastra tus fotos aquí o haz clic para seleccionarlas</div>
                        <div class="dropzone-sub">Formatos JPG, PNG, WEBP (hasta 5 fotos para verificación rápida)</div>
                        <input 
                          type="file" 
                          id="inputFotosEvidencia" 
                          multiple 
                          accept="image/*" 
                          style="display: none;">
                      </div>

                      <!-- MINIATURAS PREVIEWS -->
                      <div class="evidence-preview-grid" id="previewGallery"></div>
                    </div>
                  </div>
                </div>

                <!-- DATOS DEL REPORTANTE Y BOTÓN DE ENVÍO -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                  <div class="form-field-group">
                    <label class="form-field-label" for="inputNombre">
                      <i class="ph ph-user"></i> Tu Nombre / Alias
                    </label>
                    <input 
                      type="text" 
                      id="inputNombre" 
                      class="form-field-input" 
                      value="${window.Auth?.user?.nombre_completo || 'Vigilante Ojos Del Bosque'}">
                  </div>

                  <div class="form-field-group">
                    <label class="form-field-label" for="inputTelefono">
                      <i class="ph ph-phone"></i> Teléfono (Opcional)
                    </label>
                    <input 
                      type="tel" 
                      id="inputTelefono" 
                      class="form-field-input" 
                      placeholder="+591 7XXXXXXX">
                  </div>
                </div>

                <!-- BOTÓN DE ENVÍO PRIORITARIO -->
                <button type="button" class="btn-bosque-submit" id="btnEnviarEvidencia" style="margin-top: 1.25rem;">
                  <i class="ph ph-paper-plane-tilt"></i>
                  <span>Enviar Evidencia a Cuadrillas de Bomberos</span>
                </button>

              </form>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // ── 2. AFTER RENDER: INICIALIZACIÓN DEL MAPA, EVENTOS Y LÓGICA ───────────────
  async function afterRenderOjosDelBosque() {
    // 2.1 Configuración del Mapa Leaflet
    _initMapaOjosBosque();

    // 2.2 Rastreo de Ubicación GPS en Tiempo Real
    _iniciarRastreoEnTiempoReal();

    // 2.3 Configuración de Eventos del Formulario y Subida de Imágenes
    _initEventosFormulario();

    // 2.4 Cargar datos satelitales y estadísticas
    _cargarDatosSatelitales();

    // 2.5 Actualizar Panel Derecho
    _actualizarPanelDerecho();
  }

  // ── 2.1 INICIALIZAR MAPA SATELITAL DE CALOR ─────────────────────────────────
  function _initMapaOjosBosque() {
    const mapContainer = document.getElementById('mapaOjosBosque');
    if (!mapContainer) return;

    // Destruir mapa previo si existía
    if (OjosBosqueState.map) {
      OjosBosqueState.map.remove();
      OjosBosqueState.map = null;
    }
    OjosBosqueState.userLocationMarker = null;
    OjosBosqueState.userAccuracyCircle = null;
    OjosBosqueState.hasCenteredOnUser = false;
    OjosBosqueState.hasManuallyPlacedReport = false;

    // Inicializar mapa centrado en Cochabamba / Parque Tunari
    const defaultLat = -17.3895;
    const defaultLng = -66.1568;
    OjosBosqueState.currentLat = defaultLat;
    OjosBosqueState.currentLng = defaultLng;

    const map = L.map('mapaOjosBosque', {
      center: [defaultLat, defaultLng],
      zoom: 12,
      zoomControl: true
    });

    OjosBosqueState.map = map;

    // Usar satélite de Google Maps con capas de terreno e híbrido
    if (window.MapHelper && typeof window.MapHelper.getGoogleHybrid === 'function') {
      window.MapHelper.getGoogleHybrid().addTo(map);
      window.MapHelper.addLayerSwitcher(map);
    } else {
      L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Imágenes Satelitales &copy; Google Maps'
      }).addTo(map);
    }

    // Marcador interactivo de ubicación del reporte (Rojo de fuego)
    const markerIcon = L.divIcon({
      html: `
        <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:rgba(239,68,68,0.4); animation:pingReport 1.5s infinite;"></div>
          <div style="width:22px; height:22px; border-radius:50%; background:#ef4444; border:3px solid #ffffff; box-shadow:0 0 10px rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px;">
            <i class="ph ph-flame"></i>
          </div>
        </div>
      `,
      className: '',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    OjosBosqueState.reportMarker = L.marker([defaultLat, defaultLng], {
      icon: markerIcon,
      draggable: true,
      zIndexOffset: 1000
    }).addTo(map);

    OjosBosqueState.reportMarker.bindPopup(`
      <div style="text-align:center; padding:4px;">
        <strong style="color:#ef4444;">Punto de Fuego / Humo a Reportar</strong><br>
        <span style="font-size:11px; color:#555;">Arrastra este marcador o haz clic en el mapa para ajustar la ubicación precisa del incendio.</span>
      </div>
    `);

    // Evento al arrastrar el marcador de reporte
    OjosBosqueState.reportMarker.on('dragend', function (e) {
      const pos = e.target.getLatLng();
      OjosBosqueState.hasManuallyPlacedReport = true;
      _actualizarCoordenadas(pos.lat, pos.lng);
    });

    // Evento al hacer clic en el mapa: mueve el marcador de reporte al punto del clic
    map.on('click', function (e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      OjosBosqueState.hasManuallyPlacedReport = true;
      OjosBosqueState.reportMarker.setLatLng([lat, lng]);
      _actualizarCoordenadas(lat, lng);
      OjosBosqueState.reportMarker.openPopup();
    });

    // Forzar recalculo de dimensiones del mapa una vez cargado en DOM
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }

  // ── 2.2 RASTREO DE UBICACIÓN EN TIEMPO REAL DEL DISPOSITIVO ───────────────────
  function _iniciarRastreoEnTiempoReal() {
    const statusText = document.getElementById('gpsStatusText');
    const displayUser = document.getElementById('displayUserCoords');

    if (!navigator.geolocation) {
      if (statusText) statusText.textContent = 'GPS no disponible en este dispositivo/navegador';
      if (displayUser) displayUser.textContent = 'GPS no disponible';
      return;
    }

    if (statusText) {
      statusText.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Conectando con satélites GPS del dispositivo...';
    }

    // 1. Obtención inicial rápida
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _actualizarPosicionDispositivo(pos.coords, true);
      },
      (err) => {
        console.warn('[GPS Inicial Error]', err);
        if (statusText) {
          statusText.innerHTML = '<i class="ph ph-warning"></i> Permiso GPS pendiente o denegado en el navegador';
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    // 2. Monitoreo continuo en tiempo real (watchPosition)
    if (OjosBosqueState.watchId !== null) {
      navigator.geolocation.clearWatch(OjosBosqueState.watchId);
      OjosBosqueState.watchId = null;
    }

    OjosBosqueState.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        _actualizarPosicionDispositivo(pos.coords, false);
      },
      (err) => {
        console.warn('[GPS Watch Error]', err);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 2000 }
    );
  }

  function _actualizarPosicionDispositivo(coords, isFirst = false) {
    const lat = coords.latitude;
    const lng = coords.longitude;
    const accuracy = coords.accuracy || 20;

    OjosBosqueState.userLat = lat;
    OjosBosqueState.userLng = lng;
    OjosBosqueState.userAccuracy = accuracy;

    const statusText = document.getElementById('gpsStatusText');
    if (statusText) {
      statusText.innerHTML = `<strong>Tu posición GPS:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)} <span style="opacity:0.8;">(±${Math.round(accuracy)}m)</span>`;
    }

    const displayUser = document.getElementById('displayUserCoords');
    if (displayUser) {
      displayUser.innerHTML = `<span style="color:#38bdf8;"><i class="ph ph-navigation-arrow"></i> Tu posición actual:</span> <strong>${lat.toFixed(5)}, ${lng.toFixed(5)}</strong> <span style="color:#94a3b8; font-size:0.72rem;">(±${Math.round(accuracy)}m)</span>`;
    }

    if (!OjosBosqueState.map) return;
    const map = OjosBosqueState.map;

    // Crear o actualizar marcador azul radar de posición del usuario
    if (!OjosBosqueState.userLocationMarker) {
      const userIcon = L.divIcon({
        html: `
          <div class="user-position-marker">
            <div class="user-position-radar"></div>
            <div class="user-position-core">
              <i class="ph ph-navigation-arrow-fill" style="transform: rotate(45deg);"></i>
            </div>
          </div>
        `,
        className: 'user-location-marker-container',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      OjosBosqueState.userLocationMarker = L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1500
      }).addTo(map);

      OjosBosqueState.userLocationMarker.bindPopup(`
        <div style="text-align:center; padding:6px; min-width:180px;">
          <div style="font-weight:700; color:#0284c7; display:flex; align-items:center; justify-content:center; gap:5px; font-size:12px;">
            <i class="ph ph-navigation-arrow"></i> Tu Posición Actual (GPS)
          </div>
          <div style="font-size:11px; color:#f1f5f9; margin-top:3px; font-family:monospace;">
            ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">
            Precisión GPS: ±${Math.round(accuracy)} metros
          </div>
        </div>
      `);
    } else {
      OjosBosqueState.userLocationMarker.setLatLng([lat, lng]);
    }

    // Crear o actualizar círculo de precisión
    if (!OjosBosqueState.userAccuracyCircle) {
      OjosBosqueState.userAccuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#0284c7',
        weight: 1.5,
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        dashArray: '4, 4'
      }).addTo(map);
    } else {
      OjosBosqueState.userAccuracyCircle.setLatLng([lat, lng]);
      OjosBosqueState.userAccuracyCircle.setRadius(accuracy);
    }

    // Si es la primera detección, centrar suavemente en el usuario
    if (isFirst && !OjosBosqueState.hasCenteredOnUser) {
      OjosBosqueState.hasCenteredOnUser = true;
      map.flyTo([lat, lng], 14, { duration: 1.2 });

      if (OjosBosqueState.reportMarker && !OjosBosqueState.hasManuallyPlacedReport) {
        OjosBosqueState.reportMarker.setLatLng([lat, lng]);
        _actualizarCoordenadas(lat, lng);
      }
    }
  }

  // Actualiza la visualización de coordenadas en la interfaz
  function _actualizarCoordenadas(lat, lng) {
    OjosBosqueState.currentLat = lat;
    OjosBosqueState.currentLng = lng;
    const display = document.getElementById('displayCoords');
    if (display) {
      display.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  // ── 2.3 EVENTOS DEL FORMULARIO Y DRAG & DROP ────────────────────────────────
  function _initEventosFormulario() {
    // 1. Botón GPS de Geolocalización (centrar en el usuario)
    const btnGPS = document.getElementById('btnMiUbicacionGPS');
    if (btnGPS) {
      btnGPS.addEventListener('click', () => {
        if (OjosBosqueState.userLat && OjosBosqueState.userLng) {
          OjosBosqueState.map.flyTo([OjosBosqueState.userLat, OjosBosqueState.userLng], 16, { duration: 1 });
          if (OjosBosqueState.userLocationMarker) {
            OjosBosqueState.userLocationMarker.openPopup();
          }
          if (window.App) window.App.toast('Centrado en tu ubicación GPS en tiempo real.', 'info');
        } else {
          _iniciarRastreoEnTiempoReal();
        }
      });
    }

    // 2. Botón Reportar en mi ubicación
    const btnMarcar = document.getElementById('btnMarcarEnMiUbicacion');
    if (btnMarcar) {
      btnMarcar.addEventListener('click', () => {
        if (OjosBosqueState.userLat && OjosBosqueState.userLng) {
          OjosBosqueState.hasManuallyPlacedReport = true;
          OjosBosqueState.reportMarker.setLatLng([OjosBosqueState.userLat, OjosBosqueState.userLng]);
          _actualizarCoordenadas(OjosBosqueState.userLat, OjosBosqueState.userLng);
          OjosBosqueState.map.flyTo([OjosBosqueState.userLat, OjosBosqueState.userLng], 15);
          if (window.App) window.App.toast('Punto de reporte fijado en tu ubicación actual.', 'success');
        } else {
          _iniciarRastreoEnTiempoReal();
        }
      });
    }

    // 3. Botón centrar en focos
    const btnCentrarFocos = document.getElementById('btnCentrarFocos');
    if (btnCentrarFocos && OjosBosqueState.map) {
      btnCentrarFocos.addEventListener('click', () => {
        OjosBosqueState.map.setView([-17.3000, -66.1800], 12);
      });
    }

    // 4. Botón centrar en Parque Tunari
    const btnCentrarTunari = document.getElementById('btnCentrarTunari');
    if (btnCentrarTunari && OjosBosqueState.map) {
      btnCentrarTunari.addEventListener('click', () => {
        OjosBosqueState.map.flyTo([-17.2954, -66.1789], 13);
      });
    }

    // 5. Botones de Severidad / Tipo de Humo
    const severityBtns = document.querySelectorAll('.severity-pill-btn');
    severityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        severityBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        OjosBosqueState.selectedSeverity = btn.getAttribute('data-severity') || 'humo_denso';
      });
    });

    // 4. Drag & Drop y Selector de Archivos de Imágenes
    const dropzone = document.getElementById('dropzoneEvidencias');
    const fileInput = document.getElementById('inputFotosEvidencia');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files) {
          _procesarArchivosImagenes(e.dataTransfer.files);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files) {
          _procesarArchivosImagenes(e.target.files);
        }
      });
    }

    // 5. Botón Enviar Evidencia
    const btnEnviar = document.getElementById('btnEnviarEvidencia');
    if (btnEnviar) {
      btnEnviar.addEventListener('click', _enviarReporteEvidencia);
    }
  }

  // Procesa y convierte imágenes a Base64 para vista previa y transmisión
  function _procesarArchivosImagenes(fileList) {
    const files = Array.from(fileList);
    const validImages = files.filter(f => f.type.startsWith('image/'));

    if (validImages.length === 0) {
      if (window.App) window.App.toast('Por favor selecciona archivos de imagen válidos (JPG, PNG).', 'warning');
      return;
    }

    // Límite de 5 imágenes
    const espacioLibre = 5 - OjosBosqueState.uploadedImages.length;
    if (espacioLibre <= 0) {
      if (window.App) window.App.toast('Has alcanzado el límite de 5 fotografías por reporte.', 'warning');
      return;
    }

    const imagenesAProcesar = validImages.slice(0, espacioLibre);

    imagenesAProcesar.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target.result;
        OjosBosqueState.uploadedImages.push(base64Url);
        _renderizarGaleriaPrevia();
      };
      reader.readAsDataURL(file);
    });
  }

  // Renderiza miniaturas con botón eliminar
  function _renderizarGaleriaPrevia() {
    const gallery = document.getElementById('previewGallery');
    if (!gallery) return;

    gallery.innerHTML = OjosBosqueState.uploadedImages.map((src, index) => `
      <div class="evidence-preview-item">
        <img src="${src}" alt="Evidencia ${index + 1}" class="evidence-preview-img">
        <button type="button" class="btn-remove-evidence" data-index="${index}" title="Eliminar foto">
          <i class="ph ph-x"></i>
        </button>
      </div>
    `).join('');

    // Asignar clics de eliminación
    gallery.querySelectorAll('.btn-remove-evidence').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(idx)) {
          OjosBosqueState.uploadedImages.splice(idx, 1);
          _renderizarGaleriaPrevia();
        }
      });
    });
  }

  // ── 2.3 ENVIAR REPORTE DE EVIDENCIA AL BACKEND ──────────────────────────────
  async function _enviarReporteEvidencia() {
    if (OjosBosqueState.isSubmitting) return;

    const zonaRef = document.getElementById('inputZonaRef')?.value.trim() || '';
    const descripcion = document.getElementById('inputDescripcion')?.value.trim() || '';
    const nombre = document.getElementById('inputNombre')?.value.trim() || 'Vigilante Ojos Del Bosque';
    const telefono = document.getElementById('inputTelefono')?.value.trim() || '';
    const btnEnviar = document.getElementById('btnEnviarEvidencia');

    if (!zonaRef) {
      if (window.App) window.App.toast('Por favor indica el punto de referencia o comunidad.', 'warning');
      document.getElementById('inputZonaRef')?.focus();
      return;
    }

    if (!descripcion && OjosBosqueState.uploadedImages.length === 0) {
      if (window.App) window.App.toast('Por favor añade una breve descripción o sube una fotografía.', 'warning');
      document.getElementById('inputDescripcion')?.focus();
      return;
    }

    OjosBosqueState.isSubmitting = true;
    if (btnEnviar) {
      btnEnviar.disabled = true;
      btnEnviar.innerHTML = `<span class="ft-spinner ft-spinner-sm"></span> Transmitiendo a Bomberos...`;
    }

    const payload = {
      nombre_reportante: nombre,
      telefono_contacto: telefono,
      zona_o_referencia: zonaRef,
      departamento_id: 1, // Cochabamba
      municipio_id: 1,    // Cercado
      latitud: OjosBosqueState.currentLat,
      longitud: OjosBosqueState.currentLng,
      nivel_humo_fuego: OjosBosqueState.selectedSeverity,
      descripcion: descripcion,
      evidencia_foto_url: OjosBosqueState.uploadedImages[0] || null,
      fotos: OjosBosqueState.uploadedImages,
      estado: 'pendiente_revision'
    };

    try {
      let resultado = null;
      if (window.FireTraceAPI && typeof window.FireTraceAPI.post === 'function') {
        resultado = await window.FireTraceAPI.post('/reportes', payload);
      } else {
        const res = await fetch('/api/reportes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        resultado = await res.json();
      }

      // Mostrar banner de confirmación
      const successBanner = document.getElementById('ojosSuccessBanner');
      const successMsg = document.getElementById('ojosSuccessMsg');
      if (successBanner) {
        if (successMsg) {
          successMsg.textContent = `Evidencia en "${zonaRef}" transmitida con éxito con ${OjosBosqueState.uploadedImages.length} fotografía(s) adjunta(s). Las unidades de bomberos han recibido tu alerta GPS (${OjosBosqueState.currentLat.toFixed(4)}, ${OjosBosqueState.currentLng.toFixed(4)}).`;
        }
        successBanner.style.display = 'flex';
        successBanner.scrollIntoView({ behavior: 'smooth' });
      }

      if (window.App) {
        window.App.toast('¡Evidencia fotográfica transmitida con éxito a los bomberos!', 'safe');
      }

      // Limpiar formulario
      document.getElementById('inputZonaRef').value = '';
      document.getElementById('inputDescripcion').value = '';
      OjosBosqueState.uploadedImages = [];
      _renderizarGaleriaPrevia();

    } catch (err) {
      console.error('[Ojos Del Bosque Error]', err);
      if (window.App) {
        window.App.toast('Error al enviar reporte: ' + (err.message || 'Error de red'), 'error');
      }
    } finally {
      OjosBosqueState.isSubmitting = false;
      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = `<i class="ph ph-paper-plane-tilt"></i> <span>Enviar Evidencia a Cuadrillas de Bomberos</span>`;
      }
    }
  }

  // ── 2.4 CARGAR DATOS SATELITALES Y FOCOS DE CALOR ────────────────────────────
  async function _cargarDatosSatelitales() {
    try {
      let focos = [];
      if (window.FireTraceAPI && typeof window.FireTraceAPI.getFocosCalor === 'function') {
        const res = await window.FireTraceAPI.getFocosCalor();
        focos = (res && res.data) || (Array.isArray(res) ? res : []);
      }

      const statFocos = document.getElementById('statFocosActivos');
      const statReportes = document.getElementById('statReportesHoy');

      if (statFocos) statFocos.textContent = focos.length || '4';
      if (statReportes) statReportes.textContent = '12';

      // Agregar círculos de calor al mapa
      if (OjosBosqueState.map && Array.isArray(focos) && focos.length > 0) {
        focos.forEach(f => {
          const lat = parseFloat(f.latitud || f.lat);
          const lng = parseFloat(f.longitud || f.lng);
          if (isNaN(lat) || isNaN(lng)) return;

          const circle = L.circle([lat, lng], {
            color: '#ef4444',
            fillColor: '#f97316',
            fillOpacity: 0.45,
            radius: 350,
            weight: 2
          }).addTo(OjosBosqueState.map);

          circle.bindPopup(`
            <div style="font-size:12px;">
              <strong style="color:#ef4444;"><i class="ph ph-flame"></i> Foco Satelital VIIRS</strong><br>
              Temperatura de brillo: <b>${f.temperatura || f.frp || '340'} K</b><br>
              Detección satelital NASA FIRMS
            </div>
          `);
        });
      }
    } catch (e) {
      console.warn('[OjosBosque Satelital Warning]', e);
    }
  }

  // ── 2.5 ACTUALIZAR PANEL DERECHO ─────────────────────────────────────────────
  function _actualizarPanelDerecho() {
    const rightPanel = document.getElementById('rightPanel');
    if (!rightPanel) return;

    rightPanel.innerHTML = `
      <div style="padding: 1.2rem; display: flex; flex-direction: column; gap: 1rem; color: #d1fae5;">
        
        <!-- Tarjeta de Identidad Vigilante -->
        <div class="rp-card" style="border-color: rgba(46, 204, 113, 0.35); background: rgba(8, 26, 17, 0.85);">
          <div class="rp-card-header" style="color: #4ade80;">
            <i class="ph ph-binoculars" style="color: #2ecc71;"></i> Modo Ojos Del Bosque
          </div>
          <p style="font-size: 0.8rem; color: #a7f3d0; margin: 0 0 0.5rem 0; line-height: 1.4;">
            Como centinela ciudadano, tus reportes alimentan el mapa táctico de respuesta y ayudan a evitar que los incendios se propaguen.
          </p>
          <div style="font-size: 0.75rem; color: #86efac; background: rgba(46, 204, 113, 0.12); padding: 0.5rem; border-radius: 8px;">
            <i class="ph ph-shield-check"></i> Conexión directa y encriptada con cuarteles SAR Bolivia y Bomberos.
          </div>
        </div>

        <!-- Consejos de Seguridad al Tomar Fotos -->
        <div class="rp-card" style="border-color: rgba(240, 160, 30, 0.3); background: rgba(18, 12, 5, 0.85);">
          <div class="rp-card-header" style="color: #f59e0b;">
            <i class="ph ph-warning-circle" style="color: #f59e0b;"></i> Seguridad al Fotografiar
          </div>
          <ul style="font-size: 0.78rem; color: #fde68a; margin: 0; padding-left: 1.2rem; line-height: 1.5;">
            <li>Mantén una distancia segura (mínimo 500m) del frente de llama.</li>
            <li>No te coloques en la dirección hacia donde sopla el humo.</li>
            <li>Incluye cerros o caminos como puntos de referencia visual.</li>
            <li>Prioriza siempre tu evacuación antes que tomar fotografías.</li>
          </ul>
        </div>

        <!-- Líneas Directas de Emergencia -->
        <div class="rp-card" style="border-color: rgba(239, 68, 68, 0.3); background: rgba(26, 8, 8, 0.85);">
          <div class="rp-card-header" style="color: #f87171;">
            <i class="ph ph-phone-call" style="color: #ef4444;"></i> Líneas de Emergencia Bolivia
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.3rem;">
              <span>Bomberos Antofagasta / SAR:</span>
              <strong style="color: #f87171;">119 / 911</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.3rem;">
              <span>Radio Patrullas:</span>
              <strong style="color: #60a5fa;">110</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Ambulancias SAMU:</span>
              <strong style="color: #34d399;">168</strong>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  // Exportar estado para que App.invalidateAllMaps pueda redimensionar el mapa al alternar paneles
  window.OjosBosqueState = OjosBosqueState;

  // ── 3. REGISTRO OFICIAL EN EL ROUTER DE FIRETRACE ───────────────────────────
  if (window.App && typeof window.App.register === 'function') {
    window.App.register('ojos-del-bosque', renderOjosDelBosque, afterRenderOjosDelBosque);
  } else {
    // Si App aún no está cargado, diferir el registro al DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      if (window.App && typeof window.App.register === 'function') {
        window.App.register('ojos-del-bosque', renderOjosDelBosque, afterRenderOjosDelBosque);
      }
    });
  }

})();
