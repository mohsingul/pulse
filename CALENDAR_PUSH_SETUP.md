# Calendar & pulse push reminders

## Calendar events

Automatic Firebase notifications are sent **three times per day** (morning ~9:00, afternoon ~15:00, and evening ~21:00 in your timezone) for each upcoming shared calendar event while it is **0–5 days away** (including the day of the event) — even when the app is closed.

When either partner **adds** a calendar event, the other receives a push immediately with the event type and title.

Opening the app also triggers a daily sync for your couple’s calendar reminders.

## Pulse reminders (Settings → Reminder Notifications)

Morning, midday, and evening Pulse reminders are stored on the server and delivered via **FCM push** at the times you choose in Settings.

## Supabase secrets (required)

In [Supabase Dashboard → Project Settings → Edge Functions → Secrets](https://supabase.com/dashboard/project/iqwfevbjeohdvdbemgxp/settings/functions), set:

| Secret | Example |
|--------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full Firebase service account JSON (same as other push) |
| `APP_URL` | `https://aimopulse.vercel.app` |
| `CRON_SECRET` | A long random string (protects the cron endpoint) |

## Schedule

Run **`POST /calendar/process-reminders`** on a schedule (recommended: **every 15 minutes**):

`*/15 * * * *`

This endpoint processes both **calendar event** and **pulse** reminders.

After deploy, confirm the schedule in:  
**Dashboard → Edge Functions → make-server-494d91eb → Schedules**

Or use the included GitHub Action (`.github/workflows/reminder-cron.yml`) with repo secrets `SUPABASE_ANON_KEY` and `CRON_SECRET`.

## Manual test

```bash
curl -X POST \
  "https://iqwfevbjeohdvdbemgxp.supabase.co/functions/v1/make-server-494d91eb/calendar/process-reminders" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

## User requirements

- Both partners must **allow notifications** and open the app once while logged in (registers FCM token on the server).
- After that, pushes continue when the app is closed or you are logged out locally — the device token stays registered until you tap **Log out**.
- Reminder notification times are saved from **Settings → Reminder Notifications**.
- Calendar notifications open **Couple Calendar** on the tapped event.

## Message examples

| Days before | Example |
|-------------|---------|
| 5 | ❤️ Your Anniversary is in 5 days |
| 4 | ❤️ Your Trip is in 4 days |
| 1 | ❤️ Tomorrow is your Anniversary |
| 0 | ❤️ Happy Anniversary! |
