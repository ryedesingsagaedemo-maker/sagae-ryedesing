// ════════════════════════════════════════════════════════════════════
// SAGAE — Service Worker v2.4
// Sistema de Activos y Gestión Administrativa Educativa
// Desarrollado por RYE Design
// ════════════════════════════════════════════════════════════════════

const CACHE_NAME   = 'sagae-mobile-v2.4';
const CACHE_STATIC = 'sagae-static-v2.4';

// Recursos a cachear para funcionamiento offline
// (Corrección histórica v1.7: antes apuntaba a index.html —panel de
// escritorio—, por eso el técnico veía el panel web dentro del "shell"
// de la PWA. El módulo de técnico vive en SAGAE_index_mobile.html.)
// v2.0: corrección del selector de responsable vacío al crear tickets
// desde el móvil (nuevo endpoint "responsables" en el backend), edición
// de activos existentes (incluye reasignar responsable) y verificación
// proactiva de actualización al volver la app a primer plano.
// v2.1: corrección de login lento/intermitente (503 de Apps Script por
// saturación de la cuota de ejecuciones simultáneas) — carga de datos
// post-login por lotes en vez de en paralelo, jitter en el polling de
// fondo, y pausa aleatoria antes de reintentar un login con timeout.
// v2.2: se fuerza la renovación de la caché para que los técnicos reciban
// la app móvil con el bloqueo visual de guardado y la protección contra
// tickets duplicados. Sin este cambio de versión, el navegador seguiría
// sirviendo la versión anterior desde la caché.
// v2.3: CORRECCIÓN — el archivo publicado en GitHub Pages como
// SAGAE_index_mobile.html estaba desactualizado (versión sin el polling
// de tickets cada 20s ni la detección de nuevos tickets por hash), por lo
// que los técnicos no veían tickets recientes. Se reemplaza el archivo
// publicado por la versión vigente y se sube este número de caché para
// forzar que TODOS los dispositivos descarten la app vieja de inmediato,
// incluidos los que ya tenían la PWA instalada.
// v2.4: CORRECCIONES DEL MODULO MOVIL —
//   (1) identidad canonica del responsable: el reconocimiento de "mis
//       tickets" ya no depende de una igualdad exacta de cadenas entre
//       usuarios.nombre y tickets.resp (metricas en 0 y boton "Tomar
//       este ticket" mostrado sobre tickets propios);
//   (2) el aviso "Sin conexion" ya no queda encendido de forma
//       permanente cuando el fallo fue del backend y no de la red: se
//       distingue "sin red" de "datos sin actualizar" y el aviso se
//       apaga con cualquier lectura exitosa;
//   (3) la metrica "Cerrados hoy" deja de leer una columna inexistente;
//   (4) las banderas internas de "tomar ticket" ya no quedan pegadas al
//       ticket en memoria ni en la cache local.
//   Se sube el numero de cache para que todos los dispositivos —incluidos
//   los que ya tienen la PWA instalada— descarten la version anterior.
const STATIC_ASSETS = [
  './',
  './SAGAE_index_mobile.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ── INSTALL — cachear recursos estáticos ─────────────────────────
self.addEventListener('install', event => {
  console.log('[SAGAE SW] Instalando v2.4...');
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
  console.log('[SAGAE SW] Activando v2.4...');
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
            return caches.match('./SAGAE_index_mobile.html');
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

console.log('[SAGAE SW] Service Worker v2.4 cargado correctamente');
