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
  getKindMeta,
  heatLabel,
  heatFlames,
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

  const rulesCopy: Record<GameMode, string[]> = {
    pleasing: [
      'Cards stay in a pile — take turns drawing one.',
      'Read the task aloud and do it together (or for each other).',
      'Pass the phone when done. Game ends on Home Run.',
    ],
    memory: [
      'Tap two cards. If they match, perform the task on the card.',
      'No match? Cards flip back and your partner goes.',
      'Ends when you match Home Run or clear the board.',
    ],
    teasing: [
      `You hold 5 cards. Find pairs in your hand and complete the task.`,
      `No pair? Draw from the pile — "Quit teasing me" if they don't have yours.`,
      `First to 5 matches wins the night.`,
    ],
  };

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
                  Romantic. Steamy. Built for couples who want to tease, please, and lose
                  track of time together.
                </p>
                <p className="text-[10px] text-rose-200/60 uppercase tracking-widest">
                  18+ · Play responsibly · Skip any card you&apos;re not into
                </p>
              </div>
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
                <ul className="text-sm text-muted-foreground space-y-1.5 px-4 py-3 rounded-xl bg-accent/50 list-disc list-inside">
                  {rulesCopy[showRulesMode].map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {phase === 'playing' && mode === 'pleasing' && !drawnCard && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 max-w-md mx-auto">
            <div className="relative">
              <div className="w-40 h-56 rounded-3xl bg-gradient-to-br from-rose-600 via-fuchsia-600 to-purple-700 shadow-2xl shadow-rose-900/50 flex flex-col items-center justify-center border-2 border-white/20">
                <Flame className="w-12 h-12 text-white/90 mb-2" />
                <p className="text-white font-bold text-sm tracking-widest uppercase">
                  Tease
                </p>
                <p className="text-white/80 text-xs">or</p>
                <p className="text-white font-bold text-sm tracking-widest uppercase">
                  Please
                </p>
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
                        : 'bg-gradient-to-br from-rose-950 to-purple-950 border-rose-500/30 hover:border-rose-400/60 shadow-md'
                  }`}
                >
                  {cell.faceUp || cell.matched ? (
                    <span className="text-lg">{getKindMeta(cell.card.kind).emoji}</span>
                  ) : (
                    <Flame className="w-5 h-5 mx-auto text-rose-400/60" />
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
              Home run
            </h2>
            <p className="text-muted-foreground">
              You made it through the deck. However the night goes from here — make it count
              together.
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

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div
        className={`relative rounded-3xl border-2 ${meta.border} p-6 shadow-2xl ${meta.glow} bg-gradient-to-br ${meta.gradient} overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.15em] text-white/70 font-semibold">
              {meta.label}
            </span>
            <span className="text-xs text-white/60">{heatFlames(card.heat)} {heatLabel(card.heat)}</span>
          </div>
          <div className="text-4xl">{meta.emoji}</div>
          <h3 className="text-2xl font-bold text-white">{card.title}</h3>
          <p className="text-rose-50/95 leading-relaxed text-base">{card.task}</p>
          {card.duration && (
            <p className="text-xs text-white/50">⏱ {card.duration}</p>
          )}
          {card.kind === 'please' && (
            <p className="text-xs text-rose-200/70 flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current" />
              Make {partnerName} feel wanted
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
