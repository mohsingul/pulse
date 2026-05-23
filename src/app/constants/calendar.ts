export type CalendarEventType =
  | 'anniversary'
  | 'birthday'
  | 'trip'
  | 'holiday'
  | 'important';

export const CALENDAR_EVENT_TYPES: {
  id: CalendarEventType;
  label: string;
  emoji: string;
}[] = [
  { id: 'anniversary', label: 'Anniversary', emoji: '💍' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'trip', label: 'Trip', emoji: '✈️' },
  { id: 'holiday', label: 'Holiday', emoji: '🏖️' },
  { id: 'important', label: 'Important event', emoji: '⭐' },
];

export function getCalendarTypeMeta(type: CalendarEventType) {
  return CALENDAR_EVENT_TYPES.find((t) => t.id === type) ?? CALENDAR_EVENT_TYPES[3];
}

/** Days until the next occurrence (annual for anniversary/birthday/holiday; exact date for trip/important). */
export function daysUntilEvent(dateStr: string, type?: CalendarEventType): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);

  const isAnnual =
    type === 'anniversary' || type === 'birthday' || type === 'holiday';

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
  time?: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
}

export type CalendarColorId =
  | 'rose'
  | 'blue'
  | 'purple'
  | 'teal'
  | 'orange'
  | 'gold'
  | 'green'
  | 'coral';

export const CALENDAR_COLOR_PALETTE: { id: CalendarColorId; label: string; hex: string }[] = [
  { id: 'rose', label: 'Rose', hex: '#FB3094' },
  { id: 'blue', label: 'Blue', hex: '#2571FF' },
  { id: 'purple', label: 'Purple', hex: '#A83FFF' },
  { id: 'teal', label: 'Teal', hex: '#14B8A6' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
  { id: 'gold', label: 'Gold', hex: '#EAB308' },
  { id: 'green', label: 'Green', hex: '#22C55E' },
  { id: 'coral', label: 'Coral', hex: '#F43F5E' },
];

export const DEFAULT_CALENDAR_COLORS: Record<'user1' | 'user2', CalendarColorId> = {
  user1: 'rose',
  user2: 'blue',
};

export type CalendarColorMap = Record<string, CalendarColorId>;

export function getPaletteColor(colorId: string | undefined): string {
  const found = CALENDAR_COLOR_PALETTE.find((c) => c.id === colorId);
  return found?.hex ?? CALENDAR_COLOR_PALETTE[0].hex;
}

export function defaultColorMap(
  user1Id: string,
  user2Id: string,
): CalendarColorMap {
  return {
    [user1Id]: DEFAULT_CALENDAR_COLORS.user1,
    [user2Id]: DEFAULT_CALENDAR_COLORS.user2,
  };
}

export function mergeColorMap(
  user1Id: string,
  user2Id: string,
  stored?: CalendarColorMap | null,
): CalendarColorMap {
  const base = defaultColorMap(user1Id, user2Id);
  if (!stored) return base;
  return {
    [user1Id]: stored[user1Id] && CALENDAR_COLOR_PALETTE.some((c) => c.id === stored[user1Id])
      ? stored[user1Id]
      : base[user1Id],
    [user2Id]: stored[user2Id] && CALENDAR_COLOR_PALETTE.some((c) => c.id === stored[user2Id])
      ? stored[user2Id]
      : base[user2Id],
  };
}

export function getUserCalendarHex(
  ownerUserId: string | undefined,
  colorMap: CalendarColorMap,
  fallbackUserId: string,
): string {
  const id = ownerUserId || fallbackUserId;
  return getPaletteColor(colorMap[id]);
}

/** Parse YYYY-MM-DD in local timezone (avoids UTC shift from parseISO). */
export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatEventTime(time?: string): string | null {
  if (!time) return null;
  const [h, min] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(min).padStart(2, '0')} ${period}`;
}

/** Whether an event appears on a calendar day (annual types repeat yearly). */
export function eventOccursOnDate(
  event: { date: string; type?: CalendarEventType },
  day: Date,
): boolean {
  const parts = event.date.split('-').map(Number);
  if (parts.length < 3) return false;
  const [, m, d] = parts;
  const isAnnual =
    event.type === 'anniversary' || event.type === 'birthday' || event.type === 'holiday';
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

export interface ShiftPattern {
  startDate: string;
  daysOn: number;
  daysOff: number;
}

export type ShiftPatternMap = Record<string, ShiftPattern>;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** True when this day falls in an "on" portion of the repeating shift cycle. */
export function isShiftWorkDay(pattern: ShiftPattern, day: Date): boolean {
  const start = parseDateKey(pattern.startDate);
  start.setHours(0, 0, 0, 0);
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - start.getTime()) / MS_PER_DAY);
  const cycle = pattern.daysOn + pattern.daysOff;
  if (cycle <= 0) return false;
  const mod = ((diffDays % cycle) + cycle) % cycle;
  return mod < pattern.daysOn;
}

/** Shift display window: from start date through one year ahead. */
export function isShiftPatternActive(pattern: ShiftPattern, day: Date): boolean {
  const start = parseDateKey(pattern.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  return d >= start && d <= end;
}

export function isShiftOnDay(pattern: ShiftPattern, day: Date): boolean {
  return isShiftPatternActive(pattern, day) && isShiftWorkDay(pattern, day);
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
