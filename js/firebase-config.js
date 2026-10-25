/* ============================================================
   firebase-config.js
   ------------------------------------------------------------
   Vrednosti su iz Firebase konzole:
   Project settings -> General -> Your apps -> Web app.

   NAPOMENA: Firebase ti u konzoli prikaze snippet sa
   `import { initializeApp } from "firebase/app"`. Taj oblik je za
   projekte sa bundlerom (npr. Vite/webpack). Mi nemamo build korak,
   pa nam treba samo OBJEKAT sa vrednostima - app sam ucitava
   Firebase sa CDN-a u sync.js. Zato ovde stoji window.FIREBASE_CONFIG.

   Ako ikad ponovo kopiras iz konzole, prepisi samo vrednosti dole.
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDNrEaBmV1efd_e7oQdY-rj9FSdbl09Fo0",
  authDomain: "marvel-marathon-kosat.firebaseapp.com",
  projectId: "marvel-marathon-kosat",
  storageBucket: "marvel-marathon-kosat.firebasestorage.app",
  messagingSenderId: "1046247831951",
  appId: "1:1046247831951:web:1314b9f274e84b1a0bf3fa"
};
