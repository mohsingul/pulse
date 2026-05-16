import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  initializeNotifications,
  NotificationPreferences,
  type PushSubscriptionData,
} from '@/utils/notifications';

// VAPID public key - should match your Supabase Edge Function config
// For now, using a placeholder - you'll need to generate real VAPID keys
const VAPID_PUBLIC_KEY = 'BJGYuJ0tl0XyJJOwbUsxWc6kCoPIT3ga3eOyxCed4TSbZCmwasFPR6A8tddeJFZH__JIy_Ef1Oh0CoH-jJOPoZw';

export interface NotificationState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

export function useNotifications(userId?: string) {
  const [state, setState] = useState<NotificationState>({
    supported: false,
    permission: 'default',
    subscribed: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const supported = isPushSupported();
      const permission = getNotificationPermission();

      setState(prev => ({
        ...prev,
        supported,
        permission,
        loading: false,
      }));

      // Check if already subscribed
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState(prev => ({ ...prev, subscribed: !!subscription }));
      }
    } catch (error) {
      console.error('[useNotifications] Error checking status:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to check notification status',
      }));
    }
  };

  const requestPermission = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const permission = await requestNotificationPermission();

      setState(prev => ({
        ...prev,
        permission,
        loading: false,
      }));

      if (permission === 'granted') {
        // Auto-subscribe after permission is granted
        await subscribe();
      }

      return permission;
    } catch (error) {
      console.error('[useNotifications] Error requesting permission:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to request permission',
      }));
      return 'denied';
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!userId) {
      console.warn('[useNotifications] Cannot subscribe without userId');
      return null;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);

      if (subscription) {
        // TODO: Send subscription to backend
        // await sendSubscriptionToBackend(userId, subscription);

        setState(prev => ({
          ...prev,
          subscribed: true,
          loading: false,
        }));

        console.log('[useNotifications] Subscribed successfully');
      }

      return subscription;
    } catch (error) {
      console.error('[useNotifications] Error subscribing:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to subscribe to notifications',
      }));
      return null;
    }
  }, [userId]);

  const enableNotifications = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID required');
    }

    return new Promise<void>((resolve, reject) => {
      initializeNotifications(
        VAPID_PUBLIC_KEY,
        (subscription) => {
          setState(prev => ({
            ...prev,
            subscribed: true,
            permission: 'granted',
          }));
          // TODO: Send to backend
          resolve();
        },
        (error) => {
          setState(prev => ({ ...prev, error: error.message }));
          reject(error);
        }
      );
    });
  }, [userId]);

  return {
    ...state,
    requestPermission,
    subscribe,
    enableNotifications,
    checkNotificationStatus,
  };
}

// Hook for managing notification preferences
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState(NotificationPreferences.get());

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    const newPreferences = { ...preferences, ...updates };
    NotificationPreferences.set(newPreferences);
    setPreferences(newPreferences);
  }, [preferences]);

  const isInQuietHours = useCallback(() => {
    return NotificationPreferences.isInQuietHours();
  }, []);

  return {
    preferences,
    updatePreferences,
    isInQuietHours,
  };
}

// Helper to send subscription to backend (TODO: implement)
async function sendSubscriptionToBackend(
  userId: string,
  subscription: PushSubscriptionData
): Promise<void> {
  // TODO: Call Supabase Edge Function to store subscription
  console.log('[Notifications] Sending subscription to backend:', { userId, subscription });

  // Example:
  // await fetch(`${SUPABASE_URL}/functions/v1/push-subscribe`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  //   },
  //   body: JSON.stringify({ userId, subscription }),
  // });
}
