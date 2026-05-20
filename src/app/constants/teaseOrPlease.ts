/**
 * Tease or Please — verbatim card text from the printable PDF
 * (Bee-ingMommy.blogspot.com · Danielle). 18+ only.
 */

export type CardKind = 'task' | 'wild' | 'homerun' | 'bonus' | 'blank';
export type GameMode = 'pleasing' | 'memory' | 'teasing';

export interface TeasePleaseCardDef {
  pairId: string;
  kind: CardKind;
  /** Top line on the card (as printed) */
  title: string;
  /** Bottom line after the dashed rule; same as title if single-line card */
  task: string;
}

export interface TeasePleaseCard extends TeasePleaseCardDef {
  id: string;
}

/** True when the card has a separate instruction line below the title */
export function cardHasInstruction(card: TeasePleaseCardDef): boolean {
  return card.task.trim().toUpperCase() !== card.title.trim().toUpperCase();
}

/** Rules — verbatim from the printable PDF */
export const OFFICIAL_RULES = {
  attribution: 'Tease or Please · Bee-ingMommy.blogspot.com · 18+ · Play responsibly',
  contentsTitle: 'Contents:',
  contentsLead: '72 Game Cards (2 of each card):',
  contentsItems: [
    '62 Task Cards',
    '4 Wild Cards',
    '6 Blank Cards to Create your own task',
  ],
  note: 'NOTE: Timer and Supplies needed to tease/please NOT INCLUDED',
  objectTitle: 'Object of the Game:',
  object:
    'The object of the game is spend some quality time with your significant other, teasing or pleasing them as the cards suggest. If you are uncomfortable completing the task on the card you may remove the cards before the game begins.',
  howToPlayTitle: 'How to Play:',
  howToPlayIntro: 'There are three ways to play the game Tease or Please.',
  modes: [
    {
      id: 'memory' as GameMode,
      name: 'Game 1: Tease or Please (Matching)',
      paragraphs: [
        'Mix the game cards up and lay them face down in a square. Player 1 goes first. Flip over a card, followed by another card. If the two cards match, you must perform the task on the card. Once the task has been completed it is Player 2\'s turn. If the cards do not match then flip the cards back over and Player 2 may take their turn. The game is over once you complete the HOME RUN card.',
      ],
    },
    {
      id: 'teasing' as GameMode,
      name: 'Game 2: Teasing (Go Fish)',
      paragraphs: [
        'Shuffle and place all the game cards in a pile. Deal five cards to each player. If you are dealt a match, lay it down and complete the task. Player 1 asks Player 2 if they have a card of their choosing. If Player 2 has the card they must give the card to Player 1 and complete the task. Player 1 gets to go again. Once the task has been completed it is Player 2\'s turn.',
        'If Player 2 does not have the card then they must say, "Quit teasing me". Player 1 must then draw a card from the pile. If Player 1 draws the match to the card they asked for then they may lay them down and complete the task. If the card does not match what they asked for but another card in their hand, they must hold onto it until their next turn. Once a player draws a card that doesn\'t play from the pile, it is the next players turn. The game is over when a player gets five matches.',
      ],
    },
    {
      id: 'pleasing' as GameMode,
      name: 'Game 3: Pleasing (Drawing)',
      paragraphs: [
        'Place all the game cards in pile or mix them up in a bowl. Player 1 goes first by drawing a card. The players must perform the task on the card. Player 2 then draws a card and the players must perform the task on the card. Repeat until you are satisfied or draw the HOME RUN card. You may take out the duplicate cards if you don\'t want to repeat some tasks or leave them in for a chance at your significant other having to complete the same tasks as you.',
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
    label: 'Game 1',
    subtitle: 'Tease or Please (Matching)',
    emoji: '🃏',
  },
  {
    id: 'teasing',
    label: 'Game 2',
    subtitle: 'Teasing (Go Fish)',
    emoji: '😈',
  },
  {
    id: 'pleasing',
    label: 'Game 3',
    subtitle: 'Pleasing (Drawing)',
    emoji: '💋',
  },
];

/** PDF sheet 1 — romantic / senses (12 cards) */
const SHEET_ROMANTIC: TeasePleaseCardDef[] = [
  { pairId: 'strip-tease', kind: 'task', title: 'STRIP TEASE', task: 'STRIP TEASE' },
  { pairId: 'lap-dance', kind: 'task', title: 'LAP DANCE', task: 'LAP DANCE' },
  {
    pairId: 'kiss-head-toe',
    kind: 'task',
    title: 'KISS ME FROM HEAD TO TOE',
    task: 'KISS ME FROM HEAD TO TOE',
  },
  {
    pairId: 'senses-hear',
    kind: 'task',
    title: '5 SENSES: HEAR',
    task: 'WHISPER SWEET NOTHINGS IN MY EAR',
  },
  {
    pairId: 'senses-smell',
    kind: 'task',
    title: '5 SENSES: SMELL',
    task: 'SPRITS A BODY PART WITH A SWEET SCENT, CAN YOUR PARTNER FIND IT?',
  },
  {
    pairId: 'senses-see',
    kind: 'task',
    title: '5 SENSES: SEE',
    task: 'CHANGE INTO SOMETHING SEXY AND GIVE ME A MINI SHOW',
  },
  {
    pairId: 'senses-touch',
    kind: 'task',
    title: '5 SENSES: TOUCH',
    task: 'GENTLY RUB YOUR HANDS UP AND DOWN MY BODY',
  },
  {
    pairId: 'senses-taste',
    kind: 'task',
    title: '5 SENSES: TASTE',
    task: 'TASTE TEST SOMETHING FROM THE FRIDGE OFF MY BODY',
  },
  {
    pairId: 'talk-dirty',
    kind: 'task',
    title: 'TALK DIRTY TO ME',
    task: 'TELL ME WHAT YOU WANT ME TO DO TO YOU',
  },
  {
    pairId: 'remember-when',
    kind: 'task',
    title: 'REMEMBER WHEN',
    task: 'SHARE YOUR FAVORITE SEXUAL MEMORY',
  },
  {
    pairId: 'red-light',
    kind: 'task',
    title: 'RED LIGHT, GREEN LIGHT',
    task: 'WHEN THINGS GET HEATED UP RANDOMLY STOP',
  },
  {
    pairId: 'sneak-peak',
    kind: 'task',
    title: 'SNEAK PEAK',
    task: 'FLASH ME YOUR GOODIES',
  },
];

/** PDF sheet 2 — steamy dares (12 cards) */
const SHEET_STEAMY: TeasePleaseCardDef[] = [
  {
    pairId: 'math-69',
    kind: 'task',
    title: '(9X8)-3 = ?',
    task: "LET'S PRACTICE SOME MATH",
  },
  {
    pairId: 'ice-ice-baby',
    kind: 'task',
    title: 'ICE ICE BABY',
    task: 'RUB AN ICE CUBE ANYWHERE ON YOUR PARTNERS BODY',
  },
  {
    pairId: 'no-hands-30',
    kind: 'task',
    title: 'NO HANDS ALLOWED FOR 30 SECONDS',
    task: 'KISS ME SOMEWHERE NAUGHTY',
  },
  {
    pairId: 'play-yourself',
    kind: 'task',
    title: 'PLAY WITH YOURSELF FOR 15 SECONDS',
    task: 'PLAY WITH YOURSELF FOR 15 SECONDS',
  },
  {
    pairId: 'makeout-2',
    kind: 'task',
    title: '2 MINUTE MAKE OUT SESSION',
    task: 'NO PEAKING AT THE TIMER',
  },
  {
    pairId: 'remove-yours',
    kind: 'task',
    title: 'REMOVE AN ARTICLE OF CLOTHING YOUR CHOICE',
    task: 'REMOVE AN ARTICLE OF CLOTHING YOUR CHOICE',
  },
  {
    pairId: 'remove-partners',
    kind: 'task',
    title: 'REMOVE AN ARTICLE OF CLOTHING PARTNERS CHOICE',
    task: 'REMOVE AN ARTICLE OF CLOTHING PARTNERS CHOICE',
  },
  {
    pairId: 'pick-up',
    kind: 'task',
    title: 'TRY TO PICK ME UP',
    task: 'GIVE ME YOUR BEST PICK UP LINE',
  },
  {
    pairId: 'sex-position',
    kind: 'task',
    title: 'CHOOSE A NEW SEX POSITION',
    task: 'PRACTICE IT FULLY CLOTHED',
  },
  {
    pairId: 'make-laugh',
    kind: 'task',
    title: 'MAKE ME LAUGH',
    task: 'SUCCEED AND YOU CAN DO WHATEVER YOU WANT TO ME FOR 30 SECONDS',
  },
  {
    pairId: 'sex-toy',
    kind: 'task',
    title: 'USE YOUR FAVORITE SEXUAL TOY ON YOUR PARTNER',
    task: 'BUZZ BUZZ ANYONE',
  },
  {
    pairId: 'head-south',
    kind: 'task',
    title: 'HEAD DOWN SOUTH FOR A MINUTE OR TWO',
    task: 'HEAD DOWN SOUTH FOR A MINUTE OR TWO',
  },
];

/** PDF sheet 3 — wild, bases, home run, bonus, blanks (12 slots) */
const SHEET_FINALE: TeasePleaseCardDef[] = [
  {
    pairId: 'wild-card',
    kind: 'wild',
    title: 'WILD CARD',
    task: 'YOUR CHOICE FOR 1 MINUTE',
  },
  {
    pairId: 'wild-card',
    kind: 'wild',
    title: 'WILD CARD',
    task: 'YOUR CHOICE FOR 1 MINUTE',
  },
  {
    pairId: 'first-base',
    kind: 'task',
    title: 'FIRST BASE',
    task: "KISS ME LIKE IT'S OUR FIRST TIME",
  },
  {
    pairId: 'second-base',
    kind: 'task',
    title: 'SECOND BASE',
    task: 'SHOW THE TWINS SOME LOVE',
  },
  {
    pairId: 'third-base',
    kind: 'task',
    title: 'THIRD BASE',
    task: 'SHOW ME WHAT YOUR HANDS CAN DO',
  },
  {
    pairId: 'homerun',
    kind: 'homerun',
    title: 'HOME RUN',
    task: 'JUST DO IT ALREADY',
  },
  {
    pairId: 'foot-massage',
    kind: 'bonus',
    title: 'MINI FOOT MASSAGE',
    task: 'MINI FOOT MASSAGE',
  },
  {
    pairId: 'back-massage',
    kind: 'bonus',
    title: '3 MINUTE BACK MASSAGE',
    task: '3 MINUTE BACK MASSAGE',
  },
  {
    pairId: 'another-turn',
    kind: 'bonus',
    title: 'TAKE ANOTHER TURN',
    task: 'TAKE ANOTHER TURN',
  },
  {
    pairId: 'blank-1',
    kind: 'blank',
    title: 'BLANK CARD',
    task: 'CREATE YOUR OWN TASK',
  },
  {
    pairId: 'blank-2',
    kind: 'blank',
    title: 'BLANK CARD',
    task: 'CREATE YOUR OWN TASK',
  },
  {
    pairId: 'blank-3',
    kind: 'blank',
    title: 'BLANK CARD',
    task: 'CREATE YOUR OWN TASK',
  },
];

/** Full deck: 36 unique cards → 72 with duplicates (per PDF) */
export const CARD_LIBRARY: TeasePleaseCardDef[] = [
  ...SHEET_ROMANTIC,
  ...SHEET_STEAMY,
  ...SHEET_FINALE,
];

export const PDF_CARD_COUNT = {
  unique: CARD_LIBRARY.length,
  withDuplicates: CARD_LIBRARY.filter((c) => c.kind !== 'homerun').length * 2 + 1,
};

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
      const custom = customs[def.pairId]?.trim();
      const resolved: TeasePleaseCardDef = custom
        ? { ...def, title: 'YOUR CARD', task: custom.toUpperCase() }
        : def;
      const copies = includeDuplicates ? 2 : 1;
      for (let c = 0; c < copies; c++) {
        cards.push({ ...resolved, id: `${def.pairId}-${c}-${idx++}` });
      }
      continue;
    }

    const copies = def.kind === 'homerun' ? 1 : includeDuplicates ? 2 : 1;
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
        label: 'Task Card',
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
        label: 'Blank Card',
        emoji: '✏️',
        gradient: 'from-purple-950/90 to-violet-950/90',
        border: 'border-dashed border-purple-400/50',
        glow: 'shadow-purple-500/15',
      };
  }
}
