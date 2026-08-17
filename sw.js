/* ============================================================
   sw.js  -  service worker
   ------------------------------------------------------------
   VAZNO: podigni CACHE verziju na svaki deploy, inace se
   korisnik zaglavi na staroj verziji app-a.
   ============================================================ */
const CACHE = 'marvel-maraton-v10';

// App shell — cache-first
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './planner.js',
  './sync.js',
  './posters.js',
  './ics.js',
  './firebase-config.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Firebase / gstatic / sve sa drugog origina — pusti kroz, ne kesiramo.
  if (url.origin !== self.location.origin) return;

  // data.json — network-first (da nove naslove vidis odmah), fallback na kes.
  if (url.pathname.endsWith('data.json')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Sve ostalo (shell) — cache-first, pa mreza.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

// Klik na notifikaciju otvara app.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});
