// Push Notification Utilities for Aimo Pulse PWA
// Handles Web Push API, service worker registration, and subscription management

/**
 * URL-safe base64 string to Uint8Array conversion for VAPID keys
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if the app is installed as a PWA (standalone mode)
 * iOS 16.4+ requires app to be installed before allowing push notifications
 */
export function isInstalledPWA(): boolean {
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // iOS Safari specific check
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  return isStandalone || isIOSStandalone;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission
 * On iOS, this must be called from a user gesture and after PWA installation
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  // Check if already granted or denied
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission (must be triggered by user gesture)
  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] Service workers not supported');
    return null;
  }

  try {
    // Vite PWA plugin auto-generates this
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      type: 'module'
    });
    
    console.log('[Push] Service worker registered:', registration);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('[Push] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Get or create push subscription
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    console.warn('[Push] Push notifications not supported');
    return null;
  }

  try {
    // Get service worker registration
    let registration = await navigator.serviceWorker.ready;
    
    if (!registration) {
      registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Service worker registration failed');
      }
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Push] Existing subscription found');
      return subscription;
    }

    // Create new subscription
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log('[Push] New subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('[Push] Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const result = await subscription.unsubscribe();
      console.log('[Push] Unsubscribed from push notifications');
      return result;
    }

    return false;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push] Failed to get subscription:', error);
    return null;
  }
}

/**
 * Test notification - show a local notification to verify it works
 */
export async function showTestNotification(): Promise<void> {
  if (!isPushNotificationSupported()) {
    console.warn('[Push] Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Push] Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification('Aimo Pulse', {
      body: 'Notifications are working! 💗',
      icon: '/logo.svg',
      badge: '/logo.svg',
      tag: 'test-notification',
      requireInteraction: false,
      data: {
        url: '/'
      }
    });
    
    console.log('[Push] Test notification shown');
  } catch (error) {
    console.error('[Push] Failed to show test notification:', error);
  }
}

/**
 * Convert push subscription to JSON format for storage
 */
export function subscriptionToJSON(subscription: PushSubscription) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
      auth: arrayBufferToBase64(subscription.getKey('auth'))
    }
  };
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Check if browser/device supports notifications
 */
export function getNotificationSupportInfo() {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  const hasNotification = 'Notification' in window;
  const permission = hasNotification ? Notification.permission : 'denied';
  const isPWA = isInstalledPWA();
  
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isIOSSupported = isIOS ? parseFloat(navigator.userAgent.match(/OS (\d+)_/)?.[1] || '0') >= 16.4 : true;
  
  return {
    supported: hasServiceWorker && hasPushManager && hasNotification,
    hasServiceWorker,
    hasPushManager,
    hasNotification,
    permission,
    isPWA,
    isIOS,
    isIOSSupported,
    canRequestPermission: permission === 'default' && (!isIOS || (isPWA && isIOSSupported))
  };
}
