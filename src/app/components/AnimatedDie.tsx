import React, { useEffect, useRef, useState } from 'react';
import { getDiceDefinition, type DiceId } from '@/app/constants/sexyDice';

const ROLL_MS = 1600;
const TICK_MS = 70;

interface AnimatedDieProps {
  diceId: DiceId;
  finalLabel: string;
  finalFaceIndex: number;
  isRolling: boolean;
  onSettled?: () => void;
}

export function AnimatedDie({
  diceId,
  finalLabel,
  finalFaceIndex,
  isRolling,
  onSettled,
}: AnimatedDieProps) {
  const def = getDiceDefinition(diceId);
  const [displayIndex, setDisplayIndex] = useState(finalFaceIndex);
  const [wobble, setWobble] = useState(false);
  const settledRef = useRef(false);

  useEffect(() => {
    if (!isRolling) {
      setDisplayIndex(finalFaceIndex);
      return;
    }

    settledRef.current = false;
    setWobble(true);
    const start = Date.now();
    const tick = setInterval(() => {
      setDisplayIndex(Math.floor(Math.random() * def.faces.length));
      if (Date.now() - start >= ROLL_MS) {
        clearInterval(tick);
        setDisplayIndex(finalFaceIndex);
        setWobble(false);
        if (!settledRef.current) {
          settledRef.current = true;
          onSettled?.();
        }
      }
    }, TICK_MS);

    return () => clearInterval(tick);
  }, [isRolling, finalFaceIndex, finalLabel, def.faces.length, onSettled]);

  const label = isRolling ? def.faces[displayIndex] : finalLabel;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-2xl border-2 shadow-lg flex items-center justify-center p-2 text-center transition-transform duration-150 ${
          wobble ? 'animate-dice-wobble' : ''
        }`}
        style={{
          backgroundColor: `${def.color}22`,
          borderColor: def.color,
          boxShadow: `0 8px 24px ${def.color}40`,
        }}
      >
        <span className="absolute top-1 left-1.5 text-xs opacity-70">{def.emoji}</span>
        <span className="text-[0.65rem] sm:text-xs font-bold leading-tight text-foreground capitalize px-0.5">
          {label}
        </span>
        <span
          className="absolute bottom-1 right-1.5 w-2 h-2 rounded-full opacity-80"
          style={{ backgroundColor: def.color }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {def.name}
      </span>
    </div>
  );
}
