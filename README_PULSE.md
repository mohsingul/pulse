# Pulse - Couples Mood Board App

A lightweight, intimate couples app for sharing daily moods, messages, and doodles.

## Features

### Authentication (Local-Only)
- Simple username + password login
- No email required
- Data stored locally on device

### Pairing System
- Generate 6-digit codes
- 15-minute expiration
- Two-person limit per couple
- Code saved in Profile for later viewing

### Today Card
- Shared daily card between partners
- Updates in real-time (30-second polling)
- Three update types:
  - **Mood**: Emoji + intensity level
  - **Message**: Text (max 120 chars) with quick templates
  - **Doodle**: Canvas drawing tool

### Interactions
- Quick reactions (❤️ 🫶 😘 😄 🥺)
- Nudge partner (3 per day limit)
- View update history

### Settings
- Light/Dark theme toggle
- Customizable notification reminders:
  - Morning (default: 9:00 AM)
  - Midday (default: 1:00 PM)
  - Evening (default: 7:00 PM)

### Design System
- Brand gradient: `#FB3094 → #A83FFF → #2571FF`
- Pill-shaped buttons
- Rounded cards (2xl)
- Subtle animations
- Mesmerizing gradient blobs

## Tech Stack
- React 18
- TypeScript
- Tailwind CSS v4
- Supabase (backend)
- date-fns (date formatting)
- lucide-react (icons)

## API Endpoints

### Users
- `POST /users/create` - Create new user
- `POST /users/login` - Login user
- `GET /users/:userId` - Get user info

### Pairing
- `POST /pairing/generate` - Generate 6-digit code
- `POST /pairing/join` - Join with code
- `GET /pairing/:userId` - Get user's code

### Couples
- `GET /couples/:userId` - Get user's couple
- `DELETE /couples/:userId` - Unpair

### Today Cards
- `GET /today/:coupleId` - Get today's card
- `POST /today/:coupleId` - Update today's card
- `POST /today/:coupleId/react` - Add reaction

### History
- `GET /history/:coupleId` - Get all past cards

## Local Storage
- `pulse_user` - User data (userId, username, displayName)
- `pulse_theme` - Theme preference (light/dark)
- `pulse_notifications` - Notification settings

## Screens
1. Welcome
2. Create Profile / Login
3. Connect (Create/Join Couple)
4. Success (Connection confirmation)
5. Home (Today Card)
6. Update Pulse (Bottom sheet)
7. Doodle Canvas
8. Profile
9. Settings
10. History

## Future Enhancements (Not Implemented)
- Widget designs for iOS/Android
- Actual notification scheduling (reminder settings are UI-only)
- Image optimization for doodles
- Advanced analytics and insights