import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Phone, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/Button';
import {
  getPartnerStatusMeta,
  getEnergyDisplay,
  getEnergyLabel,
  getStressDisplay,
  getAffectionDisplay,
  getCommunicationDisplay,
  STATUS_SUGGESTIONS,
  type PartnerStatusData,
} from '@/app/constants/partnerStatus';

interface PartnerStatusHomeCardProps {
  partnerName: string;
  status: PartnerStatusData;
  onSendLove: () => void;
  onThinkingOfYou: () => void;
  onCall: () => void;
  onSuggestionAction: (action: string) => void;
}

export function PartnerStatusHomeCard({
  partnerName,
  status,
  onSendLove,
  onThinkingOfYou,
  onCall,
  onSuggestionAction,
}: PartnerStatusHomeCardProps) {
  const meta = getPartnerStatusMeta(status.statusId);
  if (!meta) return null;

  const suggestions = STATUS_SUGGESTIONS[status.statusId] ?? [];
  const updatedAgo = status.updatedAt
    ? formatDistanceToNow(new Date(status.updatedAt), { addSuffix: true })
    : 'recently';

  return (
    <div
      className={`rounded-3xl border-2 p-5 shadow-lg bg-gradient-to-br ${meta.cardClass}`}
      style={{ borderColor: `${meta.accentColor}55` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-[#FB3094]" fill="#FB3094" />
        <h3 className="font-bold text-lg">{partnerName}&apos;s Status</h3>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <span className="text-4xl">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-semibold">{meta.label}</p>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">
            {meta.homeMessage(partnerName)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div className="bg-background/60 dark:bg-black/20 rounded-xl px-3 py-2">
          <span className="text-muted-foreground">Energy</span>
          <p className="font-medium">
            {getEnergyDisplay(status.energy)} {getEnergyLabel(status.energy)}
          </p>
        </div>
        <div className="bg-background/60 dark:bg-black/20 rounded-xl px-3 py-2">
          <span className="text-muted-foreground">Stress</span>
          <p className="font-medium">{getStressDisplay(status.stress)}</p>
        </div>
        {status.affection && (
          <div className="bg-background/60 dark:bg-black/20 rounded-xl px-3 py-2">
            <span className="text-muted-foreground">Affection</span>
            <p className="font-medium">{getAffectionDisplay(status.affection)}</p>
          </div>
        )}
        {status.communication && (
          <div className="bg-background/60 dark:bg-black/20 rounded-xl px-3 py-2">
            <span className="text-muted-foreground">Communication</span>
            <p className="font-medium">{getCommunicationDisplay(status.communication)}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">Updated {updatedAgo}</p>

      <div className="flex gap-2 mb-4">
        <Button variant="gradient" size="sm" className="flex-1" onClick={onSendLove}>
          <Heart className="w-4 h-4 mr-1" />
          Send Love
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={onThinkingOfYou}>
          <Sparkles className="w-4 h-4 mr-1" />
          Thinking Of You
        </Button>
        <Button variant="secondary" size="sm" className="px-3" onClick={onCall} aria-label="Call">
          <Phone className="w-4 h-4" />
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Suggested actions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onSuggestionAction(s.action)}
                className="px-3 py-2 rounded-full bg-background/80 dark:bg-black/30 text-sm font-medium hover:bg-accent transition-colors"
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
