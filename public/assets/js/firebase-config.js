// =============================================================
// Wooden House - Firebase Configuration (SDK v10 compat)
// =============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyA0G4QZuxw0l7hH82SW_Y8_UurYsqyrMGs",
  authDomain:        "woodenhouse-898de.firebaseapp.com",
  projectId:         "woodenhouse-898de",
  storageBucket:     "woodenhouse-898de.firebasestorage.app",
  messagingSenderId: "662534856209",
  appId:             "1:662534856209:web:a69eba68addb491d0a1bb0",
  measurementId:     "G-LTQWQQ44ZH"
};

let firebaseApp;
let firebaseAuth;
let firebaseFirestore;
let firebaseStorage;

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('[Firebase] SDK no cargado.');
    return false;
  }

  firebaseApp = firebase.apps.length
    ? firebase.apps[0]
    : firebase.initializeApp(firebaseConfig);

  // Auth — siempre disponible
  firebaseAuth = firebase.auth();

  // Firestore — solo si el SDK fue incluido en la página
  if (typeof firebase.firestore === 'function') {
    firebaseFirestore = firebase.firestore();
  }

  // Storage — solo si el SDK fue incluido en la página
  if (typeof firebase.storage === 'function') {
    firebaseStorage = firebase.storage();
  }

  console.log('[OK] Firebase inicializado');
  return true;
}

if (typeof firebase !== 'undefined') {
  initFirebase();
}

// ── Helpers ────────────────────────────────────────────────────

async function loginConFirebase(email, password) {
  if (!firebaseAuth) throw new Error('Firebase Auth no inicializado');
  const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
  const idToken    = await credential.user.getIdToken(true);

  const response = await fetch('/api/auth.php?action=login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ firebase_token: idToken }),
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('La API no respondio con JSON. Verifica que /api/ sea accesible.');
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Error de autenticacion');
  return { ...data, idToken };
}

async function getFirebaseToken() {
  if (!firebaseAuth) return null;
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return await user.getIdToken(true);
}

async function logoutFirebase() {
  if (firebaseAuth) await firebaseAuth.signOut();
  await fetch('/api/auth.php?action=logout', { method: 'POST' });
}

async function authFetch(url, options = {}) {
  const token = await getFirebaseToken();
  if (token) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, options);
}

window.firebaseConfig   = firebaseConfig;
window.initFirebase     = initFirebase;
window.loginConFirebase = loginConFirebase;
window.getFirebaseToken = getFirebaseToken;
window.logoutFirebase   = logoutFirebase;
window.authFetch        = authFetch;