import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { CoupleMonthGrid } from '@/app/components/CoupleMonthGrid';
import {
  CalendarEventFormSheet,
  type CalendarSheetMode,
} from '@/app/components/CalendarEventFormSheet';
import { ArrowLeft, Plus, Trash2, CalendarDays, List } from 'lucide-react';
import { calendarAPI } from '@/utils/api';
import {
  CALENDAR_OWNER_COLORS,
  CALENDAR_EVENT_TYPES,
  getCalendarTypeMeta,
  getEventOwnerKey,
  getEventsOnDate,
  daysUntilEvent,
  toDateKey,
  type CalendarEventType,
  type CalendarEventItem,
} from '@/app/constants/calendar';
import { format, parseISO } from 'date-fns';

type CalendarTab = 'month' | 'agenda';

interface CoupleCalendarScreenProps {
  coupleId: string;
  userId: string;
  userName: string;
  partnerName: string;
  highlightEventId?: string | null;
  onBack: () => void;
  onClearHighlight?: () => void;
}

export function CoupleCalendarScreen({
  coupleId,
  userId,
  userName,
  partnerName,
  highlightEventId,
  onBack,
  onClearHighlight,
}: CoupleCalendarScreenProps) {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CalendarTab>('month');
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(toDateKey(new Date()));
  const [filter, setFilter] = useState<CalendarEventType | 'all'>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<CalendarSheetMode>('add');
  const [sheetEvent, setSheetEvent] = useState<CalendarEventItem | null>(null);
  const [saving, setSaving] = useState(false);
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchEvents = useCallback(async () => {
    try {
      const response = await calendarAPI.get(coupleId);
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!highlightEventId || events.length === 0) return;
    const ev = events.find((e) => e.id === highlightEventId);
    if (!ev) return;
    setTab('agenda');
    const [y, m] = ev.date.split('-').map(Number);
    setViewMonth(new Date(y, m - 1, 1));
    setSelectedDateKey(ev.date);
    setSheetEvent(ev);
    setSheetMode('view');
    setSheetOpen(true);
    setTimeout(() => {
      eventRefs.current[highlightEventId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }, [highlightEventId, events]);

  const filteredEvents = useMemo(() => {
    const list = filter === 'all' ? events : events.filter((e) => e.type === filter);
    return [...list].sort((a, b) => daysUntilEvent(a.date, a.type) - daysUntilEvent(b.date, b.type));
  }, [events, filter]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDateKey) return [];
    const day = parseISO(selectedDateKey);
    return getEventsOnDate(events, day);
  }, [events, selectedDateKey]);

  const openAdd = (dateKey?: string) => {
    setSheetEvent(null);
    setSheetMode('add');
    setSheetOpen(true);
    if (dateKey) setSelectedDateKey(dateKey);
  };

  const openView = (event: CalendarEventItem) => {
    setSheetEvent(event);
    setSheetMode('view');
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSheetEvent(null);
    onClearHighlight?.();
  };

  const handleSave = async (data: {
    type: CalendarEventType;
    title: string;
    date: string;
    notes?: string;
  }) => {
    setSaving(true);
    try {
      if (sheetMode === 'edit' && sheetEvent) {
        await calendarAPI.update(coupleId, sheetEvent.id, userId, data);
      } else {
        await calendarAPI.create(coupleId, userId, data);
      }
      await fetchEvents();
      setSelectedDateKey(data.date);
      const [y, m] = data.date.split('-').map(Number);
      setViewMonth(new Date(y, m - 1, 1));
      closeSheet();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = sheetEvent?.id;
    if (!id) return;
    if (!confirm('Remove this event from your shared calendar?')) return;
    setSaving(true);
    try {
      await calendarAPI.delete(coupleId, id, userId);
      await fetchEvents();
      closeSheet();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setSaving(false);
    }
  };

  const handleAgendaDelete = async (eventId: string) => {
    if (!confirm('Remove this event from your shared calendar?')) return;
    try {
      await calendarAPI.delete(coupleId, eventId, userId);
      await fetchEvents();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-border safe-top flex-shrink-0 gap-2">
        <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold truncate">Couple Calendar</h1>
          <p className="text-xs text-muted-foreground truncate">Shared with {partnerName}</p>
        </div>
        <button
          onClick={() => openAdd(selectedDateKey ?? toDateKey(new Date()))}
          className="p-2 hover:bg-accent rounded-full transition-colors flex-shrink-0"
          aria-label="Add event"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex px-4 sm:px-6 pt-3 gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setTab('month')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            tab === 'month' ? 'bg-[image:var(--pulse-gradient)] text-white shadow-md' : 'bg-accent'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Month
        </button>
        <button
          type="button"
          onClick={() => setTab('agenda')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            tab === 'agenda' ? 'bg-[image:var(--pulse-gradient)] text-white shadow-md' : 'bg-accent'
          }`}
        >
          <List className="w-4 h-4" />
          Agenda
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 py-2 text-xs font-medium flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${CALENDAR_OWNER_COLORS.self.dot}`} />
          <span className={CALENDAR_OWNER_COLORS.self.text}>You</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${CALENDAR_OWNER_COLORS.partner.dot}`} />
          <span className={CALENDAR_OWNER_COLORS.partner.text}>{partnerName}</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4">
        {tab === 'month' && (
          <>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading calendar…</p>
            ) : (
              <Card className="p-3 sm:p-4">
                <CoupleMonthGrid
                  viewMonth={viewMonth}
                  onViewMonthChange={setViewMonth}
                  events={events}
                  currentUserId={userId}
                  selectedDateKey={selectedDateKey}
                  onSelectDate={setSelectedDateKey}
                />
                <div className="mt-3 pt-3 border-t border-border flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      const today = toDateKey(new Date());
                      setSelectedDateKey(today);
                      setViewMonth(new Date());
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => openAdd(selectedDateKey ?? toDateKey(new Date()))}
                  >
                    Add on this day
                  </Button>
                </div>
              </Card>
            )}

            {selectedDateKey && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {format(parseISO(selectedDateKey), 'EEEE, MMMM d')}
                </h3>
                {selectedDayEvents.length === 0 ? (
                  <Card className="p-4 text-center text-sm text-muted-foreground">
                    No events this day — tap + to add one
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((event) => {
                      const meta = getCalendarTypeMeta(event.type);
                      const owner = getEventOwnerKey(event.createdBy, userId);
                      const colors = CALENDAR_OWNER_COLORS[owner];
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => openView(event)}
                          className={`w-full text-left rounded-2xl border-l-4 p-4 transition-all active:scale-[0.99] ${colors.soft} border-l-current`}
                          style={{ borderLeftColor: owner === 'self' ? '#FB3094' : '#2571FF' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{meta.emoji}</span>
                            <p className="font-semibold flex-1 truncate">{event.title}</p>
                            <span className={`text-[10px] font-bold uppercase ${colors.text}`}>
                              {owner === 'self' ? 'You' : partnerName.split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{meta.label}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {tab === 'agenda' && (
          <>
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

            {loading ? (
              <p className="text-center text-muted-foreground py-12">Loading…</p>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="text-5xl">📅</div>
                <p className="text-muted-foreground">No events yet</p>
                <Button variant="gradient" onClick={() => openAdd()}>
                  Add your first event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const meta = getCalendarTypeMeta(event.type);
                  const days = daysUntilEvent(event.date, event.type);
                  const daysLabel =
                    days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days < 0 ? 'Past' : `In ${days} days`;
                  const owner = getEventOwnerKey(event.createdBy, userId);
                  const colors = CALENDAR_OWNER_COLORS[owner];

                  return (
                    <div
                      key={event.id}
                      ref={(el) => {
                        eventRefs.current[event.id] = el;
                      }}
                    >
                      <Card
                        className={`p-4 cursor-pointer transition-all active:scale-[0.99] border-l-4 ${
                          highlightEventId === event.id ? 'ring-2 ring-[#A83FFF]' : ''
                        }`}
                        style={{ borderLeftColor: owner === 'self' ? '#FB3094' : '#2571FF' }}
                        onClick={() => openView(event)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3 min-w-0 flex-1">
                            <span className="text-2xl flex-shrink-0">{meta.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(event.date), 'MMM d, yyyy')} · {daysLabel}
                              </p>
                              <p className={`text-xs font-medium mt-0.5 ${colors.text}`}>
                                {owner === 'self' ? 'You' : partnerName}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAgendaDelete(event.id);
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
          </>
        )}
      </div>

      <CalendarEventFormSheet
        open={sheetOpen}
        mode={sheetMode}
        event={sheetEvent}
        initialDate={selectedDateKey ?? toDateKey(new Date())}
        currentUserId={userId}
        userName={userName}
        partnerName={partnerName}
        saving={saving}
        onClose={closeSheet}
        onSave={handleSave}
        onDelete={handleDelete}
        onStartEdit={() => setSheetMode('edit')}
      />
    </div>
  );
}
