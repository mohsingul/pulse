import React, { useState } from 'react';
import { BottomSheet } from '@/app/components/BottomSheet';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { Waves, Heart, Sparkles } from 'lucide-react';

interface SharkModeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (durationDays: number, note: string) => Promise<void>;
  isActive?: boolean;
  currentDuration?: number;
  currentNote?: string;
  onExtend?: (additionalDays: number) => Promise<void>;
  onDeactivate?: () => Promise<void>;
  onUpdateNote?: (note: string) => Promise<void>;
}

export function SharkModeSheet({
  isOpen,
  onClose,
  onActivate,
  isActive = false,
  currentDuration = 1,
  currentNote = '',
  onExtend,
  onDeactivate,
  onUpdateNote,
}: SharkModeSheetProps) {
  const [duration, setDuration] = useState(currentDuration || 1);
  const [note, setNote] = useState(currentNote || '');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
      const days = isCustomDuration ? parseInt(customDays) || 1 : duration;
      await onActivate(days, note);
      onClose();
    } catch (error) {
      console.error('Failed to activate Shark Mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (days: number) => {
    if (!onExtend) return;
    setLoading(true);
    try {
      await onExtend(days);
      onClose();
    } catch (error) {
      console.error('Failed to extend Shark Mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!onDeactivate) return;
    setLoading(true);
    try {
      await onDeactivate();
      onClose();
    } catch (error) {
      console.error('Failed to deactivate Shark Mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!onUpdateNote) return;
    setLoading(true);
    try {
      await onUpdateNote(note);
      onClose();
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isActive) {
    // Active state view
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="space-y-6 pb-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 flex items-center justify-center">
              <Waves className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold">Shark Mode Active 🦈</h2>
            <p className="text-muted-foreground text-sm">
              Your partner knows you might need a little extra care right now
            </p>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Private Note (only you can see)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Low energy today, extra hugs appreciated..."
              className="bg-accent/50"
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {onUpdateNote && (
              <Button
                onClick={handleUpdateNote}
                disabled={loading}
                className="w-full"
                variant="secondary"
              >
                {loading ? 'Updating...' : 'Update Note'}
              </Button>
            )}

            {onExtend && (
              <Button
                onClick={() => handleExtend(1)}
                disabled={loading}
                className="w-full"
                variant="secondary"
              >
                {loading ? 'Extending...' : 'Extend by 1 Day'}
              </Button>
            )}

            {onDeactivate && (
              <Button
                onClick={handleDeactivate}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? 'Ending...' : 'End Shark Mode'}
              </Button>
            )}
          </div>
        </div>
      </BottomSheet>
    );
  }

  // Activation view
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 flex items-center justify-center relative">
            <Waves className="w-10 h-10 text-purple-500" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center animate-pulse">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Shark Mode 🦈</h2>
          <p className="text-muted-foreground text-sm px-4">
            A gentle way to let your partner know you might need a little extra care, patience, and support
          </p>
        </div>

        {/* Duration Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Duration</label>
          
          {!isCustomDuration ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((days) => (
                <button
                  key={days}
                  onClick={() => setDuration(days)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    duration === days
                      ? 'border-[#A83FFF] bg-[#A83FFF]/10'
                      : 'border-border hover:border-border/50'
                  }`}
                >
                  <div className="text-2xl font-bold">{days}</div>
                  <div className="text-xs text-muted-foreground">
                    {days === 1 ? 'day' : 'days'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Input
              type="number"
              min="1"
              max="7"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="Enter days (1-7)"
              className="bg-accent"
            />
          )}

          <button
            onClick={() => setIsCustomDuration(!isCustomDuration)}
            className="text-sm text-[#A83FFF] hover:underline w-full text-center"
          >
            {isCustomDuration ? 'Choose preset duration' : 'Custom duration (up to 7 days)'}
          </button>
        </div>

        {/* Optional Note */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Note for your partner</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Low energy today, extra hugs appreciated..."
            className="bg-accent/50"
          />
          <p className="text-xs text-muted-foreground">
            Your partner will see this message
          </p>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
          <div className="flex items-start space-x-3">
            <Heart className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">What your partner will see:</p>
              <p>A gentle "Shark Mode" indicator with supportive suggestions. No details, no pressure—just awareness.</p>
            </div>
          </div>
        </div>

        {/* Activate Button */}
        <Button
          onClick={handleActivate}
          disabled={loading || (isCustomDuration && (!customDays || parseInt(customDays) < 1 || parseInt(customDays) > 7))}
          className="w-full"
        >
          {loading ? 'Activating...' : 'Activate Shark Mode'}
        </Button>
      </div>
    </BottomSheet>
  );
}