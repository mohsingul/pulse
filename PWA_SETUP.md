# Aimo Pulse PWA Implementation Guide

## Overview

Aimo Pulse has been converted into a Progressive Web App (PWA) with full support for:
- ✅ Installation to home screen (iOS + Android)
- ✅ Offline functionality via Service Worker
- ✅ Push notifications (Web Push API)
- ✅ App shortcuts and manifest
- ✅ iOS 16.4+ push notification support

---

## PWA Features Implemented

### 1. Manifest & App Installation

**File:** `/vite.config.ts`
- Configured Vite PWA plugin with custom manifest
- App name: "Aimo Pulse"
- Theme color: `#A83FFF` (brand gradient purple)
- Display mode: `standalone` (full-screen app experience)
- Icons: SVG logo with maskable support

**File:** `/index.html`
- iOS-specific meta tags for PWA installation
- Apple touch icon configuration
- Status bar styling for iOS
- Theme color meta tags for light/dark mode

### 2. Service Worker

**File:** `/public/sw-custom.js`
- Custom service worker with offline caching
- Network-first strategy for API calls (Supabase)
- Cache-first strategy for static assets
- Push notification event handlers
- Background sync support (future enhancement)

**Caching Strategy:**
- Static assets: Cache-first with network fallback
- API calls to Supabase: Network-first with cache fallback
- Dynamic cache expires after 1 hour

### 3. Push Notifications

**Files:**
- `/src/utils/pushNotifications.ts` - Core push notification utilities
- `/src/hooks/usePushNotifications.ts` - React hook for push management
- `/src/app/components/PushNotificationPrompt.tsx` - UI component for enabling notifications
- `/supabase/functions/server/pushSender.ts` - Server-side push sender

**Push Notification Flow:**

1. **User enables notifications** (requires user gesture)
   ```typescript
   const { subscribe } = usePushNotifications(userId);
   await subscribe();
   ```

2. **Subscription is saved to Supabase**
   - Endpoint, keys (p256dh, auth), device info stored in KV store
   - Mapped to user ID for easy lookup

3. **Server sends push notifications**
   ```typescript
   import { sendPushToUser, createPushPayload } from './pushSender.ts';
   
   const payload = createPushPayload('mood', 'Alex', { mood: '😊' });
   await sendPushToUser(partnerId, payload, kv);
   ```

4. **Service worker receives and displays notification**
   - Notification shown even when app is closed
   - Click opens/focuses the app

---

## VAPID Keys Setup

Push notifications require VAPID keys. Generate them using:

```bash
npx web-push generate-vapid-keys
```

### Setting VAPID Keys

**1. Update the Public Key:**

File: `/src/hooks/usePushNotifications.ts`
```typescript
const VAPID_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE';
```

**2. Set Supabase Secrets (Production):**

In your Supabase project dashboard:
```bash
# Navigate to: Project Settings > Edge Functions > Secrets

VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com
```

**3. Update Server Configuration:**

File: `/supabase/functions/server/pushSender.ts`
- Uses environment variables from Supabase secrets
- Fallbacks provided for development (update these!)

---

## Database Schema

### Push Subscriptions

Stored in KV store with the following structure:

```typescript
// Push subscription
{
  subscriptionId: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  deviceType: 'ios' | 'android' | 'unknown';
  createdAt: string; // ISO timestamp
  revokedAt: string | null; // ISO timestamp when unsubscribed
}

// User mapping
key: `user_push:${userId}`
value: subscriptionId
```

### API Endpoints

**Subscribe to Push:**
```
POST /make-server-494d91eb/push/subscribe
Body: { userId, endpoint, keys, userAgent, deviceType }
```

**Unsubscribe:**
```
DELETE /make-server-494d91eb/push/unsubscribe/:userId
```

**Get Subscription:**
```
GET /make-server-494d91eb/push/subscription/:userId
```

---

## Testing Checklist

### 🤖 Android (Chrome/Edge)

- [ ] **Install PWA**
  1. Open app in Chrome browser
  2. Tap menu (⋮) → "Install app" or "Add to Home Screen"
  3. Confirm installation
  4. App icon appears on home screen

- [ ] **Enable Push Notifications**
  1. Open installed PWA from home screen
  2. Navigate to Settings
  3. Toggle "Push Notifications" on
  4. Grant permission when prompted
  5. Verify subscription created in browser DevTools → Application → Service Workers

- [ ] **Receive Push Notification**
  1. Have partner send a pulse update (mood/message/doodle)
  2. Notification should appear even with app closed
  3. Tap notification to open app
  4. App opens to home screen

- [ ] **Offline Mode**
  1. Enable Airplane mode
  2. Open PWA from home screen
  3. App should load cached version
  4. Basic navigation should work

### 🍎 iOS (Safari 16.4+)

**Important:** iOS requires PWA to be installed BEFORE push notifications can be enabled.

- [ ] **Check iOS Version**
  - Settings → General → About → Software Version
  - Must be iOS 16.4 or later for push support

- [ ] **Install PWA**
  1. Open app in Safari
  2. Tap Share button (⎙)
  3. Scroll down → "Add to Home Screen"
  4. Tap "Add" (top right)
  5. App icon appears on home screen with name "Aimo Pulse"

- [ ] **Enable Push Notifications (AFTER installation)**
  1. Open app FROM HOME SCREEN (not Safari!)
  2. Navigate to Settings
  3. Toggle "Push Notifications" on
  4. Grant permission when iOS prompts
  5. Verify subscription in app (toggle should stay on)

- [ ] **Receive Push Notification**
  1. Have partner send pulse update
  2. Notification banner should appear
  3. Tap to open app

- [ ] **Test Offline**
  1. Enable Airplane mode
  2. Open PWA
  3. App should load (cached assets)

### Common iOS Issues

**Problem:** "Push Notifications" toggle is disabled/grayed out
- **Solution:** Make sure app is installed to home screen and opened from there (not Safari)

**Problem:** Permission prompt never appears
- **Solution:** 
  1. Delete app from home screen
  2. Safari → Settings → Advanced → Website Data → Remove All
  3. Reinstall PWA
  4. Try again from installed app

**Problem:** iOS version is older than 16.4
- **Solution:** Push notifications not supported. Show appropriate message in UI.

---

## Integration with App Events

Push notifications are automatically sent for these events:

### 1. Mood Update
```typescript
// In App.tsx
if (data.mood) {
  await notificationAPI.sendMoodUpdate(
    couple.coupleId,
    user.userId,
    data.mood,
    data.intensity
  );
}
```

Server triggers push:
```typescript
const payload = createPushPayload('mood', senderName, { mood, intensity });
await sendPushToUser(partnerId, payload, kv);
```

### 2. Message Update
```typescript
if (data.message) {
  await notificationAPI.sendMessageUpdate(
    couple.coupleId,
    user.userId,
    data.message
  );
}
```

### 3. Doodle Update
```typescript
if (data.doodle) {
  await notificationAPI.sendDoodleUpdate(
    couple.coupleId,
    user.userId,
    data.doodle
  );
}
```

### 4. Nudge
```typescript
await notificationAPI.sendNudge(coupleId, userId);
```

---

## Performance Considerations

### Service Worker Updates

The PWA uses `autoUpdate` mode:
- Service worker checks for updates on page load
- Updates installed automatically in background
- Users get new version on next app open

### Cache Management

- Static cache: `aimo-pulse-static-v1`
- Dynamic cache: `aimo-pulse-dynamic-v1`
- API cache: `supabase-api-cache` (1 hour expiry)

To force cache refresh during development:
1. Chrome DevTools → Application → Storage → Clear site data
2. Or increment cache version in `sw-custom.js`

### Push Notification Limits

- **Android:** No practical limit
- **iOS:** Apple may throttle if too many notifications sent
- **Best practice:** Don't send more than 1 notification per event type per minute

---

## Deployment Notes

### Before Deploying to Production:

1. **Generate and Set VAPID Keys**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Configure Supabase Secrets**
   - Add VAPID keys to Supabase Edge Functions secrets
   - Update VAPID_SUBJECT with your domain or email

3. **Update Icons**
   - Convert `/public/logo.svg` to PNG format
   - Create 192x192 and 512x512 versions
   - Place in `/public/` directory
   - Update manifest in `vite.config.ts` if needed

4. **Test on Real Devices**
   - Deploy to staging environment
   - Test installation on actual iOS and Android devices
   - Verify push notifications work end-to-end

5. **Configure HTTPS**
   - PWA requires HTTPS in production
   - Service workers don't work on HTTP (except localhost)

### Post-Deployment Verification:

- [ ] PWA installs on iOS Safari
- [ ] PWA installs on Android Chrome
- [ ] Push notifications work on both platforms
- [ ] Offline mode works
- [ ] App icon appears correctly
- [ ] Splash screen displays (iOS)
- [ ] No console errors in production

---

## Troubleshooting

### Service Worker Not Registering

**Check:**
1. Is app served over HTTPS? (required for PWA)
2. Is `sw.js` accessible at `/sw.js`?
3. Check browser console for service worker errors
4. Verify Vite PWA plugin is installed: `vite-plugin-pwa`

**Fix:**
```bash
# Reinstall dependencies
pnpm install

# Clear browser cache
# DevTools → Application → Clear storage
```

### Push Notifications Not Working

**Android:**
1. Check notification permission: Settings → Apps → Aimo Pulse → Notifications
2. Verify subscription created: DevTools → Application → Service Workers
3. Check server logs for push send errors

**iOS:**
1. Confirm iOS 16.4+
2. App MUST be installed to home screen
3. Check Settings → Notifications → Aimo Pulse
4. Verify VAPID keys are correct

**Server:**
1. Check VAPID keys are set correctly
2. Verify `web-push` npm package is available
3. Check Edge Function logs in Supabase dashboard
4. Test with: `curl -X POST https://your-project.supabase.co/functions/v1/...`

### Offline Mode Not Working

1. Verify service worker is active: DevTools → Application → Service Workers
2. Check cache storage: DevTools → Application → Cache Storage
3. Ensure critical assets are cached in `sw-custom.js`
4. Network tab → Throttling → Offline (test)

---

## Future Enhancements

### Planned Features:

- [ ] Background sync for offline pulse updates
- [ ] Rich notifications with images (doodle preview)
- [ ] Notification actions (quick reply, react with emoji)
- [ ] Badge count on app icon
- [ ] Periodic background sync (daily reminders)
- [ ] Share target API (share to Aimo Pulse from other apps)

### Advanced Push Features:

```typescript
// Rich notification example
const payload = {
  title: '🎨 Alex drew something',
  body: 'Check out their latest doodle!',
  icon: '/logo.svg',
  image: doodleDataUrl, // Doodle preview image
  actions: [
    { action: 'view', title: 'View', icon: '/icons/view.png' },
    { action: 'react', title: '❤️', icon: '/icons/heart.png' }
  ],
  data: { url: '/', doodleId: '123' }
};
```

---

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Apple: Push Notifications for Web Apps (iOS 16.4+)](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview/)

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase Edge Function logs
3. Verify VAPID keys are configured
4. Test on actual devices (not just emulators)

**Remember:** iOS push notifications ONLY work:
- On iOS 16.4+
- When app is installed to home screen
- When opened from home screen (not Safari)
