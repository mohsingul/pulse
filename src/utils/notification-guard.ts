/** Safe access to the browser Notification API (missing on some iOS Safari contexts). */

export type BrowserNotificationPermission = 'default' | 'granted' | 'denied';

export interface BrowserNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  renotify?: boolean;
  data?: Record<string, unknown>;
  vibrate?: number[];
}

export function hasBrowserNotificationApi(): boolean {
  return typeof globalThis !== 'undefined' && 'Notification' in globalThis;
}

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!hasBrowserNotificationApi()) {
    return 'denied';
  }
  return Notification.permission as BrowserNotificationPermission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!hasBrowserNotificationApi()) {
    return 'denied';
  }
  return (await Notification.requestPermission()) as BrowserNotificationPermission;
}

export function showBrowserNotification(
  title: string,
  options: BrowserNotificationOptions = {},
): void {
  if (!hasBrowserNotificationApi() || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } catch (error) {
    console.warn('[Notifications] Could not show notification:', error);
  }
}
