import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/app/components/Button';
import {
  ArrowLeft,
  Flame,
  RotateCcw,
  SkipForward,
  Heart,
  Shuffle,
  Info,
} from 'lucide-react';
import {
  buildDeck,
  shuffle,
  GAME_MODES,
  OFFICIAL_RULES,
  PDF_CARD_COUNT,
  cardHasInstruction,
  getKindMeta,
  type GameMode,
  type TeasePleaseCard,
} from '@/app/constants/teaseOrPlease';

interface TeaseOrPleaseScreenProps {
  userName: string;
  partnerName: string;
  onBack: () => void;
}

type Phase = 'menu' | 'rules' | 'playing' | 'finished';

interface MemoryCell {
  card: TeasePleaseCard;
  faceUp: boolean;
  matched: boolean;
}

export function TeaseOrPleaseScreen({
  userName,
  partnerName,
  onBack,
}: TeaseOrPleaseScreenProps) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [activePlayer, setActivePlayer] = useState<0 | 1>(0);
  const [deck, setDeck] = useState<TeasePleaseCard[]>([]);
  const [drawnCard, setDrawnCard] = useState<TeasePleaseCard | null>(null);
  const [memoryGrid, setMemoryGrid] = useState<MemoryCell[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [hand, setHand] = useState<TeasePleaseCard[]>([]);
  const [pileCount, setPileCount] = useState(0);
  const [matches, setMatches] = useState(0);
  const [showRulesMode, setShowRulesMode] = useState<GameMode | null>(null);

  const playerNames = useMemo(() => [userName, partnerName], [userName, partnerName]);
  const currentPlayerName = playerNames[activePlayer];

  const startGame = useCallback((selected: GameMode) => {
    setMode(selected);
    setActivePlayer(0);
    setDrawnCard(null);
    setFlippedIndices([]);
    setMatches(0);
    setShowRulesMode(null);

    const fullDeck = buildDeck(true);

    if (selected === 'pleasing') {
      setDeck(fullDeck);
      setHand([]);
      setMemoryGrid([]);
      setPileCount(fullDeck.length);
      setPhase('playing');
      return;
    }

    if (selected === 'memory') {
      const gridDeck = shuffle(fullDeck).slice(0, 24);
      setMemoryGrid(
        gridDeck.map((card) => ({ card, faceUp: false, matched: false })),
      );
      setDeck([]);
      setHand([]);
      setPhase('playing');
      return;
    }

    // teasing (go-fish style): 5 cards each, rest in pile
    const shuffled = shuffle(fullDeck);
    setHand(shuffled.slice(0, 5));
    setDeck(shuffled.slice(5));
    setPileCount(shuffled.length - 5);
    setMemoryGrid([]);
    setPhase('playing');
  }, []);

  const drawFromDeck = () => {
    if (deck.length === 0) {
      setPhase('finished');
      return;
    }
    const [top, ...rest] = deck;
    setDeck(rest);
    setDrawnCard(top);
    setPileCount(rest.length);
    if (top.kind === 'homerun') {
      setPhase('finished');
    }
  };

  const completeDrawnCard = () => {
    setDrawnCard(null);
    setActivePlayer((p) => (p === 0 ? 1 : 0));
  };

  const handleMemoryFlip = (index: number) => {
    const cell = memoryGrid[index];
    if (cell.faceUp || cell.matched || flippedIndices.length >= 2) return;

    const next = memoryGrid.map((c, i) =>
      i === index ? { ...c, faceUp: true } : c,
    );
    const newFlipped = [...flippedIndices, index];
    setMemoryGrid(next);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      const match = next[a].card.pairId === next[b].card.pairId;
      setTimeout(() => {
        if (match) {
          setMemoryGrid((grid) =>
            grid.map((c, i) =>
              i === a || i === b ? { ...c, matched: true, faceUp: true } : c,
            ),
          );
          setDrawnCard(next[a].card);
          if (next[a].card.kind === 'homerun') setPhase('finished');
        } else {
          setMemoryGrid((grid) =>
            grid.map((c, i) =>
              i === a || i === b ? { ...c, faceUp: false } : c,
            ),
          );
          setActivePlayer((p) => (p === 0 ? 1 : 0));
        }
        setFlippedIndices([]);
      }, 700);
    }
  };

  const checkHandForMatch = (cards: TeasePleaseCard[]) => {
    const counts: Record<string, number> = {};
    for (const c of cards) {
      counts[c.pairId] = (counts[c.pairId] || 0) + 1;
    }
    const pairId = Object.keys(counts).find((k) => counts[k] >= 2);
    if (!pairId) return null;
    const matched = cards.filter((c) => c.pairId === pairId).slice(0, 2);
    const rest = cards.filter((c) => !matched.some((m) => m.id === c.id));
    return { matched: matched[0], rest };
  };

  const teasingDraw = () => {
    if (deck.length === 0) {
      setPhase('finished');
      return;
    }
    const [top, ...rest] = deck;
    const newHand = [...hand, top];
    setDeck(rest);
    setPileCount(rest.length);
    const found = checkHandForMatch(newHand);
    if (found) {
      setHand(found.rest);
      setDrawnCard(found.matched);
      setMatches((m) => m + 1);
      if (found.matched.kind === 'homerun' || matches + 1 >= 5) setPhase('finished');
    } else {
      setHand(newHand);
      setActivePlayer((p) => (p === 0 ? 1 : 0));
    }
  };

  const resetAll = () => {
    setPhase('menu');
    setMode(null);
    setDeck([]);
    setDrawnCard(null);
    setMemoryGrid([]);
    setHand([]);
  };

  const rulesForMode = (id: GameMode) =>
    OFFICIAL_RULES.modes.find((m) => m.id === id)?.steps ?? [];

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <header className="px-4 py-4 flex items-center gap-3 border-b border-border safe-top flex-shrink-0 bg-gradient-to-r from-rose-950/40 via-background to-purple-950/30">
        <button
          type="button"
          onClick={phase === 'menu' ? onBack : resetAll}
          className="p-2 hover:bg-accent rounded-full transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 fill-rose-500/30" />
            Tease or Please
          </h1>
          {phase === 'playing' && mode && (
            <p className="text-xs text-muted-foreground truncate">
              {GAME_MODES.find((m) => m.id === mode)?.label} · {currentPlayerName}&apos;s turn
            </p>
          )}
        </div>
        {phase === 'playing' && (
          <button
            type="button"
            onClick={resetAll}
            className="p-2 hover:bg-accent rounded-full"
            title="New game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-10">
        {phase === 'menu' && (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-rose-500/25 p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-fuchsia-950 to-purple-950" />
              <div className="relative space-y-3">
                <div className="text-5xl">🔥</div>
                <h2 className="text-2xl font-bold text-white">Tonight is yours</h2>
                <p className="text-sm text-rose-100/80 leading-relaxed">
                  {OFFICIAL_RULES.object}
                </p>
                <p className="text-[10px] text-rose-200/60 uppercase tracking-widest">
                  {OFFICIAL_RULES.attribution}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4 space-y-2">
              <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                Deck
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {OFFICIAL_RULES.contents.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
              <p className="text-xs text-purple-300/80 pt-1">
                {PDF_CARD_COUNT.unique} unique cards · {PDF_CARD_COUNT.withDuplicates} cards when
                playing with pairs (per PDF)
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Choose how to play
              </p>
              {GAME_MODES.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-2xl border-2 border-rose-500/20 bg-gradient-to-r from-rose-950/50 to-purple-950/30 hover:border-rose-400/40 transition-colors overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => startGame(m.id)}
                    className="flex-1 flex items-center gap-4 p-4 text-left min-w-0"
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.subtitle}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRulesMode(showRulesMode === m.id ? null : m.id)}
                    className="p-4 hover:bg-accent/50 flex-shrink-0"
                    aria-label="Rules"
                  >
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
              {showRulesMode && (
                <div className="px-4 py-3 rounded-xl bg-accent/50 space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    {OFFICIAL_RULES.modes.find((m) => m.id === showRulesMode)?.name}
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                    {rulesForMode(showRulesMode).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'playing' && mode === 'pleasing' && !drawnCard && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 max-w-md mx-auto">
            <div className="relative">
              <div className="w-40 h-56 rounded-3xl bg-[repeating-linear-gradient(0deg,#5b2d82,#5b2d82_8px,#e8e0ef_8px,#e8e0ef_16px)] shadow-2xl shadow-purple-900/50 flex flex-col items-center justify-center border-4 border-purple-800 p-4">
                <div className="w-full h-full rounded-full bg-white border-4 border-purple-700 flex flex-col items-center justify-center text-center px-2">
                  <p className="text-purple-800 font-bold text-xs tracking-wide leading-tight">
                    TEASE
                  </p>
                  <p className="text-purple-700 text-[10px] font-semibold">OR</p>
                  <p className="text-purple-800 font-bold text-xs tracking-wide leading-tight">
                    PLEASE
                  </p>
                </div>
              </div>
              <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                {pileCount} cards left
              </p>
            </div>
            <p className="text-center text-muted-foreground text-sm px-4">
              <span className="font-semibold text-foreground">{currentPlayerName}</span>,
              draw a card when you&apos;re ready
            </p>
            <Button variant="gradient" size="lg" onClick={drawFromDeck} className="min-w-[200px]">
              <Shuffle className="w-5 h-5 mr-2 inline" />
              Draw card
            </Button>
          </div>
        )}

        {phase === 'playing' && mode === 'memory' && !drawnCard && (
          <div className="max-w-md mx-auto">
            <p className="text-center text-sm text-muted-foreground mb-4">
              {currentPlayerName} — flip two cards
            </p>
            <div className="grid grid-cols-4 gap-2">
              {memoryGrid.map((cell, i) => (
                <button
                  key={cell.card.id + i}
                  type="button"
                  disabled={cell.matched || flippedIndices.length >= 2}
                  onClick={() => handleMemoryFlip(i)}
                  className={`aspect-[3/4] rounded-xl text-xs font-bold transition-all ${
                    cell.matched
                      ? 'opacity-40 scale-95 bg-rose-500/20 border border-rose-500/30'
                      : cell.faceUp
                        ? 'bg-gradient-to-br from-rose-800 to-fuchsia-900 text-white border-rose-400/50'
                        : 'bg-[repeating-linear-gradient(0deg,#4a2568,#4a2568_4px,#d8d0e4_4px,#d8d0e4_8px)] border-purple-600/50 hover:border-purple-400/60 shadow-md'
                  }`}
                >
                  {cell.faceUp || cell.matched ? (
                    <span className="text-lg">{getKindMeta(cell.card.kind).emoji}</span>
                  ) : (
                    <span className="text-[8px] font-bold text-purple-900/70 leading-none text-center px-0.5">
                      T/O P
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'playing' && mode === 'teasing' && !drawnCard && (
          <div className="max-w-md mx-auto space-y-6">
            <p className="text-center text-sm">
              <span className="font-semibold">{currentPlayerName}</span>&apos;s hand ·{' '}
              {matches}/5 matches
            </p>
            <div className="flex flex-wrap gap-2 justify-center min-h-[120px]">
              {hand.map((card) => {
                const meta = getKindMeta(card.kind);
                return (
                  <div
                    key={card.id}
                    className={`w-16 h-24 rounded-xl bg-gradient-to-br ${meta.gradient} border ${meta.border} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {meta.emoji}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground">{pileCount} in pile</p>
            <Button variant="gradient" className="w-full" onClick={teasingDraw}>
              Draw from pile
            </Button>
          </div>
        )}

        {drawnCard && (
          <CardReveal
            card={drawnCard}
            partnerName={partnerName}
            onDone={completeDrawnCard}
            onSkip={completeDrawnCard}
          />
        )}

        {phase === 'finished' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 max-w-md mx-auto text-center px-4">
            <div className="text-6xl">💋</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              HOME RUN
            </h2>
            <p className="text-muted-foreground font-medium uppercase tracking-wide">
              JUST DO IT ALREADY
            </p>
            <p className="text-sm text-muted-foreground">
              You drew the HOME RUN card. Game over — the rest of the night is yours.
            </p>
            <Button variant="gradient" onClick={resetAll}>
              Play again
            </Button>
            <Button variant="ghost" onClick={onBack}>
              Back to home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CardReveal({
  card,
  partnerName,
  onDone,
  onSkip,
}: {
  card: TeasePleaseCard;
  partnerName: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const meta = getKindMeta(card.kind);
  const twoLine = cardHasInstruction(card);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div
        className={`relative rounded-3xl border-4 ${meta.border} p-8 shadow-2xl ${meta.glow} overflow-hidden`}
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(91,45,130,0.15) 0px, rgba(91,45,130,0.15) 6px, rgba(232,224,239,0.08) 6px, rgba(232,224,239,0.08) 12px)',
        }}
      >
        <div className="relative rounded-full border-4 border-purple-400/60 bg-purple-950/80 px-6 py-8 text-center min-h-[220px] flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-purple-300/80 mb-3">
            {meta.label}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight leading-snug">
            {card.title}
          </h3>
          {twoLine && (
            <>
              <div className="my-4 border-t border-dashed border-purple-300/50 w-3/4 mx-auto" />
              <p className="text-sm sm:text-base text-purple-100 uppercase leading-snug font-medium">
                {card.task}
              </p>
            </>
          )}
          {card.kind === 'homerun' && (
            <p className="text-xs text-rose-200/70 flex items-center justify-center gap-1 mt-4">
              <Heart className="w-3 h-3 fill-current" />
              With {partnerName}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="gradient" size="lg" className="w-full" onClick={onDone}>
          Done — pass to partner
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={onSkip}>
          <SkipForward className="w-4 h-4 mr-2 inline" />
          Skip this card
        </Button>
      </div>
    </div>
  );
}
