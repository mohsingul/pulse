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
  getUserCalendarHex,
  isUserOnShiftForDay,
  toDateKey,
  type CalendarColorMap,
  type CalendarEventItem,
  type OvertimeMap,
  type ShiftPatternMap,
} from '@/app/constants/calendar';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CoupleMonthGridProps {
  viewMonth: Date;
  onViewMonthChange: (month: Date) => void;
  events: CalendarEventItem[];
  currentUserId: string;
  colorMap: CalendarColorMap;
  shiftPatterns: ShiftPatternMap;
  overtimeDays: OvertimeMap;
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
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => onViewMonthChange(subMonths(viewMonth, 1))}
          className="p-2.5 rounded-full hover:bg-accent active:scale-95 transition-transform"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold tabular-nums">{format(viewMonth, 'MMMM yyyy')}</h2>
        <button
          type="button"
          onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
          className="p-2.5 rounded-full hover:bg-accent active:scale-95 transition-transform"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div
        key={format(viewMonth, 'yyyy-MM')}
        className="grid grid-cols-7 gap-1 animate-in fade-in duration-200"
      >
        {days.map(({ date, inMonth, key }) => {
          const dayEvents = getEventsOnDate(events, date);
          const inMulti = selectedSet.has(key);
          const selected = multiSelectMode ? inMulti : selectedDateKey === key;
          const today = isToday(date);
          const shiftBars: { hex: string }[] = [];
          for (const uid of [user1Id, user2Id]) {
            if (isUserOnShiftForDay(uid, shiftPatterns, overtimeDays, date)) {
              shiftBars.push({ hex: getUserCalendarHex(uid, colorMap, uid) });
            }
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayPress(key)}
              className={`
                relative flex flex-col items-center justify-start min-h-[52px] sm:min-h-[58px]
                rounded-xl p-0.5 transition-all duration-150 active:scale-[0.97] overflow-hidden
                ${!inMonth ? 'opacity-35' : ''}
                ${
                  selected
                    ? multiSelectMode
                      ? 'ring-2 ring-[#A83FFF] bg-[#A83FFF]/25'
                      : 'ring-2 ring-[#A83FFF] bg-[#A83FFF]/10 scale-[1.02]'
                    : 'hover:bg-accent/60'
                }
                ${today && !selected ? 'bg-accent/40' : ''}
              `}
            >
              <span
                className={`
                  text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full
                  ${today ? 'bg-[image:var(--pulse-gradient)] text-white' : ''}
                `}
              >
                {format(date, 'd')}
              </span>
              {shiftBars.length > 0 && (
                <div className="absolute bottom-0 left-0.5 right-0.5 flex gap-px h-1 rounded-full overflow-hidden">
                  {shiftBars.map((b, i) => (
                    <span key={i} className="flex-1 rounded-full opacity-90" style={{ backgroundColor: b.hex }} />
                  ))}
                </div>
              )}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 px-0.5 w-full max-w-[40px]">
                  {dayEvents.slice(0, 4).map((ev) => {
                    const hex = getUserCalendarHex(ev.createdBy, colorMap, currentUserId);
                    return (
                      <span
                        key={ev.id}
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: hex }}
                        title={ev.title}
                      />
                    );
                  })}
                  {dayEvents.length > 4 && (
                    <span className="text-[8px] text-muted-foreground leading-none">+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
