/**
 * modal-auth.js — Modal de autenticación de clientes
 *
 * Expone window.AuthModal:
 *   AuthModal.open(callback)      → abre el modal; ejecuta callback(cliente) al autenticar
 *   AuthModal.close()             → cierra el modal
 *   AuthModal.logout()            → cierra sesión del cliente
 *   AuthModal.isAuthenticated()   → true si hay sesión activa
 *   AuthModal.getCliente()        → objeto con datos del cliente o null
 *   AuthModal.verificar()         → Promise<cliente|null> verifica sesión con el backend
 */

(function () {
  'use strict';

  /* ── Estado ──────────────────────────────────────────────────── */
  let _cliente   = null;   // datos del cliente autenticado
  let _callback  = null;   // función a ejecutar tras autenticación
  let _firebaseApp = null;
  let _firebaseAuth = null;

  /* ── Crear estructura HTML del modal ─────────────────────────── */
  function _crearModal() {
    if (document.getElementById('authModalOverlay')) return;

    const html = `
<div id="authModalOverlay" class="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
  <div class="auth-modal">
    <button class="auth-modal-close" onclick="AuthModal.close()" aria-label="Cerrar">
      <i class="fa-solid fa-xmark"></i>
    </button>

    <div class="auth-modal-logo"><span class="logo-text">WH</span></div>

    <!-- Vista: no autenticado -->
    <div id="authViewLogin">
      <h2 class="auth-modal-title" id="authModalTitle">Continuar con tu cuenta</h2>
      <p class="auth-modal-subtitle" id="authModalSubtitle">Inicia sesión o crea tu cuenta para continuar</p>

      <div class="auth-tabs">
        <button class="auth-tab-btn active" onclick="_authSetTab('login')" id="tabBtnLogin">Iniciar sesión</button>
        <button class="auth-tab-btn" onclick="_authSetTab('registro')" id="tabBtnRegistro">Crear cuenta</button>
      </div>

      <div id="authAlert" class="auth-alert"></div>

      <!-- Formulario de login -->
      <div id="authFormLogin">
        <form class="auth-form" onsubmit="_authLoginEmail(event)">
          <div class="auth-form-group">
            <label>Correo electrónico</label>
            <input type="email" id="loginEmail" placeholder="correo@ejemplo.com" autocomplete="email" required>
          </div>
          <div class="auth-form-group">
            <label>Contraseña</label>
            <input type="password" id="loginPassword" placeholder="Tu contraseña" autocomplete="current-password" required>
          </div>
          <button type="submit" class="btn-auth-primary" id="btnLoginSubmit">Iniciar sesión</button>
          <div class="auth-forgot-wrap">
            <a href="#" class="auth-forgot-link" onclick="_authResetPassword(event)">¿Olvidaste tu contraseña?</a>
          </div>
        </form>
      </div>

      <!-- Formulario de registro -->
      <div id="authFormRegistro" style="display:none;">
        <form class="auth-form" onsubmit="_authRegistroEmail(event)">
          <div class="auth-form-group">
            <label>Nombre completo</label>
            <input type="text" id="regNombre" placeholder="Juan Pérez" autocomplete="name" required minlength="2" maxlength="120" pattern="[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]{2,120}" title="Solo letras y espacios">
          </div>
          <div class="auth-form-group">
            <label>Correo electrónico</label>
            <input type="email" id="regEmail" placeholder="correo@ejemplo.com" autocomplete="email" required>
          </div>
          <div class="auth-form-group">
            <label>Contraseña <span style="font-weight:400;font-size:11px;">(mín. 6 caracteres)</span></label>
            <input type="password" id="regPassword" placeholder="Crea una contraseña" autocomplete="new-password" required minlength="6">
          </div>
          <div class="auth-form-group">
            <label>Confirmar contraseña</label>
            <input type="password" id="regConfirmPassword" placeholder="Repite tu contraseña" autocomplete="new-password" required minlength="6">
          </div>
          <button type="submit" class="btn-auth-primary" id="btnRegSubmit">Crear cuenta</button>
        </form>
      </div>

      <div class="auth-modal-footer">
        Al continuar aceptas nuestros <a href="/terminos" target="_blank" rel="noopener">términos de servicio</a>
      </div>
    </div>

    <!-- Vista: verificación de correo pendiente -->
    <div id="authViewVerificacion" style="display:none;">
      <div style="text-align:center; padding: 8px 0 20px;">
        <div style="font-size:52px; margin-bottom:18px;">📧</div>
        <h3 style="color:#c9a96e; font-size:20px; margin-bottom:10px;">¡Cuenta creada!</h3>
        <p style="color:#ccc; font-size:14px; line-height:1.6;">
          Te enviamos un enlace de verificación a<br>
          <strong id="authVerifEmailLabel" style="color:#e0e0e0;">—</strong>
        </p>
        <p style="color:#888; font-size:12px; margin-top:10px; line-height:1.5;">
          Haz clic en el enlace del correo para confirmar tu cuenta.<br>
          Si no ves el correo, revisa tu carpeta de spam.
        </p>
        <button class="btn-auth-primary" style="margin-top:20px;" onclick="_authContinuarDespuesDeRegistro()">
          Continuar a mi cuenta
        </button>
      </div>
    </div>

    <!-- Vista: autenticado -->
    <div id="authViewUser" style="display:none;">
      <div class="auth-user-view">
        <div class="auth-user-avatar" id="authUserAvatar">U</div>
        <div class="auth-user-name" id="authUserName">—</div>
        <div class="auth-user-email" id="authUserEmail">—</div>
        <div class="auth-user-actions">
          <button class="btn-auth-mi-cuenta" onclick="location.href='/mi-cuenta'">
            <i class="fa-solid fa-user-circle"></i> Mi cuenta
          </button>
          <button class="btn-auth-logout" onclick="_authLogout()">
            <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // Cerrar al hacer clic en el fondo
    document.getElementById('authModalOverlay').addEventListener('click', function (e) {
      if (e.target === this) AuthModal.close();
    });

    // Sanitización y validación en tiempo real de todos los campos
    _initCamposModal();
  }

  /* ── Sanitización en tiempo real del modal ───────────────────── */
  function _initCamposModal() {
    // Email de login: solo caracteres válidos de email
    const loginEmail = document.getElementById('loginEmail');
    if (loginEmail) loginEmail.addEventListener('input', function () {
      this.value = this.value.replace(/[^a-zA-Z0-9._%+\-@]/g, '');
    });

    // Nombre de registro: solo letras, espacios y acentos
    const regNombre = document.getElementById('regNombre');
    if (regNombre) regNombre.addEventListener('input', function () {
      this.value = this.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '');
    });

    // Email de registro: solo caracteres válidos de email
    const regEmail = document.getElementById('regEmail');
    if (regEmail) regEmail.addEventListener('input', function () {
      this.value = this.value.replace(/[^a-zA-Z0-9._%+\-@]/g, '');
    });



    // Confirmar contraseña: bloquear pegar + validar coincidencia al salir
    const regConfirmPassword = document.getElementById('regConfirmPassword');
    if (regConfirmPassword) {
      regConfirmPassword.addEventListener('paste', (e) => e.preventDefault());
      regConfirmPassword.addEventListener('blur', function () {
        const orig = document.getElementById('regPassword')?.value || '';
        if (this.value && this.value !== orig) _authShowAlert('Las contraseñas no coinciden', 'error');
        else _authClearAlert();
      });
    }
  }

  /* ── Helpers de UI ───────────────────────────────────────────── */
  function _authShowAlert(msg, tipo) {
    const el = document.getElementById('authAlert');
    if (!el) return;
    el.textContent = msg;
    el.className = 'auth-alert ' + (tipo || 'error');
  }

  function _authClearAlert() {
    const el = document.getElementById('authAlert');
    if (el) { el.textContent = ''; el.className = 'auth-alert'; }
  }

  function _authSetLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
      btn._origText = btn.innerHTML;
      btn.innerHTML = '<span class="auth-spinner"></span>Espera...';
      btn.disabled = true;
    } else {
      btn.innerHTML = btn._origText || btn.innerHTML;
      btn.disabled = false;
    }
  }

  /* ── Navegación entre tabs ───────────────────────────────────── */
  window._authSetTab = function (tab) {
    _authClearAlert();
    const isLogin = tab === 'login';
    document.getElementById('authFormLogin').style.display    = isLogin ? '' : 'none';
    document.getElementById('authFormRegistro').style.display = isLogin ? 'none' : '';
    document.getElementById('tabBtnLogin').classList.toggle('active', isLogin);
    document.getElementById('tabBtnRegistro').classList.toggle('active', !isLogin);
  };

  /* ── Obtener instancia de Firebase Auth ──────────────────────── */
  async function _getAuth() {
    if (_firebaseAuth) return _firebaseAuth;
    // Firebase debe estar cargado por el HTML host
    const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');

    // Buscar config de Firebase en window (puesta por firebase-config.js o el host)
    const cfg = window.FIREBASE_CONFIG || window._fbConfig || window.firebaseConfig;
    if (!cfg) throw new Error('firebaseConfig no definida en window');

    _firebaseApp = getApps().length ? getApp() : initializeApp(cfg);
    _firebaseAuth = getAuth(_firebaseApp);
    return _firebaseAuth;
  }

  /* ── Llamar al backend ───────────────────────────────────────── */
  async function _llamarBackend(action, firebaseToken, extra = {}) {
    const csrfCookie = document.cookie.split(';')
      .map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN='));
    const csrf = csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : '';

    const res = await fetch(`/api/auth.php?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ firebase_token: firebaseToken, ...extra }),
    });
    return res.json();
  }

  /* ── Actualizar botón de cuenta en el nav ────────────────────── */
  function _actualizarNavBtn() {
    const btns = document.querySelectorAll('.btn-cuenta-nav');
    btns.forEach(btn => {
      if (_cliente) {
        const inicial = (_cliente.nombre || 'U')[0].toUpperCase();
        btn.classList.add('autenticado');
        btn.innerHTML = `<i class="fa-solid fa-user-circle"></i> ${inicial}`;
        btn.title = _cliente.nombre;
        btn.onclick = () => AuthModal.open();
      } else {
        btn.classList.remove('autenticado');
        btn.innerHTML = `<i class="fa-solid fa-user"></i> Mi cuenta`;
        btn.title = '';
        btn.onclick = () => AuthModal.open();
      }
    });
  }

  /* ── Actualizar vista del modal ──────────────────────────────── */
  function _actualizarVistaModal() {
    const viewLogin  = document.getElementById('authViewLogin');
    const viewUser   = document.getElementById('authViewUser');
    const viewVerif  = document.getElementById('authViewVerificacion');
    if (!viewLogin || !viewUser) return;

    // Ocultar siempre la pantalla de verificación al cambiar de vista
    if (viewVerif) viewVerif.style.display = 'none';

    if (_cliente) {
      viewLogin.style.display = 'none';
      viewUser.style.display  = '';
      const inicial = (_cliente.nombre || 'U')[0].toUpperCase();
      document.getElementById('authUserAvatar').textContent = inicial;
      document.getElementById('authUserName').textContent   = _cliente.nombre || '—';
      document.getElementById('authUserEmail').textContent  = _cliente.correo || '—';
    } else {
      viewLogin.style.display = '';
      viewUser.style.display  = 'none';
    }
  }

  /* ── Tras autenticación exitosa ──────────────────────────────── */
  function _onAutenticado(cliente) {
    _cliente = cliente;
    _actualizarNavBtn();
    _actualizarVistaModal();
    // Notificar a otras partes de la página (solicitudes, checkout, etc.)
    document.dispatchEvent(new CustomEvent('wh:autenticado', { detail: cliente }));

    if (typeof _callback === 'function') {
      const cb = _callback;
      _callback = null;
      AuthModal.close();
      cb(cliente);
    } else {
      // Sin callback: mostrar vista de usuario autenticado
      _actualizarVistaModal();
    }
  }

  /* ── Login con email ─────────────────────────────────────────── */
  window._authLoginEmail = async function (e) {
    e.preventDefault();
    _authClearAlert();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return;

    _authSetLoading('btnLoginSubmit', true);
    try {
      const auth = await _getAuth();
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      const cred  = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      const data  = await _llamarBackend('cliente-login', token);
      if (!data.success) throw new Error(data.error || 'Error al iniciar sesión');
      _onAutenticado(data.cliente);
    } catch (e) {
      const map = {
        'auth/user-not-found':    'No existe cuenta con ese correo.',
        'auth/wrong-password':    'Contraseña incorrecta.',
        'auth/invalid-email':     'Correo inválido.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      };
      // Si el backend rechaza por ser cuenta de personal, mostrar mensaje con enlace
      const msg = e.message || '';
      if (msg.includes('personal') || msg.includes('Personal')) {
        _authShowAlert('Esa cuenta es de acceso al personal. Usa la opción "Personal" del menú.', 'error');
      } else {
        _authShowAlert(map[e.code] || msg || 'Error al iniciar sesión', 'error');
      }
    } finally {
      _authSetLoading('btnLoginSubmit', false);
    }
  };

  /* ── Continuar después del registro (botón en vista verificación) ── */
  let _pendingCliente = null;
  window._authContinuarDespuesDeRegistro = function () {
    if (_pendingCliente) {
      _onAutenticado(_pendingCliente);
      _pendingCliente = null;
    } else {
      AuthModal.close();
    }
  };

  /* ── Registro con email ──────────────────────────────────────── */
  window._authRegistroEmail = async function (e) {
    e.preventDefault();
    _authClearAlert();
    const nombre          = document.getElementById('regNombre').value.trim();
    const email           = document.getElementById('regEmail').value.trim();
    const password        = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    if (!nombre || !email || !password || !confirmPassword) return;

    // Validar nombre: solo letras, espacios y acentos
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]{2,120}$/.test(nombre)) {
      _authShowAlert('El nombre solo puede contener letras y espacios', 'error'); return;
    }
    // Verificar que las contraseñas coinciden
    if (password !== confirmPassword) {
      _authShowAlert('Las contraseñas no coinciden', 'error'); return;
    }

    _authSetLoading('btnRegSubmit', true);
    try {
      const auth = await _getAuth();
      const { createUserWithEmailAndPassword, sendEmailVerification } =
        await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      const cred  = await createUserWithEmailAndPassword(auth, email, password);

      // Enviar correo de verificación (no bloquea el flujo)
      sendEmailVerification(cred.user).catch(() => {});

      const token = await cred.user.getIdToken();
      const data  = await _llamarBackend('cliente-registro', token, { nombre, correo: email });
      if (!data.success) throw new Error(data.error || 'Error al registrarse');

      // Guardar cliente pendiente y mostrar vista de verificación
      _pendingCliente = data.cliente;
      const labelEl = document.getElementById('authVerifEmailLabel');
      if (labelEl) labelEl.textContent = email;

      // Ocultar login y mostrar pantalla de verificación
      document.getElementById('authViewLogin').style.display       = 'none';
      document.getElementById('authViewVerificacion').style.display = 'block';
    } catch (e) {
      const map = {
        'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión.',
        'auth/invalid-email':        'Correo inválido.',
        'auth/weak-password':        'La contraseña es muy corta (mínimo 6 caracteres).',
      };
      const msg = e.message || '';
      if (msg.includes('personal') || msg.includes('Personal')) {
        _authShowAlert('Ese correo pertenece a una cuenta de personal. Usa la opción "Personal" del menú.', 'error');
      } else {
        _authShowAlert(map[e.code] || msg || 'Error al registrarse', 'error');
      }
    } finally {
      _authSetLoading('btnRegSubmit', false);
    }
  };

  /* ── Restablecer contraseña ──────────────────────────────────── */
  window._authResetPassword = async function (e) {
    e.preventDefault();
    const email = (document.getElementById('loginEmail')?.value || '').trim();
    if (!email) {
      _authShowAlert('Ingresa tu correo primero para restablecer tu contraseña.', 'error');
      document.getElementById('loginEmail')?.focus();
      return;
    }
    try {
      const auth = await _getAuth();
      const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      await sendPasswordResetEmail(auth, email);
      _authShowAlert('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo (y spam).', 'success');
    } catch (err) {
      const map = {
        'auth/user-not-found':    'No existe cuenta con ese correo.',
        'auth/invalid-email':     'Correo inválido.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
      };
      _authShowAlert(map[err.code] || 'No se pudo enviar el correo. Intenta de nuevo.', 'error');
    }
  };

  /* ── Logout ──────────────────────────────────────────────────── */
  window._authLogout = async function () {
    try {
      const auth = await _getAuth();
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      await signOut(auth);
    } catch (_) { /* ignorar */ }

    const csrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN='));
    const csrfToken = csrf ? decodeURIComponent(csrf.split('=')[1]) : '';
    await fetch('/api/auth.php?action=cliente-logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
      credentials: 'same-origin',
      body: '{}',
    }).catch(() => {});

    _cliente = null;
    _actualizarNavBtn();
    AuthModal.close();
    // Recargar para limpiar estado de la página
    location.reload();
  };

  /* ── API pública ─────────────────────────────────────────────── */
  window.AuthModal = {

    open(callback) {
      _crearModal();
      _callback = typeof callback === 'function' ? callback : null;
      _actualizarVistaModal();
      _authClearAlert();
      const overlay = document.getElementById('authModalOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('visible'));
      }
    },

    close() {
      const overlay = document.getElementById('authModalOverlay');
      if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
      }
    },

    logout() { window._authLogout(); },

    isAuthenticated() { return !!_cliente; },

    getCliente() { return _cliente ? { ..._cliente } : null; },

    async verificar() {
      try {
        const res  = await fetch('/api/auth.php?action=cliente-verificar', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.ok && data.autenticado && data.cliente) {
          _cliente = data.cliente;
          _actualizarNavBtn();
          return _cliente;
        }
      } catch (_) { /* ignorar */ }
      _cliente = null;
      _actualizarNavBtn();
      return null;
    },

    // Para páginas que necesitan auth antes de continuar
    requireAuth(callback, mensajePersonalizado) {
      if (_cliente) {
        if (typeof callback === 'function') callback(_cliente);
        return;
      }
      _crearModal();
      if (mensajePersonalizado) {
        const sub = document.getElementById('authModalSubtitle');
        if (sub) sub.textContent = mensajePersonalizado;
      }
      this.open(callback);
    },
  };

  /* ── Verificar sesión al cargar la página ────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    AuthModal.verificar();
  });

})();
