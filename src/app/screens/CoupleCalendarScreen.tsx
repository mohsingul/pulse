import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { CoupleMonthGrid } from '@/app/components/CoupleMonthGrid';
import { CalendarDaySheet } from '@/app/components/CalendarDaySheet';
import {
  CalendarEventFormSheet,
  type CalendarSheetMode,
} from '@/app/components/CalendarEventFormSheet';
import { ArrowLeft, Plus, Trash2, CalendarDays, List, CheckSquare, Square } from 'lucide-react';
import { calendarAPI } from '@/utils/api';
import {
  CALENDAR_EVENT_TYPES,
  getCalendarTypeMeta,
  getEventsOnDate,
  getPaletteColor,
  getUserCalendarHex,
  daysUntilEvent,
  dateRangeFromKeys,
  isMultiDayEvent,
  isOvertimeDay,
  mergeColorMap,
  parseDateKey,
  formatEventTime,
  toDateKey,
  type CalendarColorMap,
  type CalendarEventType,
  type CalendarEventItem,
  type OvertimeMap,
  type ShiftPatternMap,
} from '@/app/constants/calendar';
import { format } from 'date-fns';

type CalendarTab = 'month' | 'agenda';

interface CoupleCalendarScreenProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  highlightEventId?: string | null;
  onBack: () => void;
  onClearHighlight?: () => void;
}

export function CoupleCalendarScreen({
  coupleId,
  userId,
  user1Id,
  user2Id,
  userName,
  partnerName,
  highlightEventId,
  onBack,
  onClearHighlight,
}: CoupleCalendarScreenProps) {
  const partnerUserId = userId === user1Id ? user2Id : user1Id;

  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [colorMap, setColorMap] = useState<CalendarColorMap>(() =>
    mergeColorMap(user1Id, user2Id, null),
  );
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPatternMap>({});
  const [overtimeDays, setOvertimeDays] = useState<OvertimeMap>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CalendarTab>('month');
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(toDateKey(new Date()));
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [multiSelectedKeys, setMultiSelectedKeys] = useState<string[]>([]);
  const [formEndDate, setFormEndDate] = useState<string | undefined>();
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [overtimeSaving, setOvertimeSaving] = useState(false);
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
      if (response.colors) {
        setColorMap(mergeColorMap(user1Id, user2Id, response.colors));
      }
      if (response.shiftPatterns) setShiftPatterns(response.shiftPatterns);
      if (response.overtimeDays) setOvertimeDays(response.overtimeDays);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  }, [coupleId, user1Id, user2Id]);

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
    return getEventsOnDate(events, parseDateKey(selectedDateKey));
  }, [events, selectedDateKey]);

  const handleDayPress = (dateKey: string) => {
    if (multiSelectMode) {
      setMultiSelectedKeys((prev) => {
        const set = new Set(prev);
        if (set.has(dateKey)) set.delete(dateKey);
        else set.add(dateKey);
        return [...set].sort();
      });
      return;
    }
    setSelectedDateKey(dateKey);
    setDaySheetOpen(true);
  };

  const openAdd = (dateKey?: string, endDate?: string) => {
    setDaySheetOpen(false);
    setSheetEvent(null);
    setSheetMode('add');
    setSheetOpen(true);
    if (dateKey) setSelectedDateKey(dateKey);
    setFormEndDate(endDate);
  };

  const openAddFromMultiSelect = () => {
    const range = dateRangeFromKeys(multiSelectedKeys);
    if (!range) return;
    openAdd(range.start, range.end !== range.start ? range.end : undefined);
  };

  const exitMultiSelect = () => {
    setMultiSelectMode(false);
    setMultiSelectedKeys([]);
  };

  const handleToggleOvertime = async () => {
    if (!selectedDateKey) return;
    setOvertimeSaving(true);
    try {
      const res = await calendarAPI.toggleOvertime(coupleId, userId, selectedDateKey);
      if (res.overtimeDays) setOvertimeDays(res.overtimeDays);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update shift');
    } finally {
      setOvertimeSaving(false);
    }
  };

  const openView = (event: CalendarEventItem) => {
    setDaySheetOpen(false);
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
    endDate?: string;
    time?: string;
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
      exitMultiSelect();
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

      <div className="flex items-center justify-center gap-4 py-2 text-xs font-medium flex-shrink-0 px-4">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: getPaletteColor(colorMap[userId]) }}
          />
          You
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: getPaletteColor(colorMap[partnerUserId]) }}
          />
          {partnerName.split(' ')[0]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4">
        {tab === 'month' && (
          <>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading calendar…</p>
            ) : (
              <>
              <Card className="p-3 sm:p-4">
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={multiSelectMode ? 'gradient' : 'secondary'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      if (multiSelectMode) exitMultiSelect();
                      else {
                        setMultiSelectMode(true);
                        setDaySheetOpen(false);
                      }
                    }}
                  >
                    {multiSelectMode ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 mr-1 inline" />
                        Done selecting
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 mr-1 inline" />
                        Select multiple days
                      </>
                    )}
                  </Button>
                </div>
                {multiSelectMode && (
                  <p className="text-xs text-center text-muted-foreground mb-2">
                    Tap days to select, then add one event across all selected dates
                  </p>
                )}
                <CoupleMonthGrid
                  viewMonth={viewMonth}
                  onViewMonthChange={setViewMonth}
                  events={events}
                  currentUserId={userId}
                  colorMap={colorMap}
                  shiftPatterns={shiftPatterns}
                  overtimeDays={overtimeDays}
                  user1Id={user1Id}
                  user2Id={user2Id}
                  multiSelectMode={multiSelectMode}
                  selectedDateKey={selectedDateKey}
                  selectedDateKeys={multiSelectedKeys}
                  onDayPress={handleDayPress}
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
                      if (multiSelectMode) {
                        setMultiSelectedKeys([today]);
                      } else {
                        handleDayPress(today);
                      }
                    }}
                  >
                    Today
                  </Button>
                  {!multiSelectMode && (
                    <Button
                      variant="gradient"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => openAdd(selectedDateKey ?? toDateKey(new Date()))}
                    >
                      Add event
                    </Button>
                  )}
                </div>
              </Card>
              {multiSelectMode && multiSelectedKeys.length > 0 && (
                <Card className="p-3 flex flex-col gap-2 sticky bottom-2 z-10 shadow-lg border-[#A83FFF]/30">
                  <p className="text-sm font-semibold text-center">
                    {multiSelectedKeys.length} day{multiSelectedKeys.length === 1 ? '' : 's'} selected
                  </p>
                  <Button variant="gradient" size="sm" onClick={openAddFromMultiSelect}>
                    Add event for selected days
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setMultiSelectedKeys([])}>
                    Clear selection
                  </Button>
                </Card>
              )}
              </>
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
                  const hex = getUserCalendarHex(event.createdBy, colorMap, userId);
                  const isSelf = !event.createdBy || event.createdBy === userId;
                  const timeLabel = formatEventTime(event.time);

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
                        style={{ borderLeftColor: hex }}
                        onClick={() => openView(event)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3 min-w-0 flex-1">
                            <span className="text-2xl flex-shrink-0">{meta.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {isMultiDayEvent(event)
                                  ? `${format(parseDateKey(event.date), 'MMM d')} – ${format(parseDateKey(event.endDate!), 'MMM d, yyyy')}`
                                  : format(parseDateKey(event.date), 'MMM d, yyyy')}
                                {timeLabel ? ` · ${timeLabel}` : ''} · {daysLabel}
                              </p>
                              <p className="text-xs font-medium mt-0.5" style={{ color: hex }}>
                                {isSelf ? 'You' : partnerName}
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

      {selectedDateKey && (
        <CalendarDaySheet
          open={daySheetOpen}
          dateKey={selectedDateKey}
          events={selectedDayEvents}
          currentUserId={userId}
          userName={userName}
          partnerName={partnerName}
          colorMap={colorMap}
          shiftPatterns={shiftPatterns}
          overtimeDays={overtimeDays}
          user1Id={user1Id}
          user2Id={user2Id}
          isMyOvertime={Boolean(selectedDateKey && isOvertimeDay(overtimeDays, userId, parseDateKey(selectedDateKey)))}
          onClose={() => setDaySheetOpen(false)}
          onAdd={() => openAdd(selectedDateKey)}
          onEventClick={openView}
          onToggleOvertime={handleToggleOvertime}
          overtimeSaving={overtimeSaving}
        />
      )}

      <CalendarEventFormSheet
        open={sheetOpen}
        mode={sheetMode}
        event={sheetEvent}
        initialDate={selectedDateKey ?? toDateKey(new Date())}
        initialEndDate={formEndDate}
        currentUserId={userId}
        userName={userName}
        partnerName={partnerName}
        colorMap={colorMap}
        saving={saving}
        onClose={closeSheet}
        onSave={handleSave}
        onDelete={handleDelete}
        onStartEdit={() => setSheetMode('edit')}
      />
    </div>
  );
}
