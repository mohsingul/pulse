import React, { useState } from 'react';
import { BottomSheet } from '@/app/components/BottomSheet';
import { Button } from '@/app/components/Button';
import {
  PARTNER_STATUSES,
  ENERGY_LEVELS,
  STRESS_LEVELS,
  AFFECTION_LEVELS,
  COMMUNICATION_MOODS,
  DEFAULT_STATUS_INDICATORS,
  getPartnerStatusMeta,
  type PartnerStatusData,
  type PartnerStatusId,
} from '@/app/constants/partnerStatus';

interface PartnerStatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: PartnerStatusData | null;
  onSave: (data: Omit<PartnerStatusData, 'updatedAt'>) => Promise<void>;
}

export function PartnerStatusSheet({
  isOpen,
  onClose,
  currentStatus,
  onSave,
}: PartnerStatusSheetProps) {
  const [statusId, setStatusId] = useState<PartnerStatusId>(currentStatus?.statusId ?? 'great');
  const [energy, setEnergy] = useState(currentStatus?.energy ?? DEFAULT_STATUS_INDICATORS.energy);
  const [stress, setStress] = useState(currentStatus?.stress ?? DEFAULT_STATUS_INDICATORS.stress);
  const [affection, setAffection] = useState(currentStatus?.affection ?? DEFAULT_STATUS_INDICATORS.affection);
  const [communication, setCommunication] = useState(
    currentStatus?.communication ?? DEFAULT_STATUS_INDICATORS.communication,
  );
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setStatusId(currentStatus?.statusId ?? 'great');
      setEnergy(currentStatus?.energy ?? DEFAULT_STATUS_INDICATORS.energy);
      setStress(currentStatus?.stress ?? DEFAULT_STATUS_INDICATORS.stress);
      setAffection(currentStatus?.affection ?? DEFAULT_STATUS_INDICATORS.affection);
      setCommunication(currentStatus?.communication ?? DEFAULT_STATUS_INDICATORS.communication);
      setShowDetails(false);
    }
  }, [isOpen, currentStatus]);

  const handleQuickSave = async () => {
    setSaving(true);
    try {
      await onSave({
        statusId,
        energy,
        stress,
        affection,
        communication,
      });
      onClose();
    } catch {
      alert('Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const preview = getPartnerStatusMeta(statusId);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="❤️ Partner Status">
      <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
        <p className="text-sm text-muted-foreground">
          A quick emotional check-in for your partner — update in under 3 seconds, or add optional
          details below.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {PARTNER_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusId(s.id)}
              className={`flex flex-col items-start p-3 rounded-2xl border-2 text-left transition-all ${
                statusId === s.id
                  ? 'border-[#A83FFF] bg-[#A83FFF]/10 shadow-md'
                  : 'border-border hover:border-[#A83FFF]/30'
              }`}
            >
              <span className="text-2xl mb-1">{s.emoji}</span>
              <span className="font-semibold text-sm leading-tight">{s.label}</span>
              <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</span>
            </button>
          ))}
        </div>

        {preview && (
          <p className="text-xs text-center text-muted-foreground px-2">
            Partner may see: &ldquo;{preview.homeMessage('Your partner')}&rdquo;
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-sm text-[#A83FFF] font-medium"
        >
          {showDetails ? '− Hide optional details' : '+ Add energy, stress & more (optional)'}
        </button>

        {showDetails && (
          <div className="space-y-4 pt-2 border-t border-border">
            <IndicatorRow
              label="Energy"
              options={ENERGY_LEVELS.map((e) => ({ id: e.id, label: `${e.display} ${e.label}` }))}
              value={energy}
              onChange={setEnergy}
            />
            <IndicatorRow
              label="Stress"
              options={STRESS_LEVELS.map((e) => ({ id: e.id, label: `${e.display} ${e.label}` }))}
              value={stress}
              onChange={setStress}
            />
            <IndicatorRow
              label="Affection"
              options={AFFECTION_LEVELS.map((e) => ({ id: e.id, label: `${e.display} ${e.label}` }))}
              value={affection}
              onChange={setAffection}
            />
            <IndicatorRow
              label="Communication"
              options={COMMUNICATION_MOODS.map((e) => ({ id: e.id, label: `${e.display} ${e.label}` }))}
              value={communication}
              onChange={setCommunication}
            />
          </div>
        )}

        <Button variant="gradient" className="w-full" onClick={handleQuickSave} disabled={saving}>
          {saving ? 'Sharing…' : 'Share with partner'}
        </Button>
      </div>
    </BottomSheet>
  );
}

function IndicatorRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              value === o.id ? 'bg-[image:var(--pulse-gradient)] text-white' : 'bg-accent'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
