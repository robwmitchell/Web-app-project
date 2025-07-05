// Enhanced Service Worker for Stack Status IO
// Optimized for performance, SEO, and offline functionality

const CACHE_NAME = 'stack-status-v2.1';
const RUNTIME_CACHE = 'stack-status-runtime-v2.1';

// Enhanced cache strategy with performance optimization
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
  '/logos/aws-logo.png',
  '/logos/cloudflare-logo.svg',
  '/logos/Okta-logo.svg',
  '/logos/Zscaler.svg',
  '/logos/SendGrid.svg',
  '/logos/slack-logo.png',
  '/logos/datadog-logo.png',
  '/robots.txt',
  '/sitemap.xml'
];

// API endpoints that should be cached with network-first strategy
const API_CACHE_PATTERNS = [
  /^https:\/\/stack-status\.io\/api\/cloudflare/,
  /^https:\/\/stack-status\.io\/api\/aws/,
  /^https:\/\/stack-status\.io\/api\/okta/,
  /^https:\/\/stack-status\.io\/api\/zscaler/,
  /^https:\/\/stack-status\.io\/api\/sendgrid/,
  /^https:\/\/stack-status\.io\/api\/incidents/
];

// External service status pages (cache for short periods)
const STATUS_PAGE_PATTERNS = [
  /^https:\/\/www\.cloudflarestatus\.com/,
  /^https:\/\/status\.aws\.amazon\.com/,
  /^https:\/\/status\.okta\.com/,
  /^https:\/\/trust\.zscaler\.com/,
  /^https:\/\/status\.sendgrid\.com/,
  /^https:\/\/status\.slack\.com/,
  /^https:\/\/status\.datadoghq\.eu/
];

// Cache duration constants (in seconds)
const CACHE_DURATIONS = {
  STATIC: 24 * 60 * 60, // 24 hours
  API: 5 * 60, // 5 minutes
  STATUS_PAGES: 2 * 60, // 2 minutes
  IMAGES: 7 * 24 * 60 * 60 // 7 days
};

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Static resources cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[SW] Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('stack-status-') && 
              cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE
            )
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Different strategies based on request type
  if (shouldCacheStatic(request)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (shouldCacheAPI(request)) {
    event.respondWith(networkFirstStrategy(request, CACHE_DURATIONS.API));
  } else if (shouldCacheStatusPages(request)) {
    event.respondWith(networkFirstStrategy(request, CACHE_DURATIONS.STATUS_PAGES));
  } else if (shouldCacheImages(request)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_DURATIONS.IMAGES));
  } else {
    event.respondWith(networkOnlyStrategy(request));
  }
});

// Cache-first strategy for static resources
async function cacheFirstStrategy(request, maxAge = CACHE_DURATIONS.STATIC) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, addTimestamp(responseClone));
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(request) || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy for dynamic content
async function networkFirstStrategy(request, maxAge = CACHE_DURATIONS.API) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      const responseClone = networkResponse.clone();
      await cache.put(request, addTimestamp(responseClone));
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache...');
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      cached: false,
      message: 'Network unavailable and no valid cache found'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network-only strategy for real-time data
async function networkOnlyStrategy(request) {
  return fetch(request);
}

// Helper functions
function shouldCacheStatic(request) {
  const url = new URL(request.url);
  return STATIC_CACHE_URLS.some(path => url.pathname === path) ||
         url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2)$/);
}

function shouldCacheAPI(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function shouldCacheStatusPages(request) {
  return STATUS_PAGE_PATTERNS.some(pattern => pattern.test(request.url));
}

function shouldCacheImages(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif)$/);
}

function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function isExpired(response, maxAge) {
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return true;
  
  const age = (Date.now() - parseInt(timestamp)) / 1000;
  return age > maxAge;
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  // Implement background sync logic here
  // For example, sync queued notification subscriptions
}

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Service status update available',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'service-status',
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      url: data.url || '/',
      service: data.service,
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Stack Status IO', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Check if the app is already open
        for (const client of clientList) {
          if (client.url.includes(new URL(url, self.location).pathname) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_LOG') {
    console.log('[SW] Performance data:', event.data.data);
    // Send to analytics if needed
  }
});

console.log('[SW] Service worker script loaded');
