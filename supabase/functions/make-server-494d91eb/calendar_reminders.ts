import * as kv from "./kv_store.ts";

const REMINDER_DAYS = [5, 3, 1, 0] as const;
const APP_URL = Deno.env.get("APP_URL") || "https://aimopulse.vercel.app";

type CalendarEventType = "anniversary" | "birthday" | "trip" | "holiday" | "important";

type CalendarEvent = {
  id: string;
  coupleId: string;
  type: CalendarEventType;
  title: string;
  date: string;
  notes?: string;
};

type SendFcmPush = (
  fcmToken: string,
  notification: { title: string; body: string; icon?: string; badge?: string },
  data?: Record<string, unknown>,
) => Promise<unknown>;

export function daysUntilCalendarEvent(dateStr: string, type: CalendarEventType): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map(Number);

  if (type === "anniversary" || type === "birthday" || type === "holiday") {
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) {
      next = new Date(today.getFullYear() + 1, m - 1, d);
    }
    return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const target = new Date(y, m - 1, d);
  if (target < today) return -1;
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getNextOccurrenceDate(dateStr: string, type: CalendarEventType): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map(Number);

  if (type === "anniversary" || type === "birthday" || type === "holiday") {
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) {
      next = new Date(today.getFullYear() + 1, m - 1, d);
    }
    return next.toISOString().split("T")[0];
  }

  const target = new Date(y, m - 1, d);
  if (target < today) return null;
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

  if (daysUntil === 5) {
    return {
      title: "Aimo Pulse",
      body: `❤️ Your ${name} is in 5 days`,
    };
  }
  if (daysUntil === 3) {
    return {
      title: "Aimo Pulse",
      body: `❤️ Your ${name} is in 3 days`,
    };
  }
  if (daysUntil === 1) {
    return {
      title: "Aimo Pulse",
      body: `❤️ Tomorrow is your ${name}`,
    };
  }

  if (event.type === "anniversary") {
    return { title: "Aimo Pulse", body: "❤️ Happy Anniversary!" };
  }
  if (event.type === "birthday") {
    return { title: "Aimo Pulse", body: `❤️ Happy Birthday — ${name}!` };
  }
  if (event.type === "holiday") {
    return { title: "Aimo Pulse", body: `❤️ Happy Holiday — ${name}!` };
  }
  return { title: "Aimo Pulse", body: `❤️ Today is ${name}!` };
}

function buildCalendarDeepLink(coupleId: string, eventId: string): string {
  const params = new URLSearchParams({
    screen: "couple-calendar",
    eventId,
    coupleId,
  });
  return `${APP_URL}/?${params.toString()}`;
}

async function wasReminderSent(
  coupleId: string,
  eventId: string,
  occurrenceDate: string,
  daysBefore: number,
): Promise<boolean> {
  const key = `calendar_reminder_sent:${coupleId}:${eventId}:${occurrenceDate}:${daysBefore}`;
  return !!(await kv.get(key));
}

async function markReminderSent(
  coupleId: string,
  eventId: string,
  occurrenceDate: string,
  daysBefore: number,
): Promise<void> {
  const key = `calendar_reminder_sent:${coupleId}:${eventId}:${occurrenceDate}:${daysBefore}`;
  await kv.set(key, { sentAt: new Date().toISOString() });
}

async function sendReminderToCouple(
  sendFcmPush: SendFcmPush,
  couple: { user1Id: string; user2Id: string },
  event: CalendarEvent,
  daysUntil: number,
  occurrenceDate: string,
): Promise<boolean> {
  if (await wasReminderSent(event.coupleId, event.id, occurrenceDate, daysUntil)) {
    return false;
  }

  const copy = getCalendarReminderMessage(event, daysUntil);
  const url = buildCalendarDeepLink(event.coupleId, event.id);
  const userIds = [couple.user1Id, couple.user2Id];
  let anySent = false;

  for (const uid of userIds) {
    const user = await kv.get(`user:${uid}`);
    if (!user?.fcmToken) continue;

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
          url,
          tag: `calendar-${event.id}-${occurrenceDate}-${daysUntil}`,
        },
      );
      anySent = true;
    } catch (err) {
      console.error(`[Calendar Reminder] FCM failed for user ${uid}:`, err);
    }
  }

  if (anySent) {
    await markReminderSent(event.coupleId, event.id, occurrenceDate, daysUntil);
  }

  return anySent;
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

    const daysUntil = daysUntilCalendarEvent(event.date, event.type);
    if (!REMINDER_DAYS.includes(daysUntil as typeof REMINDER_DAYS[number])) {
      skipped++;
      continue;
    }

    const occurrenceDate = getNextOccurrenceDate(event.date, event.type);
    if (!occurrenceDate) {
      skipped++;
      continue;
    }

    const didSend = await sendReminderToCouple(
      sendFcmPush,
      couple,
      event,
      daysUntil,
      occurrenceDate,
    );

    if (didSend) sent++;
    else skipped++;
  }

  console.log(`[Calendar Reminder] Done: sent=${sent}, skipped=${skipped}, processed=${processed}`);
  return { sent, skipped, processed };
}
