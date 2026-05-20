import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { CalendarEventDetail } from '@/app/components/CalendarEventDetail';
import { ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react';
import { calendarAPI } from '@/utils/api';
import {
  CALENDAR_EVENT_TYPES,
  getCalendarTypeMeta,
  daysUntilEvent,
  type CalendarEventType,
} from '@/app/constants/calendar';
import { format, parseISO } from 'date-fns';

interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  notes?: string;
  createdByName?: string;
}

interface CoupleCalendarScreenProps {
  coupleId: string;
  userId: string;
  partnerName: string;
  highlightEventId?: string | null;
  onBack: () => void;
  onClearHighlight?: () => void;
}

export function CoupleCalendarScreen({
  coupleId,
  userId,
  partnerName,
  highlightEventId,
  onBack,
  onClearHighlight,
}: CoupleCalendarScreenProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(highlightEventId ?? null);
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CalendarEventType | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<CalendarEventType>('anniversary');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [coupleId]);

  useEffect(() => {
    if (highlightEventId) {
      setSelectedEventId(highlightEventId);
    }
  }, [highlightEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    const el = eventRefs.current[selectedEventId];
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [selectedEventId, events, loading]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  const fetchEvents = async () => {
    try {
      const response = await calendarAPI.get(coupleId);
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const list = filter === 'all' ? events : events.filter((e) => e.type === filter);
    return [...list].sort((a, b) => daysUntilEvent(a.date, a.type) - daysUntilEvent(b.date, b.type));
  }, [events, filter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setSaving(true);
    try {
      await calendarAPI.create(coupleId, userId, {
        type,
        title: title.trim(),
        date,
        notes: notes.trim() || undefined,
      });
      setTitle('');
      setDate('');
      setNotes('');
      setShowAddForm(false);
      await fetchEvents();
    } catch (error: any) {
      alert(error.message || 'Failed to add event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Remove this event from your shared calendar?')) return;
    try {
      await calendarAPI.delete(coupleId, eventId, userId);
      await fetchEvents();
    } catch (error: any) {
      alert(error.message || 'Failed to delete event');
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="px-6 py-6 flex items-center justify-between border-b border-border safe-top flex-shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-bold">Couple Calendar</h1>
          <p className="text-xs text-muted-foreground">Shared with {partnerName}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 hover:bg-accent rounded-full transition-colors"
          aria-label="Add event"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <Card className="p-4 bg-gradient-to-r from-[#FB3094]/5 via-[#A83FFF]/5 to-[#2571FF]/5 border-[#A83FFF]/20">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#A83FFF] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Keep anniversaries, birthdays, trips, and important moments in one place. Push
              reminders go out 5 days, 3 days, and 1 day before, plus on the day.
            </p>
          </div>
        </Card>

        {selectedEvent && (
          <CalendarEventDetail
            event={selectedEvent}
            onClose={() => {
              setSelectedEventId(null);
              onClearHighlight?.();
            }}
          />
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-[image:var(--pulse-gradient)] text-white' : 'bg-accent'
            }`}
          >
            All
          </button>
          {CALENDAR_EVENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === t.id ? 'bg-[image:var(--pulse-gradient)] text-white' : 'bg-accent'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {showAddForm && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Add shared event</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {CALENDAR_EVENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      type === t.id ? 'border-[#A83FFF] bg-[#A83FFF]/10' : 'border-border'
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button type="submit" variant="gradient" className="w-full" disabled={saving}>
                {saving ? 'Adding…' : 'Add to calendar'}
              </Button>
            </form>
          </Card>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading calendar…</p>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="text-5xl">📅</div>
            <p className="text-muted-foreground">No events yet</p>
            <p className="text-sm text-muted-foreground">Tap + to add your first shared date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const meta = getCalendarTypeMeta(event.type);
              const days = daysUntilEvent(event.date, event.type);
              const daysLabel =
                days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`;

              return (
                <div
                  key={event.id}
                  ref={(el) => {
                    eventRefs.current[event.id] = el;
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedEventId(event.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedEventId(event.id)}
                >
                <Card
                  className={`p-4 cursor-pointer transition-all ${
                    selectedEventId === event.id
                      ? 'ring-2 ring-[#A83FFF] border-[#A83FFF]/50'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{meta.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(event.date), 'MMM d, yyyy')} · {daysLabel}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{meta.label}</p>
                        {event.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">{event.notes}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(event.id);
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10 flex-shrink-0"
                      aria-label="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
