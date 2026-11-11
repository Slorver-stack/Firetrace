/**
 * FireTrace - Monitor de Incendios Bolivia
 * NASA Space Apps Challenge 2026
 * Efecto de Cenizas y Partículas de Quemazón (ashEffect.js)
 */

(function () {
  'use strict';

  class AshEffect {
    constructor(container, count = 25) {
      this.container = container;
      this.particles = [];
      this.count = count;
      this.wrapper = null;
    }

    init() {
      if (!this.container) return;

      // Crear un sub-contenedor relativo para contener las cenizas
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'ash-container';
      this.container.appendChild(this.wrapper);

      const ashColors = ['#6a5a4a', '#4a3a2a', '#2a1a0a', '#8c827a', '#3f3832'];

      for (let i = 0; i < this.count; i++) {
        const particle = document.createElement('div');
        particle.className = 'ash-particle';

        // 10% de probabilidad de ser una brasa incandescente
        if (Math.random() < 0.12) {
          particle.classList.add('ember');
        } else {
          const color = ashColors[Math.floor(Math.random() * ashColors.length)];
          particle.style.backgroundColor = color;
        }

        // Tamaño variable entre 2px y 7px
        const size = Math.floor(Math.random() * 6) + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Posición horizontal aleatoria
        particle.style.left = `${Math.random() * 100}%`;

        // Duración variable de caída: 3s a 8s
        const durationFall = (Math.random() * 5 + 3.5).toFixed(2);
        // Duración del vaivén lateral: 2s a 4s
        const durationSway = (Math.random() * 2 + 2).toFixed(2);
        // Delay aleatorio para que no caigan todas al mismo tiempo
        const delay = (Math.random() * 5).toFixed(2);

        particle.style.animationDuration = `${durationFall}s, ${durationSway}s`;
        particle.style.animationDelay = `${delay}s, ${delay}s`;

        // Opacidad variable
        particle.style.opacity = (Math.random() * 0.5 + 0.3).toFixed(2);

        this.wrapper.appendChild(particle);
        this.particles.push(particle);
      }
    }

    destroy() {
      if (this.wrapper && this.wrapper.parentNode) {
        this.wrapper.parentNode.removeChild(this.wrapper);
      }
      this.particles = [];
      this.wrapper = null;
    }
  }

  // Auto-inicialización en todos los contenedores con clase .ash-zone
  function initAshEffects() {
    document.querySelectorAll('.ash-zone').forEach(el => {
      // Evitar doble inicialización si ya tiene .ash-container
      if (!el.querySelector('.ash-container')) {
        const ash = new AshEffect(el);
        ash.init();
        el._ashInstance = ash;
      }
    });
  }

  // Ejecutar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAshEffects);
  } else {
    initAshEffects();
  }

  window.AshEffect = AshEffect;
  window.initAshEffects = initAshEffects;
})();
