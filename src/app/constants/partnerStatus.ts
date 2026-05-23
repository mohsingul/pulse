export type PartnerStatusId =
  | 'loved'
  | 'great'
  | 'calm'
  | 'low'
  | 'need_affection'
  | 'need_talk'
  | 'stressed'
  | 'drained'
  | 'romantic'
  | 'playful'
  | 'intimacy'
  | 'support';

export type EnergyLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'exhausted';
export type StressLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type AffectionLevel = 'overflowing' | 'happy' | 'average' | 'missing_you' | 'need_more';
export type CommunicationMood = 'talkative' | 'open' | 'relaxed' | 'reflective' | 'quiet';

export interface PartnerStatusData {
  statusId: PartnerStatusId;
  energy?: EnergyLevel;
  stress?: StressLevel;
  affection?: AffectionLevel;
  communication?: CommunicationMood;
  updatedAt: string;
}

export interface PartnerStatusRecord {
  coupleId: string;
  user1: PartnerStatusData | null;
  user2: PartnerStatusData | null;
}

export const PARTNER_STATUSES: {
  id: PartnerStatusId;
  emoji: string;
  label: string;
  description: string;
  homeMessage: (name: string) => string;
  pushTitle: (name: string) => string;
  pushBody: (name: string) => string;
  cardClass: string;
  accentColor: string;
  showOnHome: boolean;
}[] = [
  {
    id: 'loved',
    emoji: '💖',
    label: 'Feeling Loved',
    description: "I'm feeling connected and appreciated.",
    homeMessage: (n) => `${n} is feeling loved today 💕`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling loved today 💕`,
    cardClass: 'from-pink-200/40 via-pink-100/30 to-rose-100/20 border-pink-300/50',
    accentColor: '#F9A8D4',
    showOnHome: true,
  },
  {
    id: 'great',
    emoji: '😊',
    label: 'Doing Great',
    description: "I'm having a really good day.",
    homeMessage: (n) => `${n} is doing great today 🟢`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is having a great day 😊`,
    cardClass: 'from-green-200/30 via-emerald-100/20 to-green-50/10 border-green-400/40',
    accentColor: '#4ADE80',
    showOnHome: true,
  },
  {
    id: 'calm',
    emoji: '😌',
    label: 'Calm & Relaxed',
    description: "I'm peaceful and content.",
    homeMessage: (n) => `${n} is having a calm day 🌊`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is calm and relaxed today 🌊`,
    cardClass: 'from-sky-200/30 via-blue-100/20 to-cyan-50/10 border-sky-300/50',
    accentColor: '#7DD3FC',
    showOnHome: true,
  },
  {
    id: 'low',
    emoji: '😔',
    label: 'Feeling Low',
    description: 'I could use some encouragement.',
    homeMessage: (n) => `${n} may appreciate some kindness today ❤️`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling low today`,
    cardClass: 'from-amber-200/40 via-yellow-100/30 to-amber-50/20 border-amber-400/50',
    accentColor: '#FBBF24',
    showOnHome: true,
  },
  {
    id: 'need_affection',
    emoji: '🫂',
    label: 'Need Affection',
    description: 'I need more hugs, closeness, or reassurance.',
    homeMessage: (n) => `${n} could use a little extra affection today 🤗`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} could use extra affection today 🤗`,
    cardClass: 'from-rose-200/40 via-pink-100/30 to-rose-50/20 border-rose-300/50',
    accentColor: '#FB7185',
    showOnHome: true,
  },
  {
    id: 'need_talk',
    emoji: '💬',
    label: 'Need To Talk',
    description: 'Something is on my mind.',
    homeMessage: (n) => `${n} would like some quality conversation today 💬`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} would like to talk today 💬`,
    cardClass: 'from-violet-200/40 via-purple-100/30 to-violet-50/20 border-violet-400/50',
    accentColor: '#A78BFA',
    showOnHome: true,
  },
  {
    id: 'stressed',
    emoji: '😩',
    label: 'Stressed',
    description: 'Work, life or responsibilities are overwhelming.',
    homeMessage: (n) => `${n} is feeling stressed today. A supportive message might help ❤️`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling stressed today 😩`,
    cardClass: 'from-orange-200/40 via-orange-100/30 to-orange-50/20 border-orange-400/50',
    accentColor: '#FB923C',
    showOnHome: true,
  },
  {
    id: 'drained',
    emoji: '😢',
    label: 'Emotionally Drained',
    description: "I've had a difficult day.",
    homeMessage: (n) => `${n} may need emotional support today 🫂`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} may need emotional support today 🫂`,
    cardClass: 'from-orange-300/40 via-red-100/20 to-orange-100/30 border-orange-500/50',
    accentColor: '#F97316',
    showOnHome: true,
  },
  {
    id: 'romantic',
    emoji: '🔥',
    label: 'Feeling Romantic',
    description: "I'm in a romantic mood.",
    homeMessage: (n) => `${n} is feeling romantic tonight 🌹`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling romantic tonight 🔥`,
    cardClass: 'from-red-200/40 via-pink-200/30 to-rose-200/20 border-red-400/50',
    accentColor: '#F43F5E',
    showOnHome: true,
  },
  {
    id: 'playful',
    emoji: '😈',
    label: 'Feeling Playful',
    description: 'Flirty, teasing and fun.',
    homeMessage: (n) => `${n} is feeling playful today 😈`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling playful today 😈`,
    cardClass: 'from-fuchsia-200/40 via-pink-200/30 to-magenta-100/20 border-fuchsia-400/50',
    accentColor: '#E879F9',
    showOnHome: true,
  },
  {
    id: 'intimacy',
    emoji: '❤️',
    label: 'Intimacy Desired',
    description: 'Private status visible only to partner.',
    homeMessage: (n) => `${n} would love some extra intimacy today ❤️`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} shared a private status with you ❤️`,
    cardClass: 'from-rose-300/50 via-red-200/30 to-rose-200/30 border-rose-500/50',
    accentColor: '#E11D48',
    showOnHome: true,
  },
  {
    id: 'support',
    emoji: '🚨',
    label: 'Support Needed',
    description: 'Closest thing to Shark Mode without being emergency mode.',
    homeMessage: (n) => `${n} needs your support today ❤️`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} needs your support today ❤️`,
    cardClass: 'from-red-300/50 via-red-200/40 to-red-100/30 border-red-500/60',
    accentColor: '#EF4444',
    showOnHome: true,
  },
];

export const ENERGY_LEVELS: { id: EnergyLevel; label: string; display: string }[] = [
  { id: 'very_high', label: 'Very High', display: '⚡' },
  { id: 'high', label: 'High', display: '⚡⚡' },
  { id: 'moderate', label: 'Moderate', display: '⚡⚡⚡' },
  { id: 'low', label: 'Low', display: '⚡⚡⚡⚡' },
  { id: 'exhausted', label: 'Exhausted', display: '⚡⚡⚡⚡⚡' },
];

export const STRESS_LEVELS: { id: StressLevel; label: string; display: string }[] = [
  { id: 'low', label: 'Low', display: '🟢' },
  { id: 'moderate', label: 'Moderate', display: '🟡' },
  { id: 'high', label: 'High', display: '🟠' },
  { id: 'very_high', label: 'Very High', display: '🔴' },
];

export const AFFECTION_LEVELS: { id: AffectionLevel; label: string; display: string }[] = [
  { id: 'overflowing', label: 'Overflowing', display: '💖' },
  { id: 'happy', label: 'Happy', display: '💕' },
  { id: 'average', label: 'Average', display: '💗' },
  { id: 'missing_you', label: 'Missing You', display: '🤍' },
  { id: 'need_more', label: 'Need More Affection', display: '💔' },
];

export const COMMUNICATION_MOODS: { id: CommunicationMood; label: string; display: string }[] = [
  { id: 'talkative', label: 'Talkative', display: '💬' },
  { id: 'open', label: 'Open', display: '😊' },
  { id: 'relaxed', label: 'Relaxed', display: '😌' },
  { id: 'reflective', label: 'Reflective', display: '🤔' },
  { id: 'quiet', label: 'Quiet Today', display: '🔕' },
];

export const STATUS_SUGGESTIONS: Record<
  PartnerStatusId,
  { emoji: string; label: string; action: 'encourage' | 'call' | 'message' | 'nudge' | 'date' | 'love_note' | 'playlist' | 'evening' | 'thoughtful' }[]
> = {
  loved: [
    { emoji: '💕', label: 'Send love note', action: 'love_note' },
    { emoji: '❤️', label: 'Send encouragement', action: 'encourage' },
  ],
  great: [
    { emoji: '❤️', label: 'Celebrate together', action: 'message' },
    { emoji: '💕', label: 'Send love', action: 'encourage' },
  ],
  calm: [
    { emoji: '🌊', label: 'Peaceful check-in', action: 'message' },
    { emoji: '☕', label: 'Send warmth', action: 'encourage' },
  ],
  low: [
    { emoji: '☕', label: 'Send encouragement', action: 'encourage' },
    { emoji: '❤️', label: 'Support message', action: 'message' },
    { emoji: '🤗', label: 'Thinking of you', action: 'nudge' },
  ],
  need_affection: [
    { emoji: '🤗', label: 'Send affection', action: 'encourage' },
    { emoji: '❤️', label: 'Thinking of you', action: 'nudge' },
    { emoji: '💕', label: 'Love note', action: 'love_note' },
  ],
  need_talk: [
    { emoji: '💬', label: 'Start conversation', action: 'message' },
    { emoji: '📞', label: 'Call partner', action: 'call' },
    { emoji: '❤️', label: 'Check in', action: 'encourage' },
  ],
  stressed: [
    { emoji: '☕', label: 'Send encouragement', action: 'encourage' },
    { emoji: '📞', label: 'Call partner', action: 'call' },
    { emoji: '❤️', label: 'Support message', action: 'message' },
    { emoji: '🎁', label: 'Plan something thoughtful', action: 'thoughtful' },
  ],
  drained: [
    { emoji: '🫂', label: 'Send support', action: 'encourage' },
    { emoji: '📞', label: 'Call partner', action: 'call' },
    { emoji: '❤️', label: 'Gentle message', action: 'message' },
  ],
  romantic: [
    { emoji: '🌹', label: 'Date night idea', action: 'date' },
    { emoji: '💕', label: 'Love note', action: 'love_note' },
    { emoji: '🎵', label: 'Romantic playlist', action: 'playlist' },
    { emoji: '🍷', label: 'Evening together', action: 'evening' },
  ],
  playful: [
    { emoji: '😈', label: 'Flirty message', action: 'message' },
    { emoji: '❤️', label: 'Send love', action: 'encourage' },
  ],
  intimacy: [
    { emoji: '❤️', label: 'Send love', action: 'encourage' },
    { emoji: '💕', label: 'Private love note', action: 'love_note' },
  ],
  support: [
    { emoji: '📞', label: 'Call partner', action: 'call' },
    { emoji: '❤️', label: 'Support message', action: 'message' },
    { emoji: '🫂', label: 'Send reassurance', action: 'encourage' },
  ],
};

export function getPartnerStatusMeta(id: PartnerStatusId | string | undefined) {
  return PARTNER_STATUSES.find((s) => s.id === id) ?? null;
}

function localDateKey(date: Date, timezoneOffsetMinutes: number): string {
  const shifted = new Date(date.getTime() - timezoneOffsetMinutes * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** True if status was set today (local midnight boundary). */
export function isPartnerStatusFromToday(updatedAt?: string | null): boolean {
  if (!updatedAt) return false;
  const tz = new Date().getTimezoneOffset();
  const todayKey = localDateKey(new Date(), tz);
  const statusKey = localDateKey(new Date(updatedAt), tz);
  return todayKey === statusKey;
}

export function getUserStatusFromRecord(
  record: PartnerStatusRecord | null,
  userId: string,
  user1Id: string,
): PartnerStatusData | null {
  if (!record) return null;
  const status = userId === user1Id ? record.user1 : record.user2;
  if (!status || !isPartnerStatusFromToday(status.updatedAt)) return null;
  return status;
}

export function getEnergyDisplay(id?: EnergyLevel) {
  return ENERGY_LEVELS.find((e) => e.id === id)?.display ?? '⚡⚡⚡';
}

export function getEnergyLabel(id?: EnergyLevel) {
  return ENERGY_LEVELS.find((e) => e.id === id)?.label ?? 'Moderate';
}

export function getStressDisplay(id?: StressLevel) {
  const s = STRESS_LEVELS.find((e) => e.id === id);
  return s ? `${s.display} ${s.label}` : '🟡 Moderate';
}

export function getAffectionDisplay(id?: AffectionLevel) {
  const a = AFFECTION_LEVELS.find((e) => e.id === id);
  return a ? `${a.display} ${a.label}` : null;
}

export function getCommunicationDisplay(id?: CommunicationMood) {
  const c = COMMUNICATION_MOODS.find((e) => e.id === id);
  return c ? `${c.display} ${c.label}` : null;
}

/** Default indicators for quick 3-second update */
export const DEFAULT_STATUS_INDICATORS = {
  energy: 'moderate' as EnergyLevel,
  stress: 'low' as StressLevel,
  affection: 'happy' as AffectionLevel,
  communication: 'open' as CommunicationMood,
};
