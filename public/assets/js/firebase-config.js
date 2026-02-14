import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyA0G4QZuxw0l7hH82SW_Y8_UurYsqyrMGs",
    authDomain: "woodenhouse-898de.firebaseapp.com",
    projectId: "woodenhouse-898de",
    storageBucket: "woodenhouse-898de.firebasestorage.app",
    messagingSenderId: "662534856209",
    appId: "1:662534856209:web:a69eba68addb491d0a1bb0",
    measurementId: "G-LTQWQQ44ZH"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
