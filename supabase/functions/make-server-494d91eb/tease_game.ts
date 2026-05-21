/**
 * Couple-synced Tease or Please game session (KV-backed)
 * Full card objects are persisted — IDs alone break across server requests.
 */
import * as kv from "./kv_store.ts";

export type GameMode = "pleasing" | "memory" | "teasing";
export type SessionStatus = "idle" | "invite_pending" | "active" | "finished";

export type CardKind = "task" | "wild" | "homerun" | "bonus" | "blank";

export interface CardDef {
  pairId: string;
  kind: CardKind;
  title: string;
  task: string;
}

export interface GameCard extends CardDef {
  id: string;
}

export interface MemoryCellState {
  card: GameCard;
  faceUp: boolean;
  matched: boolean;
}

export interface TeaseGameSession {
  coupleId: string;
  status: SessionStatus;
  mode: GameMode;
  hostUserId: string;
  hostName: string;
  partnerUserId: string;
  partnerName: string;
  acceptedAt: string | null;
  activeUserId: string;
  phase: "playing" | "finished";
  tableCard: GameCard | null;
  tableCardFromUserId: string | null;
  awaitingAckFromUserId: string | null;
  pleasing: { deck: GameCard[] };
  memory: {
    cells: MemoryCellState[];
    flippedIndices: number[];
    resolveAt: number | null;
  };
  teasing: {
    hands: Record<string, GameCard[]>;
    deck: GameCard[];
    matches: Record<string, number>;
  };
  updatedAt: string;
}

const CARD_LIBRARY: CardDef[] = [
  { pairId: "strip-tease", kind: "task", title: "STRIP TEASE", task: "STRIP TEASE" },
  { pairId: "lap-dance", kind: "task", title: "LAP DANCE", task: "LAP DANCE" },
  { pairId: "kiss-head-toe", kind: "task", title: "KISS ME FROM HEAD TO TOE", task: "KISS ME FROM HEAD TO TOE" },
  { pairId: "senses-hear", kind: "task", title: "5 SENSES: HEAR", task: "WHISPER SWEET NOTHINGS IN MY EAR" },
  { pairId: "senses-smell", kind: "task", title: "5 SENSES: SMELL", task: "SPRITS A BODY PART WITH A SWEET SCENT, CAN YOUR PARTNER FIND IT?" },
  { pairId: "senses-see", kind: "task", title: "5 SENSES: SEE", task: "CHANGE INTO SOMETHING SEXY AND GIVE ME A MINI SHOW" },
  { pairId: "senses-touch", kind: "task", title: "5 SENSES: TOUCH", task: "GENTLY RUB YOUR HANDS UP AND DOWN MY BODY" },
  { pairId: "senses-taste", kind: "task", title: "5 SENSES: TASTE", task: "TASTE TEST SOMETHING FROM THE FRIDGE OFF MY BODY" },
  { pairId: "talk-dirty", kind: "task", title: "TALK DIRTY TO ME", task: "TELL ME WHAT YOU WANT ME TO DO TO YOU" },
  { pairId: "remember-when", kind: "task", title: "REMEMBER WHEN", task: "SHARE YOUR FAVORITE SEXUAL MEMORY" },
  { pairId: "red-light", kind: "task", title: "RED LIGHT, GREEN LIGHT", task: "WHEN THINGS GET HEATED UP RANDOMLY STOP" },
  { pairId: "sneak-peak", kind: "task", title: "SNEAK PEAK", task: "FLASH ME YOUR GOODIES" },
  { pairId: "math-69", kind: "task", title: "(9X8)-3 = ?", task: "LET'S PRACTICE SOME MATH" },
  { pairId: "ice-ice-baby", kind: "task", title: "ICE ICE BABY", task: "RUB AN ICE CUBE ANYWHERE ON YOUR PARTNERS BODY" },
  { pairId: "no-hands-30", kind: "task", title: "NO HANDS ALLOWED FOR 30 SECONDS", task: "KISS ME SOMEWHERE NAUGHTY" },
  { pairId: "play-yourself", kind: "task", title: "PLAY WITH YOURSELF FOR 15 SECONDS", task: "PLAY WITH YOURSELF FOR 15 SECONDS" },
  { pairId: "makeout-2", kind: "task", title: "2 MINUTE MAKE OUT SESSION", task: "NO PEAKING AT THE TIMER" },
  { pairId: "remove-yours", kind: "task", title: "REMOVE AN ARTICLE OF CLOTHING YOUR CHOICE", task: "REMOVE AN ARTICLE OF CLOTHING YOUR CHOICE" },
  { pairId: "remove-partners", kind: "task", title: "REMOVE AN ARTICLE OF CLOTHING PARTNERS CHOICE", task: "REMOVE AN ARTICLE OF CLOTHING PARTNERS CHOICE" },
  { pairId: "pick-up", kind: "task", title: "TRY TO PICK ME UP", task: "GIVE ME YOUR BEST PICK UP LINE" },
  { pairId: "sex-position", kind: "task", title: "CHOOSE A NEW SEX POSITION", task: "PRACTICE IT FULLY CLOTHED" },
  { pairId: "make-laugh", kind: "task", title: "MAKE ME LAUGH", task: "SUCCEED AND YOU CAN DO WHATEVER YOU WANT TO ME FOR 30 SECONDS" },
  { pairId: "sex-toy", kind: "task", title: "USE YOUR FAVORITE SEXUAL TOY ON YOUR PARTNER", task: "BUZZ BUZZ ANYONE" },
  { pairId: "head-south", kind: "task", title: "HEAD DOWN SOUTH FOR A MINUTE OR TWO", task: "HEAD DOWN SOUTH FOR A MINUTE OR TWO" },
  { pairId: "wild-card", kind: "wild", title: "WILD CARD", task: "YOUR CHOICE FOR 1 MINUTE" },
  { pairId: "wild-card", kind: "wild", title: "WILD CARD", task: "YOUR CHOICE FOR 1 MINUTE" },
  { pairId: "first-base", kind: "task", title: "FIRST BASE", task: "KISS ME LIKE IT'S OUR FIRST TIME" },
  { pairId: "second-base", kind: "task", title: "SECOND BASE", task: "SHOW THE TWINS SOME LOVE" },
  { pairId: "third-base", kind: "task", title: "THIRD BASE", task: "SHOW ME WHAT YOUR HANDS CAN DO" },
  { pairId: "homerun", kind: "homerun", title: "HOME RUN", task: "JUST DO IT ALREADY" },
  { pairId: "foot-massage", kind: "bonus", title: "MINI FOOT MASSAGE", task: "MINI FOOT MASSAGE" },
  { pairId: "back-massage", kind: "bonus", title: "3 MINUTE BACK MASSAGE", task: "3 MINUTE BACK MASSAGE" },
  { pairId: "another-turn", kind: "bonus", title: "TAKE ANOTHER TURN", task: "TAKE ANOTHER TURN" },
  { pairId: "blank-1", kind: "blank", title: "BLANK CARD", task: "CREATE YOUR OWN TASK" },
  { pairId: "blank-2", kind: "blank", title: "BLANK CARD", task: "CREATE YOUR OWN TASK" },
  { pairId: "blank-3", kind: "blank", title: "BLANK CARD", task: "CREATE YOUR OWN TASK" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Stable IDs survive KV round-trips (pairId + library index + copy) */
function buildDeck(): GameCard[] {
  const cards: GameCard[] = [];
  CARD_LIBRARY.forEach((def, libIndex) => {
    const copies = def.kind === "homerun" ? 1 : 2;
    for (let c = 0; c < copies; c++) {
      cards.push({
        ...def,
        id: `${def.pairId}@${libIndex}@${c}`,
      });
    }
  });
  return shuffle(cards);
}

/** Migrate sessions saved with old deckIds-only format */
function migrateLegacySession(raw: Record<string, unknown>): TeaseGameSession {
  const s = raw as TeaseGameSession & {
    pleasing?: { deckIds?: string[]; deck?: GameCard[] };
    teasing?: { deckIds?: string[]; deck?: GameCard[]; hands?: Record<string, string[] | GameCard[]> };
    memory?: { cells?: Array<{ cardId?: string; card?: GameCard; faceUp: boolean; matched: boolean }> };
  };

  const resolveLegacyId = (id: string): GameCard | null => {
    for (let i = 0; i < CARD_LIBRARY.length; i++) {
      const def = CARD_LIBRARY[i];
      if (id.startsWith(`${def.pairId}-`) || id.startsWith(`${def.pairId}@`)) {
        return { ...def, id };
      }
    }
    return null;
  };

  if (s.pleasing && (s.pleasing as { deckIds?: string[] }).deckIds && !s.pleasing.deck) {
    s.pleasing = {
      deck: ((s.pleasing as { deckIds: string[] }).deckIds)
        .map((id) => resolveLegacyId(id))
        .filter((c): c is GameCard => c !== null),
    };
  }

  if (s.teasing) {
    const t = s.teasing as {
      deckIds?: string[];
      deck?: GameCard[];
      hands?: Record<string, string[] | GameCard[]>;
      matches?: Record<string, number>;
    };
    const deck = t.deck ?? (t.deckIds?.map((id) => resolveLegacyId(id)).filter(Boolean) as GameCard[]) ?? [];
    const hands: Record<string, GameCard[]> = {};
    for (const [uid, h] of Object.entries(t.hands ?? {})) {
      hands[uid] = Array.isArray(h)
        ? h.map((item) =>
          typeof item === "string" ? resolveLegacyId(item) : item
        ).filter((c): c is GameCard => c != null)
        : [];
    }
    s.teasing = { deck, hands, matches: t.matches ?? {} };
  }

  if (s.memory?.cells) {
    s.memory = {
      cells: s.memory.cells.map((cell) => {
        if (cell.card) return cell as MemoryCellState;
        const legacyId = (cell as { cardId?: string }).cardId;
        const card = legacyId ? resolveLegacyId(legacyId) : null;
        return card
          ? { card, faceUp: cell.faceUp, matched: cell.matched }
          : null;
      }).filter((c): c is MemoryCellState => c !== null),
      flippedIndices: s.memory.flippedIndices ?? [],
      resolveAt: s.memory.resolveAt ?? null,
    };
  }

  return s as TeaseGameSession;
}

function sessionKey(coupleId: string) {
  return `tease_game:${coupleId}`;
}

export async function getSession(coupleId: string): Promise<TeaseGameSession | null> {
  const raw = await kv.get(sessionKey(coupleId));
  if (!raw) return null;
  return migrateLegacySession(raw as Record<string, unknown>);
}

async function saveSession(session: TeaseGameSession) {
  session.updatedAt = new Date().toISOString();
  await kv.set(sessionKey(session.coupleId), session);
}

function partnerId(session: TeaseGameSession, userId: string): string {
  return userId === session.hostUserId ? session.partnerUserId : session.hostUserId;
}

function initGameState(
  mode: GameMode,
  hostUserId: string,
  partnerUserId: string,
) {
  const deck = buildDeck();
  const base = {
    mode,
    activeUserId: hostUserId,
    phase: "playing" as const,
    tableCard: null as GameCard | null,
    tableCardFromUserId: null as string | null,
    awaitingAckFromUserId: null as string | null,
    pleasing: { deck: [] as GameCard[] },
    memory: { cells: [] as MemoryCellState[], flippedIndices: [] as number[], resolveAt: null },
    teasing: {
      hands: {} as Record<string, GameCard[]>,
      deck: [] as GameCard[],
      matches: {} as Record<string, number>,
    },
  };

  if (mode === "pleasing") {
    base.pleasing.deck = deck;
  } else if (mode === "memory") {
    const grid = shuffle(deck).slice(0, 24);
    base.memory.cells = grid.map((c) => ({ card: c, faceUp: false, matched: false }));
  } else {
    const shuffled = shuffle(deck);
    base.teasing.hands[hostUserId] = shuffled.slice(0, 5);
    base.teasing.hands[partnerUserId] = shuffled.slice(5, 10);
    base.teasing.deck = shuffled.slice(10);
    base.teasing.matches[hostUserId] = 0;
    base.teasing.matches[partnerUserId] = 0;
  }

  return base;
}

export async function createInvite(
  couple: { coupleId: string; user1Id: string; user2Id: string },
  hostUserId: string,
  hostName: string,
  partnerUserId: string,
  partnerName: string,
  mode: GameMode,
): Promise<TeaseGameSession> {
  const existing = await getSession(couple.coupleId);
  if (existing?.status === "active") {
    throw new Error("A game is already in progress");
  }

  const session: TeaseGameSession = {
    coupleId: couple.coupleId,
    status: "invite_pending",
    mode,
    hostUserId,
    hostName,
    partnerUserId,
    partnerName,
    acceptedAt: null,
    activeUserId: hostUserId,
    phase: "playing",
    tableCard: null,
    tableCardFromUserId: null,
    awaitingAckFromUserId: null,
    pleasing: { deck: [] },
    memory: { cells: [], flippedIndices: [], resolveAt: null },
    teasing: { hands: {}, deck: [], matches: {} },
    updatedAt: new Date().toISOString(),
  };

  await saveSession(session);
  return session;
}

export async function acceptInvite(
  coupleId: string,
  userId: string,
): Promise<TeaseGameSession> {
  const session = await getSession(coupleId);
  if (!session || session.status !== "invite_pending") {
    throw new Error("No pending invite");
  }
  if (userId !== session.partnerUserId) {
    throw new Error("Only your partner can accept this invite");
  }

  const init = initGameState(session.mode, session.hostUserId, session.partnerUserId);

  const active: TeaseGameSession = {
    ...session,
    ...init,
    status: "active",
    acceptedAt: new Date().toISOString(),
  };

  await saveSession(active);
  return active;
}

export async function declineInvite(coupleId: string, userId: string) {
  const session = await getSession(coupleId);
  if (!session || session.status !== "invite_pending") return null;
  if (userId !== session.partnerUserId && userId !== session.hostUserId) {
    throw new Error("Not allowed");
  }
  await kv.del(sessionKey(coupleId));
  return { cleared: true };
}

export async function cancelSession(coupleId: string, userId: string) {
  const session = await getSession(coupleId);
  if (!session) return null;
  if (userId !== session.hostUserId && userId !== session.partnerUserId) {
    throw new Error("Not allowed");
  }
  await kv.del(sessionKey(coupleId));
  return { cleared: true };
}

function showTableCard(session: TeaseGameSession, card: GameCard, fromUserId: string) {
  session.tableCard = card;
  session.tableCardFromUserId = fromUserId;
  session.awaitingAckFromUserId = null;
  if (card.kind === "homerun") {
    session.phase = "finished";
  }
}

function switchTurn(session: TeaseGameSession) {
  session.activeUserId = partnerId(session, session.activeUserId);
}

const MEMORY_REVEAL_MS = 2500;

/** After two flips, keep both cards face-up briefly before match resolve or turn switch. */
function applyMemoryResolveIfDue(session: TeaseGameSession): boolean {
  if (session.mode !== "memory") return false;
  const { resolveAt, flippedIndices } = session.memory;
  if (!resolveAt || flippedIndices.length !== 2) return false;
  if (Date.now() < resolveAt) return false;

  const cells = session.memory.cells;
  const [a, b] = flippedIndices;
  const cardA = cells[a]?.card;
  const cardB = cells[b]?.card;
  if (!cardA || !cardB) {
    session.memory.flippedIndices = [];
    session.memory.resolveAt = null;
    return true;
  }

  const match = cardA.pairId === cardB.pairId;
  if (match) {
    cells[a].matched = true;
    cells[b].matched = true;
    showTableCard(session, cardA, session.activeUserId);
  } else {
    cells[a].faceUp = false;
    cells[b].faceUp = false;
    switchTurn(session);
  }
  session.memory.flippedIndices = [];
  session.memory.resolveAt = null;
  return true;
}

export async function getSessionAndResolve(coupleId: string): Promise<TeaseGameSession | null> {
  const session = await getSession(coupleId);
  if (!session) return null;
  if (applyMemoryResolveIfDue(session)) {
    await saveSession(session);
  }
  return session;
}

export async function gameAction(
  coupleId: string,
  userId: string,
  action: string,
  payload: Record<string, unknown> = {},
): Promise<TeaseGameSession> {
  const session = await getSessionAndResolve(coupleId);
  if (!session || session.status !== "active") {
    throw new Error("No active game");
  }

  if (session.awaitingAckFromUserId === userId && action !== "ack_card") {
    throw new Error("Acknowledge your partner's card first");
  }

  if (action !== "ack_card" && session.activeUserId !== userId) {
    throw new Error("Not your turn");
  }

  switch (action) {
    case "draw": {
      if (session.mode !== "pleasing") throw new Error("Invalid action for this mode");
      const deck = session.pleasing.deck;
      if (deck.length === 0) {
        session.phase = "finished";
        break;
      }
      const [card, ...rest] = deck;
      session.pleasing.deck = rest;
      showTableCard(session, card, userId);
      break;
    }
    case "memory_flip": {
      if (session.mode !== "memory") throw new Error("Invalid action for this mode");
      if (session.memory.resolveAt) throw new Error("Wait for cards to resolve");
      const index = Number(payload.index);
      if (Number.isNaN(index)) throw new Error("index required");
      const cells = session.memory.cells;
      const cell = cells[index];
      if (!cell || cell.matched || cell.faceUp) throw new Error("Invalid flip");
      if (session.memory.flippedIndices.length >= 2) throw new Error("Wait for flip resolve");

      cell.faceUp = true;
      const flipped = [...session.memory.flippedIndices, index];
      session.memory.flippedIndices = flipped;

      if (flipped.length === 2) {
        session.memory.resolveAt = Date.now() + MEMORY_REVEAL_MS;
      }
      break;
    }
    case "teasing_draw": {
      if (session.mode !== "teasing") throw new Error("Invalid action for this mode");
      const pile = session.teasing.deck;
      if (pile.length === 0) {
        session.phase = "finished";
        break;
      }
      const [drawn, ...rest] = pile;
      session.teasing.deck = rest;
      const hand = [...(session.teasing.hands[userId] || []), drawn];
      const counts: Record<string, number> = {};
      for (const c of hand) {
        counts[c.pairId] = (counts[c.pairId] || 0) + 1;
      }
      const matchedPairId = Object.keys(counts).find((k) => counts[k] >= 2);
      if (matchedPairId) {
        const pairCards = hand.filter((c) => c.pairId === matchedPairId);
        session.teasing.hands[userId] = hand.filter((c) => c.pairId !== matchedPairId);
        showTableCard(session, pairCards[0], userId);
        session.teasing.matches[userId] = (session.teasing.matches[userId] || 0) + 1;
        if (session.teasing.matches[userId] >= 5) session.phase = "finished";
      } else {
        session.teasing.hands[userId] = hand;
        switchTurn(session);
      }
      break;
    }
    case "pass_card": {
      if (!session.tableCard) throw new Error("No card to pass");
      if (session.tableCardFromUserId !== userId) {
        throw new Error("Only the player who drew this card can pass it");
      }
      session.awaitingAckFromUserId = partnerId(session, userId);
      switchTurn(session);
      break;
    }
    case "ack_card": {
      if (session.awaitingAckFromUserId !== userId) {
        throw new Error("Nothing to acknowledge");
      }
      session.tableCard = null;
      session.tableCardFromUserId = null;
      session.awaitingAckFromUserId = null;
      break;
    }
    case "skip_card": {
      session.tableCard = null;
      session.tableCardFromUserId = null;
      session.awaitingAckFromUserId = null;
      switchTurn(session);
      break;
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  applyMemoryResolveIfDue(session);
  await saveSession(session);
  return session;
}

export function sessionForClient(session: TeaseGameSession, userId: string) {
  const isHost = userId === session.hostUserId;
  const partnerDisplayName = isHost ? session.partnerName : session.hostName;

  return {
    session,
    isHost,
    isYourTurn:
      session.status === "active" &&
      session.activeUserId === userId &&
      session.awaitingAckFromUserId !== userId,
    needsAck: session.awaitingAckFromUserId === userId,
    showYourCard:
      session.tableCard != null &&
      session.tableCardFromUserId === userId &&
      !session.awaitingAckFromUserId,
    partnerDisplayName,
    tableCard: session.tableCard,
    teasingHandCards: session.teasing.hands[userId] || [],
    pileCount: session.mode === "pleasing"
      ? session.pleasing.deck.length
      : session.mode === "teasing"
      ? session.teasing.deck.length
      : 0,
  };
}
