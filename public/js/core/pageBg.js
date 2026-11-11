/**
 * FireTrace - Monitor de Incendios Bolivia
 * NASA Space Apps Challenge 2026
 * Controlador del Fondo Dinámico de Página (pageBg.js)
 * Administra las imágenes de la carpeta "FONDO PAGINA" con transiciones suaves por sección.
 */

(function () {
  'use strict';

  const PageBg = {
    activeLayer: 'A',
    currentRoute: null,
    currentImage: null,

    // Mapeo curado de imágenes de la carpeta FONDO PAGINA por sección/ruta
    bgImages: {
      'inicio': '/IMG/FONDO%20PAGINA/Paisaje%20monta%C3%B1oso%20al%20amanecer.png',
      'dashboard': '/IMG/FONDO%20PAGINA/Paisaje%20monta%C3%B1oso%20al%20amanecer.png',
      'mapa-incendios': '/IMG/FONDO%20PAGINA/Valle%20monta%C3%B1oso%20al%20atardecer.png',
      'incendio-vivo': '/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif',
      'memoria-fuego': '/IMG/FONDO%20PAGINA/Incendio%20forestal%20reflejado%20en%20el%20r%C3%ADo.png',
      'semaforo-atencion': '/IMG/FONDO%20PAGINA/Valle%20monta%C3%B1oso%20al%20atardecer.png',
      'ojos-del-bosque': '/IMG/FONDO%20PAGINA/C%C3%B3ndor%20sobre%20el%20incendio%20forestal.png',
      'firetrace-explica': '/IMG/FONDO%20PAGINA/Paisaje%20monta%C3%B1oso%20al%20amanecer.png',
      'bitacora-bosque': '/IMG/FONDO%20PAGINA/Incendio%20forestal%20reflejado%20en%20el%20r%C3%ADo.png',
      'vigilancia-reactivacion': '/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif',
      'admin': '/IMG/FONDO%20PAGINA/Paisaje%20monta%C3%B1oso%20al%20amanecer.png',
      'admin/usuarios': '/IMG/FONDO%20PAGINA/Paisaje%20monta%C3%B1oso%20al%20amanecer.png',
      'admin/incendios': '/IMG/FONDO%20PAGINA/Valle%20monta%C3%B1oso%20al%20atardecer.png',
      'rol/bombero': '/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif',
      'rol/ambulancia': '/IMG/FONDO%20PAGINA/Valle%20monta%C3%B1oso%20al%20atardecer.png',
      'rol/rescatista': '/IMG/FONDO%20PAGINA/C%C3%B3ndor%20sobre%20el%20incendio%20forestal.png',
      'reportar-incendio': '/IMG/FONDO%20PAGINA/C%C3%B3ndor%20sobre%20el%20incendio%20forestal.png'
    },

    init() {
      // 1. Precargar todas las imágenes de FONDO PAGINA para transiciones fluidas e instantáneas
      const uniqueImages = Array.from(new Set(Object.values(this.bgImages)));
      uniqueImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });

      // 2. Determinar la ruta inicial
      const pathRoute = window.location.pathname.replace(/^\/+|\/+$/g, '') || 'inicio';
      this.setActive(pathRoute, true);
    },

    setActive(route, force = false) {
      if (!route) route = 'inicio';
      route = route.replace(/^\/+|\/+$/g, '');
      if (route === '' || route === 'dashboard') route = 'inicio';

      const targetImage = this.bgImages[route] || this.bgImages['inicio'];
      if (!targetImage) return;

      if (!force && this.currentImage === targetImage && this.currentRoute === route) {
        return;
      }

      this.currentRoute = route;
      this.currentImage = targetImage;

      const layerA = document.getElementById('pageBgA');
      const layerB = document.getElementById('pageBgB');

      if (!layerA || !layerB) return;

      if (this.activeLayer === 'A') {
        // Cargar en capa B y activar crossfade
        layerB.style.backgroundImage = `url("${targetImage}")`;
        layerB.classList.add('active');
        layerA.classList.remove('active');
        this.activeLayer = 'B';
      } else {
        // Cargar en capa A y activar crossfade
        layerA.style.backgroundImage = `url("${targetImage}")`;
        layerA.classList.add('active');
        layerB.classList.remove('active');
        this.activeLayer = 'A';
      }
    }
  };

  window.PageBg = PageBg;

  // Inicializar automáticamente cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PageBg.init());
  } else {
    PageBg.init();
  }
})();
