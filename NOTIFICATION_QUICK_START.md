# 🚀 Notification System - Quick Start

Get the iOS-style notification system running in **under 1 hour**.

---

## ⚡ 5-Minute Quick Setup

### Step 1: Install Dependencies

```bash
pnpm install motion date-fns
```

### Step 2: Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

You'll get:
```
Public Key: BNx...abc (copy this)
Private Key: xyz...123 (copy this)
```

### Step 3: Update Hook with Public Key

Open `src/hooks/useNotifications.ts` and replace:

```typescript
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';
```

With your actual public key:

```typescript
const VAPID_PUBLIC_KEY = 'BNx...abc';
```

### Step 4: Add to App.tsx

Copy this into your `src/app/App.tsx`:

```typescript
// ADD TO IMPORTS
import { NotificationSettingsScreen } from '@/app/screens/NotificationSettingsScreen';
import { NotificationCenterScreen } from '@/app/screens/NotificationCenterScreen';
import { NotificationOnboarding } from '@/app/components/NotificationOnboarding';
import { useNotifications } from '@/hooks/useNotifications';

// ADD TO Screen TYPE
type Screen = 
  | 'welcome'
  | 'create-profile'
  | 'login'
  | 'connect'
  | 'create-couple'
  | 'join-couple'
  | 'success'
  | 'home'
  | 'profile'
  | 'settings'
  | 'history'
  | 'doodle'
  | 'doodle-gallery'
  | 'message-archive'
  | 'mood-archive'
  | 'shark-mode-archive'
  | 'daily-challenge-archive'
  | 'notification-settings'     // ← ADD THIS
  | 'notification-center';      // ← ADD THIS

// ADD TO STATE (inside App component)
const [showNotificationOnboarding, setShowNotificationOnboarding] = useState(false);
const notificationState = useNotifications(user?.userId);

// ADD TO SCREEN RENDERING (inside the return statement)
{currentScreen === 'notification-settings' && (
  <NotificationSettingsScreen 
    onBack={() => setCurrentScreen('settings')} 
  />
)}

{currentScreen === 'notification-center' && (
  <NotificationCenterScreen
    userId={user.userId}
    onBack={() => setCurrentScreen('home')}
  />
)}

// ADD MODAL (at the end, before closing tag)
<NotificationOnboarding
  isOpen={showNotificationOnboarding}
  onClose={() => setShowNotificationOnboarding(false)}
  onEnable={async () => {
    try {
      await notificationState.enableNotifications();
      setShowNotificationOnboarding(false);
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  }}
/>

// ADD TRIGGER (after couple state changes)
useEffect(() => {
  // Show onboarding 2 seconds after successful pairing
  if (couple && notificationState.permission === 'default') {
    const timer = setTimeout(() => {
      setShowNotificationOnboarding(true);
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [couple, notificationState.permission]);
```

### Step 5: Test It!

```bash
pnpm dev
```

1. Create account or login
2. Pair with someone
3. Wait 2 seconds → notification onboarding appears!
4. Click "Enable Notifications"
5. Go to Settings → Notifications
6. Click "Send Test Notification"

✅ **Done! Notifications are working locally.**

---

## 🔧 Add Backend (Optional - for real push)

### Backend Option A: Supabase Edge Functions (Recommended)

1. **Add push endpoints** to `supabase/functions/server/index.tsx`:

```typescript
// Install web-push in your Edge Function
import webpush from 'npm:web-push@3.6.7';

// Subscribe endpoint
app.post("/make-server-494d91eb/push/subscribe", async (c) => {
  try {
    const { userId, subscription } = await c.req.json();
    
    // Store subscription
    await kv.set(`push_subscription:${userId}`, {
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to subscribe' }, 500);
  }
});

// Send push endpoint
app.post("/make-server-494d91eb/push/send", async (c) => {
  try {
    const { userId, title, body, type } = await c.req.json();
    
    // Get subscription
    const subscription = await kv.get(`push_subscription:${userId}`);
    if (!subscription) {
      return c.json({ error: 'No subscription found' }, 404);
    }
    
    // Configure VAPID
    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      Deno.env.get('VAPID_PUBLIC_KEY') || '',
      Deno.env.get('VAPID_PRIVATE_KEY') || ''
    );
    
    // Send push
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify({ title, body, type, icon: '/icon-192.png' })
    );
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Push send error:', error);
    return c.json({ error: 'Failed to send push' }, 500);
  }
});
```

2. **Set environment variables**:

```bash
supabase secrets set VAPID_PUBLIC_KEY="BNx...abc"
supabase secrets set VAPID_PRIVATE_KEY="xyz...123"
```

3. **Deploy**:

```bash
supabase functions deploy make-server-494d91eb
```

4. **Update frontend** to call backend:

In `src/hooks/useNotifications.ts`, uncomment and update:

```typescript
async function sendSubscriptionToBackend(
  userId: string,
  subscription: PushSubscriptionData
): Promise<void> {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-494d91eb/push/subscribe`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ userId, subscription }),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to save subscription');
  }
}
```

### Backend Option B: Firebase Cloud Messaging

If you prefer Firebase:

1. Set up Firebase project
2. Get FCM server key
3. Use FCM SDK instead of Web Push
4. Follow Firebase docs for push notifications

---

## 🧪 Testing Checklist

### Local Testing (Without Backend)

- [ ] Service worker registers (`/sw.js` accessible)
- [ ] Permission request works
- [ ] Local notifications show up
- [ ] Settings screen loads
- [ ] Notification center loads
- [ ] Onboarding modal appears
- [ ] Dark mode works
- [ ] Animations are smooth

### With Backend

- [ ] Subscription saves to backend
- [ ] Push notifications arrive when app is closed
- [ ] Notifications work on lock screen
- [ ] Banner notifications appear
- [ ] Notification center shows push
- [ ] Clicking notification opens app

### iOS Testing (Critical!)

- [ ] Install as PWA on iOS (Add to Home Screen)
- [ ] Request permissions from installed PWA
- [ ] Receive push notifications
- [ ] Lock screen notifications work
- [ ] Banner notifications work
- [ ] Haptic feedback works
- [ ] Safe areas are respected

---

## 📱 iOS Deployment

### For Best iOS Experience:

1. **Ensure app is installable** (manifest.json configured)
2. **Test in Safari** first
3. **Add to Home Screen**
4. **Then request notifications**

iOS requires PWA installation before push notifications work!

### manifest.json Required Fields:

```json
{
  "name": "Aimo Pulse",
  "short_name": "Pulse",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#A83FFF",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🐛 Common Issues

### "Service worker not registering"

**Solution:** Make sure `/sw.js` is in the `public/` folder and accessible at `https://your-app.com/sw.js`

### "Notifications not supported"

**Solution:** 
- Check HTTPS is enabled (required)
- Check browser compatibility
- For iOS: app must be installed as PWA

### "Permission denied"

**Solution:** Users must manually enable in Settings → Notifications. You cannot programmatically re-request.

### "Push not arriving"

**Solution:**
- Verify VAPID keys are correct
- Check subscription is saved in backend
- Verify Edge Function is deployed
- Check browser console for errors

---

## 📊 What You Get

✅ **4 New Screens:**
- Notification Settings
- Notification Center
- Notification Showcase
- Onboarding Modal

✅ **Service Worker:**
- Background notifications
- Offline caching
- Custom vibrations

✅ **Complete Documentation:**
- Setup guide (this file)
- Full implementation guide
- Troubleshooting

✅ **iOS-Native Feel:**
- Glassmorphism
- Smooth animations
- Safe area support
- Dark mode

---

## ⏱️ Time Breakdown

| Task | Time |
|------|------|
| Install dependencies | 2 min |
| Generate VAPID keys | 2 min |
| Update App.tsx | 10 min |
| Test locally | 5 min |
| **Total (Frontend Only)** | **~20 min** |
| Add backend | +20 min |
| Deploy | +10 min |
| **Total (With Backend)** | **~50 min** |

---

## 🎯 Next Steps

1. ✅ Complete the 5-minute setup above
2. ✅ Test locally
3. ⚠️ Add backend (optional, for real push)
4. ✅ Deploy to production
5. ✅ Test on iOS (install as PWA)
6. 🎉 Launch!

---

## 📚 Full Documentation

For advanced customization, troubleshooting, and backend details:

- **Full Guide:** `NOTIFICATION_SYSTEM_GUIDE.md`
- **Complete Reference:** `NOTIFICATION_SYSTEM_COMPLETE.md`

---

## 🆘 Need Help?

**Quick fixes:**
- Check browser console for errors
- Verify `/sw.js` is accessible
- Ensure HTTPS is enabled
- For iOS: install as PWA first

**Still stuck?**
Read `NOTIFICATION_SYSTEM_GUIDE.md` for detailed troubleshooting.

---

**You're ready! 🚀**

Start with the 5-minute setup and have notifications running in no time.
