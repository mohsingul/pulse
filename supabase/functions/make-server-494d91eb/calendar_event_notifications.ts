import * as kv from "./kv_store.ts";

type CalendarEventType =
  | "anniversary"
  | "birthday"
  | "trip"
  | "holiday"
  | "important"
  | "menstrual_cycle";

type CalendarEvent = {
  id: string;
  coupleId: string;
  type: CalendarEventType;
  title: string;
  date: string;
  endDate?: string;
  createdByName?: string;
};

type SendFcmPush = (
  fcmToken: string,
  notification: { title: string; body: string; icon?: string; badge?: string },
  data?: Record<string, unknown>,
) => Promise<unknown>;

const APP_URL = Deno.env.get("APP_URL") || "https://aimopulse.vercel.app";

const TYPE_LABELS: Record<CalendarEventType, string> = {
  anniversary: "Anniversary",
  birthday: "Birthday",
  trip: "Trip",
  holiday: "Holiday",
  important: "Important event",
  menstrual_cycle: "Menstrual cycle",
};

function buildCalendarDeepLink(coupleId: string, eventId: string): string {
  const params = new URLSearchParams({
    screen: "couple-calendar",
    eventId,
    coupleId,
  });
  return `${APP_URL}/?${params.toString()}`;
}

function eventSummary(event: CalendarEvent): string {
  const name = event.title?.trim() || TYPE_LABELS[event.type] || "Calendar event";
  const typeLabel = TYPE_LABELS[event.type] ?? "Event";
  return `${typeLabel}: ${name}`;
}

/** Notify partner when the other person adds a shared calendar event. */
export async function notifyPartnerCalendarEventAdded(
  sendFcmPush: SendFcmPush,
  couple: { user1Id: string; user2Id: string },
  actorUserId: string,
  event: CalendarEvent,
): Promise<boolean> {
  const receiverId = actorUserId === couple.user1Id ? couple.user2Id : couple.user1Id;
  if (!receiverId || receiverId === actorUserId) return false;

  const actor = await kv.get(`user:${actorUserId}`);
  const receiver = await kv.get(`user:${receiverId}`);
  if (!receiver?.fcmToken) return false;

  const actorName = actor?.displayName || event.createdByName || "Your partner";
  const summary = eventSummary(event);

  try {
    await sendFcmPush(
      receiver.fcmToken,
      {
        title: "Aimo Pulse",
        body: `📅 ${actorName} added ${summary}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      },
      {
        type: "calendar-event-added",
        coupleId: event.coupleId,
        eventId: event.id,
        url: buildCalendarDeepLink(event.coupleId, event.id),
        tag: `calendar-added-${event.id}`,
      },
    );
    return true;
  } catch (err) {
    console.error(`[Calendar] Partner notify failed for ${receiverId}:`, err);
    return false;
  }
}
