// OPTINET — Service Worker con versión automática por timestamp
// ⚠️ IMPORTANTE: Este valor cambia automáticamente en cada deploy.
// NO lo edites manualmente. El script de build lo actualiza solo.
// Si no usas el script de build, cámbialo manualmente antes de cada subida.
const CACHE_VERSION = '20260710090340';
const CACHE_NAME = 'optinet-' + CACHE_VERSION;

// Archivos a cachear para funcionamiento offline
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// ─── INSTALACIÓN ─────────────────────────────────────────────────────────────
// Cachea los archivos locales y activa el SW inmediatamente (skipWaiting)
self.addEventListener('install', event => {
  console.log('[SW] Instalando versión:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.warn('[SW] Error al cachear assets:', err))
  );
  // Activar inmediatamente sin esperar a que cierren las pestañas abiertas
  self.skipWaiting();
});

// ─── ACTIVACIÓN ──────────────────────────────────────────────────────────────
// Elimina TODOS los cachés anteriores y toma control de todos los clientes
self.addEventListener('activate', event => {
  console.log('[SW] Activando versión:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Eliminando caché antiguo:', k);
            return caches.delete(k);
          })
      )
    ).then(() => {
      // Tomar control de todas las pestañas abiertas inmediatamente
      return self.clients.claim();
    }).then(() => {
      // Notificar a todos los clientes que hay una nueva versión activa
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
// Estrategia: Network-First para todo (garantiza contenido fresco)
// con fallback a caché si no hay conexión
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar peticiones de Firebase, Firestore y CDNs de autenticación
  const isFirebase = url.hostname.includes('firebase') ||
                     url.hostname.includes('firestore') ||
                     url.hostname.includes('googleapis') ||
                     url.hostname.includes('gstatic');
  if (isFirebase) return; // Dejar que el navegador maneje Firebase directamente

  // Para CDNs externos (xlsx, chart.js, etc.): Network-First con caché de respaldo
  const isExternal = url.hostname !== self.location.hostname;
  if (isExternal) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para archivos locales (index.html, manifest.json, iconos):
  // Network-First — siempre intenta descargar la versión más reciente
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Sin conexión: servir desde caché
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback final: devolver index.html para navegación SPA
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ─── MENSAJES ────────────────────────────────────────────────────────────────
// Permite forzar actualización desde el cliente si es necesario
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.source.postMessage({ type: 'SW_VERSION', version: CACHE_VERSION });
  }
});
