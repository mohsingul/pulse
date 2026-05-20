import * as kv from "./kv_store.ts";

const VALID_STATUS_IDS = [
  "loved", "great", "calm", "low", "need_affection", "need_talk",
  "stressed", "drained", "romantic", "playful", "intimacy", "support",
] as const;

const VALID_ENERGY = ["very_high", "high", "moderate", "low", "exhausted"];
const VALID_STRESS = ["low", "moderate", "high", "very_high"];
const VALID_AFFECTION = ["overflowing", "happy", "average", "missing_you", "need_more"];
const VALID_COMMUNICATION = ["talkative", "open", "relaxed", "reflective", "quiet"];

const LEGACY_STATUS_MAP: Record<string, string> = {
  great: "great",
  low: "low",
  attention: "need_affection",
  support: "support",
};

const STATUS_COPY: Record<string, {
  homeMessage: (name: string) => string;
  pushTitle: (name: string) => string;
  pushBody: (name: string) => string;
}> = {
  loved: {
    homeMessage: (n) => `${n} is feeling loved today 💕`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling loved today 💕`,
  },
  great: {
    homeMessage: (n) => `${n} is having a great day 😊`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is having a great day 😊`,
  },
  calm: {
    homeMessage: (n) => `${n} is having a calm day 🌊`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is calm and relaxed today 🌊`,
  },
  low: {
    homeMessage: (n) => `${n} may appreciate some kindness today ❤️`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling low today`,
  },
  need_affection: {
    homeMessage: (n) => `${n} could use a little extra affection today 🤗`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} could use extra affection today 🤗`,
  },
  need_talk: {
    homeMessage: (n) => `${n} would like some quality conversation today 💬`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} would like to talk today 💬`,
  },
  stressed: {
    homeMessage: (n) => `${n} is feeling stressed today 😩`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling stressed today 😩`,
  },
  drained: {
    homeMessage: (n) => `${n} may need emotional support today 🫂`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} may need emotional support today 🫂`,
  },
  romantic: {
    homeMessage: (n) => `${n} is feeling romantic tonight 🌹`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling romantic tonight 🔥`,
  },
  playful: {
    homeMessage: (n) => `${n} is feeling playful today 😈`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} is feeling playful today 😈`,
  },
  intimacy: {
    homeMessage: (n) => `${n} would love some extra intimacy today ❤️`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} shared a private status with you ❤️`,
  },
  support: {
    homeMessage: (n) => `${n} needs your support today ❤️`,
    pushTitle: (n) => `❤️ ${n} updated their status`,
    pushBody: (n) => `${n} needs your support today ❤️`,
  },
};

export type PartnerStatusPayload = {
  statusId: string;
  energy?: string;
  stress?: string;
  affection?: string;
  communication?: string;
  updatedAt: string;
};

export type PartnerStatusRecord = {
  coupleId: string;
  user1: PartnerStatusPayload | null;
  user2: PartnerStatusPayload | null;
};

function migrateLegacyRecord(raw: any, coupleId: string): PartnerStatusRecord {
  if (raw?.user1?.statusId || raw?.user2?.statusId) {
    return { coupleId, user1: raw.user1 ?? null, user2: raw.user2 ?? null };
  }

  const now = new Date().toISOString();
  const toPayload = (legacyStatus: string | null, updatedAt: string | null): PartnerStatusPayload | null => {
    if (!legacyStatus) return null;
    const statusId = LEGACY_STATUS_MAP[legacyStatus] ?? legacyStatus;
    if (!VALID_STATUS_IDS.includes(statusId as typeof VALID_STATUS_IDS[number])) return null;
    return {
      statusId,
      energy: "moderate",
      stress: "low",
      affection: "happy",
      communication: "open",
      updatedAt: updatedAt ?? now,
    };
  };

  return {
    coupleId,
    user1: toPayload(raw?.user1Status, raw?.user1UpdatedAt),
    user2: toPayload(raw?.user2Status, raw?.user2UpdatedAt),
  };
}

export async function getPartnerStatusRecord(coupleId: string): Promise<PartnerStatusRecord> {
  const raw = await kv.get(`partner_needs:${coupleId}`);
  if (!raw) {
    return { coupleId, user1: null, user2: null };
  }
  return migrateLegacyRecord(raw, coupleId);
}

export function validateStatusPayload(body: Record<string, unknown>): {
  ok: true;
  data: Omit<PartnerStatusPayload, "updatedAt">;
} | { ok: false; error: string } {
  const statusId = String(body.statusId ?? body.status ?? "");
  if (!VALID_STATUS_IDS.includes(statusId as typeof VALID_STATUS_IDS[number])) {
    return { ok: false, error: "Invalid status" };
  }

  const energy = body.energy ? String(body.energy) : "moderate";
  const stress = body.stress ? String(body.stress) : "low";
  const affection = body.affection ? String(body.affection) : "happy";
  const communication = body.communication ? String(body.communication) : "open";

  if (!VALID_ENERGY.includes(energy)) return { ok: false, error: "Invalid energy level" };
  if (!VALID_STRESS.includes(stress)) return { ok: false, error: "Invalid stress level" };
  if (!VALID_AFFECTION.includes(affection)) return { ok: false, error: "Invalid affection level" };
  if (!VALID_COMMUNICATION.includes(communication)) return { ok: false, error: "Invalid communication mood" };

  return {
    ok: true,
    data: { statusId, energy, stress, affection, communication },
  };
}

export function getStatusNotificationCopy(statusId: string, displayName: string) {
  return STATUS_COPY[statusId] ?? {
    homeMessage: (n: string) => `${n} updated their status`,
    pushTitle: (n: string) => `❤️ ${n} updated their status`,
    pushBody: (n: string) => `${n} shared how they're feeling today`,
  };
}
