// Aimo Pulse - Firebase Cloud Messaging Notification Utilities
// iOS PWA-compatible push notifications

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken, type Messaging } from 'firebase/messaging';
import { firebaseConfig, vapidKey } from './firebase-config';

let firebaseApp: any = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase
 */
export function initializeFirebase() {
  if (!firebaseApp) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('[Firebase] App initialized');
    } catch (error) {
      console.error('[Firebase] Initialization error:', error);
      throw error;
    }
  }
  return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): Messaging | null {
  if (!messaging) {
    try {
      const app = initializeFirebase();
      messaging = getMessaging(app);
      console.log('[Firebase] Messaging initialized');
    } catch (error) {
      console.error('[Firebase] Messaging error:', error);
      return null;
    }
  }
  return messaging;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window &&
    typeof window !== 'undefined'
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  console.log('[Firebase] Permission:', permission);
  return permission;
}

/**
 * Register service worker for Firebase
 */
export async function registerFirebaseServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Firebase] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/sw.js',
      { scope: '/' }
    );

    console.log('[Firebase] Service worker registered:', registration.scope);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('[Firebase] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Get FCM token (assumes permission is already granted)
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      throw new Error('Firebase Messaging not initialized');
    }

    // Ensure service worker is registered
    const registration = await registerFirebaseServiceWorker();
    if (!registration) {
      throw new Error('Service worker not registered');
    }

    // Check permission (should already be granted by initializeNotifications)
    const permission = Notification.permission;
    if (permission !== 'granted') {
      throw new Error(
        permission === 'denied'
          ? 'Notifications are blocked. Enable them in browser settings.'
          : 'Notification permission not granted. Enable notifications first.'
      );
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration,
    });

    console.log('[Firebase] FCM token obtained:', token ? 'Success' : 'Failed');
    return token;
  } catch (error) {
    console.error('[Firebase] Error getting FCM token:', error);
    return null;
  }
}

/**
 * Setup foreground message listener
 */
export function setupForegroundMessageListener(
  onMessageReceived: (payload: any) => void
): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.warn('[Firebase] Messaging not initialized');
    return null;
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[Firebase] Foreground message received:', payload);
    onMessageReceived(payload);

    // Show notification if app is in foreground
    if (Notification.permission === 'granted') {
      showLocalNotification(
        payload.notification?.title || 'Aimo Pulse',
        {
          body: payload.notification?.body || 'You have a new update',
          icon: payload.notification?.icon || '/icon-192.png',
          tag: 'aimo-pulse',
          data: payload.data,
        }
      );
    }
  });

  return unsubscribe;
}

/**
 * Show local notification
 */
export function showLocalNotification(
  title: string,
  options: NotificationOptions
): void {
  if (Notification.permission !== 'granted') {
    console.warn('[Firebase] Notification permission not granted');
    return;
  }

  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  } catch (error) {
    console.error('[Firebase] Error showing notification:', error);
  }
}

/**
 * Initialize Firebase notifications (complete flow)
 */
export async function initializeNotifications(
  onSuccess?: (token: string) => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    console.log('[Firebase] Initializing notifications...');

    // Step 1: Check support
    if (!isPushSupported()) {
      throw new Error('Push notifications not supported on this device');
    }

    // Step 2: Check current permission
    let permission = getNotificationPermission();
    console.log('[Firebase] Current permission:', permission);

    // Step 3: If already denied, ask user to enable in settings
    if (permission === 'denied') {
      throw new Error(
        'Notifications are blocked in your browser. Please enable them in browser settings and try again.'
      );
    }

    // Step 4: Initialize Firebase
    initializeFirebase();

    // Step 5: Register service worker
    const registration = await registerFirebaseServiceWorker();
    if (!registration) {
      throw new Error('Failed to register service worker');
    }

    // Step 6: Request permission if needed (this will show the browser dialog)
    if (permission === 'default') {
      console.log('[Firebase] Requesting notification permission from user...');
      permission = await requestNotificationPermission();
      console.log('[Firebase] User response:', permission);

      if (permission !== 'granted') {
        throw new Error(
          permission === 'denied'
            ? 'Notifications are blocked in your browser. Please enable them in browser settings and try again.'
            : 'Please click "Allow" when the browser asks for notification permission.'
        );
      }
    }

    // Step 7: Get FCM token
    const token = await getFCMToken();
    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    console.log('[Firebase] Notifications initialized successfully');
    onSuccess?.(token);
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    onError?.(error as Error);
  }
}

/**
 * Delete FCM token (unsubscribe)
 */
export async function deleteFCMToken(): Promise<boolean> {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return false;
    }

    const registration = await registerFirebaseServiceWorker();
    if (!registration) {
      return false;
    }

    const existingToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    }).catch(() => null);

    if (!existingToken) {
      console.log('[Firebase] No FCM token to delete');
      return true;
    }

    const deleted = await deleteToken(messaging).catch((error) => {
      console.error('[Firebase] deleteToken failed:', error);
      return false;
    });

    console.log('[Firebase] FCM token deleted:', deleted);
    return deleted;
  } catch (error) {
    console.error('[Firebase] Error deleting token:', error);
    return false;
  }
}

/**
 * Storage for notification preferences (same as before)
 */
export const NotificationPreferences = {
  get: () => {
    const prefs = localStorage.getItem('notification_preferences');
    return prefs
      ? JSON.parse(prefs)
      : {
          messages: true,
          pulseUpdates: true,
          dailyChallenges: true,
          sharkMode: true,
          calendarReminders: true,
          sound: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        };
  },

  set: (preferences: any) => {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
  },

  isInQuietHours: (): boolean => {
    const prefs = NotificationPreferences.get();
    if (!prefs.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  },
};

/**
 * Check notification settings status
 */
export function checkNotificationSettings(): {
  supported: boolean;
  permission: NotificationPermission;
  serviceWorkerActive: boolean;
} {
  return {
    supported: isPushSupported(),
    permission: getNotificationPermission(),
    serviceWorkerActive: navigator.serviceWorker?.controller !== null,
  };
}
