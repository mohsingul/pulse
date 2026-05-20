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

/** Days until the next occurrence (annual events use month/day only). */
export function daysUntilEvent(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) {
    next = new Date(today.getFullYear() + 1, m - 1, d);
  }
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
