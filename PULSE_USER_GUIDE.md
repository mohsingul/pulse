# Pulse - User Guide & Testing Instructions

## Overview
Pulse is a couples mood board app built with React that allows two partners to share their daily mood, messages, and doodles through a single "Today Card" that updates throughout the day.

## Features Implemented ✅

### 1. Authentication (Local-Only)
- ✅ Username + Password login (no email required)
- ✅ Profile creation with display name
- ✅ Local storage persistence
- ✅ Reset profile option

### 2. Pairing System
- ✅ Generate 6-digit codes
- ✅ 15-minute expiration timer
- ✅ Join with code validation
- ✅ Error handling (expired, invalid, already used codes)
- ✅ Auto-polling for connection status
- ✅ Code saved in Profile for later viewing
- ✅ Copy and Share code functionality

### 3. Today Card
- ✅ Shared daily card between partners
- ✅ Auto-refresh every 30 seconds
- ✅ Three update types:
  - **Mood**: 20 emoji options + intensity level (Low/Medium/High)
  - **Message**: Text input (max 120 chars) with 6 quick templates
  - **Doodle**: Full canvas with drawing tools
- ✅ Empty state with gradient background
- ✅ Loading states

### 4. Interactions
- ✅ Quick reactions (❤️ 🫶 😘 😄 🥺)
- ✅ Nudge partner (3 per day limit with tooltip)
- ✅ View who updated last
- ✅ Time-ago formatting

### 5. Doodle Canvas
- ✅ Full-screen drawing interface
- ✅ Pen and eraser tools
- ✅ 7 color options
- ✅ Adjustable thickness slider
- ✅ Undo/Redo functionality
- ✅ Clear canvas
- ✅ Touch support for mobile
- ✅ High DPI display support

### 6. History
- ✅ Timeline view of all past days
- ✅ Day detail view
- ✅ Shows mood, message, doodle, and reactions
- ✅ Date formatting
- ✅ Empty state

### 7. Profile & Settings
- ✅ View/copy/share pairing code
- ✅ Generate new code
- ✅ Code status (Active/Expired/Used)
- ✅ Unpair functionality with confirmation
- ✅ Logout with confirmation
- ✅ Light/Dark theme toggle
- ✅ Notification reminder settings (Morning/Midday/Evening)
- ✅ Time pickers for each reminder

### 8. Design System
- ✅ Brand gradient (#FB3094 → #A83FFF → #2571FF)
- ✅ Pill-shaped buttons with hover effects
- ✅ Rounded cards (3xl)
- ✅ Animated gradient blobs
- ✅ Smooth transitions
- ✅ Bottom sheet animations
- ✅ Responsive mobile-first design
- ✅ Light and Dark themes

## How to Test

### Test Scenario 1: Two-User Flow (Recommended)

**User 1 (Desktop/Mobile 1):**
1. Open the app
2. Click "Get Started"
3. Create profile: Display Name: "Alex", Username: "alex", Password: "123456"
4. Click "Create a Couple"
5. Note the 6-digit code (e.g., "123456")
6. Copy or share the code

**User 2 (Different browser/device):**
1. Open the app
2. Click "Get Started"
3. Create profile: Display Name: "Jordan", Username: "jordan", Password: "123456"
4. Click "Join with Code"
5. Enter the code from User 1
6. See success screen with "You're Connected!"

**Both Users:**
1. Click "Go to Home"
2. See the shared Today Card (initially empty)
3. User 1: Click "Update Pulse" → Select mood 😊 (Medium) → Send
4. User 2: Refresh or wait ~30 seconds → See Alex's mood
5. User 2: Add reaction ❤️
6. User 1: Add message "Thinking of you 💭"
7. Either user: Open doodle canvas → Draw → Save
8. Both see updated card with mood, message, and doodle

### Test Scenario 2: Single-User Demo
1. Create profile
2. Generate pairing code (you can view it in Profile later)
3. Update pulse with mood/message/doodle
4. View history
5. Toggle dark mode in Settings
6. Configure notification times

### Testing Features

**Pairing Code:**
- Code expires in 15 minutes (visible countdown)
- Can't use own code
- Can't join if already paired
- Code saved in Profile → "Your Pairing Code" section

**Today Card:**
- Updates auto-refresh
- Shows "Updated X ago" timestamp
- Shows who updated last (You/Partner name)
- Empty state when no updates

**Doodle Canvas:**
- Draw with pen tool
- Switch to eraser
- Change colors and thickness
- Undo/redo actions
- Clear all
- Touch drawing on mobile

**Profile:**
- View pairing code status
- Generate new code (if not paired)
- Unpair (with confirmation)
- Logout (with confirmation)

**Settings:**
- Theme toggle (Light/Dark)
- Notification toggles and time pickers
- Settings persist in localStorage

## Browser Console Testing

Open browser console to see:
- API request logs
- Error messages
- State updates

## Known Limitations (By Design)

1. **No Email/OAuth**: Simple username + password only
2. **No Push Notifications**: Reminder settings are UI-only (no actual scheduling)
3. **No Widgets**: Widget designs were specified but not implemented (requires native wrapper)
4. **Manual Refresh**: 30-second auto-polling (not true real-time WebSocket)
5. **Local Authentication**: Passwords stored as SHA-256 hashes (suitable for prototyping only)
6. **In-Memory Database**: Uses Supabase KV store (data persists per session)

## Mobile Responsiveness

The app is designed mobile-first and works on:
- Small phones (320px+)
- Large phones (414px+)
- Tablets (768px+)
- Desktop (1024px+)

Test on:
- Chrome DevTools mobile emulator
- Real mobile devices
- Different orientations

## Troubleshooting

**Issue: Can't connect after entering code**
- Check code hasn't expired (15 min limit)
- Verify code entered correctly
- Ensure User 1 is on "waiting" screen

**Issue: Updates not showing**
- Wait 30 seconds for auto-refresh
- Manually refresh browser
- Check browser console for errors

**Issue: Theme not persisting**
- Check localStorage is enabled
- Try clearing cache and reloading

**Issue: Doodle not saving**
- Ensure you clicked "Save Doodle"
- Check canvas has content before saving

## Data Storage

**LocalStorage Keys:**
- `pulse_user` - User session data
- `pulse_theme` - Theme preference
- `pulse_notifications` - Notification settings

**Supabase KV Keys:**
- `user:{userId}` - User profiles
- `couple:{coupleId}` - Couple pairings
- `code:{code}` - Pairing codes
- `today:{coupleId}:{date}` - Daily cards
- And more (see README_PULSE.md)

## Next Steps for Production

If deploying this to production, consider:

1. **Security:**
   - Add proper authentication (OAuth, JWT)
   - Implement secure password hashing (bcrypt)
   - Add rate limiting
   - Validate all inputs server-side

2. **Real-Time:**
   - Implement WebSocket connections
   - Use Supabase Realtime for instant updates

3. **Notifications:**
   - Implement push notifications (FCM/APNs)
   - Add notification service worker
   - Schedule reminders server-side

4. **Storage:**
   - Optimize doodle images (compress, resize)
   - Use Supabase Storage for images
   - Implement proper database schema

5. **Widgets:**
   - Wrap in React Native or Capacitor
   - Implement native widgets for iOS/Android

6. **Analytics:**
   - Track user engagement
   - Monitor errors
   - Optimize performance

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase backend is running
3. Clear localStorage and try again
4. Review code in `/src/app/screens/` for logic

## Credits

Built with:
- React 18
- TypeScript
- Tailwind CSS v4
- Supabase
- Vite
- date-fns
- lucide-react

Design inspired by modern mobile app UI patterns with mesmerizing gradients and smooth animations.
