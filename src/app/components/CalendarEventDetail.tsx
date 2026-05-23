import React from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { X } from 'lucide-react';
import {
  getCalendarTypeMeta,
  getReminderLabel,
  daysUntilEvent,
  isInCalendarPushReminderWindow,
  type CalendarEventType,
} from '@/app/constants/calendar';
import { format, parseISO } from 'date-fns';

export interface CalendarEventDetailData {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  notes?: string;
  createdByName?: string;
}

interface CalendarEventDetailProps {
  event: CalendarEventDetailData;
  onClose: () => void;
}

export function CalendarEventDetail({ event, onClose }: CalendarEventDetailProps) {
  const meta = getCalendarTypeMeta(event.type);
  const days = daysUntilEvent(event.date, event.type);
  const daysLabel = days < 0 ? 'Past' : getReminderLabel(days);
  const hasPushSoon = isInCalendarPushReminderWindow(days);

  return (
    <Card className="p-5 border-2 border-[#A83FFF]/40 bg-gradient-to-br from-[#FB3094]/5 via-[#A83FFF]/5 to-[#2571FF]/5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl">{meta.emoji}</span>
          <div>
            <h2 className="text-xl font-bold">{event.title}</h2>
            <p className="text-sm text-muted-foreground">{meta.label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-full"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Date</dt>
          <dd className="font-medium">{format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Countdown</dt>
          <dd className="font-medium">{daysLabel}</dd>
        </div>
        {event.createdByName && (
          <div>
            <dt className="text-muted-foreground">Added by</dt>
            <dd className="font-medium">{event.createdByName}</dd>
          </div>
        )}
        {event.notes && (
          <div>
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="font-medium">{event.notes}</dd>
          </div>
        )}
      </dl>

      {hasPushSoon && (
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
          You&apos;ll get push reminders 5 days, 3 days, and 1 day before, plus on the day — even when
          the app is closed.
        </p>
      )}

      <Button variant="secondary" className="w-full mt-4" onClick={onClose}>
        Done
      </Button>
    </Card>
  );
}
