# iOS-Style Notification System for Aimo Pulse 📱

A complete, production-ready push notification system with premium iOS aesthetics and emotional UX.

---

## 🎨 Features

### User-Facing Features

✅ **Notification Onboarding Modal**
- Beautiful glassmorphism design
- Animated gradient backgrounds
- Emotional, relationship-focused copy
- "Enable" and "Maybe Later" CTAs

✅ **Notification Settings Screen**
- Permission status cards with actionable CTAs
- Toggle switches for notification types:
  - Messages
  - Pulse Updates (moods, doodles, nudges)
  - Daily Challenges
  - Shark Mode Alerts
- Sound toggle
- Quiet Hours with time picker
- Live notification previews
- Test notification button

✅ **Notification Center (Inbox)**
- Grouped by date (Today, Yesterday, dates)
- Unread indicators
- Swipe-to-delete gestures
- Filter by All/Unread
- Mark all as read
- Empty states
- Smooth animations

✅ **iOS-Style Push Notifications**
- Lock screen notifications
- Banner notifications
- Notification center cards
- Custom vibration patterns per type
- App icon badge
- Sound support

### Technical Features

✅ Service Worker for background notifications
✅ Push API integration
✅ Notification permissions management
✅ Local notification preferences storage
✅ Quiet hours detection
✅ VAPID key support (Web Push)
✅ Offline support with caching

---

## 📁 File Structure

```
src/
├── app/
│   ├── components/
│   │   ├── NotificationOnboarding.tsx       # Onboarding modal
│   │   ├── NotificationPanel.tsx            # Existing notification panel
│   │   └── IOSNotificationMockup.tsx        # iOS notification mockups
│   └── screens/
│       ├── NotificationSettingsScreen.tsx   # Settings screen
│       └── NotificationCenterScreen.tsx     # Notification inbox
├── hooks/
│   └── useNotifications.ts                  # React hooks for notifications
└── utils/
    └── notifications.ts                     # Core notification utilities

public/
└── sw.js                                    # Service Worker

```

---

## 🚀 Getting Started

### Step 1: Install Dependencies

The notification system uses Motion (formerly Framer Motion) for animations:

```bash
pnpm install motion date-fns
```

### Step 2: Add Notification Screens to App.tsx

Update your `App.tsx` to include the new screens:

```typescript
// Add to imports
import { NotificationSettingsScreen } from '@/app/screens/NotificationSettingsScreen';
import { NotificationCenterScreen } from '@/app/screens/NotificationCenterScreen';
import { NotificationOnboarding } from '@/app/components/NotificationOnboarding';
import { useNotifications } from '@/hooks/useNotifications';

// Add to Screen type
type Screen = 
  | 'welcome'
  | 'notification-settings'
  | 'notification-center'
  | /* ... other screens */;

// Add state for notification onboarding
const [showNotificationOnboarding, setShowNotificationOnboarding] = useState(false);

// Use notification hook
const notifications = useNotifications(user?.userId);

// Add to screen rendering
{currentScreen === 'notification-settings' && (
  <NotificationSettingsScreen onBack={() => setCurrentScreen('settings')} />
)}

{currentScreen === 'notification-center' && (
  <NotificationCenterScreen
    userId={user.userId}
    onBack={() => setCurrentScreen('home')}
  />
)}

// Add notification onboarding modal
<NotificationOnboarding
  isOpen={showNotificationOnboarding}
  onClose={() => setShowNotificationOnboarding(false)}
  onEnable={async () => {
    await notifications.enableNotifications();
    setShowNotificationOnboarding(false);
  }}
/>
```

### Step 3: Link From Settings Screen

Update your `SettingsScreen.tsx` to add a link to notification settings:

```typescript
<button
  onClick={() => onNavigate('notification-settings')}
  className="flex items-center justify-between p-4 bg-card rounded-xl"
>
  <div className="flex items-center space-x-3">
    <Bell className="w-5 h-5 text-[#A83FFF]" />
    <div>
      <p className="font-semibold">Notifications</p>
      <p className="text-sm text-muted-foreground">Manage notification preferences</p>
    </div>
  </div>
  <ChevronRight className="w-5 h-5 text-muted-foreground" />
</button>
```

### Step 4: Trigger Onboarding Modal

Show the onboarding modal at the right time (after a meaningful interaction):

```typescript
// Example: After user pairs with partner
useEffect(() => {
  if (couple && notifications.permission === 'default') {
    // Wait 2 seconds, then show onboarding
    setTimeout(() => {
      setShowNotificationOnboarding(true);
    }, 2000);
  }
}, [couple, notifications.permission]);
```

### Step 5: Generate VAPID Keys

For Web Push to work, you need VAPID keys:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

Copy the public key to `src/hooks/useNotifications.ts`:

```typescript
const VAPID_PUBLIC_KEY = 'YOUR_GENERATED_PUBLIC_KEY';
```

---

## 🔧 Backend Integration

### Update Supabase Edge Function

Add push notification endpoints to your `supabase/functions/server/index.tsx`:

```typescript
// Store push subscription
app.post("/make-server-494d91eb/push/subscribe", async (c) => {
  const { userId, subscription } = await c.req.json();
  
  // Store in database
  await kv.set(`push_subscription:${userId}`, {
    userId,
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    createdAt: new Date().toISOString(),
  });
  
  return c.json({ success: true });
});

// Send push notification
app.post("/make-server-494d91eb/push/send", async (c) => {
  const { userId, title, body, type } = await c.req.json();
  
  // Get user's subscription
  const subscription = await kv.get(`push_subscription:${userId}`);
  
  if (!subscription) {
    return c.json({ error: "No subscription found" }, 404);
  }
  
  // Send push using Web Push API
  const webpush = await import("npm:web-push");
  
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    'YOUR_VAPID_PUBLIC_KEY',
    'YOUR_VAPID_PRIVATE_KEY'
  );
  
  await webpush.sendNotification(
    subscription,
    JSON.stringify({ title, body, type })
  );
  
  return c.json({ success: true });
});
```

### Trigger Notifications on Events

Update your existing notification endpoints to send push notifications:

```typescript
// Example: When mood is updated
app.post("/make-server-494d91eb/notifications/mood-update", async (c) => {
  const { coupleId, senderId, mood } = await c.req.json();
  
  const couple = await kv.get(`couple:${coupleId}`);
  const receiverId = couple.user1Id === senderId ? couple.user2Id : couple.user1Id;
  const sender = await kv.get(`user:${senderId}`);
  
  // Send push notification
  await sendPushNotification(receiverId, {
    title: 'Aimo Pulse',
    body: `${sender.displayName} updated their mood ${mood}`,
    type: 'mood-update',
  });
  
  return c.json({ success: true });
});

async function sendPushNotification(userId: string, data: any) {
  // Call the push send endpoint
  await fetch(`${BASE_URL}/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });
}
```

---

## 🎨 Customization

### Notification Copy

The notification system uses emotionally-aware copy. You can customize messages in:
- `NotificationOnboarding.tsx` - Onboarding modal copy
- `NotificationSettingsScreen.tsx` - Settings descriptions
- `IOSNotificationMockup.tsx` - Example notifications

### Vibration Patterns

Customize vibration patterns in `public/sw.js`:

```javascript
switch (data.type) {
  case 'message':
    options.vibrate = [100, 50, 100]; // Quick double tap
    break;
  case 'nudge':
    options.vibrate = [200, 100, 200, 100, 200]; // Playful pattern
    break;
  case 'shark-mode':
    options.vibrate = [300, 100, 300]; // Urgent pattern
    break;
}
```

### Quiet Hours

Quiet hours are stored in localStorage and can be configured per-user:

```typescript
const preferences = NotificationPreferences.get();
preferences.quietHours = {
  enabled: true,
  start: '22:00',
  end: '08:00',
};
NotificationPreferences.set(preferences);
```

---

## 🧪 Testing

### Test Notification Permission

```typescript
import { requestNotificationPermission } from '@/utils/notifications';

const permission = await requestNotificationPermission();
console.log('Permission:', permission); // 'granted', 'denied', or 'default'
```

### Test Local Notification

```typescript
import { showLocalNotification } from '@/utils/notifications';

await showLocalNotification('Test Notification', {
  body: 'This is a test message!',
  tag: 'test',
});
```

### Test Service Worker

1. Open DevTools → Application → Service Workers
2. Check that `sw.js` is registered and active
3. Click "Update" to reload the service worker
4. Check console for `[Service Worker] Loaded successfully`

### Test Push Notification

Use the "Send Test Notification" button in the Notification Settings screen, or manually:

```typescript
if (Notification.permission === 'granted') {
  new Notification('Aimo Pulse', {
    body: 'Your partner sent you a message 💗',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
  });
}
```

---

## 📱 iOS-Specific Behavior

### Add to Home Screen (PWA)

For the best experience, users should add Aimo Pulse to their home screen:

1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Notifications will feel native!

### iOS Limitations

⚠️ **Important iOS Limitations:**
- iOS Safari requires PWA to be installed for push notifications
- Service workers only work in installed PWAs on iOS
- Notification permissions must be requested from user gesture
- Background sync is not supported on iOS

### iOS Optimization

The notification system is optimized for iOS:
- Respects safe areas
- Works with Dynamic Island
- Glassmorphism effects
- Haptic feedback patterns
- Native iOS spacing and typography

---

## 🔐 Privacy & Security

### What Data is Stored

- Push subscription endpoint (required for Web Push)
- Notification preferences (localStorage, device-only)
- Read/unread status (temporary, not persisted in DB)

### What is NOT Stored

- Notification content history (privacy-first design)
- Personal messages (only metadata)
- Location or tracking data

### User Control

Users can:
- Disable all notifications
- Disable specific notification types
- Set quiet hours
- Revoke permission in device settings
- Delete notification history

---

## 🐛 Troubleshooting

### "Notifications not supported"

- Check browser compatibility (Chrome, Safari, Edge, Firefox)
- Ensure HTTPS is enabled (required for service workers)
- For iOS: ensure app is installed as PWA

### "Permission denied"

- User must grant permission manually
- Cannot programmatically re-request
- Guide users to Settings → Notifications

### Service Worker not registering

```bash
# Check console for errors
# Ensure /sw.js is accessible
curl https://your-app.com/sw.js

# Unregister and re-register
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});
```

### Push notifications not arriving

- Verify VAPID keys are correct
- Check subscription is stored in backend
- Ensure Web Push library is configured
- Check browser notification settings

---

## 📊 Analytics (Optional)

Track notification engagement:

```typescript
// Track permission requests
trackEvent('notification_permission_requested');

// Track enables
trackEvent('notifications_enabled', { userId });

// Track opens
trackEvent('notification_opened', { type: 'message' });
```

---

## 🚢 Deployment Checklist

- [ ] Generate VAPID keys
- [ ] Update VAPID_PUBLIC_KEY in useNotifications.ts
- [ ] Add VAPID private key to Supabase secrets
- [ ] Deploy updated Edge Function
- [ ] Test on iOS Safari (installed PWA)
- [ ] Test on Android Chrome
- [ ] Test notification permission flow
- [ ] Test quiet hours
- [ ] Test all notification types
- [ ] Verify service worker caching

---

## 🎉 Result

You now have a **premium, iOS-style notification system** that:

✅ Feels like a native app
✅ Respects user preferences
✅ Works offline
✅ Strengthens emotional connection
✅ Follows iOS design patterns
✅ Maintains privacy

**Design principle: "Quiet technology for emotional closeness."**

---

## 📚 Additional Resources

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [iOS PWA Guidelines](https://developer.apple.com/documentation/webkit/delivering_a_web_page_with_service_workers)
- [Motion (Framer Motion) Docs](https://www.framer.com/motion/)

---

Need help? Check the inline comments in each component file!
