/**
 * login.js - Funcionalidad de Autenticación
 * Wooden House E-commerce
 */

// Importar Firebase (asumiendo que firebase-config.js ya se cargó)
let auth;

/**
 * Inicializar página de login
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Login Iniciado');
  
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
    showNotification('❌ Por favor completa todos los campos', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showNotification('❌ Email inválido', 'error');
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
        
        showNotification('✅ ¡Bienvenido!', 'success');
        
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
        showNotification('✅ ¡Bienvenido!', 'success');
        
        setTimeout(() => {
          redirigirSegunRol(data.usuario.rol);
        }, 1000);
      } else {
        throw new Error(data.error || 'Credenciales incorrectas');
      }
    }
    
  } catch (error) {
    console.error('Error de login:', error);
    
    let mensaje = '❌ Error al iniciar sesión';
    
    if (error.code === 'auth/user-not-found') {
      mensaje = '❌ Usuario no encontrado';
    } else if (error.code === 'auth/wrong-password') {
      mensaje = '❌ Contraseña incorrecta';
    } else if (error.code === 'auth/invalid-email') {
      mensaje = '❌ Email inválido';
    } else if (error.code === 'auth/user-disabled') {
      mensaje = '❌ Usuario deshabilitado';
    } else if (error.message) {
      mensaje = `❌ ${error.message}`;
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
    showNotification('❌ Firebase no está configurado', 'error');
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
      showNotification('✅ ¡Bienvenido!', 'success');
      
      setTimeout(() => {
        redirigirSegunRol(data.usuario.rol);
      }, 1000);
    } else {
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    
  } catch (error) {
    console.error('Error Google login:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      showNotification('ℹ️ Inicio de sesión cancelado', 'info');
    } else {
      showNotification('❌ Error al iniciar sesión con Google', 'error');
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
      window.location.href = '/admin/panel_administrador.html';
      break;
    case 'empleado':
      window.location.href = '/empleado/panel_empleado.html';
      break;
    default:
      window.location.href = '/index.html';
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
    btn.textContent = '🙈';
  } else {
    passwordInput.type = 'password';
    btn.textContent = '👁️';
  }
}

/**
 * Recuperar contraseña
 */
async function recuperarPassword() {
  const email = prompt('Ingresa tu email para recuperar la contraseña:');
  
  if (!email) return;
  
  if (!isValidEmail(email)) {
    showNotification('❌ Email inválido', 'error');
    return;
  }
  
  if (!auth) {
    showNotification('❌ Función no disponible', 'error');
    return;
  }
  
  const loader = showLoader('Enviando email...');
  
  try {
    await auth.sendPasswordResetEmail(email);
    
    showNotification('✅ Email de recuperación enviado. Revisa tu bandeja.', 'success');
    
  } catch (error) {
    console.error('Error:', error);
    
    if (error.code === 'auth/user-not-found') {
      showNotification('❌ Email no registrado', 'error');
    } else {
      showNotification('❌ Error al enviar email', 'error');
    }
    
  } finally {
    hideLoader();
  }
}

// Exponer función globalmente
window.recuperarPassword = recuperarPassword;

console.log('✅ Login.js cargado');
