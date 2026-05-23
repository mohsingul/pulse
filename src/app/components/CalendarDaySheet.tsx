import React from 'react';
import { Button } from '@/app/components/Button';
import { X, Plus, Clock } from 'lucide-react';
import {
  formatEventTime,
  getCalendarTypeMeta,
  getUserCalendarHex,
  isMultiDayEvent,
  isOvertimeDay,
  isShiftOnDay,
  parseDateKey,
  type CalendarColorMap,
  type CalendarEventItem,
  type OvertimeMap,
  type ShiftPatternMap,
} from '@/app/constants/calendar';
import { format } from 'date-fns';

interface CalendarDaySheetProps {
  open: boolean;
  dateKey: string;
  events: CalendarEventItem[];
  currentUserId: string;
  userName: string;
  partnerName: string;
  colorMap: CalendarColorMap;
  shiftPatterns: ShiftPatternMap;
  overtimeDays: OvertimeMap;
  user1Id: string;
  user2Id: string;
  isMyOvertime: boolean;
  onClose: () => void;
  onAdd: () => void;
  onEventClick: (event: CalendarEventItem) => void;
  onToggleOvertime: () => void;
  overtimeSaving?: boolean;
}

export function CalendarDaySheet({
  open,
  dateKey,
  events,
  currentUserId,
  partnerName,
  colorMap,
  shiftPatterns,
  overtimeDays,
  user1Id,
  user2Id,
  isMyOvertime,
  onClose,
  onAdd,
  onEventClick,
  onToggleOvertime,
  overtimeSaving,
}: CalendarDaySheetProps) {
  if (!open) return null;

  const dayLabel = format(parseDateKey(dateKey), 'EEEE, MMMM d, yyyy');
  const day = parseDateKey(dateKey);
  const labelFor = (uid: string) =>
    uid === currentUserId ? 'You' : partnerName.split(' ')[0];
  const shiftNotes: string[] = [];
  if (shiftPatterns[user1Id] && isShiftOnDay(shiftPatterns[user1Id], day)) {
    shiftNotes.push(`${labelFor(user1Id)} — on shift`);
  }
  if (shiftPatterns[user2Id] && isShiftOnDay(shiftPatterns[user2Id], day)) {
    shiftNotes.push(`${labelFor(user2Id)} — on shift`);
  }
  const partnerId = user1Id === currentUserId ? user2Id : user1Id;
  const partnerOt = isOvertimeDay(overtimeDays, partnerId, day);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close day"
      />
      <div
        className="relative bg-background rounded-t-3xl shadow-2xl border-t border-border max-h-[70vh] flex flex-col safe-bottom animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label={`Events on ${dayLabel}`}
      >
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {events.length === 0 ? 'No events' : `${events.length} event${events.length === 1 ? '' : 's'}`}
            </p>
            <h3 className="text-lg font-bold leading-tight">{dayLabel}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <Button
            variant={isMyOvertime ? 'gradient' : 'secondary'}
            className="w-full"
            onClick={onToggleOvertime}
            disabled={overtimeSaving}
          >
            <Clock className="w-4 h-4 mr-2 inline" />
            {overtimeSaving ? 'Saving…' : isMyOvertime ? 'Remove overtime' : 'Mark overtime'}
          </Button>
          {partnerOt && (
            <p className="text-xs text-center text-muted-foreground">
              {partnerName.split(' ')[0]} is on overtime this day
            </p>
          )}

          {shiftNotes.length > 0 && (
            <div className="rounded-xl bg-accent/60 px-3 py-2 space-y-1">
              {shiftNotes.map((note) => (
                <p key={note} className="text-xs font-semibold text-foreground">
                  🔄 {note}
                </p>
              ))}
            </div>
          )}
          {events.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">📅</div>
              <p className="text-muted-foreground text-sm">
                {shiftNotes.length > 0 || isMyOvertime ? 'No events on this day' : 'Nothing planned for this day'}
              </p>
              <Button variant="gradient" onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2 inline" />
                Add event
              </Button>
            </div>
          ) : (
            events.map((event) => {
              const meta = getCalendarTypeMeta(event.type);
              const hex = getUserCalendarHex(event.createdBy, colorMap, currentUserId);
              const isSelf = !event.createdBy || event.createdBy === currentUserId;
              const timeLabel = formatEventTime(event.time);
              const dateLabel = isMultiDayEvent(event)
                ? `${format(parseDateKey(event.date), 'MMM d')} – ${format(parseDateKey(event.endDate!), 'MMM d, yyyy')}`
                : null;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99] border-l-4"
                  style={{
                    borderLeftColor: hex,
                    backgroundColor: `${hex}18`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <p className="font-semibold flex-1 truncate">{event.title}</p>
                    <span className="text-[10px] font-bold uppercase" style={{ color: hex }}>
                      {isSelf ? 'You' : partnerName.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {meta.label}
                    {dateLabel ? ` · ${dateLabel}` : ''}
                    {timeLabel ? ` · ${timeLabel}` : ''}
                  </p>
                  {event.notes && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.notes}</p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {events.length > 0 && (
          <div className="px-5 pb-6 pt-2 border-t border-border">
            <Button variant="gradient" className="w-full" onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add another event
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
