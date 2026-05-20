import React, { useState } from 'react';
import { BottomSheet } from '@/app/components/BottomSheet';
import { Button } from '@/app/components/Button';
import {
  PARTNER_NEED_LEVELS,
  getPartnerNeedLevel,
  type PartnerNeedStatus,
} from '@/app/constants/partnerNeeds';

interface PartnerNeedsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: PartnerNeedStatus | null;
  onSave: (status: PartnerNeedStatus) => Promise<void>;
}

export function PartnerNeedsSheet({
  isOpen,
  onClose,
  currentStatus,
  onSave,
}: PartnerNeedsSheetProps) {
  const [selected, setSelected] = useState<PartnerNeedStatus>(currentStatus ?? 'great');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelected(currentStatus ?? 'great');
    }
  }, [isOpen, currentStatus]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } catch {
      alert('Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentLevel = getPartnerNeedLevel(selected);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="How are you feeling?">
      <div className="p-6 space-y-6 overflow-y-auto">
        <p className="text-sm text-muted-foreground">
          Let your partner know how you&apos;re doing today. This is lighter than Shark Mode — a gentle
          check-in they&apos;ll see on their home screen.
        </p>

        <div className="space-y-2">
          {PARTNER_NEED_LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => setSelected(level.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                selected === level.id
                  ? 'border-[#A83FFF] bg-[#A83FFF]/10'
                  : 'border-border hover:border-[#A83FFF]/40'
              }`}
            >
              <span className="text-2xl">{level.emoji}</span>
              <span className="font-medium">{level.label}</span>
            </button>
          ))}
        </div>

        {currentLevel && (
          <p className="text-xs text-muted-foreground text-center">
            {selected === 'great'
              ? 'Your partner won\'t see a special banner — you\'re all good.'
              : `Your partner may see: "…${currentLevel.partnerMessage} ❤️"`}
          </p>
        )}

        <Button variant="gradient" className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Share with partner'}
        </Button>
      </div>
    </BottomSheet>
  );
}
