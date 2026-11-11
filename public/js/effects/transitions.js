/**
 * FireTrace - Monitor de Incendios Bolivia
 * NASA Space Apps Challenge 2026
 * Transiciones y Animaciones con GSAP (transitions.js)
 */

(function () {
  'use strict';

  const Transitions = {
    // Fade In con promesa
    fadeIn(element, duration = 0.4) {
      return new Promise((resolve) => {
        if (!element) return resolve();
        if (window.gsap) {
          gsap.fromTo(
            element,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration,
              ease: 'power2.out',
              onComplete: resolve
            }
          );
        } else {
          element.style.opacity = '1';
          resolve();
        }
      });
    },

    // Fade Out con promesa
    fadeOut(element, duration = 0.3) {
      return new Promise((resolve) => {
        if (!element) return resolve();
        if (window.gsap) {
          gsap.to(element, {
            opacity: 0,
            y: -8,
            duration,
            ease: 'power2.in',
            onComplete: resolve
          });
        } else {
          element.style.opacity = '0';
          resolve();
        }
      });
    },

    // Animación escalonada (stagger) para stats cards
    animateStatsCards(container) {
      if (!container) return;
      const cards = container.querySelectorAll('.stats-card');
      if (cards.length === 0) return;

      if (window.gsap) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 35, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'back.out(1.2)'
          }
        );
      }
    },

    // Animación de entrada de alertas desde la derecha
    animateAlerts(container) {
      if (!container) return;
      const alerts = container.querySelectorAll('.alert-card-critical, .side-card');
      if (alerts.length === 0) return;

      if (window.gsap) {
        gsap.fromTo(
          alerts,
          { opacity: 0, x: 40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.45,
            stagger: 0.1,
            ease: 'power3.out'
          }
        );
      }
    },

    // Animación de pulso continuo para banner de alerta crítica
    pulseAlert(element) {
      if (!element || !window.gsap) return;
      gsap.to(element, {
        scale: 1.03,
        boxShadow: '0 0 24px rgba(239, 68, 68, 0.75)',
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    },

    // Inicializar chispas y brasas de fuego de fondo
    initSparks(container, count = 30) {
      if (!container) return;
      container.innerHTML = ''; // Limpiar previo

      for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark-particle';

        // Tamaño aleatorio entre 2px y 5px
        const size = Math.random() * 3.5 + 2;
        spark.style.width = `${size}px`;
        spark.style.height = `${size}px`;

        // Posición horizontal aleatoria
        spark.style.left = `${Math.random() * 100}vw`;
        spark.style.bottom = `-20px`;

        // Color y resplandor variable
        const isAmber = Math.random() > 0.5;
        spark.style.background = isAmber
          ? 'radial-gradient(circle, #fffbeb 0%, #f59e0b 60%, #b45309 100%)'
          : 'radial-gradient(circle, #fff7ed 0%, #ff5722 60%, #b91c1c 100%)';

        container.appendChild(spark);

        if (window.gsap) {
          // Animación ascendente con vaivén continuo
          const duration = Math.random() * 8 + 6;
          const delay = Math.random() * 7;
          const swayDistance = (Math.random() - 0.5) * 80;

          gsap.set(spark, { opacity: 0, y: 0, x: 0 });

          const tl = gsap.timeline({ repeat: -1, delay });
          tl.to(spark, {
            opacity: Math.random() * 0.7 + 0.3,
            duration: duration * 0.2,
            ease: 'power1.out'
          })
          .to(spark, {
            y: `-${window.innerHeight + 80}px`,
            x: `+=${swayDistance}`,
            duration: duration * 0.8,
            ease: 'none'
          }, `<`)
          .to(spark, {
            opacity: 0,
            duration: duration * 0.3,
            ease: 'power1.in'
          }, `-=${duration * 0.3}`);
        }
      }
    }
  };

  window.Transitions = Transitions;
})();
