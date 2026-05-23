import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { calendarAPI } from '@/utils/api';
import {
  CALENDAR_COLOR_PALETTE,
  getPaletteColor,
  isShiftOnDay,
  mergeColorMap,
  parseDateKey,
  toDateKey,
  type CalendarColorId,
  type CalendarColorMap,
  type ShiftPattern,
  type ShiftPatternMap,
} from '@/app/constants/calendar';
import { addDays, format } from 'date-fns';
import { Check, Loader2 } from 'lucide-react';

interface CalendarSettingsPanelProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
}

export function CalendarSettingsPanel({
  coupleId,
  userId,
  user1Id,
  user2Id,
  userName,
  partnerName,
}: CalendarSettingsPanelProps) {
  const partnerUserId = userId === user1Id ? user2Id : user1Id;

  const [colorMap, setColorMap] = useState<CalendarColorMap>(() =>
    mergeColorMap(user1Id, user2Id, null),
  );
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPatternMap>({});
  const [myColorId, setMyColorId] = useState<CalendarColorId>('rose');
  const [loading, setLoading] = useState(true);
  const [colorSaving, setColorSaving] = useState(false);
  const [shiftSaving, setShiftSaving] = useState(false);
  const [colorSaved, setColorSaved] = useState(false);
  const [shiftSaved, setShiftSaved] = useState(false);

  const myShift = shiftPatterns[userId];
  const [shiftStart, setShiftStart] = useState(toDateKey(new Date()));
  const [daysOn, setDaysOn] = useState(4);
  const [daysOff, setDaysOff] = useState(4);

  const loadPrefs = useCallback(async () => {
    try {
      const data = await calendarAPI.get(coupleId);
      const merged = mergeColorMap(user1Id, user2Id, data.colors);
      setColorMap(merged);
      setMyColorId(merged[userId] ?? 'rose');
      setShiftPatterns(data.shiftPatterns ?? {});
      const mine = data.shiftPatterns?.[userId];
      if (mine) {
        setShiftStart(mine.startDate);
        setDaysOn(mine.daysOn);
        setDaysOff(mine.daysOff);
      }
    } catch (e) {
      console.error('[CalendarSettings] load failed', e);
    } finally {
      setLoading(false);
    }
  }, [coupleId, user1Id, user2Id, userId]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const previewDays = useMemo(() => {
    const pattern: ShiftPattern = { startDate: shiftStart, daysOn, daysOff };
    const start = parseDateKey(shiftStart);
    return Array.from({ length: 14 }, (_, i) => {
      const day = addDays(start, i);
      return { key: toDateKey(day), label: format(day, 'EEE d'), on: isShiftOnDay(pattern, day) };
    });
  }, [shiftStart, daysOn, daysOff]);

  const handleColorSelect = async (colorId: CalendarColorId) => {
    setMyColorId(colorId);
    setColorMap((prev) => ({ ...prev, [userId]: colorId }));
    setColorSaving(true);
    setColorSaved(false);
    try {
      const res = await calendarAPI.setColor(coupleId, userId, colorId);
      if (res.colors) {
        const merged = mergeColorMap(user1Id, user2Id, res.colors);
        setColorMap(merged);
        setMyColorId(merged[userId]);
      }
      setColorSaved(true);
      setTimeout(() => setColorSaved(false), 2000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not save color');
      await loadPrefs();
    } finally {
      setColorSaving(false);
    }
  };

  const handleSaveShift = async () => {
    setShiftSaving(true);
    setShiftSaved(false);
    try {
      const res = await calendarAPI.setShift(coupleId, userId, {
        startDate: shiftStart,
        daysOn,
        daysOff,
      });
      if (res.shiftPatterns) setShiftPatterns(res.shiftPatterns);
      setShiftSaved(true);
      setTimeout(() => setShiftSaved(false), 2000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not save shift pattern');
    } finally {
      setShiftSaving(false);
    }
  };

  const handleClearShift = async () => {
    if (!confirm('Remove your shift pattern from the shared calendar?')) return;
    setShiftSaving(true);
    try {
      const res = await calendarAPI.clearShift(coupleId, userId);
      if (res.shiftPatterns) setShiftPatterns(res.shiftPatterns);
      setShiftStart(toDateKey(new Date()));
      setDaysOn(4);
      setDaysOff(4);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not clear shift');
    } finally {
      setShiftSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#A83FFF]" />
      </Card>
    );
  }

  const partnerColorId = colorMap[partnerUserId];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Your calendar color</h3>
        <p className="text-sm text-muted-foreground">
          Events you add appear in this color for both of you.
        </p>
        <Card className="p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground">Tap to select · {userName}</p>
          <div className="flex flex-wrap gap-3">
            {CALENDAR_COLOR_PALETTE.map((c) => {
              const selected = myColorId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={colorSaving}
                  onClick={() => handleColorSelect(c.id)}
                  className={`relative w-11 h-11 rounded-full border-2 transition-all active:scale-95 disabled:opacity-60 ${
                    selected ? 'border-foreground ring-2 ring-offset-2 ring-foreground/30 scale-110' : 'border-border'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.label}
                  aria-pressed={selected}
                >
                  {selected && (
                    <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getPaletteColor(myColorId) }} />
              You
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getPaletteColor(partnerColorId) }}
              />
              {partnerName.split(' ')[0]}
            </span>
            {colorSaving && <span className="text-muted-foreground">Saving…</span>}
            {colorSaved && !colorSaving && <span className="text-green-600 font-medium">Saved</span>}
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Work shift pattern</h3>
        <p className="text-sm text-muted-foreground">
          Show your {daysOn}-on / {daysOff}-off schedule on the shared calendar for the next year. Your
          partner sees when you&apos;re on shift.
        </p>
        <Card className="p-4 space-y-4">
          <Input
            label="First day on shift"
            type="date"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Days on"
              type="number"
              min={1}
              max={14}
              value={daysOn}
              onChange={(e) => setDaysOn(Math.max(1, Math.min(14, Number(e.target.value) || 4)))}
            />
            <Input
              label="Days off"
              type="number"
              min={1}
              max={14}
              value={daysOff}
              onChange={(e) => setDaysOff(Math.max(1, Math.min(14, Number(e.target.value) || 4)))}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Preview (next 2 weeks)</p>
            <div className="flex flex-wrap gap-1">
              {previewDays.map((d) => (
                <span
                  key={d.key}
                  className={`text-[10px] px-2 py-1 rounded-md font-medium ${
                    d.on ? 'text-white' : 'bg-accent text-muted-foreground'
                  }`}
                  style={d.on ? { backgroundColor: getPaletteColor(myColorId) } : undefined}
                >
                  {d.label}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Highlighted = on shift · Shown for 12 months from start date
            </p>
          </div>

          {myShift && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              Pattern active on shared calendar
            </p>
          )}

          <Button variant="gradient" className="w-full" onClick={handleSaveShift} disabled={shiftSaving}>
            {shiftSaving ? 'Saving…' : myShift ? 'Update shift pattern' : 'Save shift pattern'}
          </Button>
          {myShift && (
            <Button variant="ghost" className="w-full text-destructive" onClick={handleClearShift} disabled={shiftSaving}>
              Remove my shift pattern
            </Button>
          )}
          {shiftSaved && !shiftSaving && (
            <p className="text-center text-xs text-green-600 font-medium">Shift pattern saved</p>
          )}
        </Card>
      </div>
    </div>
  );
}
