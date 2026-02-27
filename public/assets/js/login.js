// =============================================================
// Wooden House - Login (Firebase Auth + Backend PHP)
// VERSION CORREGIDA: fix crash al cambiar admin→empleado
// =============================================================

const loginForm  = document.getElementById('loginForm');
const alertBox   = document.getElementById('alertBox');
const btnLogin   = document.getElementById('btnLogin');
const togglePass = document.getElementById('togglePass');
const forgotLink = document.getElementById('forgotLink');

// Flag global: bloquea onAuthStateChanged mientras se hace login manual
let loginEnCurso = false;
// Flag: ya redirigimos, evitar doble redirección
let redirigido   = false;

// ── Mostrar alerta ─────────────────────────────────────────
function showAlert(msg, type = 'error') {
  if (!alertBox) return;
  alertBox.innerHTML     = msg;
  alertBox.className     = `alert alert-${type}`;
  alertBox.style.display = 'block';
}

// ── Toggle ver/ocultar contraseña ──────────────────────────
togglePass?.addEventListener('click', () => {
  const pwd = document.getElementById('password');
  const isVisible = pwd.type === 'text';
  pwd.type = isVisible ? 'password' : 'text';
  togglePass.innerHTML = isVisible
    ? '<i class="fa-solid fa-eye"></i>'
    : '<i class="fa-solid fa-eye-slash"></i>';
});

// ── Recuperar contraseña ───────────────────────────────────
forgotLink?.addEventListener('click', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (!email) { showAlert('Ingresa tu correo primero', 'error'); return; }
  if (!window.firebaseAuth) { showAlert('Firebase no disponible', 'error'); return; }
  window.firebaseAuth.sendPasswordResetEmail(email)
    .then(() => showAlert('Correo de recuperación enviado. Revisa tu bandeja.', 'success'))
    .catch(err => showAlert('Error: ' + err.message, 'error'));
});

// ── Submit del formulario ──────────────────────────────────
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) { showAlert('Ingresa correo y contraseña', 'error'); return; }

  // Bloquear auto-redirect mientras hacemos login manual
  loginEnCurso         = true;
  btnLogin.disabled    = true;
  btnLogin.textContent = 'Iniciando sesión...';
  alertBox.style.display = 'none';

  try {
    if (!window.firebaseAuth) throw new Error('Firebase no inicializado');

    // 1. Forzar sign out de cualquier sesión previa en Firebase
    try { await window.firebaseAuth.signOut(); } catch(e) {}

    // 2. Login con nuevas credenciales
    const credential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
    const idToken    = await credential.user.getIdToken(true);

    // 3. Verificar con backend PHP (crea sesión PHP con el rol correcto)
    const res = await fetch('/api/auth.php?action=login', {
      method:      'POST',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ firebase_token: idToken }),
    });

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error('El servidor no respondió con JSON. Verifica la configuración PHP.');
    }

    const data = await res.json();

    if (data.success) {
      sessionStorage.setItem('wh_firebase_token', idToken);
      sessionStorage.setItem('wh_usuario', JSON.stringify(data.usuario));
      showAlert('<i class="fa-solid fa-circle-check"></i> Bienvenido, redirigiendo...', 'success');
      redirigido = true;
      setTimeout(() => { window.location.href = data.redirect; }, 700);
    } else {
      await window.firebaseAuth.signOut().catch(() => {});
      throw new Error(data.error || 'Usuario no autorizado');
    }

  } catch (err) {
    console.error('[Login]', err);
    loginEnCurso = false; // permitir onAuthStateChanged de nuevo
    let msg = 'Error al iniciar sesión';
    if      (err.code === 'auth/user-not-found')    msg = 'Correo no registrado';
    else if (err.code === 'auth/wrong-password')     msg = 'Contraseña incorrecta';
    else if (err.code === 'auth/invalid-credential') msg = 'Credenciales incorrectas';
    else if (err.code === 'auth/too-many-requests')  msg = 'Demasiados intentos. Espera un momento.';
    else if (err.message)                            msg = err.message;
    showAlert('<i class="fa-solid fa-xmark"></i> ' + msg, 'error');
  } finally {
    btnLogin.disabled    = false;
    btnLogin.textContent = 'Iniciar Sesión';
  }
});

// ── Limpiar sesión al cargar la página de login ─────────────
// Esto es crucial: cuando el admin hace logout → viene a /login
// Debemos limpiar TODO para que el siguiente login sea limpio
document.addEventListener('DOMContentLoaded', () => {
  // Limpiar storage siempre al cargar login
  sessionStorage.removeItem('wh_firebase_token');
  sessionStorage.removeItem('wh_usuario');

  if (typeof window.firebaseAuth === 'undefined' || !window.firebaseAuth) return;

  // Cerrar sesión Firebase en background (no await, no bloquear UI)
  window.firebaseAuth.signOut().catch(() => {});
  // Cerrar sesión PHP también
  fetch('/api/auth.php?action=logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});

  // Verificar si había sesión activa válida (para auto-redirect)
  // IMPORTANTE: solo si venimos de una navegación normal, NO desde logout
  const params       = new URLSearchParams(window.location.search);
  const desdeLogout  = params.has('logout');  // /login?logout=1
  if (desdeLogout) return;                    // Venir de logout → no auto-redirect

  // Auto-redirect si ya tiene sesión PHP válida (sin Firebase)
  // Esto es útil si el usuario tiene sesión PHP pero perdió Firebase local
  fetch('/api/auth.php?action=verificar', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      if (data.success && data.autenticado && !redirigido && !loginEnCurso) {
        redirigido = true;
        const rol = data.usuario?.rol || '';
        window.location.href = rol === 'administrador'
          ? '/admin/panel_administrador.php'
          : '/empleado/panel_empleado.php';
      }
    })
    .catch(() => {});
});

console.log('[OK] Login.js cargado');
