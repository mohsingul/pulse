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
  getShiftDayNightKind,
  getUserCalendarHex,
  isUserOnShiftForDay,
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
          const shiftBars: { hex: string; kind: 'day' | 'night' }[] = [];
          for (const uid of [user1Id, user2Id]) {
            if (!isUserOnShiftForDay(uid, shiftPatterns, overtimeDays, shiftExcludedDays, date)) {
              continue;
            }
            const pattern = shiftPatterns[uid];
            const kind = pattern ? getShiftDayNightKind(pattern, date) : 'day';
            shiftBars.push({
              hex: getUserCalendarHex(uid, colorMap, uid),
              kind: kind ?? 'day',
            });
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayPress(key)}
              className={`
                relative flex flex-col items-center justify-between w-full aspect-square
                rounded-2xl p-1 pt-1.5 transition-all duration-150 active:scale-[0.97] overflow-hidden
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
              <span
                className={`
                  text-lg sm:text-xl font-semibold tabular-nums leading-none
                  min-w-[2rem] min-h-[2rem] sm:min-w-[2.25rem] sm:min-h-[2.25rem]
                  flex items-center justify-center rounded-full
                  ${today ? 'bg-[image:var(--pulse-gradient)] text-white shadow-sm' : ''}
                `}
              >
                {format(date, 'd')}
              </span>

              <div className="flex flex-col items-center justify-end w-full gap-1 pb-1 min-h-[1.25rem]">
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 px-0.5 max-w-full">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const hex = getUserCalendarHex(ev.createdBy, colorMap, currentUserId);
                      return (
                        <span
                          key={ev.id}
                          className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: hex }}
                          title={ev.title}
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] font-semibold text-muted-foreground leading-none">+</span>
                    )}
                  </div>
                )}
                {shiftBars.length > 0 && (
                  <div className="w-[85%] flex flex-col items-center gap-0.5">
                    {shiftBars.map((b, i) => (
                      <div key={i} className="w-full flex items-center gap-0.5">
                        <span
                          className="text-[10px] leading-none flex-shrink-0"
                          title={b.kind === 'night' ? 'Night shift' : 'Day shift'}
                        >
                          {b.kind === 'night' ? '🌙' : '☀️'}
                        </span>
                        <span
                          className="flex-1 h-1 rounded-full opacity-95"
                          style={{ backgroundColor: b.hex }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
