/**
 * Tease or Please — card text & rules from the printable PDF
 * (Bee-ingMommy / Danielle). 18+ only. Play responsibly.
 */

export type CardKind = 'task' | 'wild' | 'homerun' | 'bonus' | 'blank';
export type GameMode = 'pleasing' | 'memory' | 'teasing';

export interface TeasePleaseCardDef {
  pairId: string;
  kind: CardKind;
  title: string;
  task: string;
  subtitle?: string;
}

export interface TeasePleaseCard extends TeasePleaseCardDef {
  id: string;
}

/** Rules transcribed from PDF page 1 */
export const OFFICIAL_RULES = {
  attribution: 'Tease or Please · Bee-ingMommy.blogspot.com · 18+ · Play responsibly',
  contents: [
    '72 Game Cards (2 of each card): 62 Task Cards, 4 Wild Cards, 6 Blank Cards',
    'Timer and supplies needed to tease/please are NOT included',
  ],
  object:
    'Spend quality time with your significant other, teasing or pleasing them as the cards suggest. Remove any cards you are uncomfortable with before you begin.',
  modes: [
    {
      id: 'memory' as GameMode,
      name: 'Game 1: Tease or Please (Matching)',
      steps: [
        'Mix the cards and lay them face down in a square.',
        'Player 1 flips one card, then another. If they match, perform the task on the card.',
        'After the task, it is Player 2\'s turn. If they do not match, flip them back and Player 2 goes.',
        'Game ends when you complete the HOME RUN card.',
      ],
    },
    {
      id: 'teasing' as GameMode,
      name: 'Game 2: Teasing (Go Fish)',
      steps: [
        'Shuffle all cards. Deal five cards to each player.',
        'If you are dealt a match, lay it down and complete the task.',
        'Player 1 asks Player 2 for a card. If Player 2 has it, they give it and complete the task; Player 1 goes again.',
        'If not, Player 2 says "Quit teasing me." Player 1 draws from the pile.',
        'If the draw completes the pair they asked for, lay them down and complete the task.',
        'Game ends when a player gets five matches.',
      ],
    },
    {
      id: 'pleasing' as GameMode,
      name: 'Game 3: Pleasing (Drawing)',
      steps: [
        'Place all cards in a pile or bowl.',
        'Player 1 draws a card — both perform the task. Then Player 2 draws.',
        'Repeat until satisfied or you draw the HOME RUN card.',
        'You may remove duplicate cards before playing if you do not want to repeat tasks.',
      ],
    },
  ],
};

export const GAME_MODES: {
  id: GameMode;
  label: string;
  subtitle: string;
  emoji: string;
}[] = [
  {
    id: 'memory',
    label: 'Tease or Please',
    subtitle: OFFICIAL_RULES.modes[0].name.replace('Game 1: ', ''),
    emoji: '🃏',
  },
  {
    id: 'teasing',
    label: 'Teasing',
    subtitle: 'Go Fish — say "Quit teasing me"',
    emoji: '😈',
  },
  {
    id: 'pleasing',
    label: 'Pleasing',
    subtitle: 'Draw from the pile · take turns',
    emoji: '💋',
  },
];

/** All unique cards from PDF pages 9–14 (verbatim / faithful transcription) */
export const CARD_LIBRARY: TeasePleaseCardDef[] = [
  { pairId: 'strip-tease', kind: 'task', title: 'Strip Tease', task: 'Strip tease for your partner.' },
  { pairId: 'lap-dance', kind: 'task', title: 'Lap Dance', task: 'Give your partner a lap dance.' },
  {
    pairId: 'kiss-head-toe',
    kind: 'task',
    title: 'Kiss Me From Head To Toe',
    task: 'Kiss your partner from head to toe.',
  },
  {
    pairId: 'senses-hear',
    kind: 'task',
    title: '5 Senses: Hear',
    task: 'Whisper sweet nothings in my ear.',
  },
  {
    pairId: 'senses-smell',
    kind: 'task',
    title: '5 Senses: Smell',
    task: 'Spritz a body part with a sweet scent — can your partner find it?',
  },
  {
    pairId: 'senses-see',
    kind: 'task',
    title: '5 Senses: See',
    task: 'Change into something sexy and give me a mini show.',
  },
  {
    pairId: 'senses-touch',
    kind: 'task',
    title: '5 Senses: Touch',
    task: 'Gently rub your hands up and down my body.',
  },
  {
    pairId: 'senses-taste',
    kind: 'task',
    title: '5 Senses: Taste',
    task: 'Taste test something from the fridge off my body.',
  },
  {
    pairId: 'talk-dirty',
    kind: 'task',
    title: 'Talk Dirty To Me',
    task: 'Tell me what you want me to do to you.',
  },
  {
    pairId: 'remember-when',
    kind: 'task',
    title: 'Remember When',
    task: 'Share your favorite sexual memory.',
  },
  {
    pairId: 'red-light',
    kind: 'task',
    title: 'Red Light, Green Light',
    task: 'When things get heated up, randomly stop.',
  },
  {
    pairId: 'sneak-peak',
    kind: 'task',
    title: 'Sneak Peak',
    task: 'Flash me your goodies.',
  },
  {
    pairId: 'math-69',
    kind: 'task',
    title: '(9×8)−3 = ?',
    subtitle: "Let's practice some math",
    task: "Let's practice some math — (the answer is 69).",
  },
  {
    pairId: 'ice-ice-baby',
    kind: 'task',
    title: 'Ice Ice Baby',
    task: "Rub an ice cube anywhere on your partner's body.",
  },
  {
    pairId: 'no-hands-30',
    kind: 'task',
    title: 'No Hands Allowed For 30 Seconds',
    task: 'Kiss me somewhere naughty.',
    subtitle: '30 seconds',
  },
  {
    pairId: 'play-yourself',
    kind: 'task',
    title: 'Play With Yourself For 15 Seconds',
    task: 'Play with yourself for 15 seconds.',
  },
  {
    pairId: 'makeout-2',
    kind: 'task',
    title: '2 Minute Make Out Session',
    task: '2 minute make out session — no peeking at the timer.',
  },
  {
    pairId: 'remove-yours',
    kind: 'task',
    title: 'Remove An Article Of Clothing',
    task: 'Remove an article of clothing — your choice.',
  },
  {
    pairId: 'remove-partners',
    kind: 'task',
    title: 'Remove An Article Of Clothing',
    task: "Remove an article of clothing — partner's choice.",
  },
  {
    pairId: 'pick-up',
    kind: 'task',
    title: 'Try To Pick Me Up',
    task: 'Give me your best pick up line.',
  },
  {
    pairId: 'sex-position',
    kind: 'task',
    title: 'Choose A New Sex Position',
    task: 'Practice it fully clothed.',
  },
  {
    pairId: 'make-laugh',
    kind: 'task',
    title: 'Make Me Laugh',
    task: 'Succeed and you can do whatever you want to me for 30 seconds.',
  },
  {
    pairId: 'sex-toy',
    kind: 'task',
    title: 'Use Your Favorite Sexual Toy On Your Partner',
    task: 'Buzz buzz anyone.',
  },
  {
    pairId: 'head-south',
    kind: 'task',
    title: 'Head Down South',
    task: 'Head down south for a minute or two.',
  },
  {
    pairId: 'wild-a',
    kind: 'wild',
    title: 'Wild Card',
    task: 'Your choice for 1 minute.',
  },
  {
    pairId: 'wild-b',
    kind: 'wild',
    title: 'Wild Card',
    task: 'Your choice for 1 minute.',
  },
  {
    pairId: 'first-base',
    kind: 'task',
    title: 'First Base',
    task: "Kiss me like it's our first time.",
  },
  {
    pairId: 'second-base',
    kind: 'task',
    title: 'Second Base',
    task: 'Show the twins some love.',
  },
  {
    pairId: 'third-base',
    kind: 'task',
    title: 'Third Base',
    task: 'Show me what your hands can do.',
  },
  {
    pairId: 'homerun',
    kind: 'homerun',
    title: 'Home Run',
    task: 'Just do it already.',
  },
  {
    pairId: 'foot-massage',
    kind: 'bonus',
    title: 'Mini Foot Massage',
    task: 'Give a mini foot massage.',
  },
  {
    pairId: 'back-massage',
    kind: 'bonus',
    title: '3 Minute Back Massage',
    task: 'Give a 3 minute back massage.',
  },
  {
    pairId: 'another-turn',
    kind: 'bonus',
    title: 'Take Another Turn',
    task: 'Take another turn.',
  },
  { pairId: 'blank-1', kind: 'blank', title: 'Blank Card', task: 'Create your own task.' },
  { pairId: 'blank-2', kind: 'blank', title: 'Blank Card', task: 'Create your own task.' },
  { pairId: 'blank-3', kind: 'blank', title: 'Blank Card', task: 'Create your own task.' },
];

const CUSTOM_BLANK_KEY = 'tease_or_please_blanks';

export function getCustomBlankTasks(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_BLANK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCustomBlankTask(pairId: string, task: string) {
  const all = getCustomBlankTasks();
  all[pairId] = task;
  localStorage.setItem(CUSTOM_BLANK_KEY, JSON.stringify(all));
}

export function buildDeck(includeDuplicates = true): TeasePleaseCard[] {
  const customs = getCustomBlankTasks();
  const cards: TeasePleaseCard[] = [];
  let idx = 0;

  for (const def of CARD_LIBRARY) {
    if (def.kind === 'blank') {
      const customTask = customs[def.pairId];
      const resolved = customTask?.trim()
        ? { ...def, task: customTask.trim() }
        : def;
      const copies = includeDuplicates ? 2 : 1;
      for (let c = 0; c < copies; c++) {
        cards.push({ ...resolved, id: `${def.pairId}-${c}-${idx++}` });
      }
      continue;
    }

    const copies =
      def.kind === 'homerun' ? 1 : includeDuplicates ? 2 : 1;
    for (let c = 0; c < copies; c++) {
      cards.push({ ...def, id: `${def.pairId}-${c}-${idx++}` });
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
    case 'task':
      return {
        label: 'Task',
        emoji: '💜',
        gradient: 'from-purple-900/95 via-violet-900/90 to-purple-950/95',
        border: 'border-purple-400/40',
        glow: 'shadow-purple-500/25',
      };
    case 'wild':
      return {
        label: 'Wild Card',
        emoji: '✨',
        gradient: 'from-violet-950/90 via-fuchsia-900/85 to-purple-950/90',
        border: 'border-violet-400/50',
        glow: 'shadow-violet-500/35',
      };
    case 'homerun':
      return {
        label: 'Home Run',
        emoji: '🏠',
        gradient: 'from-rose-950/90 via-purple-900/85 to-fuchsia-950/90',
        border: 'border-rose-400/50',
        glow: 'shadow-rose-500/35',
      };
    case 'bonus':
      return {
        label: 'Bonus',
        emoji: '🎁',
        gradient: 'from-purple-800/90 via-purple-900/85 to-violet-950/90',
        border: 'border-purple-300/35',
        glow: 'shadow-purple-400/20',
      };
    case 'blank':
      return {
        label: 'Your Card',
        emoji: '✏️',
        gradient: 'from-purple-950/90 to-violet-950/90',
        border: 'border-dashed border-purple-400/50',
        glow: 'shadow-purple-500/15',
      };
  }
}
