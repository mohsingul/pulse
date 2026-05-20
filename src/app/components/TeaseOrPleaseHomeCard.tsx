import React from 'react';
import { Flame, ChevronRight, Sparkles } from 'lucide-react';

interface TeaseOrPleaseHomeCardProps {
  partnerName: string;
  onPlay: () => void;
}

export function TeaseOrPleaseHomeCard({ partnerName, onPlay }: TeaseOrPleaseHomeCardProps) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="w-full text-left group relative overflow-hidden rounded-3xl border-2 border-rose-500/30 shadow-xl shadow-rose-900/20 transition-transform active:scale-[0.98]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-fuchsia-950 to-purple-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,48,148,0.35),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,63,255,0.25),transparent_50%)]" />
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-rose-500/20 blur-2xl group-hover:bg-rose-500/30 transition-colors" />

      <div className="relative px-5 py-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/40 ring-2 ring-white/20">
              <Flame className="w-6 h-6 text-white fill-white/30" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-rose-200/80 font-semibold">
                18+ · Couples only
              </p>
              <h3 className="text-xl font-bold text-white tracking-tight">Tease or Please</h3>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-rose-100 border border-white/20 backdrop-blur-sm animate-pulse">
            Steamy
          </span>
        </div>

        <p className="text-sm text-rose-100/90 leading-relaxed pr-4">
          Flip cards. Match dares. Tease {partnerName} or please them — however the night wants to go.
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-rose-200/70">
            <Sparkles className="w-3.5 h-3.5" />
            <span>3 ways to play · 60+ intimate cards</span>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
            Play now
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </button>
  );
}
