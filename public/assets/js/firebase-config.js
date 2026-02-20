// =============================================================
// Wooden House - Firebase Configuration (SDK v9 compat mode)
// =============================================================

// Configuración del proyecto Firebase
const firebaseConfig = {
  apiKey:            "AIzaSyA0G4QZuxw0l7hH82SW_Y8_UurYsqyrMGs",
  authDomain:        "woodenhouse-898de.firebaseapp.com",
  projectId:         "woodenhouse-898de",
  storageBucket:     "woodenhouse-898de.firebasestorage.app",
  messagingSenderId: "662534856209",
  appId:             "1:662534856209:web:a69eba68addb491d0a1bb0",
  measurementId:     "G-LTQWQQ44ZH"
};

// ============================================================
// Firebase se inicializa via CDN compat (v8 API)
// Los scripts CDN deben cargarse ANTES de este archivo en el HTML
// Ejemplo:
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js"></script>
// ============================================================

let firebaseApp;
let firebaseAuth;
let firebaseFirestore;
let firebaseStorage;

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK no cargado. Asegúrate de incluir los scripts CDN antes de firebase-config.js');
    return false;
  }

  // Inicializar solo si no está inicializado
  if (!firebase.apps.length) {
    firebaseApp = firebase.initializeApp(firebaseConfig);
  } else {
    firebaseApp = firebase.apps[0];
  }

  firebaseAuth      = firebase.auth();
  firebaseFirestore = firebase.firestore();
  firebaseStorage   = firebase.storage();

  console.log('[OK] Firebase inicializado correctamente');
  return true;
}

// Auto-init si Firebase está disponible
if (typeof firebase !== 'undefined') {
  initFirebase();
}

// ============================================================
// Helpers de autenticación
// ============================================================

/**
 * Iniciar sesión con email y contraseña
 * Luego llama a la API PHP con el ID Token de Firebase
 */
async function loginConFirebase(email, password) {
  if (!firebaseAuth) throw new Error('Firebase Auth no inicializado');

  const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
  const idToken    = await credential.user.getIdToken(true);

  // Enviar token a backend PHP para crear sesión y obtener rol
  const response = await fetch('/api/auth.php?action=login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ firebase_token: idToken }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Error de autenticación');

  return { ...data, idToken };
}

/**
 * Obtener ID Token del usuario actual (para llamadas a API)
 */
async function getFirebaseToken() {
  if (!firebaseAuth) return null;
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return await user.getIdToken(true);
}

/**
 * Cerrar sesión
 */
async function logoutFirebase() {
  if (firebaseAuth) await firebaseAuth.signOut();
  await fetch('/api/auth.php?action=logout', { method: 'POST' });
}

/**
 * Fetch autenticado (agrega Bearer token de Firebase)
 */
async function authFetch(url, options = {}) {
  const token = await getFirebaseToken();
  if (token) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, options);
}

// Exportar para uso global
window.firebaseConfig     = firebaseConfig;
window.initFirebase       = initFirebase;
window.loginConFirebase   = loginConFirebase;
window.getFirebaseToken   = getFirebaseToken;
window.logoutFirebase     = logoutFirebase;
window.authFetch          = authFetch;
