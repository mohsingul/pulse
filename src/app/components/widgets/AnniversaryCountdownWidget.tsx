import React from 'react';
import { Card } from '@/app/components/Card';

function daysUntil(dateIso?: string | null) {
  if (!dateIso) return null;
  try {
    const now = new Date();
    const d = new Date(dateIso);
    // Set to next occurrence of month/day
    const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    let target = thisYear;
    if (target.getTime() < now.getTime()) {
      target = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
    }
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
}

export function AnniversaryCountdownWidget({ anniversaryDate }: { anniversaryDate?: string | null }) {
  const days = daysUntil(anniversaryDate);

  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">Anniversary</p>
      {days == null ? (
        <div className="text-sm text-muted-foreground">Set an anniversary in Settings</div>
      ) : days === 0 ? (
        <h4 className="text-lg font-semibold">Happy Anniversary 🎉</h4>
      ) : (
        <div>
          <h4 className="text-xl font-semibold">{days} day{days > 1 ? 's' : ''}</h4>
          <p className="text-sm text-muted-foreground">until your anniversary</p>
        </div>
      )}
    </Card>
  );
}
