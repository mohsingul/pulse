# Calendar push reminders

Automatic Firebase notifications are sent **5, 3, and 1 days before**, and **on the day** of each shared calendar event — even when the app is closed.

## Supabase secrets (required)

In [Supabase Dashboard → Project Settings → Edge Functions → Secrets](https://supabase.com/dashboard/project/iqwfevbjeohdvdbemgxp/settings/functions), set:

| Secret | Example |
|--------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full Firebase service account JSON (same as other push) |
| `APP_URL` | `https://pulse-one-umber.vercel.app` |
| `CRON_SECRET` | A long random string (protects the cron endpoint) |

## Daily schedule

The edge function runs **`POST /calendar/process-reminders`** daily at **09:00 UTC** via `supabase/config.toml` schedule.

After deploy, confirm the schedule in:  
**Dashboard → Edge Functions → make-server-494d91eb → Schedules**

## Manual test

```bash
curl -X POST \
  "https://iqwfevbjeohdvdbemgxp.supabase.co/functions/v1/make-server-494d91eb/calendar/process-reminders" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

## User requirements

- Both partners must **allow notifications** and open the app once while logged in (registers FCM token).
- Notifications open **Couple Calendar** on the tapped event.

## Message examples

| Days before | Example |
|-------------|---------|
| 5 | ❤️ Your Anniversary is in 5 days |
| 3 | ❤️ Your Anniversary is in 3 days |
| 1 | ❤️ Tomorrow is your Anniversary |
| 0 | ❤️ Happy Anniversary! |
