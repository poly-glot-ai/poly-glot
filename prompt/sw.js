// Poly-Glot Prompt Studio — Service Worker
// Strategy: network-first for HTML/API, cache-first for static assets
// Version bump this string to force cache refresh on deploy
const CACHE_VERSION = 'pg-prompt-v1';
const STATIC_CACHE  = CACHE_VERSION + '-static';
const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';

const PRECACHE_URLS = [
  '/prompt/',
  '/prompt/index.html',
  '/prompt/manifest.json',
  '/prompt/icons/icon-192x192.png',
  '/prompt/icons/icon-512x512.png',
  '/prompt/parrot-favicon.ico',
  '/prompt/parrot-180.png',
];

// ── Install: precache shell ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Precache partial failure (ok):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ──────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('pg-prompt-') && k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for navigation + API, cache-first for assets ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests (fonts, GA, etc.)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match('/prompt/') || caches.match('/prompt/index.html'))
    );
    return;
  }

  // Static assets (icons, images, fonts): cache-first
  if (
    url.pathname.startsWith('/prompt/icons/') ||
    url.pathname.match(/\.(png|ico|webp|jpg|jpeg|svg|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (!res || res.status !== 200) return res;
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // JS/CSS: network-first, cache fallback
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Everything else: network only
  event.respondWith(fetch(request));
});
