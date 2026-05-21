import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/Button';
import {
  ArrowLeft,
  Flame,
  RotateCcw,
  SkipForward,
  Heart,
  Shuffle,
  Info,
  Users,
  Loader2,
} from 'lucide-react';
import {
  GAME_MODES,
  OFFICIAL_RULES,
  PDF_CARD_COUNT,
  cardHasInstruction,
  getKindMeta,
  type GameMode,
  type TeasePleaseCard,
} from '@/app/constants/teaseOrPlease';
import { teaseGameAPI } from '@/utils/api';

interface TeaseOrPleaseScreenProps {
  coupleId: string;
  userId: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
}

interface SyncCard {
  id: string;
  pairId: string;
  kind: string;
  title: string;
  task: string;
}

interface MemoryCellView {
  cardId: string;
  faceUp: boolean;
  matched: boolean;
  card: SyncCard | null;
}

interface GameSyncView {
  session: {
    status: string;
    mode: GameMode;
    hostUserId: string;
    hostName: string;
    partnerName: string;
    phase: string;
    activeUserId: string;
    tableCard: SyncCard | null;
    tableCardFromUserId: string | null;
    memory: { cells: MemoryCellView[]; flippedIndices: number[] };
    teasing: { matches: Record<string, number> };
  } | null;
  isHost: boolean;
  isYourTurn: boolean;
  needsAck: boolean;
  showYourCard: boolean;
  partnerDisplayName: string;
  tableCard: SyncCard | null;
  teasingHandCards: SyncCard[];
  pileCount: number;
}

export function TeaseOrPleaseScreen({
  coupleId,
  userId,
  userName,
  partnerName,
  onBack,
}: TeaseOrPleaseScreenProps) {
  const [sync, setSync] = useState<GameSyncView | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRulesMode, setShowRulesMode] = useState<GameMode | null>(null);
  const [showFullRules, setShowFullRules] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await teaseGameAPI.get(coupleId, userId);
      setSync(data?.session ? (data as GameSyncView) : null);
    } catch (e) {
      console.error('[Tease Game] poll failed', e);
    } finally {
      setLoading(false);
    }
  }, [coupleId, userId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, [refresh]);

  const runAction = async (action: string, payload?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const data = await teaseGameAPI.action(coupleId, userId, action, payload);
      setSync(data as GameSyncView);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Action failed';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const sendInvite = async (mode: GameMode) => {
    setActionLoading(true);
    try {
      const data = await teaseGameAPI.invite(coupleId, userId, userName, mode);
      setSync(data as GameSyncView);
      setPendingMode(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not send invite');
    } finally {
      setActionLoading(false);
    }
  };

  const acceptInvite = async () => {
    setActionLoading(true);
    try {
      const data = await teaseGameAPI.accept(coupleId, userId);
      setSync(data as GameSyncView);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not accept');
    } finally {
      setActionLoading(false);
    }
  };

  const declineInvite = async () => {
    await teaseGameAPI.decline(coupleId, userId);
    await refresh();
  };

  const cancelGame = async () => {
    await teaseGameAPI.cancel(coupleId, userId);
    await refresh();
  };

  const session = sync?.session;
  const status = session?.status ?? 'idle';
  const mode = session?.mode;
  const isYourTurn = sync?.isYourTurn ?? false;
  const needsAck = sync?.needsAck ?? false;
  const showYourCard = sync?.showYourCard ?? false;
  const tableCard = sync?.tableCard ?? session?.tableCard ?? null;

  const toTeaseCard = (c: SyncCard | null): TeasePleaseCard | null => {
    if (!c) return null;
    return {
      id: c.id,
      pairId: c.pairId,
      kind: c.kind as TeasePleaseCard['kind'],
      title: c.title,
      task: c.task,
    };
  };

  const activeCard = toTeaseCard(tableCard);
  const partnerLabel = sync?.partnerDisplayName || partnerName;

  if (loading && !sync) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FB3094]" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <header className="px-4 py-4 flex items-center gap-3 border-b border-border safe-top flex-shrink-0 bg-gradient-to-r from-rose-950/40 via-background to-purple-950/30">
        <button type="button" onClick={onBack} className="p-2 hover:bg-accent rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 fill-rose-500/30" />
            Tease or Please
          </h1>
          {status === 'active' && (
            <p className="text-xs text-muted-foreground truncate">
              {isYourTurn ? 'Your turn' : `${partnerLabel}'s turn`}
              {needsAck ? ' · Card waiting for you' : ''}
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
        {/* Lobby — no session */}
        {(status === 'idle' || !session) && (
          <LobbyMenu
            pendingMode={pendingMode}
            setPendingMode={setPendingMode}
            showFullRules={showFullRules}
            setShowFullRules={setShowFullRules}
            showRulesMode={showRulesMode}
            setShowRulesMode={setShowRulesMode}
            onInvite={sendInvite}
            loading={actionLoading}
            partnerName={partnerName}
          />
        )}

        {/* Waiting for partner to accept */}
        {status === 'invite_pending' && sync?.isHost && (
          <div className="max-w-md mx-auto text-center space-y-6 py-12">
            <Users className="w-12 h-12 mx-auto text-purple-400" />
            <h2 className="text-xl font-bold">Waiting for {partnerName}</h2>
            <p className="text-muted-foreground text-sm">
              Invite sent for <strong>{GAME_MODES.find((m) => m.id === mode)?.label}</strong>.
              They need to open Tease or Please and accept before the game starts.
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A83FFF]" />
          </div>
        )}

        {/* Partner: accept invite */}
        {status === 'invite_pending' && !sync?.isHost && (
          <div className="max-w-md mx-auto text-center space-y-6 py-8">
            <div className="text-5xl">💌</div>
            <h2 className="text-xl font-bold">{session?.hostName} invited you</h2>
            <p className="text-muted-foreground">
              Play <strong>{GAME_MODES.find((m) => m.id === mode)?.subtitle}</strong> together —
              cards sync live between both phones.
            </p>
            <Button variant="gradient" size="lg" className="w-full" onClick={acceptInvite} disabled={actionLoading}>
              Accept & start game
            </Button>
            <Button variant="ghost" onClick={declineInvite}>
              Decline
            </Button>
          </div>
        )}

        {/* Active game */}
        {status === 'active' && session && mode && !activeCard && (
          <ActiveGameBoard
            mode={mode}
            session={session}
            sync={sync!}
            userId={userId}
            partnerLabel={partnerLabel}
            isYourTurn={isYourTurn}
            actionLoading={actionLoading}
            onAction={runAction}
          />
        )}

        {status === 'finished' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 max-w-md mx-auto text-center px-4">
            <div className="text-6xl">💋</div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400">
              HOME RUN
            </h2>
            <p className="text-sm text-muted-foreground uppercase">Just do it already</p>
            <Button variant="gradient" onClick={cancelGame}>
              Back to menu
            </Button>
          </div>
        )}
      </div>

      {/* Card overlays — synced between partners */}
      {activeCard && (showYourCard || needsAck) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 safe-top safe-bottom">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardReveal
              card={activeCard}
              partnerName={partnerLabel}
              variant={needsAck ? 'partner_passed' : 'your_turn'}
              fromName={
                needsAck
                  ? session?.tableCardFromUserId === session?.hostUserId
                    ? session.hostName
                    : session?.partnerName
                  : undefined
              }
              onPrimary={async () => {
                if (needsAck) {
                  await runAction('ack_card');
                } else {
                  await runAction('pass_card');
                }
              }}
              onSkip={async () => runAction('skip_card')}
              loading={actionLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LobbyMenu({
  pendingMode,
  setPendingMode,
  showFullRules,
  setShowFullRules,
  showRulesMode,
  setShowRulesMode,
  onInvite,
  loading,
  partnerName,
}: {
  pendingMode: GameMode | null;
  setPendingMode: (m: GameMode | null) => void;
  showFullRules: boolean;
  setShowFullRules: (v: boolean) => void;
  showRulesMode: GameMode | null;
  setShowRulesMode: (m: GameMode | null) => void;
  onInvite: (mode: GameMode) => void;
  loading: boolean;
  partnerName: string;
}) {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="relative rounded-3xl overflow-hidden border border-rose-500/25 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-fuchsia-950 to-purple-950" />
        <div className="relative space-y-3 text-sm text-rose-100/90">
          <h2 className="text-xl font-bold text-white text-center">Play together</h2>
          <p className="text-center text-rose-100/80">
            Invite {partnerName}. They must accept before cards are dealt. Turns and tasks sync on
            both phones.
          </p>
          <button
            type="button"
            onClick={() => setShowFullRules(!showFullRules)}
            className="w-full py-2 rounded-xl border border-purple-400/30 text-xs font-semibold text-purple-100"
          >
            {showFullRules ? 'Hide rules' : 'Read full rules'}
          </button>
        </div>
      </div>

      {showFullRules && (
        <div className="text-xs text-muted-foreground space-y-3 p-4 rounded-xl bg-accent/40 max-h-48 overflow-y-auto">
          <p>{OFFICIAL_RULES.object}</p>
          {OFFICIAL_RULES.modes.map((m) => (
            <p key={m.id}>
              <strong>{m.name}</strong> {m.paragraphs[0].slice(0, 120)}…
            </p>
          ))}
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Pick a mode, then invite
      </p>
      {GAME_MODES.map((m) => (
        <div
          key={m.id}
          className={`rounded-2xl border-2 overflow-hidden ${
            pendingMode === m.id ? 'border-rose-400' : 'border-rose-500/20'
          }`}
        >
          <button
            type="button"
            onClick={() => setPendingMode(m.id)}
            className="w-full flex items-center gap-4 p-4 text-left"
          >
            <span className="text-3xl">{m.emoji}</span>
            <div>
              <p className="font-semibold">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.subtitle}</p>
            </div>
          </button>
        </div>
      ))}

      <Button
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={!pendingMode || loading}
        onClick={() => pendingMode && onInvite(pendingMode)}
      >
        <Users className="w-5 h-5 mr-2 inline" />
        Invite {partnerName} to play
      </Button>

      <p className="text-center text-[10px] text-muted-foreground">
        {PDF_CARD_COUNT.unique} cards · {PDF_CARD_COUNT.withDuplicates} with pairs
      </p>
    </div>
  );
}

function ActiveGameBoard({
  mode,
  session,
  sync,
  userId,
  partnerLabel,
  isYourTurn,
  actionLoading,
  onAction,
}: {
  mode: GameMode;
  session: NonNullable<GameSyncView['session']>;
  sync: GameSyncView;
  userId: string;
  partnerLabel: string;
  isYourTurn: boolean;
  actionLoading: boolean;
  onAction: (action: string, payload?: Record<string, unknown>) => void;
}) {
  const flipped = session.memory.flippedIndices?.length ?? 0;

  if (mode === 'pleasing') {
    return (
      <div className="flex flex-col items-center space-y-8 max-w-md mx-auto py-8">
        <p className="text-center text-sm text-muted-foreground">
          {isYourTurn ? (
            <>
              <span className="font-semibold text-foreground">Your turn</span> — draw a card
            </>
          ) : (
            <>
              Waiting for <span className="font-semibold">{partnerLabel}</span>…
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{sync.pileCount} cards in pile</p>
        <Button
          variant="gradient"
          size="lg"
          disabled={!isYourTurn || actionLoading}
          onClick={() => onAction('draw')}
        >
          <Shuffle className="w-5 h-5 mr-2 inline" />
          Draw card
        </Button>
      </div>
    );
  }

  if (mode === 'memory') {
    const cells = session.memory?.cells ?? [];
    return (
      <div className="max-w-md mx-auto">
        <p className="text-center text-sm text-muted-foreground mb-4">
          {isYourTurn ? 'Your turn — flip two cards' : `Waiting for ${partnerLabel}…`}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {cells.map((cell, i) => (
            <button
              key={`${cell.cardId}-${i}`}
              type="button"
              disabled={!isYourTurn || cell.matched || flipped >= 2 || actionLoading}
              onClick={() => onAction('memory_flip', { index: i })}
              className={`aspect-[3/4] rounded-xl text-[7px] font-bold uppercase p-1 transition-all ${
                cell.matched
                  ? 'opacity-40 bg-purple-500/20'
                  : cell.faceUp
                    ? 'bg-purple-800 text-white'
                    : 'bg-[repeating-linear-gradient(0deg,#4a2568,#4a2568_4px,#d8d0e4_4px,#d8d0e4_8px)]'
              }`}
            >
              {cell.faceUp || cell.matched ? (
                <span className="line-clamp-4">{cell.card?.title ?? '?'}</span>
              ) : (
                'T/P'
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const hand = sync.teasingHandCards ?? [];
  const myMatches = session.teasing?.matches?.[userId] ?? 0;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <p className="text-center text-sm">
        {isYourTurn ? 'Your turn' : `Waiting for ${partnerLabel}…`} · {myMatches}/5 matches
      </p>
      <div className="flex flex-wrap gap-2 justify-center min-h-[100px]">
        {hand.map((card) => (
          <div
            key={card.id}
            className="w-14 h-20 rounded-lg bg-purple-900/80 border border-purple-400/40 flex items-center justify-center text-[8px] uppercase p-1 text-center font-bold text-purple-100"
          >
            {card.title.slice(0, 12)}
          </div>
        ))}
      </div>
      <Button
        variant="gradient"
        className="w-full"
        disabled={!isYourTurn || actionLoading}
        onClick={() => onAction('teasing_draw')}
      >
        Draw from pile ({sync.pileCount})
      </Button>
    </div>
  );
}

function CardReveal({
  card,
  partnerName,
  variant,
  fromName,
  onPrimary,
  onSkip,
  loading,
}: {
  card: TeasePleaseCard;
  partnerName: string;
  variant: 'your_turn' | 'partner_passed';
  fromName?: string;
  onPrimary: () => void;
  onSkip: () => void;
  loading?: boolean;
}) {
  const meta = getKindMeta(card.kind);
  const twoLine = cardHasInstruction(card);

  return (
    <div className="space-y-4">
      {variant === 'partner_passed' && (
        <p className="text-center text-sm font-semibold text-rose-300">
          {fromName} passed this card to you
        </p>
      )}
      {variant === 'your_turn' && (
        <p className="text-center text-sm font-semibold text-rose-300">Do the task, then pass</p>
      )}
      <div
        className={`relative rounded-3xl border-4 ${meta.border} p-8 shadow-2xl ${meta.glow}`}
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(91,45,130,0.15) 0px, rgba(91,45,130,0.15) 6px, rgba(232,224,239,0.08) 6px, rgba(232,224,239,0.08) 12px)',
        }}
      >
        <div className="relative rounded-full border-4 border-purple-400/60 bg-purple-950/80 px-6 py-8 text-center">
          <span className="text-[10px] uppercase tracking-widest text-purple-300/80">{meta.label}</span>
          <h3 className="text-lg font-bold text-white uppercase mt-3 leading-snug">{card.title}</h3>
          {twoLine && (
            <>
              <div className="my-4 border-t border-dashed border-purple-300/50 w-3/4 mx-auto" />
              <p className="text-sm text-purple-100 uppercase leading-snug font-medium">{card.task}</p>
            </>
          )}
          {card.kind === 'homerun' && (
            <p className="text-xs text-rose-200/70 mt-4 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 fill-current" />
              With {partnerName}
            </p>
          )}
        </div>
      </div>
      <Button variant="gradient" size="lg" className="w-full" onClick={onPrimary} disabled={loading}>
        {variant === 'partner_passed' ? 'Got it — my turn' : 'Done — pass to partner'}
      </Button>
      {variant === 'your_turn' && (
        <Button variant="ghost" className="w-full" onClick={onSkip} disabled={loading}>
          <SkipForward className="w-4 h-4 mr-2 inline" />
          Skip card
        </Button>
      )}
    </div>
  );
}
