import * as kv from "./kv_store.ts";

type CalendarEvent = {
  id: string;
  coupleId: string;
  type: string;
  title?: string;
  date: string;
  endDate?: string;
  createdBy?: string;
  createdByName?: string;
};

type SendFcmPush = (
  fcmToken: string,
  notification: { title: string; body: string; icon?: string; badge?: string },
  data?: Record<string, unknown>,
) => Promise<unknown>;

const APP_URL = Deno.env.get("APP_URL") || "https://aimopulse.vercel.app";

function todayDateKey(): string {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.toISOString().split("T")[0];
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysInclusiveBetween(startKey: string, endKey: string): number {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function isInRange(dayKey: string, start: string, end: string): boolean {
  return dayKey >= start && dayKey <= end;
}

function generateId(): string {
  return crypto.randomUUID();
}

async function ensureSharkModeForUser(
  coupleId: string,
  userId: string,
  durationDays: number,
  note: string,
): Promise<{ activated: boolean; extended: boolean }> {
  const user = await kv.get(`user:${userId}`);
  if (!user) return { activated: false, extended: false };

  const now = new Date();
  const targetEndsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const existing = await kv.get(`shark_mode:${coupleId}`);

  if (
    existing?.status === "active" &&
    existing.activatedBy === userId &&
    new Date(existing.endsAt) > now
  ) {
    const currentEnd = new Date(existing.endsAt);
    if (targetEndsAt > currentEnd) {
      existing.endsAt = targetEndsAt.toISOString();
      existing.durationDays = Math.min(
        7,
        Math.ceil(
          (targetEndsAt.getTime() - new Date(existing.activatedAt).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      );
      existing.note = note;
      existing.autoTriggered = true;
      existing.triggerSource = "menstrual_cycle";
      await kv.set(`shark_mode:${coupleId}`, existing);
      await kv.set(`shark_mode_history:${coupleId}:${existing.id}`, existing);
      return { activated: false, extended: true };
    }
    return { activated: false, extended: false };
  }

  if (existing?.status === "active" && existing.activatedBy !== userId) {
    return { activated: false, extended: false };
  }

  const sharkModeId = generateId();
  const sharkMode = {
    id: sharkModeId,
    coupleId,
    activatedBy: userId,
    activatedByName: user.displayName || "Partner",
    activatedAt: now.toISOString(),
    endsAt: targetEndsAt.toISOString(),
    durationDays: Math.min(Math.max(durationDays, 1), 7),
    note,
    reassurance: null,
    reassuranceBy: null,
    reassuranceAt: null,
    status: "active",
    autoTriggered: true,
    triggerSource: "menstrual_cycle",
  };

  await kv.set(`shark_mode:${coupleId}`, sharkMode);
  await kv.set(`shark_mode_history:${coupleId}:${sharkModeId}`, sharkMode);
  return { activated: true, extended: false };
}

async function notifyPartnerSharkMode(
  sendFcmPush: SendFcmPush,
  coupleId: string,
  couple: { user1Id: string; user2Id: string },
  activatedUserId: string,
  displayName: string,
): Promise<boolean> {
  const receiverId =
    activatedUserId === couple.user1Id ? couple.user2Id : couple.user1Id;
  if (!receiverId || receiverId === activatedUserId) return false;

  const receiver = await kv.get(`user:${receiverId}`);
  if (!receiver?.fcmToken) return false;

  const firstName = displayName.split(" ")[0] || displayName;

  try {
    await sendFcmPush(
      receiver.fcmToken,
      {
        title: "Aimo Pulse",
        body: `🦈 ${firstName} is in Shark Mode — menstrual cycle day`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      },
      {
        type: "shark-mode",
        coupleId,
        url: APP_URL,
        tag: `shark-menstrual-${activatedUserId}-${todayDateKey()}`,
      },
    );
    return true;
  } catch (err) {
    console.error(`[Menstrual Shark] Partner notify failed:`, err);
    return false;
  }
}

/** On each menstrual cycle day: auto-activate Shark Mode for the owner and notify partner once per day. */
export async function processMenstrualCycleSharkMode(
  sendFcmPush: SendFcmPush,
  coupleIdFilter?: string,
): Promise<{ processed: number; activated: number; notified: number }> {
  const today = todayDateKey();
  let processed = 0;
  let activated = 0;
  let notified = 0;

  const allEvents = await kv.getByPrefix("calendar_event:");

  for (const raw of allEvents as CalendarEvent[]) {
    if (!raw?.coupleId || raw.type !== "menstrual_cycle" || !raw.createdBy) continue;
    if (coupleIdFilter && raw.coupleId !== coupleIdFilter) continue;

    const end = raw.endDate && raw.endDate >= raw.date ? raw.endDate : raw.date;
    if (!isInRange(today, raw.date, end)) continue;

    processed++;

    const couple = await kv.get(`couple:${raw.coupleId}`);
    if (!couple?.user1Id || !couple?.user2Id) continue;

    const remaining = daysInclusiveBetween(today, end);
    const durationDays = Math.min(Math.max(remaining, 1), 7);
    const note = "Auto-enabled from menstrual cycle on your shared calendar.";

    const result = await ensureSharkModeForUser(
      raw.coupleId,
      raw.createdBy,
      durationDays,
      note,
    );
    if (result.activated || result.extended) activated++;

    const notifyKey = `menstrual_shark_notify:${raw.coupleId}:${raw.createdBy}:${today}`;
    if (await kv.get(notifyKey)) continue;

    const owner = await kv.get(`user:${raw.createdBy}`);
    const name = owner?.displayName || raw.createdByName || "Your partner";
    const didNotify = await notifyPartnerSharkMode(
      sendFcmPush,
      raw.coupleId,
      couple,
      raw.createdBy,
      name,
    );
    if (didNotify) {
      await kv.set(notifyKey, { sentAt: new Date().toISOString() });
      notified++;
    }
  }

  console.log(
    `[Menstrual Shark] processed=${processed} activated=${activated} notified=${notified}`,
  );
  return { processed, activated, notified };
}
