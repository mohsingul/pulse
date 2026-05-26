import * as kv from "./kv_store.ts";

type ReminderPeriod = "morning" | "midday" | "evening";

type ReminderSlot = {
  enabled: boolean;
  time: string;
};

export type UserReminderPreferences = {
  userId?: string;
  morning: ReminderSlot;
  midday: ReminderSlot;
  evening: ReminderSlot;
  timezoneOffset: number;
};

type SendFcmPush = (
  fcmToken: string,
  notification: { title: string; body: string; icon?: string; badge?: string },
  data?: Record<string, unknown>,
) => Promise<unknown>;

const PERIODS: ReminderPeriod[] = ["morning", "midday", "evening"];
const MATCH_WINDOW_MINUTES = 20;

const PERIOD_COPY: Record<ReminderPeriod, { title: string; body: string }> = {
  morning: {
    title: "Aimo Pulse",
    body: "☀️ Good morning — time to update your Pulse",
  },
  midday: {
    title: "Aimo Pulse",
    body: "💫 Midday check-in — how is your Pulse today?",
  },
  evening: {
    title: "Aimo Pulse",
    body: "🌙 Evening reminder — share your Pulse before the day ends",
  },
};

function prefsKey(userId: string): string {
  return `user_reminder_prefs:${userId}`;
}

export async function saveUserReminderPreferences(
  userId: string,
  prefs: Omit<UserReminderPreferences, "userId">,
): Promise<void> {
  await kv.set(prefsKey(userId), {
    userId,
    ...prefs,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserReminderPreferences(
  userId: string,
): Promise<UserReminderPreferences | null> {
  return (await kv.get(prefsKey(userId))) as UserReminderPreferences | null;
}

function parseTimeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map((v) => Number(v));
  return hour * 60 + (minute || 0);
}

/** Local minutes since midnight using JS getTimezoneOffset() convention. */
function localMinutesNow(timezoneOffset: number): number {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const local = utcMinutes - timezoneOffset;
  return ((local % 1440) + 1440) % 1440;
}

function localDateKey(timezoneOffset: number): string {
  const now = new Date();
  const utcMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
  );
  const local = new Date(utcMs - timezoneOffset * 60 * 1000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isWithinTimeWindow(localMinutes: number, targetMinutes: number): boolean {
  const diff = Math.abs(localMinutes - targetMinutes);
  return diff <= MATCH_WINDOW_MINUTES || diff >= 1440 - MATCH_WINDOW_MINUTES;
}

async function wasPulseReminderSent(
  userId: string,
  period: ReminderPeriod,
  dateKey: string,
): Promise<boolean> {
  const key = `pulse_reminder_sent:${userId}:${period}:${dateKey}`;
  return !!(await kv.get(key));
}

async function markPulseReminderSent(
  userId: string,
  period: ReminderPeriod,
  dateKey: string,
): Promise<void> {
  const key = `pulse_reminder_sent:${userId}:${period}:${dateKey}`;
  await kv.set(key, { sentAt: new Date().toISOString() });
}

export async function processPulseRemindersForUser(
  sendFcmPush: SendFcmPush,
  userId: string,
): Promise<{ sent: number; skipped: number; processed: number }> {
  let sent = 0;
  let skipped = 0;
  let processed = 0;

  const prefs = (await getUserReminderPreferences(userId)) as UserReminderPreferences | null;
  if (!prefs?.morning || !prefs?.midday || !prefs?.evening) {
    return { sent, skipped: 1, processed };
  }

  processed++;

  const user = await kv.get(`user:${userId}`);
  if (!user?.fcmToken) {
    return { sent, skipped: 1, processed };
  }

  const tz = typeof prefs.timezoneOffset === "number" ? prefs.timezoneOffset : 0;
  const dateKey = localDateKey(tz);
  const localNow = localMinutesNow(tz);

  for (const period of PERIODS) {
    const slot = prefs[period];
    if (!slot?.enabled || !slot.time) continue;

    if (await wasPulseReminderSent(userId, period, dateKey)) {
      skipped++;
      continue;
    }

    const target = parseTimeToMinutes(slot.time);
    if (!isWithinTimeWindow(localNow, target)) {
      skipped++;
      continue;
    }

    const copy = PERIOD_COPY[period];
    try {
      await sendFcmPush(
        user.fcmToken,
        {
          title: copy.title,
          body: copy.body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        },
        {
          type: "pulse-reminder",
          period,
          tag: `pulse-${period}-${dateKey}`,
        },
      );
      await markPulseReminderSent(userId, period, dateKey);
      sent++;
    } catch (err) {
      console.error(`[Pulse Reminder] FCM failed for user ${userId}:`, err);
      skipped++;
    }
  }

  return { sent, skipped, processed };
}

export async function processPulseReminders(
  sendFcmPush: SendFcmPush,
): Promise<{ sent: number; skipped: number; processed: number }> {
  let sent = 0;
  let skipped = 0;
  let processed = 0;

  const allPrefs = await kv.getByPrefix("user_reminder_prefs:");

  for (const prefs of allPrefs as UserReminderPreferences[]) {
    if (!prefs?.morning || !prefs?.midday || !prefs?.evening) continue;

    const userId = prefs.userId;
    if (!userId) continue;

    processed++;

    const user = await kv.get(`user:${userId}`);
    if (!user?.fcmToken) {
      skipped++;
      continue;
    }

    const tz = typeof prefs.timezoneOffset === "number" ? prefs.timezoneOffset : 0;
    const dateKey = localDateKey(tz);
    const localNow = localMinutesNow(tz);

    for (const period of PERIODS) {
      const slot = prefs[period];
      if (!slot?.enabled || !slot.time) continue;

      if (await wasPulseReminderSent(userId, period, dateKey)) {
        skipped++;
        continue;
      }

      const target = parseTimeToMinutes(slot.time);
      if (!isWithinTimeWindow(localNow, target)) {
        skipped++;
        continue;
      }

      const copy = PERIOD_COPY[period];
      try {
        await sendFcmPush(
          user.fcmToken,
          {
            title: copy.title,
            body: copy.body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
          },
          {
            type: "pulse-reminder",
            period,
            tag: `pulse-${period}-${dateKey}`,
          },
        );
        await markPulseReminderSent(userId, period, dateKey);
        sent++;
      } catch (err) {
        console.error(`[Pulse Reminder] FCM failed for user ${userId}:`, err);
        skipped++;
      }
    }
  }

  console.log(`[Pulse Reminder] Done: sent=${sent}, skipped=${skipped}, processed=${processed}`);
  return { sent, skipped, processed };
}
