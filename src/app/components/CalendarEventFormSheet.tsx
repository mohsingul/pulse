import React, { useEffect, useState } from 'react';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { X, Trash2, Pencil } from 'lucide-react';
import {
  CALENDAR_EVENT_TYPES,
  getCalendarTypeMeta,
  daysUntilEvent,
  getReminderLabel,
  formatEventTime,
  getUserCalendarHex,
  parseDateKey,
  type CalendarColorMap,
  type CalendarEventType,
  type CalendarEventItem,
} from '@/app/constants/calendar';
import { format } from 'date-fns';

export type CalendarSheetMode = 'add' | 'view' | 'edit';

interface CalendarEventFormSheetProps {
  open: boolean;
  mode: CalendarSheetMode;
  event: CalendarEventItem | null;
  initialDate: string;
  initialEndDate?: string;
  currentUserId: string;
  userName: string;
  partnerName: string;
  colorMap: CalendarColorMap;
  saving: boolean;
  onClose: () => void;
  onSave: (data: {
    type: CalendarEventType;
    title: string;
    date: string;
    endDate?: string;
    time?: string;
    notes?: string;
  }) => void;
  onDelete: () => void;
  onStartEdit: () => void;
}

export function CalendarEventFormSheet({
  open,
  mode,
  event,
  initialDate,
  initialEndDate,
  currentUserId,
  userName,
  partnerName,
  colorMap,
  saving,
  onClose,
  onSave,
  onDelete,
  onStartEdit,
}: CalendarEventFormSheetProps) {
  const [formKey, setFormKey] = useState(0);
  const [type, setType] = useState<CalendarEventType>('important');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialEndDate ?? '');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) {
      setTime('');
      setTitle('');
      setNotes('');
      setEndDate('');
      return;
    }
    if (mode === 'add') {
      setFormKey((k) => k + 1);
      setType('important');
      setTitle('');
      setDate(initialDate);
      setEndDate(initialEndDate && initialEndDate > initialDate ? initialEndDate : '');
      setTime('');
      setNotes('');
    } else if (event) {
      setType(event.type);
      setTitle(event.title);
      setDate(event.date);
      setEndDate(event.endDate && event.endDate > event.date ? event.endDate : '');
      setTime(event.time ?? '');
      setNotes(event.notes ?? '');
    }
  }, [open, mode, event?.id, initialDate, initialEndDate]);

  if (!open) return null;

  const isForm = mode === 'add' || mode === 'edit';
  const isSelf = !event?.createdBy || event.createdBy === currentUserId;
  const ownerLabel = isSelf ? userName : partnerName;
  const ownerHex = getUserCalendarHex(event?.createdBy, colorMap, currentUserId);
  const timeLabel = event ? formatEventTime(event.time) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onSave({
      type,
      title: title.trim(),
      date,
      endDate: endDate && endDate >= date ? endDate : undefined,
      time: time.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative bg-background rounded-t-3xl shadow-2xl border-t border-border max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 safe-bottom"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold">
            {mode === 'add' ? 'Add event' : mode === 'edit' ? 'Edit event' : 'Event'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-8 pt-4 space-y-4">
          {mode === 'view' && event && (
            <>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${ownerHex}20`, color: ownerHex }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ownerHex }} />
                {ownerLabel}
              </div>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{getCalendarTypeMeta(event.type).emoji}</span>
                <div>
                  <h2 className="text-xl font-bold">{event.title}</h2>
                  <p className="text-sm text-muted-foreground">{getCalendarTypeMeta(event.type).label}</p>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium">
                    {event.endDate && event.endDate > event.date
                      ? `${format(parseDateKey(event.date), 'MMM d')} – ${format(parseDateKey(event.endDate), 'MMM d, yyyy')}`
                      : format(parseDateKey(event.date), 'EEEE, MMMM d, yyyy')}
                  </dd>
                </div>
                {timeLabel && (
                  <div>
                    <dt className="text-muted-foreground">Time</dt>
                    <dd className="font-medium">{timeLabel}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Countdown</dt>
                  <dd className="font-medium">
                    {(() => {
                      const d = daysUntilEvent(event.date, event.type);
                      return d < 0 ? 'Past' : getReminderLabel(d);
                    })()}
                  </dd>
                </div>
                {event.notes && (
                  <div>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="font-medium">{event.notes}</dd>
                  </div>
                )}
              </dl>
              <div className="flex gap-2 pt-2">
                <Button variant="gradient" className="flex-1" onClick={onStartEdit}>
                  <Pencil className="w-4 h-4 mr-2 inline" />
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={saving}
                  className="p-3 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Delete event"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {isForm && (
            <form key={`form-${formKey}-${mode}-${event?.id ?? 'new'}`} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {CALENDAR_EVENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-[0.98] ${
                      type === t.id ? 'border-[#A83FFF] bg-[#A83FFF]/10' : 'border-border'
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              <Input
                label="Title"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (endDate && endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  required
                />
                <Input
                  label="End date (optional)"
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Input
                key={`time-${formKey}-${mode}-${event?.id ?? 'new'}`}
                label="Time (optional)"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <Input
                label="Notes"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button type="submit" variant="gradient" className="w-full" disabled={saving}>
                {saving ? 'Saving…' : mode === 'add' ? 'Add to calendar' : 'Save changes'}
              </Button>
              {mode === 'edit' && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-destructive"
                  onClick={onDelete}
                  disabled={saving}
                >
                  Delete event
                </Button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
