const firebaseConfig = {
  apiKey: "AIzaSyA0G4QZuxw0l7hH82SW_Y8_UurYsqyrMGs",
  authDomain: "woodenhouse-898de.firebaseapp.com",
  projectId: "woodenhouse-898de",
  storageBucket: "woodenhouse-898de.firebasestorage.app",
  messagingSenderId: "662534856209",
  appId: "1:662534856209:web:a69eba68addb491d0a1bb0",
  measurementId: "G-LTQWQQ44ZH"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar servicios
const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore();

console.log('Firebase inicializado correctamente');