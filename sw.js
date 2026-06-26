// ════════════════════════════════════════════════════════════════════
// SAGAE — Service Worker v1.5
// Sistema de Activos y Gestión Administrativa Educativa
// Desarrollado por RYE Design
// ════════════════════════════════════════════════════════════════════

const CACHE_NAME   = 'sagae-mobile-v1.5';
const CACHE_STATIC = 'sagae-static-v1.5';

// Recursos a cachear para funcionamiento offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ── INSTALL — cachear recursos estáticos ─────────────────────────
self.addEventListener('install', event => {
  console.log('[SAGAE SW] Instalando v1.5...');
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SAGAE SW] Error cacheando assets:', err);
      });
    }).then(() => {
      console.log('[SAGAE SW] Assets cacheados correctamente');
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE — limpiar caches viejos ─────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SAGAE SW] Activando v1.5...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_STATIC && name !== CACHE_NAME)
          .map(name => {
            console.log('[SAGAE SW] Eliminando cache obsoleto:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SAGAE SW] Activado. Tomando control de clientes.');
      return self.clients.claim();
    })
  );
});

// ── FETCH — Network First para HTML/JS, Cache First para íconos ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API de Google — siempre red, nunca cachear
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // CDN externas — Cache First
  if (url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // HTML, JS, CSS propios — Network First (garantiza actualizaciones automáticas)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) {
            console.log('[SAGAE SW] Sirviendo desde cache:', event.request.url);
            return cached;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Sin conexión', { status: 503 });
        });
      })
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body:    data.body || 'Nueva notificación de SAGAE',
    icon:    './icons/icon-192.png',
    badge:   './icons/icon-96.png',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/' },
    actions: [
      { action: 'ver',    title: 'Ver ticket' },
      { action: 'cerrar', title: 'Cerrar'     }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'SAGAE', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'ver') {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});

// ── MENSAJE — forzar actualización desde el cliente ──────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SAGAE SW] Forzando activación inmediata...');
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
      .then(() => console.log('[SAGAE SW] Cache limpiado por solicitud del cliente'));
  }
});

console.log('[SAGAE SW] Service Worker v1.5 cargado correctamente');
