// Aimo Pulse - Service Worker for Push Notifications
// Handles background push notifications with iOS-style behavior

const CACHE_NAME = 'aimo-pulse-v1';
const NOTIFICATION_TAG = 'aimo-pulse-notification';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/icon-192.png',
        '/icon-512.png',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {
    title: 'Aimo Pulse',
    body: 'You have a new update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    type: 'default',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[Service Worker] Failed to parse push data:', e);
    }
  }

  const options = createNotificationOptions(data);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - open app when notification is tapped
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Create iOS-style notification options
function createNotificationOptions(data) {
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: NOTIFICATION_TAG,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: {
      timestamp: Date.now(),
      type: data.type,
      url: data.url || '/',
    },
  };

  // Customize based on notification type
  switch (data.type) {
    case 'message':
      options.vibrate = [100, 50, 100];
      options.actions = [
        { action: 'view', title: 'View Message', icon: '/icon-192.png' },
      ];
      break;

    case 'nudge':
      options.vibrate = [200, 100, 200, 100, 200];
      break;

    case 'mood-update':
      options.vibrate = [150, 100, 150];
      break;

    case 'shark-mode':
      options.vibrate = [300, 100, 300];
      options.requireInteraction = true;
      break;

    default:
      break;
  }

  return options;
}

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.url.includes('/functions/v1/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  console.log('[Service Worker] Syncing notifications...');
}

console.log('[Service Worker] Loaded successfully');
