'use client';

import { TickerSummary } from '../../types/arena';

export function MetricsStrip({ data }: { data: TickerSummary | null }) {
  if (!data) return <div className="h-10 border-t border-zinc-800 bg-zinc-950" />;

  return (
    <div className="min-h-[36px] shrink-0 flex items-center px-4 py-2 border-t border-zinc-800 bg-zinc-950 text-[10px] md:text-xs font-mono text-zinc-400">
      <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-2 w-full justify-center md:justify-start">
        <span className="flex items-center">
          <span className="text-zinc-600 mr-1">P/E:</span> 
          <span className="text-zinc-200">{data.peRatio}</span>
        </span>
        <div className="hidden md:block w-px h-3 bg-zinc-800 my-auto" />
        <span className="flex items-center">
          <span className="text-zinc-600 mr-1">MCap:</span> 
          <span className="text-zinc-200">{data.marketCap}</span>
        </span>
        <div className="hidden md:block w-px h-3 bg-zinc-800 my-auto" />
        <span className="flex items-center">
          <span className="text-zinc-600 mr-1">FCF:</span> 
          <span className="text-zinc-200">{data.freeCashFlow}</span>
        </span>
        <div className="hidden md:block w-px h-3 bg-zinc-800 my-auto" />
        <span className="flex items-center">
          <span className="text-zinc-600 mr-1">Debt:</span> 
          <span className="text-zinc-200">{data.totalDebt}</span>
        </span>
      </div>
    </div>
  );
}
