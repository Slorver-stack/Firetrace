/**
 * FireTrace - Monitor de Incendios Bolivia
 * NASA Space Apps Challenge 2026
 * Proveedor de Capas de Google Maps en Tiempo Real (mapHelper.js)
 */

(function () {
  'use strict';

  const MapHelper = {
    /**
     * Capa Google Maps Híbrida (Satélite de alta resolución + Nombres de ciudades, vías y límites en tiempo real)
     */
    getGoogleHybrid() {
      return L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Imágenes Satelitales en Tiempo Real &copy; Google Maps &middot; NASA FIRMS &middot; FireTrace'
      });
    },

    /**
     * Capa Google Maps Satélite puro
     */
    getGoogleSatellite() {
      return L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Satélite &copy; Google Maps'
      });
    },

    /**
     * Capa Google Maps Callejero / Rutas
     */
    getGoogleRoadmap() {
      return L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Rutas &copy; Google Maps'
      });
    },

    /**
     * Capa Google Maps Relieve y Curvas de Nivel
     */
    getGoogleTerrain() {
      return L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Topografía &copy; Google Maps'
      });
    },

    /**
     * Capa CartoDB Dark Matter (Modo oscuro táctico)
     */
    getDarkMatter() {
      return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap, &copy; CARTO'
      });
    },

    /**
     * Añade selector de capas de Google Maps a un mapa Leaflet existente
     * @param {L.Map} map
     * @param {Object} [overlays] Capas superpuestas opcionales (focos, perímetros, etc.)
     */
    addLayerSwitcher(map, overlays = {}) {
      if (!map || typeof L === 'undefined') return;

      const hybrid = this.getGoogleHybrid();
      const satellite = this.getGoogleSatellite();
      const roads = this.getGoogleRoadmap();
      const terrain = this.getGoogleTerrain();
      const dark = this.getDarkMatter();

      const baseLayers = {
        '🛰️ Google Maps Satélite Híbrido': hybrid,
        '🌍 Google Maps Satélite Puro': satellite,
        '🗺️ Google Maps Callejero': roads,
        '⛰️ Google Maps Relieve y Terreno': terrain,
        '🌓 Modo Táctico Oscuro': dark
      };

      L.control.layers(baseLayers, overlays, {
        position: 'topright',
        collapsed: true
      }).addTo(map);

      // Si no tiene capa base activa, añadir híbrido por defecto
      let hasBase = false;
      map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) hasBase = true;
      });
      if (!hasBase) {
        hybrid.addTo(map);
      }
    },

    /**
     * Crea una capa de mapa de calor térmica (L.heatLayer) con gradiente de fuego
     * Soporta tanto Array de puntos [lat, lng, intensidad] como URL del endpoint (p. ej. '/api/focos-calor/heatmap')
     * @param {Array<Array<number>>|string} points Array de [lat, lng, intensidad] o URL
     * @param {Object} [options]
     * @returns {L.Layer|Promise<L.Layer>|null}
     */
    createHeatmapLayer(points = [], options = {}) {
      if (typeof L === 'undefined' || typeof L.heatLayer !== 'function') {
        console.warn('[MapHelper] Leaflet.heat no está disponible.');
        return typeof points === 'string' ? Promise.resolve(null) : null;
      }

      const defaultOptions = {
        radius: 26,
        blur: 16,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.35,
        gradient: {
          0.15: '#22c55e', // Verde (temperatura normal / biomasa fría)
          0.35: '#eab308', // Amarillo (anomalía térmica incipiente < 20 MW)
          0.60: '#f97316', // Naranja (foco de calor activo 20 - 60 MW)
          0.85: '#ef4444', // Rojo (incendio crítico > 60 MW)
          1.00: '#991b1b'  // Rojo granate intenso (frente descontrolado)
        }
      };

      if (typeof points === 'string') {
        return fetch(points)
          .then(res => res.json())
          .then(data => {
            const pts = data.points || data.heatmapPoints || (Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
            return L.heatLayer(pts, { ...defaultOptions, ...options });
          })
          .catch(err => {
            console.warn('[MapHelper] Error cargando puntos de mapa de calor:', err);
            return null;
          });
      }

      return L.heatLayer(points, { ...defaultOptions, ...options });
    },

    /**
     * Crea un enlace de navegación directa en Google Maps
     * @param {number} lat
     * @param {number} lng
     * @param {number} [zoom=15]
     * @returns {string}
     */
    getGoogleMapsUrl(lat, lng, zoom = 15) {
      return `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`;
    },

    /**
     * Crea un enlace de ruta en tiempo real en Google Maps
     * @param {number} destLat
     * @param {number} destLng
     * @param {number} [origLat]
     * @param {number} [origLng]
     * @returns {string}
     */
    getGoogleMapsDirectionsUrl(destLat, destLng, origLat = null, origLng = null) {
      if (origLat && origLng) {
        return `https://www.google.com/maps/dir/?api=1&origin=${origLat},${origLng}&destination=${destLat},${destLng}&travelmode=driving`;
      }
      return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    }
  };

  window.MapHelper = MapHelper;
})();
