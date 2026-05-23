/**
 * Couple-synced Sexy Dice game (KV-backed)
 */
import * as kv from "./kv_store.ts";

export type DiceId = "action" | "body" | "time" | "toys" | "sex" | "location";
export type SessionStatus = "idle" | "invite_pending" | "active" | "finished";

const DICE_FACES: Record<DiceId, string[]> = {
  action: ["kiss", "tickle", "nibble", "lick", "suck", "blow"],
  body: ["neck", "bottom", "lips", "chest", "navel", "inner thigh"],
  time: ["2 minutes", "5 minutes", "7 minutes", "10 minutes", "12 minutes", "15 minutes"],
  toys: ["massager", "blindfold", "ice", "heat", "tickler", "handcuffs"],
  sex: [
    "heavy foreplay",
    "I'm on top",
    "his choice",
    "her choice",
    "a quickie",
    "wet and wild",
  ],
  location: ["bedroom", "table", "floor", "couch", "chair", "shower"],
};

export interface DiceRollFace {
  diceId: DiceId;
  faceIndex: number;
  label: string;
}

export interface SexyDiceSession {
  coupleId: string;
  status: SessionStatus;
  hostUserId: string;
  hostName: string;
  partnerUserId: string;
  partnerName: string;
  acceptedAt: string | null;
  enabledDice: DiceId[];
  activeUserId: string;
  lastRoll: DiceRollFace[] | null;
  lastRollByUserId: string | null;
  rollSeq: number;
  updatedAt: string;
}

function sessionKey(coupleId: string) {
  return `sexy_dice_game:${coupleId}`;
}

function partnerId(session: SexyDiceSession, userId: string): string {
  return userId === session.hostUserId ? session.partnerUserId : session.hostUserId;
}

function validateEnabledDice(enabledDice: unknown): DiceId[] {
  if (!Array.isArray(enabledDice) || enabledDice.length === 0) {
    throw new Error("Select at least one die");
  }
  const valid = enabledDice.filter((id): id is DiceId =>
    typeof id === "string" && id in DICE_FACES
  );
  if (valid.length === 0) throw new Error("Invalid dice selection");
  return valid;
}

export async function getSession(coupleId: string): Promise<SexyDiceSession | null> {
  const raw = await kv.get(sessionKey(coupleId));
  return raw ? (raw as SexyDiceSession) : null;
}

async function saveSession(session: SexyDiceSession) {
  session.updatedAt = new Date().toISOString();
  await kv.set(sessionKey(session.coupleId), session);
}

export async function createInvite(
  couple: { coupleId: string },
  hostUserId: string,
  hostName: string,
  partnerUserId: string,
  partnerName: string,
  enabledDice: DiceId[],
): Promise<SexyDiceSession> {
  const existing = await getSession(couple.coupleId);
  if (existing?.status === "active" || existing?.status === "invite_pending") {
    throw new Error("A dice game is already in progress");
  }

  const dice = validateEnabledDice(enabledDice);

  const session: SexyDiceSession = {
    coupleId: couple.coupleId,
    status: "invite_pending",
    hostUserId,
    hostName,
    partnerUserId,
    partnerName,
    acceptedAt: null,
    enabledDice: dice,
    activeUserId: hostUserId,
    lastRoll: null,
    lastRollByUserId: null,
    rollSeq: 0,
    updatedAt: new Date().toISOString(),
  };

  await saveSession(session);
  return session;
}

export async function acceptInvite(
  coupleId: string,
  userId: string,
): Promise<SexyDiceSession> {
  const session = await getSession(coupleId);
  if (!session || session.status !== "invite_pending") {
    throw new Error("No pending invite");
  }
  if (userId !== session.partnerUserId) {
    throw new Error("Only your partner can accept this invite");
  }

  const active: SexyDiceSession = {
    ...session,
    status: "active",
    acceptedAt: new Date().toISOString(),
    activeUserId: session.hostUserId,
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

function rollEnabledDice(enabledDice: DiceId[]): DiceRollFace[] {
  return enabledDice.map((diceId) => {
    const faces = DICE_FACES[diceId];
    const faceIndex = Math.floor(Math.random() * faces.length);
    return { diceId, faceIndex, label: faces[faceIndex] };
  });
}

export async function rollDice(
  coupleId: string,
  userId: string,
): Promise<SexyDiceSession> {
  const session = await getSession(coupleId);
  if (!session || session.status !== "active") {
    throw new Error("No active game");
  }
  if (session.activeUserId !== userId) {
    throw new Error("Not your turn to roll");
  }

  session.lastRoll = rollEnabledDice(session.enabledDice);
  session.lastRollByUserId = userId;
  session.rollSeq += 1;
  session.activeUserId = partnerId(session, userId);

  await saveSession(session);
  return session;
}

export async function endGame(coupleId: string, userId: string): Promise<SexyDiceSession> {
  const session = await getSession(coupleId);
  if (!session || session.status !== "active") {
    throw new Error("No active game");
  }
  if (userId !== session.hostUserId && userId !== session.partnerUserId) {
    throw new Error("Not allowed");
  }
  session.status = "finished";
  await saveSession(session);
  return session;
}

export function sessionForClient(session: SexyDiceSession, userId: string) {
  const isHost = userId === session.hostUserId;
  const partnerDisplayName = isHost ? session.partnerName : session.hostName;

  return {
    session,
    isHost,
    isYourTurn: session.status === "active" && session.activeUserId === userId,
    partnerDisplayName,
    enabledDice: session.enabledDice,
    lastRoll: session.lastRoll,
    rollSeq: session.rollSeq,
    lastRollByUserId: session.lastRollByUserId,
  };
}
