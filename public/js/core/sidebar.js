/**
 * FireTrace - Monitor de Incendios Bolivia
 * NASA Space Apps Challenge 2026
 * Lógica de la Barra Lateral y Transición de Fondos (sidebar.js)
 */

(function () {
  'use strict';

  const Sidebar = {
    isCollapsed: false,
    currentRoute: null,
    activeLayer: 'A', // Alterna entre capa A y capa B para el crossfade

    // Mapa de imágenes de fondo por sección (con nombres exactos)
    bgImages: {
      'inicio': '/IMG/BARRA LATERAL/Paisaje sereno de montañas y bosque (BARRA LATERAL).png',
      'mapa-incendios': '/IMG/BARRA LATERAL/Bosque Incendio (BARRA LATERAL).jfif',
      'incendio-vivo': '/IMG/BARRA LATERAL/Atardecer entre montañas y brasas (BARRA LATERAL).png',
      'memoria-fuego': '/IMG/BARRA LATERAL/Bosque Verde (BARRA LATERAL).jfif',
      'semaforo-atencion': '/IMG/BARRA LATERAL/imagen de bosque (BARRA LATERAL).jfif',
      'ojos-del-bosque': '/IMG/BARRA LATERAL/Bosque Verde bonito (BARRA LATERAL).jfif',
      'firetrace-explica': '/IMG/BARRA LATERAL/Bosque (BARRA LATERAL).jfif',
      'bitacora-bosque': '/IMG/BARRA LATERAL/Montañas al atardecer_ proteger lo que importa (BARRA LATERAL).png',
      'vigilancia-reactivacion': '/IMG/BARRA LATERAL/Bosque Incendio (BARRA LATERAL).jfif',
      'admin': '/IMG/BARRA LATERAL/Montañas al atardecer_ proteger lo que importa (BARRA LATERAL).png',
      'rol/bombero': '/IMG/BARRA LATERAL/Bosque Incendio (BARRA LATERAL).jfif',
      'rol/ambulancia': '/IMG/BARRA LATERAL/Atardecer entre montañas y brasas (BARRA LATERAL).png',
      'rol/rescatista': '/IMG/BARRA LATERAL/Bosque Verde bonito (BARRA LATERAL).jfif',
      'reportar-incendio': '/IMG/BARRA LATERAL/Atardecer entre montañas y brasas (BARRA LATERAL).png'
    },

    // Citas por sección
    quotes: {
      'inicio': '"Cada minuto cuenta. La prevención también es una forma de actuar."',
      'mapa-incendios': '"Vigilancia constante sobre el pulmón de Bolivia."',
      'incendio-vivo': '"Tu acción también protege."',
      'memoria-fuego': '"Conocer el pasado nos ayuda a proteger el futuro."',
      'vigilancia-reactivacion': '"La prevención también es una forma de actuar."',
      'semaforo-atencion': '"Anticipar el peligro salva vidas y ecosistemas."',
      'ojos-del-bosque': '"La naturaleza no se recupera sola. Actuemos juntos."',
      'firetrace-explica': '"La ciencia satelital al servicio de nuestros bosques."',
      'bitacora-bosque': '"El registro de hoy es la defensa del mañana."',
      'admin': '"Gestión estratégica para la preservación territorial."',
      'rol/bombero': '"Valentía y precisión frente al fuego."',
      'rol/ambulancia': '"Respuesta médica inmediata donde más se necesita."',
      'rol/rescatista': '"Protegiendo cada vida en nuestros ecosistemas."',
      'reportar-incendio': '"Tus ojos son la alerta temprana para salvar el bosque."'
    },

    init() {
      const sidebarEl = document.getElementById('sidebar');
      const toggleBtn = document.getElementById('sidebarToggle');
      if (!sidebarEl) return;

      // Restaurar estado de colapso desde localStorage
      const savedCollapsed = localStorage.getItem('ft_sidebar_collapsed');
      if (savedCollapsed === 'true') {
        this.setCollapsed(true, false);
      }

      // Listener para el botón toggle
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle();
        });
      }

      // Delegación de clicks en los links de navegación
      document.querySelectorAll('.sidebar-link[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const route = link.getAttribute('data-route');
          if (window.App && typeof window.App.navigate === 'function') {
            window.App.navigate(route);
          } else {
            this.setActive(route);
          }

          // En móviles, cerrar el drawer al navegar
          if (window.innerWidth <= 900) {
            this.closeMobile();
          }
        });
      });

      // Precargar todas las imágenes de la barra lateral en segundo plano para transiciones instantáneas
      Object.values(this.bgImages).forEach(img => {
        const p = new Image();
        p.src = encodeURI(img);
      });

      // Cargar de inmediato la imagen de inicio en capa A
      const initialBg = this.bgImages['inicio'];
      const layerA = document.getElementById('sidebarBgA');
      if (layerA && initialBg) {
        layerA.style.backgroundImage = `url("${encodeURI(initialBg)}")`;
        layerA.classList.add('active');
        this.activeLayer = 'A';
      }
    },

    toggle() {
      this.setCollapsed(!this.isCollapsed, true);
    },

    setCollapsed(collapsed, animate = true) {
      this.isCollapsed = collapsed;
      const sidebarEl = document.getElementById('sidebar');
      const body = document.body;

      if (!sidebarEl) return;

      if (this.isCollapsed) {
        sidebarEl.classList.add('collapsed');
        body.classList.add('sidebar-collapsed');
      } else {
        sidebarEl.classList.remove('collapsed');
        body.classList.remove('sidebar-collapsed');
      }

      localStorage.setItem('ft_sidebar_collapsed', this.isCollapsed);

      // Redibujar mapas Leaflet con el nuevo ancho
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (window.App && typeof window.App.invalidateAllMaps === 'function') {
          window.App.invalidateAllMaps();
        }
      }, 350);

      // Si GSAP está disponible y se solicita animación adicional
      if (animate && window.gsap) {
        gsap.fromTo(
          sidebarEl,
          { scale: 0.995 },
          { scale: 1, duration: 0.25, ease: 'power2.out' }
        );
      }
    },

    openMobile() {
      const sidebarEl = document.getElementById('sidebar');
      if (sidebarEl) sidebarEl.classList.add('mobile-open');
    },

    closeMobile() {
      const sidebarEl = document.getElementById('sidebar');
      if (sidebarEl) sidebarEl.classList.remove('mobile-open');
    },

    setActive(route) {
      if (!route) return;
      this.currentRoute = route;

      // 1. Quitar clase active de todos los items
      document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
      });

      // 2. Activar el item correspondiente
      const activeLink = document.querySelector(`.sidebar-link[data-route="${route}"]`);
      if (activeLink) {
        const activeItem = activeLink.closest('.sidebar-item');
        if (activeItem) {
          activeItem.classList.add('active');
        }
      }

      // 3. Cambiar imagen de fondo con crossfade suave (barra lateral y fondo general de página)
      this.changeBgImage(route);
      if (window.PageBg && typeof window.PageBg.setActive === 'function') {
        window.PageBg.setActive(route);
      }

      // 4. Actualizar cita inspiracional con fade
      this.updateQuote(route);
    },

    changeBgImage(route) {
      const imagePath = this.bgImages[route] || this.bgImages['inicio'];
      if (!imagePath) return;

      const encodedPath = encodeURI(imagePath);

      const layerA = document.getElementById('sidebarBgA');
      const layerB = document.getElementById('sidebarBgB');

      if (!layerA || !layerB) return;

      if (this.activeLayer === 'A') {
        // Cargar en capa B y activar crossfade
        layerB.style.backgroundImage = `url("${encodedPath}")`;
        layerB.style.backgroundSize = '100% 100%';
        layerB.style.backgroundPosition = 'center top';
        layerB.classList.add('active');
        layerA.classList.remove('active');
        this.activeLayer = 'B';
      } else {
        // Cargar en capa A y activar crossfade
        layerA.style.backgroundImage = `url("${encodedPath}")`;
        layerA.style.backgroundSize = '100% 100%';
        layerA.style.backgroundPosition = 'center top';
        layerA.classList.add('active');
        layerB.classList.remove('active');
        this.activeLayer = 'A';
      }
    },

    updateQuote(route) {
      const quoteEl = document.getElementById('sidebarQuote');
      if (!quoteEl) return;

      const newQuote = this.quotes[route] || this.quotes['inicio'] || '"Tu acción también protege."';

      if (window.gsap) {
        gsap.to(quoteEl, {
          opacity: 0,
          duration: 0.25,
          onComplete: () => {
            quoteEl.textContent = newQuote;
            gsap.to(quoteEl, { opacity: 1, duration: 0.4 });
          }
        });
      } else {
        quoteEl.style.opacity = '0';
        setTimeout(() => {
          quoteEl.textContent = newQuote;
          quoteEl.style.opacity = '1';
        }, 200);
      }
    }
  };

  window.Sidebar = Sidebar;
})();
