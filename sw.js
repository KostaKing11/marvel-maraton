/* ============================================================
   sw.js  -  service worker
   ------------------------------------------------------------
   VAZNO: podigni CACHE verziju na svaki deploy, inace se
   korisnik zaglavi na staroj verziji app-a.
   ============================================================ */
const CACHE = 'marvel-maraton-v57';

// App shell — cache-first. Isti ?v= broj kao u index.html.
const V = '207';
const SHELL = [
  './',
  './index.html',
  './css/app.css?v=' + V,
  './js/firebase-config.js?v=' + V,
  './js/store.js?v=' + V,
  './js/catalog.js?v=' + V,
  './js/planner.js?v=' + V,
  './js/posters.js?v=' + V,
  './js/reviews.js?v=' + V,
  './js/ics.js?v=' + V,
  './js/ui.js?v=' + V,
  './js/doom.js?v=' + V,
  './js/views.js?v=' + V,
  './js/main.js?v=' + V,
  './data.json',
  './img/map/z1.jpg', './img/map/z2.jpg', './img/map/z3.jpg', './img/map/z4.jpg', './img/map/z5.jpg', './img/map/doom.webp',
  './img/map/doomhead.jpg', './img/map/road.jpg', './img/map/sign.webp', './img/map/start.webp', './img/map/goal.webp', './img/map/mini.jpg',
  './manifest.json',
  './icons/icon-192.png',
  './icons/badge-96.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // VAZNO: `cache: 'reload'`. Bez toga addAll() pokupi fajlove iz
      // HTTP kesa browsera (GitHub Pages salje max-age=600), pa se u
      // novi kes upise STARI style.css/app.js - verzija kesa se promeni,
      // a sadrzaj ostane isti. Ovako svaki fajl ide sa mreze.
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE && k !== 'mm-meta').map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Firebase / gstatic / sve sa drugog origina — pusti kroz, ne kesiramo.
  if (url.origin !== self.location.origin) return;

  // index.html i data.json — network-first. index.html mora jer nosi
  // ?v= adrese ostalih fajlova: da se cita iz kesa, nova verzija se
  // nikad ne bi ni zatrazila.
  if (url.pathname.endsWith('data.json') ||
      url.pathname.endsWith('index.html') ||
      url.pathname.endsWith('/marvel-maraton/') ||
      req.mode === 'navigate') {
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

/* ============================================================
   Upozorenje kad dugo nisi gledao
   ------------------------------------------------------------
   SW ne moze do localStorage-a, pa app ostavlja mali JSON u kesu
   "mm-meta". Chrome budi periodicsync za instalirane PWA - nije
   garantovano kad, ali je jedini nacin bez push servera.
   ============================================================ */

async function readMeta() {
  try {
    const c = await caches.open('mm-meta');
    const r = await c.match('/mm-meta.json');
    return r ? await r.json() : null;
  } catch (e) { return null; }
}

async function maybeWarn() {
  const m = await readMeta();
  if (!m || !m.lastWatchAt || !m.left) return;

  const hours = Math.floor((Date.now() - m.lastWatchAt) / 3600000);
  if (hours < 24) return;

  // Najvise jednom dnevno.
  const today = new Date().toISOString().slice(0, 10);
  const c = await caches.open('mm-meta');
  const seen = await c.match('/mm-warned.txt');
  if (seen && (await seen.text()) === today) return;
  await c.put('/mm-warned.txt', new Response(today));

  const days = Math.floor(hours / 24);
  const title = days >= 2 ? `🚨 ${days} DANA BEZ MARVELA` : '🚨 24 SATA BEZ MARVELA';
  const body = (m.title ? `Na redu je #${m.num} ${m.title}.
` : '') +
    `Još ${m.left} naslova. Doomsday ne čeka.`;

  await self.registration.showNotification(title, {
    body,
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    image: m.poster || undefined,
    vibrate: [220, 90, 220, 90, 420],
    tag: 'mm-warn',
    renotify: true,
    requireInteraction: true,
    actions: [{ action: 'open', title: 'Gledam sad' }, { action: 'later', title: 'Sutra' }]
  });
}

self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'mm-warn') e.waitUntil(maybeWarn());
});
self.addEventListener('sync', (e) => {
  if (e.tag === 'mm-warn') e.waitUntil(maybeWarn());
});

// Klik na notifikaciju otvara app.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'later') return;      // "Sutra" samo sklanja notifikaciju
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});
