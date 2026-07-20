// OPTINET — Service Worker
// Actualiza CACHE_VERSION antes de cada deploy para invalidar el caché
const CACHE_VERSION = '20260720000000';
const CACHE_NAME = 'optinet-' + CACHE_VERSION;

// Archivos a cachear para funcionamiento offline
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

// ─── INSTALACIÓN ─────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando versión:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      // 'reload' fuerza a ignorar la caché HTTP del navegador al precachear
      .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .catch(err => console.warn('[SW] Error al cachear assets:', err))
  );
  self.skipWaiting();
});

// ─── ACTIVACIÓN ──────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activando versión:', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Eliminando caché antiguo:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
    // NOTA: Se eliminó el postMessage SW_UPDATED para evitar recargas
    // automáticas que causaban pantalla de carga infinita.
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
// Estrategia: Network-First para archivos locales, bypass para Firebase y CDNs
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar Firebase, Firestore y CDNs externos
  const isExternal =
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname !== self.location.hostname;

  if (isExternal) return;

  // Archivos locales: Network-First REAL (sin caché HTTP intermedia) con
  // respaldo offline. 'no-store' obliga a ignorar la caché del navegador,
  // que era lo que hacía que "Network-First" a veces devolviera una copia vieja.
  const networkRequest = new Request(event.request, { cache: 'no-store' });

  event.respondWith(
    fetch(networkRequest)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        })
      )
  );
});

// ─── MENSAJES ────────────────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
