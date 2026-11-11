/* Service worker: guarda la app para usarla sin conexión. Subir VERSION al cambiar archivos. */
const VERSION = 'nacimiento-v8';
const BASE = ['./', 'index.html', 'app.css', 'app.js', 'niveles/datos.js', 'manifest.webmanifest',
  'assets/logo.png', 'assets/papel.jpg', 'assets/icon-192.png', 'assets/mapa-tierra-santa.jpg', 'assets/mapa-region.jpg', 'assets/mapa-oriente.jpg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASE))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || e.request.headers.has('range')) return; // los videos usan peticiones por rangos
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
