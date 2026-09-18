// NexaCRM Service Worker
// Version: 1.0.0

const CACHE_VERSION = 'nexacrm-v1.0.0';
const CACHE_PREFIX = 'nexacrm';

// Caches
const CACHE_NAMES = {
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  ASSETS: `${CACHE_PREFIX}-assets-${CACHE_VERSION}`,
  PAGES: `${CACHE_PREFIX}-pages-${CACHE_VERSION}`,
};

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/offline',
];

// Routes that should NEVER be cached (sensitive CRM data)
const NEVER_CACHE_PATTERNS = [
  /\/api\/v1\/auth\//,
  /\/api\/v1\/contacts\//,
  /\/api\/v1\/leads\//,
  /\/api\/v1\/deals\//,
  /\/api\/v1\/inbox\//,
  /\/api\/v1\/whatsapp\//,
  /\/api\/v1\/settings\//,
  /\/api\/v1\/team\//,
  /\/api\/v1\/reports\//,
  /\/api\/v1\/dashboard\//,
  /\/api\/v1\/tasks\//,
  /\/api\/v1\/calendar\//,
];

// Static assets that can be cached aggressively
const STATIC_ASSET_PATTERNS = [
  /\/_next\/static\//,
  /\.(?:woff2?|ttf|eot)$/,
  /\/icons\//,
];

// Public pages that can be cached
const PUBLIC_PAGE_PATTERNS = [
  /^\/home$/,
  /^\/help\//,
  /^\/privacy$/,
  /^\/terms$/,
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache failed (non-critical):', err);
      });
    }).then(() => {
      console.log('[SW] Service worker installed successfully');
      // Force activation without waiting
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName.startsWith(CACHE_PREFIX) && !Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // NEVER cache sensitive API endpoints
  if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    // Network only - no caching
    event.respondWith(fetch(request));
    return;
  }
  
  // Cache static assets aggressively (immutable Next.js assets)
  if (STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.ASSETS));
    return;
  }
  
  // Cache public pages with network-first strategy
  if (PUBLIC_PAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.PAGES));
    return;
  }
  
  // Protected pages - network only (requires authentication)
  if (
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/contacts') ||
    url.pathname.startsWith('/leads') ||
    url.pathname.startsWith('/deals') ||
    url.pathname.startsWith('/inbox') ||
    url.pathname.startsWith('/tasks') ||
    url.pathname.startsWith('/calendar') ||
    url.pathname.startsWith('/reports') ||
    url.pathname.startsWith('/team') ||
    url.pathname.startsWith('/settings')
  ) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Default: network first for everything else
  event.respondWith(networkFirstStrategy(request, CACHE_NAMES.PAGES));
});

// Cache-first strategy (for immutable static assets)
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    throw error;
  }
}

// Network-first strategy (for pages)
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If offline page exists, show it
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    throw error;
  }
}

// Message event - handle commands from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    console.log('[SW] Received CLIENTS_CLAIM message');
    self.clients.claim();
  }
  
  if (event.data && event.data.type === 'CACHE_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Background sync event (for future offline support)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    // Future: sync offline mutations
    event.waitUntil(Promise.resolve());
  }
});

console.log('[SW] Service worker script loaded');
