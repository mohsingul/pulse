// Push Notification Sender using Web Push API
// This module handles sending push notifications to subscribed devices

/**
 * VAPID keys for Web Push
 * Generate using: npx web-push generate-vapid-keys
 * 
 * IMPORTANT: These should be stored as Supabase secrets in production!
 * - VAPID_PUBLIC_KEY (same as in React app)
 * - VAPID_PRIVATE_KEY (keep secret, server-side only)
 * - VAPID_SUBJECT (mailto:your-email@example.com or https://your-domain.com)
 */
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SQ8XL_dMBcVmTMuZu-FaIZVpAqB7COxlBuEgOQEVgIXq6JIGZR8GrCM';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'YOUR_PRIVATE_KEY_HERE';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@aimopulse.app';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    // Build the notification payload
    const notificationPayload = JSON.stringify(payload);

    // For Deno, we'll use the fetch API to send web push
    // In production, you'd use the web-push npm package via npm: specifier
    const webpush = await import('npm:web-push');
    
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      notificationPayload
    );

    console.log('[Push] Notification sent successfully');
    return true;
  } catch (error: any) {
    console.error('[Push] Error sending notification:', error);
    
    // Handle specific errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('[Push] Subscription is no longer valid (410/404)');
      // The subscription should be removed from database
      return false;
    }
    
    return false;
  }
}

/**
 * Send push notification to a user by their userId
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  kvStore: any
): Promise<boolean> {
  try {
    // Get user's push subscription
    const subscriptionId = await kvStore.get(`user_push:${userId}`);
    
    if (!subscriptionId) {
      console.log(`[Push] No subscription found for user ${userId}`);
      return false;
    }

    const subscription = await kvStore.get(`push_subscription:${subscriptionId}`);
    
    if (!subscription || subscription.revokedAt) {
      console.log(`[Push] Subscription revoked for user ${userId}`);
      return false;
    }

    // Send push notification
    const success = await sendPushNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      payload
    );

    if (!success && subscription.endpoint) {
      // Mark subscription as revoked if it's no longer valid
      subscription.revokedAt = new Date().toISOString();
      await kvStore.set(`push_subscription:${subscriptionId}`, subscription);
    }

    return success;
  } catch (error) {
    console.error(`[Push] Error sending to user ${userId}:`, error);
    return false;
  }
}

/**
 * Helper: Create push payload for different notification types
 */
export function createPushPayload(
  type: 'nudge' | 'mood' | 'message' | 'doodle',
  senderName: string,
  data?: any
): PushPayload {
  const basePayload = {
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: `aimo-pulse-${type}`,
    data: {
      url: '/',
      type,
      ...data
    }
  };

  switch (type) {
    case 'nudge':
      return {
        ...basePayload,
        title: '💗 Nudge from ' + senderName,
        body: senderName + ' wants to know how you\'re doing!'
      };
    
    case 'mood':
      return {
        ...basePayload,
        title: '😊 ' + senderName + ' shared their mood',
        body: data?.mood || 'Check out their latest update!'
      };
    
    case 'message':
      return {
        ...basePayload,
        title: '💌 New message from ' + senderName,
        body: data?.message || 'Tap to read the message'
      };
    
    case 'doodle':
      return {
        ...basePayload,
        title: '🎨 ' + senderName + ' drew something for you',
        body: 'See their latest doodle!'
      };
    
    default:
      return {
        ...basePayload,
        title: 'Aimo Pulse',
        body: 'You have a new update'
      };
  }
}
