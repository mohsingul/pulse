import { userAPI } from '@/utils/api';
import { getFCMToken } from '@/utils/firebase-notifications';
import { storage } from '@/utils/storage';
import { syncReminderPreferencesToServer } from '@/hooks/useReminderNotifications';
import { getBrowserNotificationPermission } from '@/utils/notification-guard';

/**
 * Keeps FCM registered on the server even when the login session has ended.
 * Social-style apps deliver push via server + device token, not an active app session.
 */
export async function bootstrapPushRegistration(userId: string): Promise<void> {
  if (typeof window === 'undefined' || getBrowserNotificationPermission() !== 'granted') {
    return;
  }

  const token = await getFCMToken();
  if (!token) return;

  await userAPI.registerFcmToken(userId, token);
  storage.setPushUserId(userId);
}

export async function refreshPushRegistrationIfNeeded(): Promise<void> {
  const userId = storage.getPushUserId();
  if (!userId) return;

  try {
    await bootstrapPushRegistration(userId);
    await syncReminderPreferencesToServer(userId);
    // Calendar/pulse reminders run once per day from App.tsx (avoids duplicate pushes on resume).
  } catch (error) {
    console.warn('[Push] Background refresh failed:', error);
  }
}
