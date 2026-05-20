import React from 'react';
import { Flame, Sparkles } from 'lucide-react';

export type HomeTab = 'today' | 'tease';

interface HomeTabBarProps {
  active: HomeTab;
  onToday: () => void;
  onTeaseOrPlease: () => void;
}

export function HomeTabBar({ active, onToday, onTeaseOrPlease }: HomeTabBarProps) {
  return (
    <nav
      className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur-md safe-bottom px-2 pt-2 pb-2"
      aria-label="Home sections"
    >
      <div className="flex gap-2 max-w-lg mx-auto">
        <button
          type="button"
          onClick={onToday}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-3 rounded-2xl transition-all ${
            active === 'today'
              ? 'bg-accent text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent/50'
          }`}
        >
          <Sparkles
            className={`w-5 h-5 ${active === 'today' ? 'text-[#A83FFF]' : ''}`}
          />
          <span className="text-xs font-semibold">Today</span>
        </button>

        <button
          type="button"
          onClick={onTeaseOrPlease}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-3 rounded-2xl transition-all ${
            active === 'tease'
              ? 'bg-gradient-to-r from-rose-600/20 via-fuchsia-600/20 to-purple-600/20 text-rose-100 border border-rose-500/30 shadow-md shadow-rose-900/20'
              : 'text-muted-foreground hover:bg-rose-500/10'
          }`}
        >
          <Flame
            className={`w-5 h-5 ${
              active === 'tease'
                ? 'text-rose-400 fill-rose-500/40'
                : 'text-rose-500/70 fill-rose-500/20'
            }`}
          />
          <span
            className={`text-xs font-semibold text-center leading-tight ${
              active === 'tease' ? 'text-rose-100' : ''
            }`}
          >
            Tease or Please
          </span>
        </button>
      </div>
    </nav>
  );
}
