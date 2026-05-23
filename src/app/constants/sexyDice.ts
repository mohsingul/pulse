/**
 * Sexy Dice — rules and faces from the Dating Divas printable (6 dice).
 * 18+ couples game. Play responsibly.
 */

export type DiceId = 'action' | 'body' | 'time' | 'toys' | 'sex' | 'location';

export interface DiceDefinition {
  id: DiceId;
  name: string;
  emoji: string;
  color: string;
  faces: string[];
}

export const SEXY_DICE: Record<DiceId, DiceDefinition> = {
  action: {
    id: 'action',
    name: 'Actions',
    emoji: '💋',
    color: '#FB3094',
    faces: ['kiss', 'tickle', 'nibble', 'lick', 'suck', 'blow'],
  },
  body: {
    id: 'body',
    name: 'Body Parts',
    emoji: '🫦',
    color: '#E91E8C',
    faces: ['neck', 'bottom', 'lips', 'chest', 'navel', 'inner thigh'],
  },
  time: {
    id: 'time',
    name: 'Time',
    emoji: '⏱️',
    color: '#A83FFF',
    faces: ['2 minutes', '5 minutes', '7 minutes', '10 minutes', '12 minutes', '15 minutes'],
  },
  toys: {
    id: 'toys',
    name: 'Bedroom Toys',
    emoji: '🎀',
    color: '#7C4DFF',
    faces: ['massager', 'blindfold', 'ice', 'heat', 'tickler', 'handcuffs'],
  },
  sex: {
    id: 'sex',
    name: 'Sex',
    emoji: '🔥',
    color: '#FF6B35',
    faces: [
      'heavy foreplay',
      "I'm on top",
      'his choice',
      'her choice',
      'a quickie',
      'wet and wild',
    ],
  },
  location: {
    id: 'location',
    name: 'Home Locations',
    emoji: '🏠',
    color: '#00BCD4',
    faces: ['bedroom', 'table', 'floor', 'couch', 'chair', 'shower'],
  },
};

export const ALL_DICE_IDS: DiceId[] = ['action', 'body', 'time', 'toys', 'sex', 'location'];

export const OFFICIAL_RULES = {
  attribution: 'Inspired by the Dating Divas Sexy Dice printables · 18+ · Play responsibly',
  steps: [
    'Lock the doors, turn off your phones.',
    'Freshen up.',
    'Pick 1, 2, 3, 4, 5, or all 6 dice to use per game.',
    'Grab any items needed for the game.',
    'Roll the dice.',
    'Do whatever it says!',
    'Enjoy.',
  ],
};

export interface DiceRollFace {
  diceId: DiceId;
  faceIndex: number;
  label: string;
}

function locationPhrase(loc: string): string {
  switch (loc.toLowerCase()) {
    case 'bedroom':
      return 'in the bedroom';
    case 'shower':
      return 'in the shower';
    case 'floor':
      return 'on the floor';
    case 'couch':
      return 'on the couch';
    case 'chair':
      return 'in the chair';
    case 'table':
      return 'at the table';
    default:
      return `in the ${loc}`;
  }
}

/** Build a readable prompt from rolled faces (order follows enabled dice). */
export function buildRollPrompt(roll: DiceRollFace[]): string {
  const byId = Object.fromEntries(roll.map((r) => [r.diceId, r.label])) as Partial<
    Record<DiceId, string>
  >;

  const parts: string[] = [];

  if (byId.action && byId.body) {
    parts.push(`${capitalize(byId.action)} their ${byId.body}`);
  } else if (byId.action) {
    parts.push(capitalize(byId.action));
  } else if (byId.body) {
    parts.push(`Focus on their ${byId.body}`);
  }

  if (byId.time) {
    parts.push(`for ${byId.time}`);
  }

  if (byId.location) {
    parts.push(locationPhrase(byId.location));
  }

  if (byId.toys) {
    parts.push(`using a ${byId.toys}`);
  }

  if (byId.sex) {
    parts.push(`— ${capitalize(byId.sex)}`);
  }

  if (parts.length === 0) return 'Roll again!';
  return parts.join(' ');
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getDiceDefinition(id: DiceId): DiceDefinition {
  return SEXY_DICE[id];
}
