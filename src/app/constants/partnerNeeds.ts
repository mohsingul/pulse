export type PartnerNeedStatus = 'great' | 'low' | 'attention' | 'support';

export const PARTNER_NEED_LEVELS: {
  id: PartnerNeedStatus;
  emoji: string;
  label: string;
  partnerMessage: string | null;
  bannerClass: string;
}[] = [
  {
    id: 'great',
    emoji: '🟢',
    label: 'Doing great',
    partnerMessage: null,
    bannerClass: '',
  },
  {
    id: 'low',
    emoji: '🟡',
    label: 'Feeling low',
    partnerMessage: 'may be having a low day',
    bannerClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-900 dark:text-yellow-100',
  },
  {
    id: 'attention',
    emoji: '🟠',
    label: 'Needs attention',
    partnerMessage: 'may need a little extra love today',
    bannerClass: 'bg-orange-500/10 border-orange-500/30 text-orange-900 dark:text-orange-100',
  },
  {
    id: 'support',
    emoji: '🔴',
    label: 'Really needs support',
    partnerMessage: 'may need extra support today',
    bannerClass: 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-100',
  },
];

export function getPartnerNeedLevel(status: PartnerNeedStatus | null | undefined) {
  return PARTNER_NEED_LEVELS.find((l) => l.id === status) ?? null;
}

export function getPartnerStatusFromRecord(
  partnerNeeds: {
    user1Status: PartnerNeedStatus | null;
    user2Status: PartnerNeedStatus | null;
  } | null,
  userId: string,
  user1Id: string,
): PartnerNeedStatus | null {
  if (!partnerNeeds) return null;
  return userId === user1Id ? partnerNeeds.user1Status : partnerNeeds.user2Status;
}
