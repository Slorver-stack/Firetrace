/**
 * FireTrace - Monitor de Incendios Bolivia
 * NASA Space Apps Challenge 2026
 * Gestión de Autenticación, Roles y Permisos (auth.js)
 */

(function () {
  'use strict';

  const Auth = {
    user: null,
    watchLocationId: null,

    // Mapa de permisos por sección/ruta
    permissions: {
      'inicio': ['administrador', 'bombero_respuesta', 'voluntario', 'ciudadano', 'invitado', 'ojos_del_bosque'],
      'mapa-incendios': ['administrador', 'bombero_respuesta', 'voluntario', 'ciudadano', 'invitado', 'ojos_del_bosque'],
      'incendio-vivo': ['administrador', 'bombero_respuesta', 'voluntario', 'ciudadano', 'invitado'],
      'memoria-fuego': ['administrador', 'bombero_respuesta', 'voluntario', 'ciudadano', 'invitado'],
      'semaforo-atencion': ['administrador', 'bombero_respuesta', 'voluntario', 'ciudadano', 'invitado'],
      'ojos-del-bosque': ['administrador', 'bombero_respuesta', 'voluntario', 'ciudadano', 'invitado', 'ojos_del_bosque'],
      'firetrace-explica': ['administrador', 'bombero_respuesta', 'voluntario', 'ciudadano', 'invitado'],
      'bitacora-bosque': ['administrador', 'bombero_respuesta', 'voluntario', 'ciudadano'],
      'admin': ['administrador'],
      'admin/usuarios': ['administrador'],
      'admin/incendios': ['administrador'],
      'rol/bombero': ['administrador', 'bombero_respuesta'],
      'rol/ambulancia': ['administrador', 'bombero_respuesta', 'voluntario']
    },

    async init() {
      try {
        const response = await fetch('/auth/me', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          console.warn('[Auth] No autenticado, redirigiendo a /login');
          window.location.href = '/login';
          return null;
        }

        const data = await response.json();
        if (data && data.authenticated && data.user) {
          this.user = data.user;
          this.updateUI();
          this.setupEvents();
          this.startLocationTracking();
          return this.user;
        } else {
          window.location.href = '/login';
          return null;
        }
      } catch (err) {
        console.error('[Auth Error] Error al verificar sesión:', err);
        window.location.href = '/login';
        return null;
      }
    },

    updateUI() {
      if (!this.user) return;

      const userNameEl = document.getElementById('headerUserName');
      const userRoleEl = document.getElementById('headerUserRole');

      if (userNameEl) {
        userNameEl.textContent = this.user.nombre_completo || this.user.usuario || 'Usuario';
      }

      if (userRoleEl) {
        userRoleEl.textContent = this.getRolLabel();
        userRoleEl.className = `header-user-role-badge role-${this.user.rol || 'ciudadano'}`;
      }

      // Mostrar items específicos de rol en la barra lateral
      const roleAdminEl = document.querySelector('.item-role-admin');
      const roleBomberoEl = document.querySelector('.item-role-bombero');
      const roleAmbulanciaEl = document.querySelector('.item-role-ambulancia');
      const roleRescatistaEl = document.querySelector('.item-role-rescatista');

      if (this.user.rol === 'administrador') {
        if (roleAdminEl) roleAdminEl.style.display = 'block';
        if (roleBomberoEl) roleBomberoEl.style.display = 'block';
        if (roleAmbulanciaEl) roleAmbulanciaEl.style.display = 'block';
        if (roleRescatistaEl) roleRescatistaEl.style.display = 'block';
      } else if (this.user.rol === 'bombero_respuesta') {
        if (roleBomberoEl) roleBomberoEl.style.display = 'block';
        if (roleAmbulanciaEl) roleAmbulanciaEl.style.display = 'block';
        if (roleRescatistaEl) roleRescatistaEl.style.display = 'block';
      } else if (this.user.rol === 'voluntario') {
        if (roleRescatistaEl) roleRescatistaEl.style.display = 'block';
      }

      // Restricción visual de items de menú según rol
      document.querySelectorAll('.sidebar-link[data-route]').forEach(link => {
        const route = link.getAttribute('data-route');
        const parentLi = link.closest('.sidebar-item');
        if (parentLi && !this.canAccess(route)) {
          parentLi.style.opacity = '0.4';
          parentLi.style.pointerEvents = 'none';
          parentLi.setAttribute('title', 'Acceso no permitido para tu rol');
        }
      });
    },

    setupEvents() {
      // Toggle dropdown de usuario en header
      const headerUser = document.getElementById('headerUser');
      const userDropdown = document.getElementById('userDropdown');

      if (headerUser && userDropdown) {
        headerUser.addEventListener('click', (e) => {
          e.stopPropagation();
          const isVisible = userDropdown.style.display === 'block';
          userDropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Cerrar dropdown al hacer click afuera
        document.addEventListener('click', (e) => {
          if (!headerUser.contains(e.target)) {
            userDropdown.style.display = 'none';
          }
        });

        // Enlace Panel de Rol
        const userRoleLink = document.getElementById('userRoleLink');
        if (userRoleLink) {
          userRoleLink.addEventListener('click', (e) => {
            e.preventDefault();
            userDropdown.style.display = 'none';
            const roleRoutes = {
              'administrador': 'admin',
              'bombero_respuesta': 'rol/bombero',
              'voluntario': 'inicio',
              'ciudadano': 'inicio',
              'invitado': 'ojos-del-bosque',
              'ojos_del_bosque': 'ojos-del-bosque'
            };
            const targetRoute = roleRoutes[this.user?.rol] || 'ojos-del-bosque';
            if (window.App && typeof window.App.navigate === 'function') {
              window.App.navigate(targetRoute);
            }
          });
        }
      }

      // Botón de Cerrar Sesión
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await this.logout();
        });
      }
    },

    async logout() {
      try {
        const res = await fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const data = await res.json().catch(() => ({}));
        this.user = null;
        if (this.watchLocationId) {
          navigator.geolocation.clearWatch(this.watchLocationId);
        }
        window.location.href = (data && data.redirect) || '/login';
      } catch (err) {
        console.error('[Auth Logout Error]', err);
        window.location.href = '/login';
      }
    },

    hasRole(roles) {
      if (!this.user || !this.user.rol) return false;
      if (Array.isArray(roles)) {
        return roles.includes(this.user.rol);
      }
      return this.user.rol === roles;
    },

    canAccess(section) {
      if (!this.user) return false;
      if (this.user.rol === 'administrador') return true;

      const allowedRoles = this.permissions[section];
      if (!allowedRoles) return true; // Ruta pública si no está registrada

      return allowedRoles.includes(this.user.rol);
    },

    getRolLabel() {
      const labels = {
        'administrador': 'Administrador',
        'bombero_respuesta': 'Bombero / SAR',
        'voluntario': 'Voluntario',
        'ciudadano': 'Ciudadano',
        'invitado': 'Ojos Del Bosque',
        'ojos_del_bosque': 'Ojos Del Bosque'
      };
      return labels[this.user?.rol] || 'Usuario';
    },

    // Geolocalización del usuario para respuesta y alertas de proximidad
    startLocationTracking() {
      if (!navigator.geolocation || this.user?.rol === 'invitado') return;

      navigator.geolocation.getCurrentPosition(
        (pos) => this._sendLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.log('[Auth Geo] Ubicación no concedida:', err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Si es bombero o voluntario, monitorear cambios continuos
      if (this.hasRole(['bombero_respuesta', 'voluntario'])) {
        this.watchLocationId = navigator.geolocation.watchPosition(
          (pos) => this._sendLocation(pos.coords.latitude, pos.coords.longitude),
          null,
          { enableHighAccuracy: true, maximumAge: 60000, timeout: 20000 }
        );
      }
    },

    async _sendLocation(lat, lng) {
      try {
        await fetch('/auth/update-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ lat, lng })
        });
        if (this.user) {
          this.user.latitud_actual = lat;
          this.user.longitud_actual = lng;
        }
      } catch (e) {
        // Silencioso
      }
    }
  };

  window.Auth = Auth;
})();
