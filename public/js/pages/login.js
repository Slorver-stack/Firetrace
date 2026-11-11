/**
 * ==========================================================================
 * FIRETRACE - JAVASCRIPT DE AUTENTICACIÓN Y LOGIN
 * NASA Space Apps Challenge 2026
 * Archivo: public/js/pages/login.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Elementos del DOM ───────────────────────────────────────────────────
  const loginForm = document.getElementById('loginForm');
  const loginCard = document.getElementById('loginCard');
  const usuarioInput = document.getElementById('usuario');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const btnLogin = document.getElementById('btnLogin');
  const btnGuest = document.getElementById('btnGuest');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');
  const loginAlert = document.getElementById('loginAlert');
  const loginAlertText = document.getElementById('loginAlertText');

  // Elementos del Slideshow
  const slides = document.querySelectorAll('.showcase-slide');
  const dots = document.querySelectorAll('.slideshow-dots .dot');

  let currentSlide = 0;
  let slideshowInterval = null;
  const SLIDESHOW_DURATION = 5000; // 5 segundos por diapositiva

  // ── 1. SLIDESHOW CON CROSSFADE AUTOMÁTICO Y NAVEGACIÓN MANUAL ───────────
  function goToSlide(index) {
    if (slides.length === 0) return;

    // Quitar activo de la diapositiva y dot actual
    slides[currentSlide].classList.remove('active');
    if (dots[currentSlide]) {
      dots[currentSlide].classList.remove('active');
      dots[currentSlide].setAttribute('aria-selected', 'false');
    }

    // Calcular índice circular
    currentSlide = (index + slides.length) % slides.length;

    // Activar nueva diapositiva y dot
    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) {
      dots[currentSlide].classList.add('active');
      dots[currentSlide].setAttribute('aria-selected', 'true');
    }
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function startSlideshow() {
    stopSlideshow();
    slideshowInterval = setInterval(nextSlide, SLIDESHOW_DURATION);
  }

  function stopSlideshow() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
  }

  // Asignar eventos de clic a los puntos indicadores (dots)
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIndex = parseInt(dot.getAttribute('data-index'), 10);
      if (!isNaN(targetIndex)) {
        goToSlide(targetIndex);
        startSlideshow(); // Reiniciar temporizador
      }
    });
  });

  // Iniciar slideshow automático
  startSlideshow();

  // ── 2. MOSTRAR Y OCULTAR CONTRASEÑA ─────────────────────────────────────
  if (togglePasswordBtn && passwordInput && togglePasswordIcon) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      const newType = isPassword ? 'text' : 'password';
      passwordInput.setAttribute('type', newType);

      // Cambiar icono de Phosphor
      if (isPassword) {
        togglePasswordIcon.classList.remove('ph-eye');
        togglePasswordIcon.classList.add('ph-eye-slash');
        togglePasswordBtn.setAttribute('aria-label', 'Ocultar contraseña');
      } else {
        togglePasswordIcon.classList.remove('ph-eye-slash');
        togglePasswordIcon.classList.add('ph-eye');
        togglePasswordBtn.setAttribute('aria-label', 'Mostrar contraseña');
      }
    });
  }

  // ── 3. RECORDAR USUARIO CON LOCALSTORAGE ────────────────────────────────
  const STORAGE_KEY = 'firetrace_remembered_user';

  try {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser && usuarioInput && rememberMeCheckbox) {
      usuarioInput.value = savedUser;
      rememberMeCheckbox.checked = true;
      // Poner foco en contraseña si el usuario ya está cargado
      if (passwordInput) {
        passwordInput.focus();
      }
    }
  } catch (e) {
    console.warn('Acceso a localStorage restringido:', e);
  }

  function handleRememberMe(usuario) {
    try {
      if (rememberMeCheckbox && rememberMeCheckbox.checked) {
        localStorage.setItem(STORAGE_KEY, usuario);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  // ── 4. MANEJO DE ALERTAS Y ANIMACIÓN DE ERROR (SHAKE) ───────────────────
  function showError(message) {
    if (!loginAlert || !loginAlertText) return;

    loginAlertText.textContent = message;
    loginAlert.classList.add('show');

    // Efecto shake en la tarjeta de login
    if (loginCard) {
      loginCard.classList.remove('shake');
      // Forzar reflow para reiniciar la animación
      void loginCard.offsetWidth;
      loginCard.classList.add('shake');

      loginCard.addEventListener('animationend', () => {
        loginCard.classList.remove('shake');
      }, { once: true });
    }
  }

  function hideError() {
    if (loginAlert) {
      loginAlert.classList.remove('show');
    }
  }

  // Limpiar error cuando el usuario comienza a escribir
  if (usuarioInput) usuarioInput.addEventListener('input', hideError);
  if (passwordInput) passwordInput.addEventListener('input', hideError);

  // ── 5. ESTADO DE CARGA DE BOTONES ───────────────────────────────────────
  function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  // ── 6. SUBMIT DEL FORMULARIO DE LOGIN (POST /auth/login) ────────────────
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const usuario = usuarioInput ? usuarioInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      // Validación en cliente
      if (!usuario) {
        showError('Por favor ingresa tu usuario o correo electrónico.');
        if (usuarioInput) usuarioInput.focus();
        return;
      }

      if (!password) {
        showError('Por favor ingresa tu contraseña.');
        if (passwordInput) passwordInput.focus();
        return;
      }

      setButtonLoading(btnLogin, true);

      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Guardar usuario en localStorage si seleccionó "recordar"
          handleRememberMe(usuario);

          // Redirección exitosa al dashboard o ruta especificada
          window.location.href = data.redirect || '/dashboard';
        } else {
          setButtonLoading(btnLogin, false);
          showError(data.error || 'Credenciales incorrectas o usuario inactivo.');
          if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
          }
        }
      } catch (err) {
        console.error('[Login Error]', err);
        setButtonLoading(btnLogin, false);
        showError('Error al conectar con el servidor. Verifica tu conexión.');
      }
    });
  }

  // ── 7. ACCESO COMO OJOS DEL BOSQUE ──────────────────────────────────────
  if (btnGuest) {
    btnGuest.addEventListener('click', async (e) => {
      e.preventDefault();
      hideError();

      btnGuest.disabled = true;
      const originalText = btnGuest.innerHTML;
      btnGuest.innerHTML = `<span class="ft-spinner ft-spinner-sm"></span> Conectando a Ojos Del Bosque...`;

      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ invitado: true, rol: 'ojos_del_bosque' })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          window.location.href = data.redirect || '/ojos-del-bosque';
        } else {
          btnGuest.disabled = false;
          btnGuest.innerHTML = originalText;
          showError(data.error || 'No se pudo iniciar sesión en Ojos Del Bosque.');
        }
      } catch (err) {
        console.error('[Ojos Del Bosque Login Error]', err);
        btnGuest.disabled = false;
        btnGuest.innerHTML = originalText;
        showError('Error al conectar con el servidor. Intenta nuevamente.');
      }
    });
  }

  // ── 8. PERFILES DE PRUEBA RÁPIDOS ─────────────────────────────────────────
  function setDemoProfile(usuario, password) {
    if (usuarioInput) usuarioInput.value = usuario;
    if (passwordInput) passwordInput.value = password;
    hideError();
    // Animación visual de relleno y submit automático
    if (btnLogin) {
      btnLogin.focus();
      btnLogin.click();
    }
  }

  const demoAdmin = document.getElementById('demoAdmin');
  if (demoAdmin) demoAdmin.addEventListener('click', () => setDemoProfile('admin', 'admin'));

  const demoBombero = document.getElementById('demoBombero');
  if (demoBombero) demoBombero.addEventListener('click', () => setDemoProfile('bombero', '12345'));

  const demoAmbulancia = document.getElementById('demoAmbulancia');
  if (demoAmbulancia) demoAmbulancia.addEventListener('click', () => setDemoProfile('ambulancia', '12345'));
});
