import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { calendarAPI } from '@/utils/api';
import {
  CALENDAR_COLOR_PALETTE,
  getPaletteColor,
  getShiftCyclePhase,
  migrateShiftPatternMap,
  mergeColorMap,
  parseDateKey,
  SHIFT_DAYS_DAY,
  SHIFT_DAYS_NIGHT,
  SHIFT_DAYS_OFF,
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

  const loadPrefs = useCallback(async () => {
    try {
      const data = await calendarAPI.get(coupleId);
      const merged = mergeColorMap(user1Id, user2Id, data.colors);
      setColorMap(merged);
      setMyColorId(merged[userId] ?? 'rose');
      setShiftPatterns(migrateShiftPatternMap(data.shiftPatterns));
      const mine = data.shiftPatterns?.[userId];
      if (mine?.startDate) {
        setShiftStart(mine.startDate);
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
    const pattern: ShiftPattern = {
      startDate: shiftStart,
      daysDay: SHIFT_DAYS_DAY,
      daysOff: SHIFT_DAYS_OFF,
      daysNight: SHIFT_DAYS_NIGHT,
      daysOffAfterNight: SHIFT_DAYS_OFF,
    };
    const start = parseDateKey(shiftStart);
    return Array.from({ length: 28 }, (_, i) => {
      const day = addDays(start, i);
      const phase = getShiftCyclePhase(pattern, day);
      return {
        key: toDateKey(day),
        label: format(day, 'EEE d'),
        phase,
      };
    });
  }, [shiftStart]);

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
        daysDay: SHIFT_DAYS_DAY,
        daysOff: SHIFT_DAYS_OFF,
        daysNight: SHIFT_DAYS_NIGHT,
        daysOffAfterNight: SHIFT_DAYS_OFF,
      });
      if (res.shiftPatterns) setShiftPatterns(migrateShiftPatternMap(res.shiftPatterns));
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
      if (res.shiftPatterns) setShiftPatterns(migrateShiftPatternMap(res.shiftPatterns));
      setShiftStart(toDateKey(new Date()));
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
          Repeating cycle: <strong>4 days</strong> ☀️ → <strong>4 off</strong> → <strong>4 nights</strong> 🌙 →{' '}
          <strong>4 off</strong>, then repeats. Shown on the shared calendar for one year from your start date.
        </p>
        <Card className="p-4 space-y-4">
          <Input
            label="First day of your 4 day shifts (☀️ — first yellow day in your roster)"
            type="date"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
          />

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Preview (4 weeks)</p>
            <div className="flex flex-wrap gap-1">
              {previewDays.map((d) => {
                const tint =
                  d.phase === 'day'
                    ? 'bg-amber-100 text-amber-950 border border-amber-200'
                    : d.phase === 'night'
                      ? 'bg-blue-500 text-white border border-blue-600'
                      : 'bg-accent text-muted-foreground border border-transparent';
                return (
                  <span
                    key={d.key}
                    className={`text-[10px] px-2 py-1 rounded-md font-medium min-w-[2.5rem] text-center ${tint}`}
                  >
                    {d.phase === 'night' ? '🌙 ' : d.phase === 'day' ? '☀️ ' : ''}
                    {d.label}
                  </span>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              ☀️ day · blank = off · 🌙 night
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
