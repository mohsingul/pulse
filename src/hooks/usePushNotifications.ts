// React Hook for Push Notification Management
import { useState, useEffect, useCallback } from 'react';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
  subscriptionToJSON,
  getNotificationSupportInfo,
  isInstalledPWA
} from '@/utils/pushNotifications';

// VAPID public key - this should come from environment variables in production
// Generate keys using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'BIVLeGeC2aj8kBU6_gkxZNnQfXMa4RdfY9l05SVDbn0B1qTTfTMv6i9ZizcKmRg9XD8f_RHXlnf-rbIE6sDD8qg';

interface PushNotificationState {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  isPWA: boolean;
  supportInfo: ReturnType<typeof getNotificationSupportInfo>;
}

export function usePushNotifications(userId: string | null) {
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    subscription: null,
    isLoading: false,
    error: null,
    isSupported: false,
    isPWA: false,
    supportInfo: getNotificationSupportInfo()
  });

  // Initialize - check current state
  useEffect(() => {
    const initialize = async () => {
      const supported = isPushNotificationSupported();
      const pwa = isInstalledPWA();
      const permission = getNotificationPermission();
      const supportInfo = getNotificationSupportInfo();
      
      let subscription = null;
      if (supported && permission === 'granted') {
        subscription = await getCurrentPushSubscription();
      }

      setState((prev) => ({
        ...prev,
        permission,
        subscription,
        isSupported: supported,
        isPWA: pwa,
        supportInfo
      }));
    };

    initialize();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Push notifications are not supported on this device/browser'
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Request notification permission
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          permission,
          error: 'Notification permission was denied'
        }));
        return false;
      }

      // Step 2: Subscribe to push notifications
      const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
      
      if (!subscription) {
        throw new Error('Failed to create push subscription');
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        permission: 'granted',
        subscription,
        error: null
      }));

      return true;
    } catch (error: any) {
      console.error('[usePushNotifications] Failed to enable notifications:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to enable push notifications'
      }));
      return false;
    }
  }, [state.isSupported, userId]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Unsubscribe from push
      const result = await unsubscribeFromPushNotifications();
      
      if (!result) {
        throw new Error('Failed to unsubscribe');
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        subscription: null,
        error: null
      }));

      return true;
    } catch (error: any) {
      console.error('[usePushNotifications] Failed to disable notifications:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to disable push notifications'
      }));
      return false;
    }
  }, []);

  // Check and sync subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    const subscription = await getCurrentPushSubscription();
    const permission = getNotificationPermission();
    
    setState((prev) => ({
      ...prev,
      subscription,
      permission
    }));

    return { subscription, permission };
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    checkSubscriptionStatus,
    isSubscribed: state.permission === 'granted' && state.subscription !== null
  };
}