'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '../ui/dialog';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (ticker: string) => {
    setOpen(false);
    router.push(`/arena/${ticker}`);
  };

  const tickers = ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMD', 'META'];
  
  const filtered = tickers.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:border-zinc-700 hover:text-zinc-300 transition-all focus:outline-none"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search tickers...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-950 px-1.5 font-mono text-[10px] font-medium text-zinc-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 border-zinc-800 bg-zinc-950 shadow-2xl max-w-xl top-[20%] translate-y-0">
          <div className="flex items-center border-b border-zinc-800 px-3">
            <Search className="h-5 w-5 text-zinc-500 mr-2 shrink-0" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticker (e.g., NVDA, AAPL)..."
              className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-zinc-200 h-14"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">No results found.</div>
            ) : (
              <div className="space-y-1">
                {filtered.map(ticker => (
                  <button
                    key={ticker}
                    onClick={() => handleSelect(ticker)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-zinc-900 text-left transition-colors"
                  >
                    <span className="font-mono font-bold text-zinc-200">{ticker}</span>
                    <span className="text-xs text-zinc-500">Run Debate</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
