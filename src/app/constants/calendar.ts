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

/** Show reminders on home when event is within push schedule (0–5 days). */
export const CALENDAR_REMINDER_WINDOW_DAYS = 5;

/** Push reminders 3x daily (morning + afternoon + evening) while in window (matches server). */
export function isInCalendarPushReminderWindow(daysUntil: number): boolean {
  return daysUntil >= 0 && daysUntil <= CALENDAR_REMINDER_WINDOW_DAYS;
}

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
  endDate?: string;
  time?: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
}

/** @deprecated Legacy — string[] dates; migrated to ShiftOverrideMap */
export type OvertimeMap = Record<string, string[]>;

export type ShiftDayNightKind = 'day' | 'night';

/** Manual day/night marks on specific dates (userId → date → kind). */
export type ShiftOverrideMap = Record<string, Record<string, ShiftDayNightKind>>;

/** Dates excluded from the repeating shift pattern (day off / holiday override). */
export type ShiftExcludedMap = Record<string, string[]>;

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

function isAnnualType(type?: CalendarEventType): boolean {
  return type === 'anniversary' || type === 'birthday' || type === 'holiday';
}

/** Whether an event appears on a calendar day (annual types repeat yearly; ranges use endDate). */
export function eventOccursOnDate(
  event: { date: string; endDate?: string; type?: CalendarEventType },
  day: Date,
): boolean {
  const parts = event.date.split('-').map(Number);
  if (parts.length < 3) return false;
  const [, m, d] = parts;

  if (isAnnualType(event.type)) {
    return day.getMonth() === m - 1 && day.getDate() === d;
  }

  const key = toDateKey(day);
  const end = event.endDate && event.endDate >= event.date ? event.endDate : event.date;
  return key >= event.date && key <= end;
}

export function isMultiDayEvent(event: { date: string; endDate?: string }): boolean {
  return Boolean(event.endDate && event.endDate > event.date);
}

export function normalizeShiftOverrides(
  overrides?: ShiftOverrideMap | null,
  legacyOvertime?: OvertimeMap | null,
): ShiftOverrideMap {
  const out: ShiftOverrideMap = {};
  if (overrides) {
    for (const [uid, byDate] of Object.entries(overrides)) {
      if (!byDate || typeof byDate !== 'object' || Array.isArray(byDate)) continue;
      out[uid] = { ...byDate };
    }
  }
  if (legacyOvertime) {
    for (const [uid, list] of Object.entries(legacyOvertime)) {
      if (!Array.isArray(list)) continue;
      out[uid] = { ...(out[uid] ?? {}) };
      for (const date of list) {
        if (typeof date === 'string' && !out[uid][date]) {
          out[uid][date] = 'day';
        }
      }
    }
  }
  return out;
}

export function getShiftOverrideKind(
  overrides: ShiftOverrideMap,
  userId: string,
  day: Date,
): ShiftDayNightKind | null {
  return overrides[userId]?.[toDateKey(day)] ?? null;
}

/** Pattern phase or manual override; null if excluded or off. */
export function getEffectiveShiftKind(
  userId: string,
  shiftPatterns: ShiftPatternMap,
  shiftOverrides: ShiftOverrideMap,
  shiftExcludedDays: ShiftExcludedMap,
  day: Date,
): ShiftDayNightKind | null {
  if (isShiftExcluded(shiftExcludedDays, userId, day)) return null;
  const override = getShiftOverrideKind(shiftOverrides, userId, day);
  if (override) return override;
  const pattern = shiftPatterns[userId];
  if (!pattern) return null;
  const phase = getShiftCyclePhase(pattern, day);
  if (phase === 'day' || phase === 'night') return phase;
  return null;
}

export function isOvertimeDay(overrides: ShiftOverrideMap, userId: string, day: Date): boolean {
  return getShiftOverrideKind(overrides, userId, day) != null;
}

export function hasShiftPatternForUser(
  shiftPatterns: ShiftPatternMap,
  userId: string,
): boolean {
  return Boolean(shiftPatterns[userId]?.startDate);
}

export function isShiftExcluded(
  excluded: ShiftExcludedMap,
  userId: string,
  day: Date,
): boolean {
  return (excluded[userId] ?? []).includes(toDateKey(day));
}

/** Scheduled shift, manual override, or excluded. */
export function isUserOnShiftForDay(
  userId: string,
  shiftPatterns: ShiftPatternMap,
  shiftOverrides: ShiftOverrideMap,
  shiftExcludedDays: ShiftExcludedMap,
  day: Date,
): boolean {
  return getEffectiveShiftKind(userId, shiftPatterns, shiftOverrides, shiftExcludedDays, day) != null;
}

export function sortDateKeys(keys: string[]): string[] {
  return [...keys].sort();
}

export function dateRangeFromKeys(keys: string[]): { start: string; end: string } | null {
  if (keys.length === 0) return null;
  const sorted = sortDateKeys(keys);
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

export function getEventsOnDate<T extends { date: string; type?: CalendarEventType }>(
  events: T[],
  day: Date,
): T[] {
  return events.filter((e) => eventOccursOnDate(e, day));
}

export interface ShiftPattern {
  startDate: string;
  /** Days off after day block (before nights) */
  daysOff: number;
  /** Day shifts (☀️) at the start of each cycle */
  daysDay?: number;
  /** Night shifts (🌙) after the first off block */
  daysNight?: number;
  /** Days off after night block (end of cycle); defaults to daysOff */
  daysOffAfterNight?: number;
  /** @deprecated Legacy — treated as daysDay when daysDay is omitted */
  daysOn?: number;
}

export type ShiftPatternMap = Record<string, ShiftPattern>;

export type ShiftCyclePhase = 'day' | 'off' | 'night';

export const SHIFT_DAYS_DAY = 4;
export const SHIFT_DAYS_OFF = 4;
export const SHIFT_DAYS_NIGHT = 4;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Fixed roster: 4 day → 4 off → 4 night → 4 off (16 days). Only startDate is user-configurable. */
export function migrateShiftPattern(pattern: ShiftPattern): ShiftPattern {
  return {
    startDate: pattern.startDate,
    daysDay: SHIFT_DAYS_DAY,
    daysOff: SHIFT_DAYS_OFF,
    daysNight: SHIFT_DAYS_NIGHT,
    daysOffAfterNight: SHIFT_DAYS_OFF,
  };
}

export function migrateShiftPatternMap(map: ShiftPatternMap | null | undefined): ShiftPatternMap {
  if (!map) return {};
  const out: ShiftPatternMap = {};
  for (const [uid, pattern] of Object.entries(map)) {
    if (pattern?.startDate) out[uid] = migrateShiftPattern(pattern);
  }
  return out;
}

export function normalizeShiftPattern(_pattern: ShiftPattern): {
  daysDay: number;
  daysOff: number;
  daysNight: number;
  daysOffAfterNight: number;
} {
  return {
    daysDay: SHIFT_DAYS_DAY,
    daysOff: SHIFT_DAYS_OFF,
    daysNight: SHIFT_DAYS_NIGHT,
    daysOffAfterNight: SHIFT_DAYS_OFF,
  };
}

export function getShiftCycleLength(pattern: ShiftPattern): number {
  const { daysDay, daysOff, daysNight, daysOffAfterNight } = normalizeShiftPattern(pattern);
  return daysDay + daysOff + daysNight + daysOffAfterNight;
}

export function getShiftCycleMod(pattern: ShiftPattern, day: Date): number {
  const start = parseDateKey(pattern.startDate);
  start.setHours(0, 0, 0, 0);
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - start.getTime()) / MS_PER_DAY);
  const cycle = getShiftCycleLength(pattern);
  if (cycle <= 0) return 0;
  return ((diffDays % cycle) + cycle) % cycle;
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

/**
 * Repeating cycle: daysDay (☀️) → daysOff → daysNight (🌙) → daysOffAfterNight.
 * Default 4 + 4 + 4 + 4 (16 days).
 */
export function getShiftCyclePhase(pattern: ShiftPattern, day: Date): ShiftCyclePhase | null {
  if (!isShiftPatternActive(pattern, day)) return null;
  const { daysDay, daysOff, daysNight, daysOffAfterNight } = normalizeShiftPattern(pattern);
  const mod = getShiftCycleMod(pattern, day);
  if (mod < daysDay) return 'day';
  if (mod < daysDay + daysOff) return 'off';
  if (mod < daysDay + daysOff + daysNight) return 'night';
  if (mod < daysDay + daysOff + daysNight + daysOffAfterNight) return 'off';
  return null;
}

export function isShiftOnDay(pattern: ShiftPattern, day: Date): boolean {
  const phase = getShiftCyclePhase(pattern, day);
  return phase === 'day' || phase === 'night';
}

/** ☀️ or 🌙 when on a day or night shift; null on off days. */
export function getShiftDayNightKind(pattern: ShiftPattern, day: Date): ShiftDayNightKind | null {
  const phase = getShiftCyclePhase(pattern, day);
  if (phase === 'day') return 'day';
  if (phase === 'night') return 'night';
  return null;
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
