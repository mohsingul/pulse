import React from 'react';
import { Heart } from 'lucide-react';
import { getPartnerNeedLevel, type PartnerNeedStatus } from '@/app/constants/partnerNeeds';

interface PartnerNeedsBannerProps {
  partnerName: string;
  status: PartnerNeedStatus;
}

export function PartnerNeedsBanner({ partnerName, status }: PartnerNeedsBannerProps) {
  const level = getPartnerNeedLevel(status);
  if (!level?.partnerMessage) return null;

  return (
    <div className={`w-full rounded-2xl border p-4 ${level.bannerClass}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{level.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base leading-snug">
            {partnerName} {level.partnerMessage} <Heart className="inline w-4 h-4 text-[#FB3094] fill-[#FB3094]" />
          </p>
          <p className="text-sm opacity-80 mt-1">{level.label}</p>
        </div>
      </div>
    </div>
  );
}
