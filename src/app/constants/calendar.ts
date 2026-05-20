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
