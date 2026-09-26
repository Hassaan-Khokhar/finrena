'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, Terminal } from 'lucide-react';
import { Navbar } from '../../components/shared/navbar';
import { PriceChart } from './price-chart';
import { MonteCarloChart } from './monte-carlo-chart';
import { AgentTerminal } from './agent-terminal';
import { DossierModal } from './dossier-modal';
import { useArenaSimulation } from '../../lib/mock-streamer';
import { MetricsStrip } from './metrics-strip';

type LaunchState = 'IDLE_LAUNCHER' | 'TRANSITIONING' | 'ACTIVE_TERMINAL';

const QUICK_LAUNCH = [
  { symbol: 'NVDA', name: 'NVIDIA Corp' },
  { symbol: 'TSLA', name: 'Tesla Inc' },
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'MSFT', name: 'Microsoft' },
];

export function ArenaShell({ initialTicker }: { initialTicker?: string }) {
  const [launchState, setLaunchState] = useState<LaunchState>(initialTicker ? 'ACTIVE_TERMINAL' : 'IDLE_LAUNCHER');
  const [inputValue, setInputValue] = useState(initialTicker || '');
  const [activeTicker, setActiveTicker] = useState<string | null>(initialTicker ? initialTicker.toUpperCase() : null);
  const [showDossier, setShowDossier] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // When activeTicker is set, the simulation runs
  const { tickerData, messages, monteCarlo, verdict, isWaitingForHuman, sendUserMessage, forceVerdict } = useArenaSimulation(
    activeTicker || 'NVDA', 
    launchState === 'ACTIVE_TERMINAL'
  );

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    if (verdict) {
      const t = setTimeout(() => setShowDossier(true), 2000);
      return () => clearTimeout(t);
    }
  }, [verdict]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) setIsMaximized(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320);
    return () => clearTimeout(timer);
  }, [isMaximized]);

  const handleLaunch = (e?: React.FormEvent, forceTicker?: string) => {
    if (e) e.preventDefault();
    const t = forceTicker || inputValue.trim().toUpperCase();
    if (!t) return;
    
    setInputValue(t);
    setActiveTicker(t);
    setLaunchState('TRANSITIONING');
    
    // Smoothly update URL without Next.js hard reload
    window.history.pushState(null, '', `/arena/${t}`);

    setTimeout(() => {
      setLaunchState('ACTIVE_TERMINAL');
    }, 800); // 800ms transition time
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 md:h-screen md:overflow-hidden">
      <Navbar />

      <AnimatePresence mode="wait">
        {launchState === 'IDLE_LAUNCHER' && (
          <motion.main
            key="launcher"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col items-center justify-center px-4 w-full"
          >
            <div className="max-w-3xl w-full text-center mb-10">
              <motion.div layoutId="search-icon" className="inline-flex items-center justify-center p-4 bg-zinc-900/50 rounded-full border border-zinc-800 mb-6">
                <Terminal className="h-6 w-6 text-emerald-500" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-4">
                Which asset shall the committee stress-test today?
              </h1>
              <p className="text-lg text-zinc-400">
                Deploy the Bull, Bear, and Quant swarm to cross-examine financial filings and run Monte Carlo simulations.
              </p>
            </div>

            <div className="w-full max-w-2xl mx-auto relative z-20">
              <form 
                onSubmit={(e) => handleLaunch(e)}
                className="relative flex items-center bg-zinc-950 border border-zinc-700/80 rounded-xl shadow-2xl focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all overflow-hidden group"
              >
                <div className="pl-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <Search className="h-5 w-5" />
                </div>
                <input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                  placeholder="Enter ticker or asset symbol (e.g., NVDA, TSLA, AAPL, BTC)..."
                  className="w-full h-16 bg-transparent border-0 text-lg text-zinc-100 placeholder:text-zinc-600 px-4 focus-visible:ring-0 outline-none"
                  autoFocus
                />
                <div className="pr-4 shrink-0 flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-400 font-mono">
                    Enter ↵
                  </kbd>
                </div>
              </form>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                {QUICK_LAUNCH.map(asset => (
                  <button 
                    key={asset.symbol}
                    onClick={() => handleLaunch(undefined, asset.symbol)}
                    className="flex items-center text-xs font-mono px-4 py-2 rounded-full border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 transition-all"
                  >
                    <span className="font-bold text-zinc-200 mr-2">{asset.symbol}</span> 
                    <span className="opacity-60">· {asset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full max-w-2xl text-center px-4 mt-12 pb-6">
              <p className="text-[11px] text-zinc-500 font-mono tracking-tight leading-relaxed">
                FinDebate Arena is an autonomous multi-agent quantitative synthesis terminal for institutional research purposes only. AI agents can produce inaccuracies. Not financial advice. Verify all financial data with primary SEC filings.
              </p>
            </div>
          </motion.main>
        )}

        {(launchState === 'TRANSITIONING' || launchState === 'ACTIVE_TERMINAL') && (
          <motion.div
            key="arena"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Top Command & Ticker Bar */}
            <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span className="font-bold tracking-widest text-zinc-100">{activeTicker}</span>
                  {tickerData && (
                    <>
                      <span className="text-zinc-500 text-sm font-mono">{tickerData.companyName}</span>
                      <span className="text-zinc-100 font-mono ml-4">${tickerData.currentPrice.toFixed(2)}</span>
                      <span className={`text-sm font-mono ${tickerData.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tickerData.change >= 0 ? '+' : ''}{tickerData.change.toFixed(2)} ({tickerData.changePercent.toFixed(2)}%)
                      </span>
                    </>
                  )}
                </motion.div>
              </div>
              <div className="flex items-center gap-4">
                {verdict && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setShowDossier(true)}
                    className="flex items-center text-xs font-semibold bg-zinc-100 text-zinc-950 px-3 py-1.5 rounded hover:bg-zinc-300 transition-colors"
                  >
                    Export Dossier
                  </motion.button>
                )}
              </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">
              
              {launchState === 'TRANSITIONING' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className="text-emerald-500 flex items-center gap-3 font-mono text-sm"
                  >
                    <Activity className="h-5 w-5 animate-spin" />
                    INITIALIZING TERMINAL...
                  </motion.div>
                </div>
              )}

              {/* Left Panel: Charts (60% or 0% when maximized) */}
              <motion.div 
                initial={false}
                animate={{ 
                  width: isMaximized ? '0%' : (isDesktop ? '60%' : '100%'),
                  opacity: isMaximized ? 0 : 1,
                }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                onAnimationComplete={() => {
                  window.dispatchEvent(new Event('resize'));
                }}
                className={`h-full flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 shrink-0 overflow-hidden ${
                  isMaximized ? 'pointer-events-none' : ''
                }`}
                style={{
                  display: isMaximized && !isDesktop ? 'none' : undefined,
                }}
              >
                {/* Inner container with min-width on desktop to prevent chart squishing during slide transitions */}
                <div className="h-full flex flex-col w-full min-w-full md:min-w-[500px]">
                  {/* Price Chart Sub-window */}
                  <div className="flex-1 min-h-[200px] md:min-h-0 border-b border-zinc-800 relative bg-zinc-950/50">
                    <div className="absolute top-3 left-4 z-10 text-xs font-semibold text-zinc-500 tracking-wider pointer-events-none">
                      PRICE ACTION
                    </div>
                    <div className="absolute inset-0">
                      {tickerData && <PriceChart data={tickerData.historicalCandles} />}
                    </div>
                  </div>

                  {/* Monte Carlo Sub-window */}
                  <div className="flex-1 min-h-[200px] md:min-h-0 relative bg-zinc-950/50">
                    <div className="absolute top-3 left-4 z-10 text-xs font-semibold text-zinc-500 tracking-wider pointer-events-none">
                      QUANT MONTE CARLO (500 PATHS)
                    </div>
                    <div className="absolute inset-0">
                      {monteCarlo && <MonteCarloChart data={monteCarlo} />}
                    </div>
                  </div>

                  {tickerData && <MetricsStrip data={tickerData} />}
                </div>
              </motion.div>

              {/* Right Panel: Agent Terminal (40% or 100% when maximized) */}
              <motion.div 
                initial={false}
                animate={{ 
                  width: isMaximized ? '100%' : (isDesktop ? '40%' : '100%'),
                }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="h-full flex flex-col shrink-0 overflow-hidden"
              >
                <AgentTerminal 
                  messages={messages} 
                  isWaitingForHuman={isWaitingForHuman}
                  onSendMessage={sendUserMessage}
                  onForceVerdict={forceVerdict}
                  isMaximized={isMaximized}
                  onToggleMaximize={() => setIsMaximized(prev => !prev)}
                />
              </motion.div>
            </div>

            <DossierModal verdict={verdict} isOpen={showDossier} onClose={() => setShowDossier(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
