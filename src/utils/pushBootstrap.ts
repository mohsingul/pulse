import { userAPI } from '@/utils/api';
import { getFCMToken } from '@/utils/firebase-notifications';
import { storage } from '@/utils/storage';
import { syncReminderPreferencesToServer } from '@/hooks/useReminderNotifications';

/**
 * Keeps FCM registered on the server even when the login session has ended.
 * Social-style apps deliver push via server + device token, not an active app session.
 */
export async function bootstrapPushRegistration(userId: string): Promise<void> {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') {
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
  } catch (error) {
    console.warn('[Push] Background refresh failed:', error);
  }
}
