export type CalendarEventType = 'anniversary' | 'birthday' | 'trip' | 'important';

export const CALENDAR_EVENT_TYPES: {
  id: CalendarEventType;
  label: string;
  emoji: string;
}[] = [
  { id: 'anniversary', label: 'Anniversary', emoji: '💍' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'trip', label: 'Trip', emoji: '✈️' },
  { id: 'important', label: 'Important event', emoji: '⭐' },
];

export function getCalendarTypeMeta(type: CalendarEventType) {
  return CALENDAR_EVENT_TYPES.find((t) => t.id === type) ?? CALENDAR_EVENT_TYPES[3];
}

/** Days until the next occurrence (annual for anniversary/birthday; exact date for trip/important). */
export function daysUntilEvent(dateStr: string, type?: CalendarEventType): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);

  const isAnnual = type === 'anniversary' || type === 'birthday';

  if (isAnnual) {
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

/** Show reminders on home when event is within push schedule (5, 3, 1, 0 days). */
export const CALENDAR_REMINDER_WINDOW_DAYS = 5;

/** Push notification schedule (matches server). */
export const CALENDAR_PUSH_REMINDER_DAYS = [5, 3, 1, 0] as const;

export function getReminderLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  return `In ${daysUntil} days`;
}

export interface CalendarEventItem {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
}

/** Partner colors on the month grid — rose = you, blue = partner */
export const CALENDAR_OWNER_COLORS = {
  self: {
    dot: 'bg-[#FB3094]',
    ring: 'ring-[#FB3094]',
    bar: 'bg-[#FB3094]',
    soft: 'bg-[#FB3094]/20',
    text: 'text-[#FB3094]',
  },
  partner: {
    dot: 'bg-[#2571FF]',
    ring: 'ring-[#2571FF]',
    bar: 'bg-[#2571FF]',
    soft: 'bg-[#2571FF]/20',
    text: 'text-[#2571FF]',
  },
} as const;

export type CalendarOwnerKey = keyof typeof CALENDAR_OWNER_COLORS;

export function getEventOwnerKey(
  createdBy: string | undefined,
  currentUserId: string,
): CalendarOwnerKey {
  if (!createdBy || createdBy === currentUserId) return 'self';
  return 'partner';
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whether an event appears on a calendar day (annual types repeat yearly). */
export function eventOccursOnDate(
  event: { date: string; type?: CalendarEventType },
  day: Date,
): boolean {
  const parts = event.date.split('-').map(Number);
  if (parts.length < 3) return false;
  const [, m, d] = parts;
  const isAnnual = event.type === 'anniversary' || event.type === 'birthday';
  if (isAnnual) {
    return day.getMonth() === m - 1 && day.getDate() === d;
  }
  return toDateKey(day) === event.date;
}

export function getEventsOnDate<T extends { date: string; type?: CalendarEventType }>(
  events: T[],
  day: Date,
): T[] {
  return events.filter((e) => eventOccursOnDate(e, day));
}

export function getUpcomingCalendarReminders(
  events: CalendarEventItem[],
  withinDays: number = CALENDAR_REMINDER_WINDOW_DAYS,
) {
  return events
    .map((event) => ({
      event,
      daysUntil: daysUntilEvent(event.date, event.type),
    }))
    .filter(({ daysUntil }) => daysUntil >= 0 && daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
