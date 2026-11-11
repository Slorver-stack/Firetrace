/**
 * FireTrace - Monitor de Incendios Bolivia
 * NASA Space Apps Challenge 2026
 * Cliente Supabase y Wrapper de API Backend (supabase.js)
 */

(function () {
  'use strict';

  // Configuración de Supabase
  const SUPABASE_URL = 'https://drviqnxgfcdhaawsixgn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_JhWh2cXjyurbh8zPeXGvLQ_nYyg_2LF';

  // Instanciación del cliente Supabase si el SDK está cargado
  let supabaseClient = null;
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('[FireTrace Supabase] SDK no disponible en el entorno global.');
  }

  // Wrapper de llamadas API hacia el backend Node.js (/api)
  const FireTraceAPI = {
    baseUrl: '/api',

    _buildUrl(endpoint, params = null) {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      let url = `${this.baseUrl}${cleanEndpoint}`;
      if (params && typeof params === 'object') {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, val);
          }
        });
        const qs = query.toString();
        if (qs) url += `?${qs}`;
      }
      return url;
    },

    async _request(url, options = {}) {
      try {
        const defaults = {
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        };
        const config = { ...defaults, ...options };
        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
          config.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, config);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error((data && data.error) || (data && data.message) || `Error HTTP ${response.status}`);
        }

        return data;
      } catch (err) {
        console.error(`[FireTraceAPI Error] ${options.method || 'GET'} ${url}:`, err);
        throw err;
      }
    },

    async get(endpoint, params = null) {
      const url = this._buildUrl(endpoint, params);
      return this._request(url, { method: 'GET' });
    },

    async post(endpoint, body = {}) {
      const url = this._buildUrl(endpoint);
      return this._request(url, { method: 'POST', body });
    },

    async put(endpoint, body = {}) {
      const url = this._buildUrl(endpoint);
      return this._request(url, { method: 'PUT', body });
    },

    async delete(endpoint) {
      const url = this._buildUrl(endpoint);
      return this._request(url, { method: 'DELETE' });
    },

    // ── MÉTODOS DE DATOS DE INCENDIOS ──────────────────────────
    async getIncendios(params = {}) {
      const res = await this.get('/incendios', params);
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getIncendiosActivos() {
      const res = await this.get('/incendios/activos');
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getIncendioVivo() {
      const res = await this.get('/incendios/vivo');
      return (res && res.data !== undefined) ? res.data : res;
    },

    async getIncendioById(id) {
      const res = await this.get(`/incendios/${id}`);
      return (res && res.data !== undefined) ? res.data : res;
    },

    async createIncendio(data) {
      return this.post('/incendios', data);
    },

    async updateIncendio(id, data) {
      return this.put(`/incendios/${id}`, data);
    },

    async getEvolucion(id) {
      const res = await this.get(`/incendios/${id}/evolucion`);
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    // ── RECURSOS, ZONAS Y RUTAS ────────────────────────────────
    async getZonas() {
      const res = await this.get('/zonas');
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getRecursos(incendioId = null, tipo = null) {
      const params = {};
      if (incendioId) params.incendio_id = incendioId;
      if (tipo) params.tipo = tipo;
      const res = await this.get('/recursos', params);
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getRutas(incendioId) {
      const res = await this.get(`/rutas/${incendioId}`);
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getMeteorologiaZona(zonaId) {
      const res = await this.get(`/meteorologia/${zonaId}`);
      return (res && res.data !== undefined) ? res.data : res;
    },

    async getUsuariosCercanos(lat, lng, radio = 15) {
      const res = await this.get('/usuarios/cercanos', { lat, lng, radio });
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    // ── ALERTAS Y NOTIFICACIONES ───────────────────────────────
    async getAlertas(params = {}) {
      const res = await this.get('/alertas', params);
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getAlertasActivas() {
      return this.getAlertas({ activa: true });
    },

    async createAlerta(data) {
      return this.post('/alertas', data);
    },

    async desactivarAlerta(id) {
      return this.put(`/alertas/${id}`, { activa: false });
    },

    async marcarAlertaLeida(id) {
      return this.post(`/alertas/${id}/leer`);
    },

    // ── REPORTES Y VOLUNTARIADO ────────────────────────────────
    async getReportes(params = {}) {
      const res = await this.get('/reportes', params);
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async updateReporte(id, data) {
      return this.put(`/reportes/${id}`, data);
    },

    async getVoluntariado() {
      const res = await this.get('/voluntariado');
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getHistorias() {
      const res = await this.get('/historias');
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getVigilancia() {
      const res = await this.get('/vigilancia');
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    // ── USUARIOS (ADMIN) ───────────────────────────────────────
    async getUsuarios() {
      const res = await this.get('/usuarios');
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async createUsuario(data) {
      return this.post('/usuarios', data);
    },

    async updateUsuario(id, data) {
      return this.put(`/usuarios/${id}`, data);
    },

    async deleteUsuario(id) {
      return this.delete(`/usuarios/${id}`);
    },

    // ── FOCOS DE CALOR Y SATÉLITES ─────────────────────────────
    async getFocosCalor(incendioId = null) {
      const params = incendioId ? { incendio_id: incendioId } : {};
      const res = await this.get('/focos-calor', params);
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getDepartamentos() {
      const res = await this.get('/departamentos');
      return (res && res.data !== undefined) ? res.data : (res || []);
    },

    async getEstadisticasDashboard() {
      const res = await this.get('/estadisticas/dashboard');
      return (res && res.data !== undefined) ? res.data : res;
    },

    async getEstadisticas() {
      return this.getEstadisticasDashboard();
    },

    // ── SUSCRIPCIONES EN TIEMPO REAL CON SUPABASE ──────────────
    subscribeToIncendios(callback) {
      if (!supabaseClient) return null;
      return supabaseClient
        .channel('incendios-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incendios' }, payload => {
          console.log('[RealTime] Cambio en incendios:', payload);
          if (typeof callback === 'function') callback(payload);
        })
        .subscribe();
    },

    subscribeToAlertas(callback) {
      if (!supabaseClient) return null;
      return supabaseClient
        .channel('alertas-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas_notificaciones' }, payload => {
          console.log('[RealTime] Nueva alerta/cambio:', payload);
          if (typeof callback === 'function') callback(payload);
        })
        .subscribe();
    },

    subscribeToFocosCalor(callback) {
      if (!supabaseClient) return null;
      return supabaseClient
        .channel('focos-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'focos_calor' }, payload => {
          console.log('[RealTime] Nuevo foco de calor satelital:', payload);
          if (typeof callback === 'function') callback(payload);
        })
        .subscribe();
    },

    unsubscribe(channel) {
      if (supabaseClient && channel) {
        supabaseClient.removeChannel(channel);
      }
    }
  };

  // Exposición global
  window.supabaseClient = supabaseClient;
  window.FireTraceAPI = FireTraceAPI;
})();
