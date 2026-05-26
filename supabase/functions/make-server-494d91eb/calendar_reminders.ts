import * as kv from "./kv_store.ts";

const REMINDER_WINDOW_MAX = 5;
const APP_URL = Deno.env.get("APP_URL") || "https://aimopulse.vercel.app";

/** Three reminder passes per day while an event is 0–5 days away (morning + afternoon + evening). */
const REMINDER_SLOTS = [
  { id: "morning", targetMinutes: 9 * 60 },
  { id: "afternoon", targetMinutes: 15 * 60 },
  { id: "evening", targetMinutes: 21 * 60 },
] as const;

type ReminderSlotId = (typeof REMINDER_SLOTS)[number]["id"];

const SLOT_WINDOW_MINUTES = 20;

type CalendarEventType = "anniversary" | "birthday" | "trip" | "holiday" | "important";

type CalendarEvent = {
  id: string;
  coupleId: string;
  type: CalendarEventType;
  title: string;
  date: string;
  endDate?: string;
  notes?: string;
};

type SendFcmPush = (
  fcmToken: string,
  notification: { title: string; body: string; icon?: string; badge?: string },
  data?: Record<string, unknown>,
) => Promise<unknown>;

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function todayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function todayDateKey(): string {
  return todayAtMidnight().toISOString().split("T")[0];
}

export function daysUntilCalendarEvent(
  dateStr: string,
  type: CalendarEventType,
  endDate?: string,
): number {
  const today = todayAtMidnight();
  const [y, m, d] = dateStr.split("-").map(Number);

  const isAnnual =
    type === "anniversary" || type === "birthday" || type === "holiday";

  if (isAnnual) {
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) {
      next = new Date(today.getFullYear() + 1, m - 1, d);
    }
    return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const start = parseDateOnly(dateStr);
  if (endDate && (type === "trip" || type === "important" || type === "holiday")) {
    const end = parseDateOnly(endDate);
    if (end < today) return -1;
    if (start <= today && today <= end) return 0;
    if (start > today) {
      return Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  if (start < today) return -1;
  return Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getNextOccurrenceDate(
  dateStr: string,
  type: CalendarEventType,
  endDate?: string,
): string | null {
  const today = todayAtMidnight();
  const [y, m, d] = dateStr.split("-").map(Number);

  if (type === "anniversary" || type === "birthday" || type === "holiday") {
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) {
      next = new Date(today.getFullYear() + 1, m - 1, d);
    }
    return next.toISOString().split("T")[0];
  }

  const start = parseDateOnly(dateStr);
  if (endDate && (type === "trip" || type === "important" || type === "holiday")) {
    const end = parseDateOnly(endDate);
    if (end < today) return null;
    if (start <= today && today <= end) return today.toISOString().split("T")[0];
    if (start >= today) return dateStr;
    return null;
  }

  if (start < today) return null;
  return dateStr;
}

function displayNameForEvent(event: CalendarEvent): string {
  const trimmed = event.title?.trim();
  if (trimmed) return trimmed;

  switch (event.type) {
    case "anniversary":
      return "Anniversary";
    case "birthday":
      return "Birthday";
    case "trip":
      return "Trip";
    case "holiday":
      return "Holiday";
    default:
      return "Important event";
  }
}

export function getCalendarReminderMessage(
  event: CalendarEvent,
  daysUntil: number,
): { title: string; body: string } {
  const name = displayNameForEvent(event);

  if (daysUntil === 0) {
    if (event.type === "anniversary") {
      return { title: "Aimo Pulse", body: "❤️ Happy Anniversary!" };
    }
    if (event.type === "birthday") {
      return { title: "Aimo Pulse", body: `❤️ Happy Birthday — ${name}!` };
    }
    if (event.type === "holiday") {
      return { title: "Aimo Pulse", body: `❤️ Happy Holiday — ${name}!` };
    }
    if (event.endDate && event.endDate !== event.date) {
      return { title: "Aimo Pulse", body: `❤️ ${name} is happening today` };
    }
    return { title: "Aimo Pulse", body: `❤️ Today is ${name}!` };
  }

  if (daysUntil === 1) {
    return {
      title: "Aimo Pulse",
      body: `❤️ Tomorrow is your ${name}`,
    };
  }

  return {
    title: "Aimo Pulse",
    body: `❤️ Your ${name} is in ${daysUntil} days`,
  };
}

function buildCalendarDeepLink(coupleId: string, eventId: string): string {
  const params = new URLSearchParams({
    screen: "couple-calendar",
    eventId,
    coupleId,
  });
  return `${APP_URL}/?${params.toString()}`;
}

function localMinutesNow(timezoneOffset: number): number {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const local = utcMinutes - timezoneOffset;
  return ((local % 1440) + 1440) % 1440;
}

function isWithinTimeWindow(localMinutes: number, targetMinutes: number): boolean {
  const diff = Math.abs(localMinutes - targetMinutes);
  return diff <= SLOT_WINDOW_MINUTES || diff >= 1440 - SLOT_WINDOW_MINUTES;
}

async function getUserTimezoneOffset(userId: string): Promise<number> {
  const prefs = await kv.get(`user_reminder_prefs:${userId}`);
  return typeof prefs?.timezoneOffset === "number" ? prefs.timezoneOffset : 0;
}

async function wasReminderSentForSlot(
  coupleId: string,
  eventId: string,
  occurrenceDate: string,
  slot: ReminderSlotId,
): Promise<boolean> {
  const key =
    `calendar_reminder_sent:${coupleId}:${eventId}:${occurrenceDate}:${todayDateKey()}:${slot}`;
  return !!(await kv.get(key));
}

async function markReminderSentForSlot(
  coupleId: string,
  eventId: string,
  occurrenceDate: string,
  slot: ReminderSlotId,
): Promise<void> {
  const key =
    `calendar_reminder_sent:${coupleId}:${eventId}:${occurrenceDate}:${todayDateKey()}:${slot}`;
  await kv.set(key, { sentAt: new Date().toISOString(), slot });
}

function activeReminderSlotsForUser(timezoneOffset: number): ReminderSlotId[] {
  const localNow = localMinutesNow(timezoneOffset);
  return REMINDER_SLOTS.filter((s) => isWithinTimeWindow(localNow, s.targetMinutes)).map((s) =>
    s.id
  );
}

async function sendReminderToUser(
  sendFcmPush: SendFcmPush,
  userId: string,
  event: CalendarEvent,
  daysUntil: number,
  occurrenceDate: string,
  slot: ReminderSlotId,
): Promise<boolean> {
  if (await wasReminderSentForSlot(event.coupleId, event.id, occurrenceDate, slot)) {
    return false;
  }

  const user = await kv.get(`user:${userId}`);
  if (!user?.fcmToken) return false;

  const copy = getCalendarReminderMessage(event, daysUntil);
  const url = buildCalendarDeepLink(event.coupleId, event.id);

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
        type: "calendar-reminder",
        coupleId: event.coupleId,
        eventId: event.id,
        daysUntil: String(daysUntil),
        reminderSlot: slot,
        url,
        tag: `calendar-${event.id}-${occurrenceDate}-${todayDateKey()}-${slot}`,
      },
    );
    await markReminderSentForSlot(event.coupleId, event.id, occurrenceDate, slot);
    return true;
  } catch (err) {
    console.error(`[Calendar Reminder] FCM failed for user ${userId}:`, err);
    return false;
  }
}

export async function processCalendarReminders(
  sendFcmPush: SendFcmPush,
  coupleIdFilter?: string,
): Promise<{ sent: number; skipped: number; processed: number }> {
  let sent = 0;
  let skipped = 0;
  let processed = 0;

  const allEvents = await kv.getByPrefix("calendar_event:");

  for (const event of allEvents as CalendarEvent[]) {
    if (!event?.coupleId || !event?.id || !event?.date || !event?.type) continue;
    if (coupleIdFilter && event.coupleId !== coupleIdFilter) continue;

    processed++;

    const couple = await kv.get(`couple:${event.coupleId}`);
    if (!couple?.user1Id || !couple?.user2Id) {
      skipped++;
      continue;
    }

    const daysUntil = daysUntilCalendarEvent(event.date, event.type, event.endDate);
    if (daysUntil < 0 || daysUntil > REMINDER_WINDOW_MAX) {
      skipped++;
      continue;
    }

    const occurrenceDate = getNextOccurrenceDate(event.date, event.type, event.endDate);
    if (!occurrenceDate) {
      skipped++;
      continue;
    }

    const userIds = [couple.user1Id, couple.user2Id] as const;
    let eventSent = false;

    for (const uid of userIds) {
      const tz = await getUserTimezoneOffset(uid);
      const activeSlots = activeReminderSlotsForUser(tz);
      if (activeSlots.length === 0) {
        skipped++;
        continue;
      }

      for (const slot of activeSlots) {
        const didSend = await sendReminderToUser(
          sendFcmPush,
          uid,
          event,
          daysUntil,
          occurrenceDate,
          slot,
        );
        if (didSend) {
          sent++;
          eventSent = true;
        } else {
          skipped++;
        }
      }
    }

    if (!eventSent) {
      skipped++;
    }
  }

  console.log(`[Calendar Reminder] Done: sent=${sent}, skipped=${skipped}, processed=${processed}`);
  return { sent, skipped, processed };
}
