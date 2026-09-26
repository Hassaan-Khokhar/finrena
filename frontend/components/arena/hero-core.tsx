'use client';

import React from 'react';

export function HeroCore() {
  return (
    <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
      {/* Ambient Core Glow */}
      <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-3xl"></div>

      {/* Outer Radar Grid (Static) */}
      <div className="absolute inset-0 border border-zinc-800/80 rounded-full"></div>
      <div className="absolute inset-4 border border-zinc-800/60 rounded-full"></div>
      
      {/* Crosshairs (Static) */}
      <div className="absolute w-full h-[1px] bg-zinc-800/80"></div>
      <div className="absolute h-full w-[1px] bg-zinc-800/80"></div>

      {/* Rotating Ring 1 (Dashed, Slow, Clockwise) */}
      <div className="absolute inset-8 border border-dashed border-zinc-600/50 rounded-full animate-[spin_15s_linear_infinite]"></div>

      {/* Rotating Ring 2 (Solid with colored edges, Fast, Counter-Clockwise) */}
      <div className="absolute inset-16 border-t border-b border-cyan-500/40 rounded-full animate-[spin_8s_linear_infinite_reverse] shadow-[0_0_20px_rgba(6,182,212,0.2)]"></div>

      {/* Rotating Ring 3 (Dotted, Inner) */}
      <div className="absolute inset-24 border border-dotted border-emerald-500/50 rounded-full animate-[spin_10s_linear_infinite]"></div>

      {/* The Physical Core */}
      <div className="relative z-10 w-16 h-16 bg-zinc-950 border border-zinc-700 shadow-[0_0_30px_rgba(255,255,255,0.05)] rounded-full flex items-center justify-center">
        {/* Inner pulsating dot */}
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75 absolute"></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
      </div>
    </div>
  );
}
