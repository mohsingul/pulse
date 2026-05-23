import { useEffect, useRef, type MutableRefObject } from 'react';
import { storage } from '@/utils/storage';
import { userAPI } from '@/utils/api';

const REMINDER_EVENT_NAME = 'pulse-reminder-preferences-changed';

type ReminderPeriod = 'morning' | 'midday' | 'evening';

interface ReminderPreference {
  enabled: boolean;
  time: string;
}

interface ReminderPreferences {
  morning: ReminderPreference;
  midday: ReminderPreference;
  evening: ReminderPreference;
}

function getReminderPreferences(): ReminderPreferences {
  return storage.getNotifications();
}

export async function syncReminderPreferencesToServer(): Promise<void> {
  const user = storage.getUser();
  if (!user?.userId) return;

  const prefs = storage.getNotifications();
  try {
    await userAPI.saveReminderPreferences(user.userId, {
      morning: prefs.morning,
      midday: prefs.midday,
      evening: prefs.evening,
      timezoneOffset: new Date().getTimezoneOffset(),
    });
  } catch (error) {
    console.warn('[Reminders] Failed to sync preferences to server:', error);
  }
}

function getNextTriggerDelay(time: string): number {
  const [hour, minute] = time.split(':').map((value) => Number(value));
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn('[Reminders] Service worker not ready:', error);
    return null;
  }
}

async function showReminderNotification(
  title: string,
  body: string,
  registration: ServiceWorkerRegistration | null
) {
  if (Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'aimo-pulse-reminder',
    renotify: true,
    data: { type: 'pulse-reminder' },
  };

  try {
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return;
    }

    new Notification(title, options);
  } catch (error) {
    console.error('[Reminders] Failed to show notification:', error);
  }
}

async function scheduleReminder(
  period: ReminderPeriod,
  config: ReminderPreference,
  registration: ServiceWorkerRegistration | null,
  timers: MutableRefObject<Record<string, number>>
) {
  if (!config.enabled) {
    return;
  }

  const delay = getNextTriggerDelay(config.time);

  const handle = window.setTimeout(async () => {
    await showReminderNotification(
      `${period.charAt(0).toUpperCase() + period.slice(1)} reminder`,
      `Time to update your Pulse for ${period}.`,
      registration
    );

    scheduleReminder(period, config, registration, timers);
  }, delay);

  if (timers.current[period]) {
    window.clearTimeout(timers.current[period]);
  }

  timers.current[period] = handle;
}

async function scheduleAllReminders(
  preferences: ReminderPreferences,
  timers: MutableRefObject<Record<string, number>>
) {
  const registration = await getServiceWorkerRegistration();

  Object.values(timers.current).forEach((timerId) => window.clearTimeout(timerId));
  timers.current = {};

  for (const period of ['morning', 'midday', 'evening'] as ReminderPeriod[]) {
    await scheduleReminder(period, preferences[period], registration, timers);
  }
}

export function useReminderNotifications(enabled: boolean) {
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const preferences = getReminderPreferences();
    syncReminderPreferencesToServer();
    scheduleAllReminders(preferences, timersRef);

    const handleUpdate = () => {
      const updatedPreferences = getReminderPreferences();
      syncReminderPreferencesToServer();
      scheduleAllReminders(updatedPreferences, timersRef);
    };

    window.addEventListener(REMINDER_EVENT_NAME, handleUpdate);

    return () => {
      window.removeEventListener(REMINDER_EVENT_NAME, handleUpdate);
      Object.values(timersRef.current).forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current = {};
    };
  }, [enabled]);
}

export function dispatchReminderPreferenceUpdate() {
  if (typeof window === 'undefined') {
    return;
  }
  syncReminderPreferencesToServer();
  window.dispatchEvent(new Event(REMINDER_EVENT_NAME));
}
