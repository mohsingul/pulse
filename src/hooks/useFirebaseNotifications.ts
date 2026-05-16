import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFCMToken,
  initializeNotifications,
  setupForegroundMessageListener,
  NotificationPreferences,
  deleteFCMToken,
} from '@/utils/firebase-notifications';
import { userAPI } from '@/utils/api';

export interface NotificationState {
  supported: boolean;
  permission: NotificationPermission;
  fcmToken: string | null;
  loading: boolean;
  error: string | null;
}

export function useFirebaseNotifications(userId?: string) {
  const [state, setState] = useState<NotificationState>({
    supported: false,
    permission: 'default',
    fcmToken: null,
    loading: true,
    error: null,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    checkNotificationStatus();

    return () => {
      // Cleanup foreground listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId]);

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

      // Get FCM token if permission granted
      if (permission === 'granted' && supported) {
        const token = await getFCMToken();
        if (token) {
          setState(prev => ({ ...prev, fcmToken: token }));

          if (userId) {
            await sendTokenToBackend(userId, token);
          }

          // Setup foreground message listener
          const unsubscribe = setupForegroundMessageListener((payload) => {
            console.log('[Notifications] Foreground message:', payload);
            // You can handle foreground notifications here
          });

          if (unsubscribe) {
            unsubscribeRef.current = unsubscribe;
          }
        }
      }
    } catch (error) {
      console.error('[useFirebaseNotifications] Error checking status:', error);
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
        // Auto-get token after permission is granted
        const token = await getFCMToken();
        if (token) {
          setState(prev => ({ ...prev, fcmToken: token }));

          // Send token to backend
          if (userId) {
            await sendTokenToBackend(userId, token);
          }
        }
      }

      return permission;
    } catch (error) {
      console.error('[useFirebaseNotifications] Error requesting permission:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to request permission',
      }));
      return 'denied';
    }
  }, [userId]);

  const enableNotifications = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID required');
    }

    return new Promise<void>((resolve, reject) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      initializeNotifications(
        async (token) => {
          setState(prev => ({
            ...prev,
            fcmToken: token,
            permission: 'granted',
            loading: false,
          }));

          // Send token to backend
          try {
            await sendTokenToBackend(userId, token);
          } catch (error) {
            console.error('[useFirebaseNotifications] Failed to send token to backend:', error);
          }

          // Setup foreground listener
          const unsubscribe = setupForegroundMessageListener((payload) => {
            console.log('[Notifications] Foreground message:', payload);
          });

          if (unsubscribe) {
            unsubscribeRef.current = unsubscribe;
          }

          resolve();
        },
        (error) => {
          setState(prev => ({
            ...prev,
            error: error.message,
            loading: false,
          }));
          reject(error);
        }
      );
    });
  }, [userId]);

  const disableNotifications = useCallback(async () => {
    try {
      await deleteFCMToken();

      // Remove token from backend
      if (userId && state.fcmToken) {
        await removeTokenFromBackend(userId, state.fcmToken);
      }

      setState(prev => ({ ...prev, fcmToken: null }));

      // Cleanup listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    } catch (error) {
      console.error('[useFirebaseNotifications] Error disabling notifications:', error);
    }
  }, [userId, state.fcmToken]);

  return {
    ...state,
    requestPermission,
    enableNotifications,
    disableNotifications,
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

// Helper to send FCM token to backend
async function sendTokenToBackend(userId: string, fcmToken: string): Promise<void> {
  try {
    console.log('[Notifications] Sending FCM token to backend:', { userId, fcmToken: fcmToken.substring(0, 20) + '...' });
    await userAPI.registerFcmToken(userId, fcmToken);
  } catch (error) {
    console.error('[Notifications] Failed to send token to backend:', error);
    throw error;
  }
}

// Helper to remove FCM token from backend
async function removeTokenFromBackend(userId: string, fcmToken: string): Promise<void> {
  try {
    console.log('[Notifications] Removing FCM token from backend:', { userId });
    await userAPI.unregisterFcmToken(userId);
  } catch (error) {
    console.error('[Notifications] Failed to remove token from backend:', error);
  }
}
