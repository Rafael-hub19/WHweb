// =============================================================
// Wooden House - Login (Firebase Auth + Backend PHP)
// =============================================================

const loginForm  = document.getElementById('loginForm');
const alertBox   = document.getElementById('alertBox');
const btnLogin   = document.getElementById('btnLogin');
const togglePass = document.getElementById('togglePass');
const forgotLink = document.getElementById('forgotLink');

// ── Mostrar alerta ─────────────────────────────────────────
function showAlert(msg, type = 'error') {
  if (!alertBox) return;
  alertBox.innerHTML  = msg;
  alertBox.className  = `alert alert-${type}`;
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
  if (!firebaseAuth) { showAlert('Firebase no disponible', 'error'); return; }
  firebaseAuth.sendPasswordResetEmail(email)
    .then(() => showAlert('Correo de recuperación enviado. Revisa tu bandeja.', 'success'))
    .catch(err => showAlert('Error: ' + err.message, 'error'));
});

// ── Submit del formulario ──────────────────────────────────
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) { showAlert('Ingresa correo y contraseña', 'error'); return; }

  btnLogin.disabled    = true;
  btnLogin.textContent = 'Iniciando sesión...';
  alertBox.style.display = 'none';

  try {
    // firebaseAuth puede estar en scope global o en window
    let auth = window.firebaseAuth;
    try { if (!auth && typeof firebaseAuth !== 'undefined') auth = firebaseAuth; } catch(e){}
    if (!auth) throw new Error('Firebase no inicializado');

    const credential = await auth.signInWithEmailAndPassword(email, password);
    const idToken    = await credential.user.getIdToken(true);

    // Verificar con backend PHP
    const res = await fetch('/api/auth.php?action=login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ firebase_token: idToken }),
    });

    // Verificar que la respuesta sea JSON válido antes de parsear
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('El servidor no respondio con JSON. Verifica la configuracion de la API PHP.');
    }

    const data = await res.json();

    if (data.success) {
      sessionStorage.setItem('wh_firebase_token', idToken);
      sessionStorage.setItem('wh_usuario', JSON.stringify(data.usuario));
      showAlert('<i class="fa-solid fa-circle-check"></i> Bienvenido, redirigiendo...', 'success');
      setTimeout(() => { window.location.href = data.redirect; }, 800);
    } else {
      throw new Error(data.error || 'Usuario no autorizado');
    }

  } catch (err) {
    console.error('Login error:', err);
    let msg = 'Error al iniciar sesion';
    if      (err.code === 'auth/user-not-found')      msg = 'Correo no registrado';
    else if (err.code === 'auth/wrong-password')       msg = 'Contrasena incorrecta';
    else if (err.code === 'auth/invalid-credential')   msg = 'Credenciales incorrectas';
    else if (err.code === 'auth/too-many-requests')    msg = 'Demasiados intentos. Espera un momento.';
    else if (err.message)                              msg = err.message;
    showAlert('<i class="fa-solid fa-xmark"></i> ' + msg, 'error');

  } finally {
    btnLogin.disabled    = false;
    btnLogin.textContent = 'Iniciar Sesion';
  }
});

// ── Verificar si ya está logueado al cargar ────────────────
document.addEventListener('DOMContentLoaded', () => {
  let auth = window.firebaseAuth;
  try { if (!auth && typeof firebaseAuth !== 'undefined') auth = firebaseAuth; } catch(e){}
  if (!auth) return;

  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/auth.php?action=verificar', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;
      const data = await res.json();
      if (data.success && data.autenticado) {
        const rol = data.usuario?.rol || '';
        window.location.href = rol === 'administrador'
          ? '/admin/panel_administrador.php'
          : '/empleado/panel_empleado.php';
      }
    } catch (e) { /* continuar con login normal */ }
  });
});

console.log('[OK] Login.js cargado');
