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
  CALENDAR_OWNER_COLORS,
  getEventOwnerKey,
  getEventsOnDate,
  toDateKey,
  type CalendarEventItem,
} from '@/app/constants/calendar';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CoupleMonthGridProps {
  viewMonth: Date;
  onViewMonthChange: (month: Date) => void;
  events: CalendarEventItem[];
  currentUserId: string;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
}

export function CoupleMonthGrid({
  viewMonth,
  onViewMonthChange,
  events,
  currentUserId,
  selectedDateKey,
  onSelectDate,
}: CoupleMonthGridProps) {
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
          const selected = selectedDateKey === key;
          const today = isToday(date);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`
                relative flex flex-col items-center justify-start min-h-[52px] sm:min-h-[58px]
                rounded-xl p-0.5 transition-all duration-150 active:scale-[0.97]
                ${!inMonth ? 'opacity-35' : ''}
                ${selected ? 'ring-2 ring-[#A83FFF] bg-[#A83FFF]/10 scale-[1.02]' : 'hover:bg-accent/60'}
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
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 px-0.5 w-full max-w-[40px]">
                  {dayEvents.slice(0, 4).map((ev) => {
                    const owner = getEventOwnerKey(ev.createdBy, currentUserId);
                    return (
                      <span
                        key={ev.id}
                        className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${CALENDAR_OWNER_COLORS[owner].dot}`}
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
