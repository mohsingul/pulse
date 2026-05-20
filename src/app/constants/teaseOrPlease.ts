/**
 * Tease or Please — intimate couples card game
 * Inspired by the printable game rules (matching pairs, tease vs please, wild, home run).
 * Original prompts for in-app use. 18+ only.
 */

export type CardKind = 'tease' | 'please' | 'wild' | 'homerun';
export type GameMode = 'pleasing' | 'memory' | 'teasing';
export type HeatLevel = 1 | 2 | 3;

export interface TeasePleaseCardDef {
  pairId: string;
  kind: CardKind;
  title: string;
  task: string;
  heat: HeatLevel;
  duration?: string;
}

export interface TeasePleaseCard extends TeasePleaseCardDef {
  id: string;
}

export const GAME_MODES: {
  id: GameMode;
  label: string;
  subtitle: string;
  emoji: string;
}[] = [
  {
    id: 'pleasing',
    label: 'Pleasing',
    subtitle: 'Take turns drawing cards — perform every task together',
    emoji: '💋',
  },
  {
    id: 'memory',
    label: 'Tease or Please',
    subtitle: 'Flip two cards — match the pair, then do the dare',
    emoji: '🔥',
  },
  {
    id: 'teasing',
    label: 'Teasing',
    subtitle: 'Collect matching pairs in your hand — quit teasing when they say no',
    emoji: '😈',
  },
];

/** Core task library — each pairId appears twice in the full deck */
export const CARD_LIBRARY: TeasePleaseCardDef[] = [
  // —— TEASE (anticipation, denial, slow burn) ——
  {
    pairId: 't01',
    kind: 'tease',
    title: 'Slow burn',
    task: 'Whisper what you want to do later tonight — but no touching for the next 3 minutes.',
    heat: 2,
    duration: '3 min',
  },
  {
    pairId: 't02',
    kind: 'tease',
    title: 'Eyes only',
    task: 'Describe your favorite part of their body in detail while they can only watch you.',
    heat: 2,
  },
  {
    pairId: 't03',
    kind: 'tease',
    title: 'Almost kiss',
    task: 'Hover your lips near theirs for 20 seconds — pull away if they lean in.',
    heat: 2,
    duration: '20 sec',
  },
  {
    pairId: 't04',
    kind: 'tease',
    title: 'Blind desire',
    task: 'Blindfold them. Trace one line from neck to collarbone with one finger only.',
    heat: 3,
  },
  {
    pairId: 't05',
    kind: 'tease',
    title: 'Voice note',
    task: 'Record a 15-second voice note telling them exactly what you’re thinking about them.',
    heat: 2,
    duration: '15 sec',
  },
  {
    pairId: 't06',
    kind: 'tease',
    title: 'Hands tied',
    task: 'Let them tie your hands (scarf works). They get to tease you for one minute — you can’t touch back.',
    heat: 3,
    duration: '1 min',
  },
  {
    pairId: 't07',
    kind: 'tease',
    title: 'Ice & heat',
    task: 'Hold an ice cube in your mouth, then kiss their wrist once. Ask if they want more.',
    heat: 3,
  },
  {
    pairId: 't08',
    kind: 'tease',
    title: 'Outfit reveal',
    task: 'Step away and change into something that makes you feel sexy. Come back — no words for 10 seconds.',
    heat: 2,
  },
  {
    pairId: 't09',
    kind: 'tease',
    title: 'Text tease',
    task: 'Send them one text right now they’re not allowed to open until you say “now.”',
    heat: 1,
  },
  {
    pairId: 't10',
    kind: 'tease',
    title: 'Breath play (light)',
    task: 'Breathe slowly on the back of their neck for 30 seconds without kissing.',
    heat: 2,
    duration: '30 sec',
  },
  {
    pairId: 't11',
    kind: 'tease',
    title: 'Strip one',
    task: 'Remove exactly one item of your clothing — then make them wait 2 minutes for the next move.',
    heat: 3,
    duration: '2 min',
  },
  {
    pairId: 't12',
    kind: 'tease',
    title: 'Fantasy hint',
    task: 'Share the first sentence of a fantasy you’ve never said out loud. Stop there.',
    heat: 3,
  },

  // —— PLEASE (giving pleasure, romance, heat) ——
  {
    pairId: 'p01',
    kind: 'please',
    title: 'Deep kiss',
    task: 'Kiss them slowly for 45 seconds — hands in their hair or on their waist only.',
    heat: 2,
    duration: '45 sec',
  },
  {
    pairId: 'p02',
    kind: 'please',
    title: 'Massage',
    task: 'Give a 2-minute massage wherever they point — use oil or lotion if you have it.',
    heat: 2,
    duration: '2 min',
  },
  {
    pairId: 'p03',
    kind: 'please',
    title: 'Praise',
    task: 'Tell them three specific things that turn you on about them — look them in the eyes.',
    heat: 1,
  },
  {
    pairId: 'p04',
    kind: 'please',
    title: 'Neck worship',
    task: 'Kiss and lightly nibble along their neck and jawline for one minute.',
    heat: 3,
    duration: '1 min',
  },
  {
    pairId: 'p05',
    kind: 'please',
    title: 'Dance for them',
    task: 'Put on one song and move for them however you want — they can’t touch until the song ends.',
    heat: 2,
  },
  {
    pairId: 'p06',
    kind: 'please',
    title: 'Undress them',
    task: 'Slowly remove one layer they choose — kiss each new inch of skin you reveal.',
    heat: 3,
  },
  {
    pairId: 'p07',
    kind: 'please',
    title: 'Feed & sip',
    task: 'Feed them something sweet or share a drink from the same glass — maintain eye contact.',
    heat: 1,
  },
  {
    pairId: 'p08',
    kind: 'please',
    title: 'Full body scan',
    task: 'With flat palms, trace from shoulders to hips over clothes (or skin) for 90 seconds.',
    heat: 2,
    duration: '90 sec',
  },
  {
    pairId: 'p09',
    kind: 'please',
    title: 'Ear whispers',
    task: 'Whisper five dirty-sweet things only they get to hear.',
    heat: 3,
  },
  {
    pairId: 'p10',
    kind: 'please',
    title: 'Shower invite',
    task: 'Draw them a warm shower or bath — wash one part of them they choose.',
    heat: 3,
  },
  {
    pairId: 'p11',
    kind: 'please',
    title: 'Mirror moment',
    task: 'Stand behind them at a mirror — tell them what you see that drives you wild.',
    heat: 2,
  },
  {
    pairId: 'p12',
    kind: 'please',
    title: 'Bed reset',
    task: 'Lead them to bed, fresh sheets if you can — lie together 2 minutes, only kissing and holding.',
    heat: 2,
    duration: '2 min',
  },
  {
    pairId: 'p13',
    kind: 'please',
    title: 'Their choice',
    task: 'Ask “What do you want right now?” — do exactly that for 3 minutes (within your comfort).',
    heat: 3,
    duration: '3 min',
  },
  {
    pairId: 'p14',
    kind: 'please',
    title: 'Love letter',
    task: 'Write one sentence on their skin with your finger (or lipstick) — they pick the word.',
    heat: 2,
  },

  // —— WILD ——
  {
    pairId: 'w01',
    kind: 'wild',
    title: 'Wild card',
    task: 'Your partner picks: draw another card from the deck — you perform it no matter tease or please.',
    heat: 3,
  },
  {
    pairId: 'w02',
    kind: 'wild',
    title: 'Role swap',
    task: 'Swap roles for the next 2 cards — the usual receiver gives all the pleasure.',
    heat: 3,
  },
  {
    pairId: 'w03',
    kind: 'wild',
    title: 'Double or nothing',
    task: 'Do the next card together at the same time — sync or laugh trying.',
    heat: 2,
  },
  {
    pairId: 'w04',
    kind: 'wild',
    title: 'Timer challenge',
    task: 'Set a 5-minute timer. Whatever happens before it rings stays between you tonight.',
    heat: 3,
    duration: '5 min',
  },

  // —— HOME RUN ——
  {
    pairId: 'hr',
    kind: 'homerun',
    title: 'Home run',
    task: 'Finale: each share one fantasy for tonight. Then decide together — tease first, or please all night.',
    heat: 3,
  },
];

export function buildDeck(includeDuplicates = true): TeasePleaseCard[] {
  const cards: TeasePleaseCard[] = [];
  let idx = 0;

  for (const def of CARD_LIBRARY) {
    const copies = def.kind === 'homerun' ? 1 : includeDuplicates ? 2 : 1;
    for (let c = 0; c < copies; c++) {
      cards.push({
        ...def,
        id: `${def.pairId}-${c}-${idx++}`,
      });
    }
  }

  return shuffle(cards);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getKindMeta(kind: CardKind): {
  label: string;
  emoji: string;
  gradient: string;
  border: string;
  glow: string;
} {
  switch (kind) {
    case 'tease':
      return {
        label: 'Tease',
        emoji: '😈',
        gradient: 'from-rose-950/90 via-fuchsia-900/80 to-purple-950/90',
        border: 'border-fuchsia-500/40',
        glow: 'shadow-fuchsia-500/25',
      };
    case 'please':
      return {
        label: 'Please',
        emoji: '💋',
        gradient: 'from-rose-900/90 via-pink-800/80 to-red-950/90',
        border: 'border-rose-400/40',
        glow: 'shadow-rose-500/30',
      };
    case 'wild':
      return {
        label: 'Wild',
        emoji: '✨',
        gradient: 'from-violet-950/90 via-purple-800/80 to-fuchsia-950/90',
        border: 'border-violet-400/50',
        glow: 'shadow-violet-500/35',
      };
    case 'homerun':
      return {
        label: 'Home run',
        emoji: '🏠',
        gradient: 'from-amber-950/90 via-rose-900/80 to-fuchsia-950/90',
        border: 'border-amber-400/50',
        glow: 'shadow-amber-500/35',
      };
  }
}

export function heatLabel(heat: HeatLevel): string {
  if (heat === 1) return 'Warm';
  if (heat === 2) return 'Hot';
  return 'Steam';
}

export function heatFlames(heat: HeatLevel): string {
  return '🔥'.repeat(heat);
}
