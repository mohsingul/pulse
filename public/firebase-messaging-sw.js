// Aimo Pulse - Firebase Cloud Messaging Service Worker
// iOS PWA-compatible push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// These will be replaced with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAFQIStEH2dwDhDuySvGTDvcFjVTb64sTY",
  authDomain: "aimopulse.firebaseapp.com",
  projectId: "aimopulse",
  storageBucket: "aimopulse.firebasestorage.app",
  messagingSenderId: "285037088087",
  appId: "1:285037088087:web:d9715e89eea8c54cc8c212",
  measurementId: "G-77QQ7SL7W6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Aimo Pulse';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update',
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
  };

  // Customize based on notification type
  const notifType = payload.data?.type;
  
  switch (notifType) {
    case 'message':
      notificationOptions.vibrate = [100, 50, 100];
      notificationOptions.actions = [
        { action: 'view', title: 'View Message' }
      ];
      break;

    case 'nudge':
      notificationOptions.vibrate = [200, 100, 200, 100, 200];
      break;

    case 'mood-update':
      notificationOptions.vibrate = [150, 100, 150];
      break;

    case 'doodle-update':
      notificationOptions.vibrate = [150, 100, 150];
      break;

    case 'shark-mode':
      notificationOptions.vibrate = [300, 100, 300];
      notificationOptions.requireInteraction = true;
      break;

    default:
      notificationOptions.vibrate = [200, 100, 200];
      break;
  }

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Firebase SW] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if app not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Cache management for PWA
const CACHE_NAME = 'aimo-pulse-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  console.log('[Firebase SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Firebase SW] Activating...');
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

// Fetch event for offline support
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't cache API requests
  if (event.request.url.includes('/functions/v1/') || 
      event.request.url.includes('firebasestorage') ||
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

console.log('[Firebase SW] Service Worker loaded successfully');
