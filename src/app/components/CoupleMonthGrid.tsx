import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import {
  getEventsOnDate,
  getShiftCyclePhase,
  getUserCalendarHex,
  isOvertimeDay,
  isShiftExcluded,
  toDateKey,
  type CalendarColorMap,
  type CalendarEventItem,
  type OvertimeMap,
  type ShiftExcludedMap,
  type ShiftPatternMap,
} from '@/app/constants/calendar';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CoupleMonthGridProps {
  viewMonth: Date;
  onViewMonthChange: (month: Date) => void;
  events: CalendarEventItem[];
  currentUserId: string;
  colorMap: CalendarColorMap;
  shiftPatterns: ShiftPatternMap;
  overtimeDays: OvertimeMap;
  shiftExcludedDays: ShiftExcludedMap;
  user1Id: string;
  user2Id: string;
  multiSelectMode: boolean;
  selectedDateKey: string | null;
  selectedDateKeys: string[];
  onDayPress: (dateKey: string) => void;
}

function shiftIconForUser(
  userId: string,
  date: Date,
  shiftPatterns: ShiftPatternMap,
  overtimeDays: OvertimeMap,
  shiftExcludedDays: ShiftExcludedMap,
): 'day' | 'night' | null {
  if (isShiftExcluded(shiftExcludedDays, userId, date)) return null;
  const pattern = shiftPatterns[userId];
  if (pattern) {
    const phase = getShiftCyclePhase(pattern, date);
    if (phase === 'day') return 'day';
    if (phase === 'night') return 'night';
  }
  if (isOvertimeDay(overtimeDays, userId, date)) return 'day';
  return null;
}

export function CoupleMonthGrid({
  viewMonth,
  onViewMonthChange,
  events,
  currentUserId,
  colorMap,
  shiftPatterns,
  overtimeDays,
  shiftExcludedDays,
  user1Id,
  user2Id,
  multiSelectMode,
  selectedDateKey,
  selectedDateKeys,
  onDayPress,
}: CoupleMonthGridProps) {
  const selectedSet = useMemo(() => new Set(selectedDateKeys), [selectedDateKeys]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const result: { date: Date; inMonth: boolean; key: string }[] = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      result.push({
        date: cursor,
        inMonth: isSameMonth(cursor, viewMonth),
        key: toDateKey(cursor),
      });
      cursor = addDays(cursor, 1);
    }
    return result;
  }, [viewMonth]);

  return (
    <div className="select-none w-full">
      <div className="flex items-center justify-between mb-5 px-0.5">
        <button
          type="button"
          onClick={() => onViewMonthChange(subMonths(viewMonth, 1))}
          className="p-3 rounded-full hover:bg-accent active:scale-95 transition-transform"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold tabular-nums tracking-tight">{format(viewMonth, 'MMMM yyyy')}</h2>
        <button
          type="button"
          onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
          className="p-3 rounded-full hover:bg-accent active:scale-95 transition-transform"
          aria-label="Next month"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-center text-xs font-semibold uppercase text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div
        key={format(viewMonth, 'yyyy-MM')}
        className="grid grid-cols-7 gap-1.5 sm:gap-2 animate-in fade-in duration-200"
      >
        {days.map(({ date, inMonth, key }) => {
          const dayEvents = getEventsOnDate(events, date);
          const inMulti = selectedSet.has(key);
          const selected = multiSelectMode ? inMulti : selectedDateKey === key;
          const today = isToday(date);

          const topIcons: { emoji: string; hex: string; label: string }[] = [];
          for (const uid of [user1Id, user2Id]) {
            const kind = shiftIconForUser(
              uid,
              date,
              shiftPatterns,
              overtimeDays,
              shiftExcludedDays,
            );
            if (kind) {
              topIcons.push({
                emoji: kind === 'night' ? '🌙' : '☀️',
                hex: getUserCalendarHex(uid, colorMap, uid),
                label: kind === 'night' ? 'Night shift' : 'Day shift',
              });
            }
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayPress(key)}
              className={`
                relative flex flex-col items-center w-full aspect-square
                rounded-2xl transition-all duration-150 active:scale-[0.97]
                ${!inMonth ? 'opacity-30' : ''}
                ${
                  selected
                    ? multiSelectMode
                      ? 'ring-2 ring-[#A83FFF] bg-[#A83FFF]/25'
                      : 'ring-2 ring-[#A83FFF] bg-[#A83FFF]/15'
                    : 'hover:bg-accent/50'
                }
                ${today && !selected ? 'bg-accent/50' : ''}
              `}
            >
              {/* Fixed-height top row — keeps every cell aligned */}
              <div className="h-5 w-full flex items-center justify-center gap-0.5 shrink-0 pt-0.5">
                {topIcons.length > 0 ? (
                  topIcons.map((icon, i) => (
                    <span
                      key={i}
                      className="text-sm leading-none"
                      title={icon.label}
                      style={{ textShadow: `0 0 6px ${icon.hex}55` }}
                    >
                      {icon.emoji}
                    </span>
                  ))
                ) : (
                  <span className="h-4 w-4" aria-hidden />
                )}
              </div>

              <div className="flex-1 flex items-center justify-center w-full min-h-0">
                <span
                  className={`
                    text-lg sm:text-xl font-semibold tabular-nums leading-none
                    flex items-center justify-center rounded-full
                    min-w-[2rem] min-h-[2rem] sm:min-w-[2.25rem] sm:min-h-[2.25rem]
                    ${today ? 'bg-[image:var(--pulse-gradient)] text-white shadow-sm' : ''}
                  `}
                >
                  {format(date, 'd')}
                </span>
              </div>

              <div className="h-3.5 w-full flex items-center justify-center gap-0.5 shrink-0 pb-1">
                {dayEvents.length > 0 ? (
                  <>
                    {dayEvents.slice(0, 3).map((ev) => {
                      const hex = getUserCalendarHex(ev.createdBy, colorMap, currentUserId);
                      return (
                        <span
                          key={ev.id}
                          className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: hex }}
                          title={ev.title}
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] font-semibold text-muted-foreground leading-none">
                        +
                      </span>
                    )}
                  </>
                ) : (
                  <span className="h-1.5 w-1.5" aria-hidden />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
