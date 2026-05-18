import React from 'react';
import { Card } from '@/app/components/Card';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function PartnerPulseWidget({
  partnerName,
  mood,
  intensity,
  updatedAt,
  onReact,
}: {
  partnerName: string;
  mood?: string | null;
  intensity?: string | null;
  updatedAt?: string | null;
  onReact?: (emoji: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Partner Pulse</p>
          <h4 className="text-lg font-semibold">{partnerName}</h4>
        </div>
        <div className="text-4xl">{mood || '—'}</div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {intensity ? `Intensity: ${intensity}` : 'No intensity'}
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{updatedAt ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true }) : '—'}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => onReact?.('❤️')} className="px-3 py-1 rounded-full bg-white/10">❤️</button>
        <button onClick={() => onReact?.('🫶')} className="px-3 py-1 rounded-full bg-white/10">🫶</button>
        <button onClick={() => onReact?.('😘')} className="px-3 py-1 rounded-full bg-white/10">😘</button>
      </div>
    </Card>
  );
}
