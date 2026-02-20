// Importar Firebase (asumiendo que firebase-config.js ya se cargó)
let auth;

/**
 * Inicializar página de login
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[AUTH] Login Iniciado');
  
  // Verificar si ya hay sesión
  verificarSesionExistente();
  
  // Inicializar Firebase Auth
  if (typeof firebase !== 'undefined' && firebase.auth) {
    auth = firebase.auth();
  }
  
  // Event listeners
  const formLogin = document.getElementById('form-login');
  const btnGoogle = document.getElementById('btn-google-login');
  const btnMostrarPassword = document.getElementById('btn-mostrar-password');
  
  if (formLogin) {
    formLogin.addEventListener('submit', handleLogin);
  }
  
  if (btnGoogle) {
    btnGoogle.addEventListener('click', loginConGoogle);
  }
  
  if (btnMostrarPassword) {
    btnMostrarPassword.addEventListener('click', toggleMostrarPassword);
  }
});

/**
 * Verificar si ya existe una sesión activa
 */
async function verificarSesionExistente() {
  const token = localStorage.getItem('wh_token');
  
  if (token) {
    try {
      const response = await fetch('/api/usuarios/me.php', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Ya hay sesión válida, redirigir
        if (data.success && data.usuario) {
          redirigirSegunRol(data.usuario.rol);
          return;
        }
      }
      
      // Token inválido, limpiar
      localStorage.removeItem('wh_token');
      
    } catch (error) {
      console.error('Error al verificar sesión:', error);
    }
  }
}

/**
 * Manejar submit del formulario de login
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  // Validar campos
  if (!email || !password) {
    showNotification('<i class="fa-solid fa-xmark"></i> Por favor completa todos los campos', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showNotification('<i class="fa-solid fa-xmark"></i> Email inválido', 'error');
    return;
  }
  
  const loader = showLoader('Iniciando sesión...');
  
  try {
    // Intentar login con Firebase
    if (auth) {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Obtener token de Firebase
      const idToken = await user.getIdToken();
      
      // Verificar en backend
      const response = await fetch('/api/usuarios/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebase_uid: user.uid,
          email: email,
          id_token: idToken
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Guardar token
        localStorage.setItem('wh_token', data.token);
        
        showNotification('<i class="fa-solid fa-circle-check"></i> ¡Bienvenido!', 'success');
        
        // Redirigir según rol
        setTimeout(() => {
          redirigirSegunRol(data.usuario.rol);
        }, 1000);
        
      } else {
        throw new Error(data.error || 'Error al iniciar sesión');
      }
      
    } else {
      // Fallback: login directo con backend (sin Firebase)
      const response = await fetch('/api/usuarios/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('wh_token', data.token);
        showNotification('<i class="fa-solid fa-circle-check"></i> ¡Bienvenido!', 'success');
        
        setTimeout(() => {
          redirigirSegunRol(data.usuario.rol);
        }, 1000);
      } else {
        throw new Error(data.error || 'Credenciales incorrectas');
      }
    }
    
  } catch (error) {
    console.error('Error de login:', error);
    
    let mensaje = '<i class="fa-solid fa-xmark"></i> Error al iniciar sesión';
    
    if (error.code === 'auth/user-not-found') {
      mensaje = '<i class="fa-solid fa-xmark"></i> Usuario no encontrado';
    } else if (error.code === 'auth/wrong-password') {
      mensaje = '<i class="fa-solid fa-xmark"></i> Contraseña incorrecta';
    } else if (error.code === 'auth/invalid-email') {
      mensaje = '<i class="fa-solid fa-xmark"></i> Email inválido';
    } else if (error.code === 'auth/user-disabled') {
      mensaje = '<i class="fa-solid fa-xmark"></i> Usuario deshabilitado';
    } else if (error.message) {
      mensaje = `<i class="fa-solid fa-xmark"></i> ${error.message}`;
    }
    
    showNotification(mensaje, 'error');
    
  } finally {
    hideLoader();
  }
}

/**
 * Login con Google
 */
async function loginConGoogle() {
  if (!auth) {
    showNotification('<i class="fa-solid fa-xmark"></i> Firebase no está configurado', 'error');
    return;
  }
  
  const loader = showLoader('Iniciando sesión con Google...');
  
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    
    const user = result.user;
    const idToken = await user.getIdToken();
    
    // Verificar/crear usuario en backend
    const response = await fetch('/api/usuarios/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firebase_uid: user.uid,
        email: user.email,
        nombre: user.displayName,
        id_token: idToken,
        provider: 'google'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('wh_token', data.token);
      showNotification('<i class="fa-solid fa-circle-check"></i> ¡Bienvenido!', 'success');
      
      setTimeout(() => {
        redirigirSegunRol(data.usuario.rol);
      }, 1000);
    } else {
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    
  } catch (error) {
    console.error('Error Google login:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      showNotification('[INFO] Inicio de sesión cancelado', 'info');
    } else {
      showNotification('<i class="fa-solid fa-xmark"></i> Error al iniciar sesión con Google', 'error');
    }
    
  } finally {
    hideLoader();
  }
}

/**
 * Redirigir según el rol del usuario
 */
function redirigirSegunRol(rol) {
  switch (rol) {
    case 'administrador':
      window.location.href = '/admin/panel_administrador.php';
      break;
    case 'empleado':
      window.location.href = '/empleado/panel_empleado.php';
      break;
    default:
      window.location.href = '/inicio';
      break;
  }
}

/**
 * Toggle mostrar/ocultar password
 */
function toggleMostrarPassword() {
  const passwordInput = document.getElementById('password');
  const btn = document.getElementById('btn-mostrar-password');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    btn.textContent = '<i class="fa-solid fa-eye-slash"></i>';
  } else {
    passwordInput.type = 'password';
    btn.textContent = '<i class="fa-solid fa-eye"></i>';
  }
}

/**
 * Recuperar contraseña
 */
async function recuperarPassword() {
  const email = prompt('Ingresa tu email para recuperar la contraseña:');
  
  if (!email) return;
  
  if (!isValidEmail(email)) {
    showNotification('<i class="fa-solid fa-xmark"></i> Email inválido', 'error');
    return;
  }
  
  if (!auth) {
    showNotification('<i class="fa-solid fa-xmark"></i> Función no disponible', 'error');
    return;
  }
  
  const loader = showLoader('Enviando email...');
  
  try {
    await auth.sendPasswordResetEmail(email);
    
    showNotification('<i class="fa-solid fa-circle-check"></i> Email de recuperación enviado. Revisa tu bandeja.', 'success');
    
  } catch (error) {
    console.error('Error:', error);
    
    if (error.code === 'auth/user-not-found') {
      showNotification('<i class="fa-solid fa-xmark"></i> Email no registrado', 'error');
    } else {
      showNotification('<i class="fa-solid fa-xmark"></i> Error al enviar email', 'error');
    }
    
  } finally {
    hideLoader();
  }
}

// Exponer función globalmente
window.recuperarPassword = recuperarPassword;

console.log('[OK] Login.js cargado');


// ── Integración Firebase Auth (desde login.php) ─────────────────
// ============================================================
    // Login con Firebase Auth + Backend PHP
    // ============================================================
    const loginForm  = document.getElementById('loginForm');
    const alertBox   = document.getElementById('alertBox');
    const btnLogin   = document.getElementById('btnLogin');
    const togglePass = document.getElementById('togglePass');
    const forgotLink = document.getElementById('forgotLink');

    function showAlert(msg, type = 'error') {
      alertBox.textContent = msg;
      alertBox.className   = `alert alert-${type}`;
      alertBox.style.display = 'block';
    }

    togglePass?.addEventListener('click', () => {
      const pwd = document.getElementById('password');
      pwd.type = pwd.type === 'password' ? 'text' : 'password';
      togglePass.textContent = pwd.type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    });

    forgotLink?.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      if (!email) { showAlert('Ingresa tu correo primero', 'error'); return; }
      if (!firebaseAuth) { showAlert('Firebase no disponible', 'error'); return; }
      firebaseAuth.sendPasswordResetEmail(email)
        .then(() => showAlert('Correo de recuperación enviado. Revisa tu bandeja.', 'success'))
        .catch(err => showAlert('Error: ' + err.message, 'error'));
    });

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) { showAlert('Ingresa correo y contraseña', 'error'); return; }

      btnLogin.disabled     = true;
      btnLogin.textContent  = 'Iniciando sesión...';
      alertBox.style.display = 'none';

      try {
        if (!firebaseAuth) throw new Error('Firebase no inicializado');

        const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const idToken    = await credential.user.getIdToken(true);

        // Verificar con backend
        const res  = await fetch('/api/auth.php?action=login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ firebase_token: idToken }),
        });
        const data = await res.json();

        if (data.success) {
          showAlert('<i class="fa-solid fa-circle-check"></i> Bienvenido, redirigiendo...', 'success');
          // Guardar token para próximas llamadas API
          sessionStorage.setItem('wh_firebase_token', idToken);
          sessionStorage.setItem('wh_usuario', JSON.stringify(data.usuario));
          setTimeout(() => { window.location.href = data.redirect; }, 800);
        } else {
          throw new Error(data.error || 'Usuario no autorizado');
        }
      } catch (err) {
        console.error('Login error:', err);
        let msg = 'Error al iniciar sesión';
        if (err.code === 'auth/user-not-found')   msg = 'Correo no registrado';
        else if (err.code === 'auth/wrong-password') msg = 'Contraseña incorrecta';
        else if (err.code === 'auth/too-many-requests') msg = 'Demasiados intentos. Espera un momento.';
        else if (err.message) msg = err.message;
        showAlert(msg, 'error');
      } finally {
        btnLogin.disabled    = false;
        btnLogin.textContent = 'Iniciar Sesión';
      }
    });

    // Verificar si ya está logueado
    document.addEventListener('DOMContentLoaded', () => {
      if (firebaseAuth) {
        firebaseAuth.onAuthStateChanged(async (user) => {
          if (user) {
            // Verificar sesión con backend
            try {
              const token = await user.getIdToken();
              const res   = await fetch('/api/auth.php?action=verificar', {
                headers: { 'Authorization': 'Bearer ' + token }
              });
              const data  = await res.json();
              if (data.success && data.autenticado) {
                const rol = data.usuario?.rol || '';
                const redirect = rol === 'administrador'
                  ? '/public/admin/panel_administrador.php'
                  : '/public/empleado/panel_empleado.php';
                window.location.href = redirect;
              }
            } catch (e) { /* continuar con el login normal */ }
          }
        });
      }
    });