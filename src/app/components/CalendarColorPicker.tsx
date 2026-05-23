import React, { useState } from 'react';
import { Palette, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CALENDAR_COLOR_PALETTE,
  getPaletteColor,
  type CalendarColorId,
  type CalendarColorMap,
} from '@/app/constants/calendar';

interface CalendarColorPickerProps {
  currentUserId: string;
  partnerUserId: string;
  userName: string;
  partnerName: string;
  colorMap: CalendarColorMap;
  saving: boolean;
  onSelectColor: (colorId: CalendarColorId) => void;
}

export function CalendarColorPicker({
  currentUserId,
  partnerUserId,
  userName,
  partnerName,
  colorMap,
  saving,
  onSelectColor,
}: CalendarColorPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const myColorId = colorMap[currentUserId];
  const partnerColorId = colorMap[partnerUserId];

  return (
    <div className="px-4 sm:px-6 pb-2 flex-shrink-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-accent/50 text-sm font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          Calendar colors
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 p-3 rounded-xl border border-border bg-card animate-in fade-in duration-200">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Your color · {userName}</p>
            <div className="flex flex-wrap gap-2">
              {CALENDAR_COLOR_PALETTE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={saving}
                  onClick={() => onSelectColor(c.id)}
                  className={`w-9 h-9 rounded-full border-2 transition-all active:scale-95 ${
                    myColorId === c.id ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                  aria-label={`${c.label}${myColorId === c.id ? ' selected' : ''}`}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {partnerName}&apos;s color
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-full border-2 border-border flex-shrink-0"
                style={{ backgroundColor: getPaletteColor(partnerColorId) }}
              />
              <p className="text-xs text-muted-foreground">
                Only {partnerName.split(' ')[0]} can change their color on their phone
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 pt-1 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getPaletteColor(myColorId) }}
              />
              You
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getPaletteColor(partnerColorId) }}
              />
              {partnerName.split(' ')[0]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
