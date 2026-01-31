// Custom Service Worker for Aimo Pulse
// Handles push notifications, offline support, and caching

// Workbox manifest injection point - DO NOT REMOVE
self.__WB_MANIFEST;

const CACHE_NAME = 'aimo-pulse-v1';
const STATIC_CACHE = 'aimo-pulse-static-v1';
const DYNAMIC_CACHE = 'aimo-pulse-dynamic-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  // Skip waiting immediately - don't block on caching
  self.skipWaiting();
  
  // Try to cache, but don't fail if it doesn't work
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache each file individually to avoid total failure
        return Promise.allSettled([
          cache.add('/').catch(e => console.log('[SW] Failed to cache /:', e)),
          cache.add('/index.html').catch(e => console.log('[SW] Failed to cache /index.html:', e)),
          cache.add('/logo.svg').catch(e => console.log('[SW] Failed to cache /logo.svg:', e))
        ]);
      })
      .catch((error) => {
        console.error('[SW] Cache opening failed:', error);
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
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // For API requests, use Network First strategy
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch((error) => {
          console.error('[SW] Network request failed:', error);
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a basic response if no cache available
            return new Response('{"error": "Offline"}', {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }
  
  // For static assets, use Cache First strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If not in cache, fetch from network
      return fetch(request).then((response) => {
        // Don't cache failed responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        // Clone the response
        const responseClone = response.clone();
        
        // Cache the new response
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        
        return response;
      }).catch((error) => {
        console.error('[SW] Fetch failed:', error);
        // Return a fallback response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let notificationData = {
    title: 'Aimo Pulse',
    body: 'You have a new update',
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: 'aimo-pulse-notification',
    requireInteraction: false,
    data: {
      url: '/'
    }
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: {
          url: data.url || '/',
          ...data.data
        },
        actions: data.actions || []
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  // Handle action button clicks
  if (event.action) {
    console.log('[SW] Notification action clicked:', event.action);
    // You can handle different actions here
  }
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync event (optional - for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-pulse-updates') {
    event.waitUntil(
      // Sync any pending updates when connection is restored
      syncPendingUpdates()
    );
  }
});

async function syncPendingUpdates() {
  // Implementation for syncing offline updates
  console.log('[SW] Syncing pending updates...');
  // This would retrieve any pending updates from IndexedDB and send them to the server
}

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME
    });
  }
});