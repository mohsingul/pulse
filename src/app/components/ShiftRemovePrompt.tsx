import React from 'react';
import { Button } from '@/app/components/Button';
import { X } from 'lucide-react';

interface ShiftRemovePromptProps {
  open: boolean;
  dateLabel: string;
  saving?: boolean;
  onClose: () => void;
  onLabelHoliday: () => void;
  onRemoveCompletely: () => void;
}

export function ShiftRemovePrompt({
  open,
  dateLabel,
  saving,
  onClose,
  onLabelHoliday,
  onRemoveCompletely,
}: ShiftRemovePromptProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-background border border-border shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-remove-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="shift-remove-title" className="text-lg font-bold">
              Remove shift?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          This day is marked as on shift. Choose how you want to handle it on the shared calendar.
        </p>

        <div className="space-y-2">
          <Button
            variant="gradient"
            className="w-full"
            onClick={onLabelHoliday}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Label as holiday'}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={onRemoveCompletely}
            disabled={saving}
          >
            Remove shift completely
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
