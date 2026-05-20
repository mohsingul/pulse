import React from 'react';
import { Card } from '@/app/components/Card';
import { Calendar, ChevronRight } from 'lucide-react';
import {
  getCalendarTypeMeta,
  getReminderLabel,
  type CalendarEventItem,
} from '@/app/constants/calendar';

interface CalendarReminderItem {
  event: CalendarEventItem;
  daysUntil: number;
}

interface CalendarRemindersHomeProps {
  reminders: CalendarReminderItem[];
  onViewCalendar: () => void;
}

function formatCountdown(daysUntil: number): string {
  if (daysUntil === 0) return 'Happening today';
  if (daysUntil === 1) return '1 day left';
  return `${daysUntil} days left`;
}

export function CalendarRemindersHome({ reminders, onViewCalendar }: CalendarRemindersHomeProps) {
  if (reminders.length === 0) return null;

  const urgent = reminders.some((r) => r.daysUntil <= 1);

  return (
    <Card
      className={`p-4 border-2 ${
        urgent
          ? 'border-[#A83FFF]/50 bg-gradient-to-r from-[#FB3094]/8 via-[#A83FFF]/8 to-[#2571FF]/8'
          : 'border-[#A83FFF]/25'
      }`}
    >
      <button
        type="button"
        onClick={onViewCalendar}
        className="w-full text-left space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#A83FFF]" />
            <h3 className="font-semibold text-sm">Coming up</h3>
            {urgent && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FB3094]/15 text-[#FB3094] animate-pulse">
                Soon
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>

        <ul className="space-y-2">
          {reminders.map(({ event, daysUntil }) => {
            const meta = getCalendarTypeMeta(event.type);
            return (
              <li
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-accent/50"
              >
                <span className="text-xl flex-shrink-0">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {meta.label} · {getReminderLabel(daysUntil)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold tabular-nums flex-shrink-0 px-2 py-1 rounded-lg ${
                    daysUntil === 0
                      ? 'bg-[#FB3094]/15 text-[#FB3094]'
                      : daysUntil === 1
                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                        : 'bg-[#A83FFF]/15 text-[#A83FFF]'
                  }`}
                >
                  {formatCountdown(daysUntil)}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted-foreground text-center">
          Tap to open Couple Calendar
        </p>
      </button>
    </Card>
  );
}
