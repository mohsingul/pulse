/// <reference lib="webworker" />

import { firebaseConfig } from './utils/firebase-config';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Load Firebase compat libraries for background messaging.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const selfScope = self;

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase SW] Background message received:', payload);

  // If the payload already contains notification fields, let FCM handle display.
  if (payload.notification?.title || payload.notification?.body) {
    return;
  }

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Aimo Pulse';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update',
    icon: payload.notification?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'aimo-pulse',
    data: {
      url: payload.data?.url || '/',
      type: payload.data?.type || 'default',
      timestamp: Date.now(),
    },
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
  };

  switch (payload.data?.type) {
    case 'message':
      notificationOptions.vibrate = [100, 50, 100];
      notificationOptions.actions = [{ action: 'view', title: 'View Message' }];
      break;
    case 'nudge':
      notificationOptions.vibrate = [200, 100, 200, 100, 200];
      break;
    case 'mood-update':
      notificationOptions.vibrate = [150, 100, 150];
      break;
    case 'shark-mode':
      notificationOptions.vibrate = [300, 100, 300];
      notificationOptions.requireInteraction = true;
      break;
    default:
      break;
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
      return null;
    })
  );
});

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50 })],
  })
);

registerRoute(
  ({ request }) => ['script', 'style'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [new ExpirationPlugin({ maxEntries: 100 })],
  })
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/functions/v1/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  })
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded successfully');
