// public/js/firebase-client.js
// Firebase v10+ (modular) via CDN — funciona em site estático
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAiFE8gO0oiti2Id-qfJuBEktgm-uM_4zQ",
  authDomain: "vindicatus-ce514.firebaseapp.com",
  projectId: "vindicatus-ce514",
  storageBucket: "vindicatus-ce514.firebasestorage.app",
  messagingSenderId: "92931437139",
  appId: "1:92931437139:web:439178a926466e3337cca6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
