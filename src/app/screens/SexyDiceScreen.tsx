import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/app/components/Button';
import { AnimatedDie } from '@/app/components/AnimatedDie';
import {
  ALL_DICE_IDS,
  OFFICIAL_RULES,
  SEXY_DICE,
  buildRollPrompt,
  type DiceId,
  type DiceRollFace,
} from '@/app/constants/sexyDice';
import { sexyDiceGameAPI } from '@/utils/api';
import {
  ArrowLeft,
  Dices,
  RotateCcw,
  Users,
  Loader2,
  Info,
  Sparkles,
} from 'lucide-react';

interface SexyDiceScreenProps {
  coupleId: string;
  userId: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
}

interface SyncView {
  session: {
    status: string;
    hostUserId: string;
    hostName: string;
    partnerName: string;
    enabledDice: DiceId[];
    activeUserId: string;
  } | null;
  isHost: boolean;
  isYourTurn: boolean;
  partnerDisplayName: string;
  enabledDice: DiceId[];
  lastRoll: DiceRollFace[] | null;
  rollSeq: number;
  lastRollByUserId: string | null;
}

export function SexyDiceScreen({
  coupleId,
  userId,
  userName,
  partnerName,
  onBack,
}: SexyDiceScreenProps) {
  const [sync, setSync] = useState<SyncView | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDice, setSelectedDice] = useState<DiceId[]>([...ALL_DICE_IDS]);
  const [showRules, setShowRules] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [settledCount, setSettledCount] = useState(0);
  const [awaitingPartnerAccept, setAwaitingPartnerAccept] = useState(false);
  const lastAnimatedSeq = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const data = await sexyDiceGameAPI.get(coupleId, userId);
      if (data?.session) {
        setSync(data as SyncView);
        if (data.session.status === 'invite_pending' && data.isHost) {
          setAwaitingPartnerAccept(true);
        }
        if (data.session.status === 'active' || data.session.status === 'finished') {
          setAwaitingPartnerAccept(false);
        }
      } else if (!awaitingPartnerAccept) {
        setSync(null);
      }
    } catch (e) {
      console.error('[Sexy Dice] poll failed', e);
    } finally {
      setLoading(false);
    }
  }, [coupleId, userId, awaitingPartnerAccept]);

  useEffect(() => {
    refresh();
    const pollMs = awaitingPartnerAccept ? 1000 : 1500;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, awaitingPartnerAccept]);

  const rollSeq = sync?.rollSeq ?? 0;
  const lastRoll = sync?.lastRoll ?? null;

  useEffect(() => {
    if (!lastRoll || rollSeq === 0) return;
    if (rollSeq > lastAnimatedSeq.current) {
      lastAnimatedSeq.current = rollSeq;
      setIsRolling(true);
      setShowPrompt(false);
      setSettledCount(0);
    }
  }, [rollSeq, lastRoll]);

  useEffect(() => {
    if (!isRolling || !lastRoll) return;
    if (settledCount >= lastRoll.length) {
      setIsRolling(false);
      setShowPrompt(true);
    }
  }, [settledCount, isRolling, lastRoll]);

  const toggleDie = (id: DiceId) => {
    setSelectedDice((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((d) => d !== id) : prev) : [...prev, id],
    );
  };

  const sendInvite = async () => {
    setAwaitingPartnerAccept(true);
    setActionLoading(true);
    try {
      const data = await sexyDiceGameAPI.invite(coupleId, userId, userName, selectedDice);
      setSync(data as SyncView);
      setAwaitingPartnerAccept(true);
    } catch (e: unknown) {
      setAwaitingPartnerAccept(false);
      alert(e instanceof Error ? e.message : 'Could not send invite');
    } finally {
      setActionLoading(false);
    }
  };

  const acceptInvite = async () => {
    setActionLoading(true);
    try {
      const data = await sexyDiceGameAPI.accept(coupleId, userId);
      setSync(data as SyncView);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not accept');
    } finally {
      setActionLoading(false);
    }
  };

  const declineInvite = async () => {
    await sexyDiceGameAPI.decline(coupleId, userId);
    await refresh();
  };

  const cancelGame = async () => {
    setAwaitingPartnerAccept(false);
    await sexyDiceGameAPI.cancel(coupleId, userId);
    lastAnimatedSeq.current = 0;
    setShowPrompt(false);
    setIsRolling(false);
    setSync(null);
    await refresh();
  };

  const roll = async () => {
    setActionLoading(true);
    try {
      const data = await sexyDiceGameAPI.roll(coupleId, userId);
      setSync(data as SyncView);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not roll');
    } finally {
      setActionLoading(false);
    }
  };

  const endGame = async () => {
    setActionLoading(true);
    try {
      const data = await sexyDiceGameAPI.end(coupleId, userId);
      setSync(data as SyncView);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not end game');
    } finally {
      setActionLoading(false);
    }
  };

  const session = sync?.session;
  const status = session?.status ?? 'idle';
  const isHost =
    sync?.isHost === true || (session?.hostUserId != null && session.hostUserId === userId);
  const isYourTurn = sync?.isYourTurn ?? false;
  const partnerLabel = sync?.partnerDisplayName || partnerName;
  const enabledDice = sync?.enabledDice ?? session?.enabledDice ?? selectedDice;
  const prompt = lastRoll ? buildRollPrompt(lastRoll) : '';

  const isSendingInvite = actionLoading && awaitingPartnerAccept;
  const isHostWaitingForAccept =
    awaitingPartnerAccept &&
    isHost &&
    status !== 'active' &&
    status !== 'finished';

  if (loading && !sync && !awaitingPartnerAccept) {
    return (
      <InviteLoadingScreen message="Loading game…" onBack={onBack} />
    );
  }

  if (isSendingInvite) {
    return (
      <InviteLoadingScreen message="Sending invite…" onBack={onBack} />
    );
  }

  if (isHostWaitingForAccept || (status === 'invite_pending' && isHost)) {
    return (
      <InviteWaitingScreen
        partnerName={partnerName}
        enabledDice={enabledDice}
        onCancel={cancelGame}
        onBack={onBack}
      />
    );
  }

  if (status === 'invite_pending' && !isHost) {
    return (
      <PartnerInviteScreen
        hostName={session?.hostName ?? 'Your partner'}
        enabledDice={enabledDice}
        onAccept={acceptInvite}
        onDecline={declineInvite}
        onBack={onBack}
        loading={actionLoading}
      />
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <header className="px-4 py-4 flex items-center gap-3 border-b border-border safe-top flex-shrink-0 bg-gradient-to-r from-fuchsia-950/40 via-background to-rose-950/30">
        <button type="button" onClick={onBack} className="p-2 hover:bg-accent rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Dices className="w-5 h-5 text-fuchsia-400" />
            Sexy Dice
          </h1>
          {status === 'active' && (
            <p className="text-xs text-muted-foreground truncate">
              {isYourTurn ? 'Your turn to roll' : `Waiting for ${partnerLabel} to roll`}
            </p>
          )}
        </div>
        {(status === 'active' || status === 'invite_pending') && (
          <button type="button" onClick={cancelGame} className="p-2 hover:bg-accent rounded-full" title="End game">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-10">
        {(status === 'idle' || !session) && !awaitingPartnerAccept && (
          <Lobby
            partnerName={partnerName}
            selectedDice={selectedDice}
            toggleDie={toggleDie}
            showRules={showRules}
            setShowRules={setShowRules}
            onInvite={sendInvite}
            loading={actionLoading}
          />
        )}

        {status === 'active' && (
          <ActiveBoard
            enabledDice={enabledDice}
            lastRoll={lastRoll}
            rollSeq={rollSeq}
            isRolling={isRolling}
            showPrompt={showPrompt}
            prompt={prompt}
            isYourTurn={isYourTurn}
            partnerLabel={partnerLabel}
            onRoll={roll}
            onEnd={endGame}
            loading={actionLoading}
            onDieSettled={() => setSettledCount((c) => c + 1)}
          />
        )}

        {status === 'finished' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 max-w-md mx-auto text-center px-4">
            <div className="text-6xl">🎲</div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-400">
              Game over
            </h2>
            <p className="text-sm text-muted-foreground">Enjoy — or start a new round anytime.</p>
            <Button variant="gradient" onClick={cancelGame}>
              Back to menu
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InviteLoadingScreen({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="h-full w-full flex flex-col bg-background">
      <header className="px-4 py-4 flex items-center gap-3 border-b border-border safe-top">
        <button type="button" onClick={onBack} className="p-2 hover:bg-accent rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Dices className="w-5 h-5 text-fuchsia-400" />
          Sexy Dice
        </h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-fuchsia-400" />
        <p className="text-lg font-semibold">{message}</p>
        <p className="text-sm text-muted-foreground">Please wait…</p>
      </div>
    </div>
  );
}

function InviteWaitingScreen({
  partnerName,
  enabledDice,
  onCancel,
  onBack,
}: {
  partnerName: string;
  enabledDice: DiceId[];
  onCancel: () => void;
  onBack: () => void;
}) {
  return (
    <div className="h-full w-full flex flex-col bg-background">
      <header className="px-4 py-4 flex items-center gap-3 border-b border-border safe-top bg-gradient-to-r from-fuchsia-950/40 via-background to-rose-950/30">
        <button type="button" onClick={onBack} className="p-2 hover:bg-accent rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold">Waiting for {partnerName}</h1>
          <p className="text-xs text-muted-foreground">Invite sent — game starts when they accept</p>
        </div>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-accent rounded-full" title="Cancel invite">
          <RotateCcw className="w-4 h-4" />
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-fuchsia-500/10 flex items-center justify-center">
            <Users className="w-12 h-12 text-fuchsia-400" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-[#A83FFF] absolute -bottom-1 -right-1" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-bold">Waiting for {partnerName} to join</h2>
          <p className="text-sm text-muted-foreground">
            Ask them to open Aimo Pulse, tap the dice icon on home, and tap Accept. This screen
            updates automatically when they join.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {enabledDice.map((id) => (
            <span
              key={id}
              className="text-xs px-2.5 py-1 rounded-full border"
              style={{ borderColor: SEXY_DICE[id].color }}
            >
              {SEXY_DICE[id].emoji} {SEXY_DICE[id].name}
            </span>
          ))}
        </div>
        <Button variant="ghost" onClick={onCancel}>
          Cancel invite
        </Button>
      </div>
    </div>
  );
}

function PartnerInviteScreen({
  hostName,
  enabledDice,
  onAccept,
  onDecline,
  onBack,
  loading,
}: {
  hostName: string;
  enabledDice: DiceId[];
  onAccept: () => void;
  onDecline: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="h-full w-full flex flex-col bg-background">
      <header className="px-4 py-4 flex items-center gap-3 border-b border-border safe-top">
        <button type="button" onClick={onBack} className="p-2 hover:bg-accent rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Game invite</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 max-w-md mx-auto w-full">
        <div className="text-6xl">🎲</div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{hostName} invited you</h2>
          <p className="text-sm text-muted-foreground">
            Play Sexy Dice together — rolls sync live on both phones.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {enabledDice.map((id) => (
            <span key={id} className="text-xs px-2.5 py-1 rounded-full bg-accent">
              {SEXY_DICE[id].emoji} {SEXY_DICE[id].name}
            </span>
          ))}
        </div>
        <div className="w-full space-y-3">
          <Button variant="gradient" size="lg" className="w-full" onClick={onAccept} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                Starting…
              </>
            ) : (
              'Accept & start game'
            )}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onDecline} disabled={loading}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

function Lobby({
  partnerName,
  selectedDice,
  toggleDie,
  showRules,
  setShowRules,
  onInvite,
  loading,
}: {
  partnerName: string;
  selectedDice: DiceId[];
  toggleDie: (id: DiceId) => void;
  showRules: boolean;
  setShowRules: (v: boolean) => void;
  onInvite: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="relative rounded-3xl overflow-hidden border border-fuchsia-500/25 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950 via-rose-950 to-purple-950" />
        <div className="relative space-y-3 text-sm text-fuchsia-100/90">
          <h2 className="text-xl font-bold text-white text-center">Play together</h2>
          <p className="text-center text-fuchsia-100/80">
            Choose your dice, then invite {partnerName}. They must accept before you roll. Turns alternate
            each roll.
          </p>
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="w-full py-2 rounded-xl border border-fuchsia-400/30 text-xs font-semibold text-fuchsia-100 flex items-center justify-center gap-2"
          >
            <Info className="w-3.5 h-3.5" />
            {showRules ? 'Hide rules' : 'How to play'}
          </button>
        </div>
      </div>

      {showRules && (
        <ol className="text-xs text-muted-foreground space-y-2 p-4 rounded-xl bg-accent/40 list-decimal list-inside">
          {OFFICIAL_RULES.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Pick dice (1–6)
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ALL_DICE_IDS.map((id) => {
          const def = SEXY_DICE[id];
          const on = selectedDice.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleDie(id)}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                on ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-border opacity-60'
              }`}
            >
              <span className="text-2xl">{def.emoji}</span>
              <p className="font-semibold text-sm mt-1">{def.name}</p>
              <p className="text-[10px] text-muted-foreground">6 faces</p>
            </button>
          );
        })}
      </div>

      <Button
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={selectedDice.length === 0 || loading}
        onClick={onInvite}
      >
        <Users className="w-5 h-5 mr-2 inline" />
        Invite {partnerName} to play
      </Button>

      <p className="text-center text-[10px] text-muted-foreground">{OFFICIAL_RULES.attribution}</p>
    </div>
  );
}

function ActiveBoard({
  enabledDice,
  lastRoll,
  rollSeq,
  isRolling,
  showPrompt,
  prompt,
  isYourTurn,
  partnerLabel,
  onRoll,
  onEnd,
  loading,
  onDieSettled,
}: {
  enabledDice: DiceId[];
  lastRoll: DiceRollFace[] | null;
  rollSeq: number;
  isRolling: boolean;
  showPrompt: boolean;
  prompt: string;
  isYourTurn: boolean;
  partnerLabel: string;
  onRoll: () => void;
  onEnd: () => void;
  loading: boolean;
  onDieSettled: () => void;
}) {
  const rollById = lastRoll
    ? Object.fromEntries(lastRoll.map((r) => [r.diceId, r]))
    : {} as Partial<Record<DiceId, DiceRollFace>>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div
        className={`grid gap-4 justify-items-center ${
          enabledDice.length <= 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {enabledDice.map((id) => {
          const face = rollById[id];
          const def = SEXY_DICE[id];
          return (
            <AnimatedDie
              key={`${id}-${rollSeq}-${face?.faceIndex ?? 'idle'}`}
              diceId={id}
              finalLabel={face?.label ?? def.faces[0]}
              finalFaceIndex={face?.faceIndex ?? 0}
              isRolling={isRolling && !!face}
              onSettled={onDieSettled}
            />
          );
        })}
      </div>

      {showPrompt && prompt && !isRolling && (
        <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/50 to-rose-950/30 p-6 text-center space-y-3 animate-slide-up">
          <Sparkles className="w-6 h-6 mx-auto text-fuchsia-400" />
          <p className="text-lg font-semibold leading-snug capitalize">{prompt}</p>
          <p className="text-xs text-muted-foreground">Do whatever it says!</p>
        </div>
      )}

      <div className="space-y-3 pt-2">
        {isYourTurn ? (
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={loading || isRolling}
            onClick={onRoll}
          >
            <Dices className="w-5 h-5 mr-2 inline" />
            {isRolling ? 'Rolling…' : 'Roll dice'}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-3">
            {partnerLabel} is rolling…
          </p>
        )}
        <Button variant="ghost" className="w-full" onClick={onEnd} disabled={loading}>
          End game
        </Button>
      </div>
    </div>
  );
}
