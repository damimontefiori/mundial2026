/* Service worker de Mundial 2026 — offline e instalable, sin dependencias.
   Estrategia:
   - Navegaciones: network-first y cae a la última versión cacheada de la ruta
     (o a /offline.html si nunca se visitó).
   - Resultados reales (/results.json): network-first, para no quedar pegado a una
     versión vieja; cae al caché solo si no hay red.
   - Assets estáticos del mismo origen: stale-while-revalidate.
*/
const CACHE = 'm26-cache-v2';
const PRECACHE = ['/', '/offline.html', '/manifest.webmanifest', '/icon.svg', '/icon-maskable.svg'];

self.addEventListener('install', (event) => {
  // allSettled (no addAll, que es atómico): si UNA URL del precache falla, igual
  // instalamos y activamos v2 — de lo contrario un asset caído abortaría la instalación
  // y nunca se purgaría la caché vieja (quedaría sirviendo datos viejos).
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones (HTML).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Solo cacheamos respuestas OK: si guardáramos un 404/500, una visita offline
          // posterior serviría esa página de error en vez de /offline.html.
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('/offline.html')),
        ),
    );
    return;
  }

  // Resultados reales: network-first (los datos en vivo no deben servirse viejos).
  if (url.pathname === '/results.json') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  // Assets estáticos: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
