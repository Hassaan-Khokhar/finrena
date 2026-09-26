'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Zap, Scale, TrendingUp, AlertTriangle, Calculator, Gavel } from 'lucide-react';
import { Navbar } from '../components/shared/navbar';
import { Footer } from '../components/shared/footer';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100 overflow-x-clip relative">
      <Navbar />
      
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none">
        <div className="absolute inset-0 bg-zinc-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none"></div>
      </div>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-start min-h-screen pt-24 lg:pt-32 px-6 overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/15 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

        {/* The Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono text-zinc-400">Finrena • The AI Workspace for Traders & Investors</span>
        </div>

        {/* The Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white text-center max-w-4xl leading-[1.1] mb-6">
          Research the Markets. Let AI Debate the Risks.
        </h1>

        {/* The Subtext */}
        <p className="text-zinc-400 text-lg md:text-xl text-center max-w-2xl mb-10 leading-relaxed">
          Your dedicated AI financial workspace. Research stocks, analyze crypto, and get instant answers using live market data. Not sure about a trade? Turn on Debate Mode and watch top AI models argue the bull and bear case before you invest.
        </p>

        {/* The Action Row (Centered) */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/chat"
            className="px-6 py-3 rounded-lg font-medium text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center text-sm"
          >
            Start Researching — Free →
          </Link>
          <a
            href="#framework"
            className="px-6 py-3 rounded-lg text-zinc-300 border border-zinc-800 hover:bg-zinc-900 transition-all flex items-center justify-center text-sm"
          >
            See How Debate Mode Works
          </a>
        </div>

        {/* Step 2 & 3: The 3D Spatial Product Window (Desktop Only) */}
        <div
          className="w-full max-w-6xl mt-16 lg:mt-24 relative z-10 hidden md:flex flex-col"
          style={{ transform: 'perspective(1200px) rotateX(12deg) scale(0.95)', transformOrigin: 'top center' }}
        >
          {/* The Glass Window */}
          <div className="w-full h-[600px] bg-zinc-950/80 backdrop-blur-2xl border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
            
            {/* Terminal Header */}
            <div className="h-14 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center px-4 gap-4 justify-between select-none">
              {/* macOS Style Window Controls */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>

              {/* Fake Search / Chat Bar */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs font-mono text-zinc-300 max-w-sm w-full truncate">
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">What is the impact of the latest Fed rate cuts on Tech?</span>
                <span className="ml-auto text-[10px] text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded shrink-0">⌘K</span>
              </div>

              {/* Live Telemetry Ping */}
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                <span className="hidden lg:inline text-zinc-500">SESSION: #ADJ-9042</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE FEED · 42ms
                </span>
              </div>
            </div>

            {/* Terminal Body (The Grid) */}
            <div className="flex-1 grid grid-cols-12 overflow-hidden">
              
              {/* Left Sidebar (Charts & Telemetry) */}
              <div className="col-span-7 border-r border-zinc-800/80 p-6 flex flex-col justify-between bg-zinc-950/40">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-sans text-white">NVDA</span>
                        <span className="text-xs font-mono text-zinc-400">NVIDIA CORP · NASDAQ</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-mono font-bold text-white">$128.45</span>
                        <span className="text-xs font-mono text-emerald-400 font-semibold">+3.42 (+2.73%)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px] bg-zinc-900 border border-zinc-800 p-1 rounded">
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-200 rounded">1D</span>
                      <span className="px-2 py-1 text-zinc-500">5D</span>
                      <span className="px-2 py-1 text-zinc-500">1M</span>
                      <span className="px-2 py-1 text-zinc-500">1Y</span>
                    </div>
                  </div>

                  {/* Wireframe Candlestick Chart */}
                  <div className="h-44 w-full relative flex items-end gap-2.5 pt-4 pb-2 px-2 border-b border-zinc-800/60">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                      <div className="border-b border-zinc-700 w-full" />
                      <div className="border-b border-zinc-700 w-full" />
                      <div className="border-b border-zinc-700 w-full" />
                    </div>

                    {[
                      { h: 'h-16', color: 'bg-emerald-500', isGreen: true, wick: 'h-24', price: '$121.20' },
                      { h: 'h-20', color: 'bg-emerald-500', isGreen: true, wick: 'h-28', price: '$122.80' },
                      { h: 'h-12', color: 'bg-rose-500', isGreen: false, wick: 'h-20', price: '$120.90' },
                      { h: 'h-24', color: 'bg-emerald-500', isGreen: true, wick: 'h-32', price: '$123.40' },
                      { h: 'h-14', color: 'bg-rose-500', isGreen: false, wick: 'h-24', price: '$122.15' },
                      { h: 'h-28', color: 'bg-emerald-500', isGreen: true, wick: 'h-36', price: '$124.50' },
                      { h: 'h-16', color: 'bg-rose-500', isGreen: false, wick: 'h-26', price: '$123.80' },
                      { h: 'h-22', color: 'bg-emerald-500', isGreen: true, wick: 'h-30', price: '$125.60' },
                      { h: 'h-32', color: 'bg-emerald-500', isGreen: true, wick: 'h-40', price: '$126.90' },
                      { h: 'h-18', color: 'bg-rose-500', isGreen: false, wick: 'h-28', price: '$125.10' },
                      { h: 'h-36', color: 'bg-emerald-500', isGreen: true, wick: 'h-44', price: '$128.45' },
                    ].map((candle, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                        {/* Mock Crosshair/Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                          <div className="bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-zinc-300 px-2 py-1 rounded shadow-xl whitespace-nowrap">
                            {candle.price}
                          </div>
                        </div>
                        {/* Wick */}
                        <div className={`w-[1px] ${candle.color} opacity-60 ${candle.wick} absolute bottom-2`} />
                        {/* Candle Body */}
                        <div
                          className={`w-full max-w-[14px] ${candle.h} ${candle.color} rounded-sm relative z-10 opacity-90 ${
                            candle.isGreen
                              ? 'transition-all duration-200 ease-out cursor-crosshair hover:-translate-y-1 hover:brightness-150 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                              : 'transition-all duration-200 ease-out cursor-crosshair hover:translate-y-1 hover:brightness-150 hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monte Carlo Curve Projection */}
                <div className="mt-4 pt-4 border-t border-zinc-800/40">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      MONTE CARLO PROJECTION (500 ITERATIONS)
                    </span>
                    <span className="text-[11px] text-zinc-500">95% CONFIDENCE BAND</span>
                  </div>
                  
                  <div className="h-20 w-full relative">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 80">
                      <defs>
                        <linearGradient id="mcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 60 Q 75 40, 150 25 T 300 10 L 300 70 Q 225 65, 150 65 T 0 60 Z" fill="url(#mcGrad)" />
                      <path d="M 0 60 Q 75 40, 150 25 T 300 10" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <path d="M 0 60 Q 75 55, 150 45 T 300 35" fill="none" stroke="#10b981" strokeWidth="2" />
                      <path d="M 0 60 Q 75 65, 150 65 T 300 70" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                    </svg>
                  </div>

                  {/* Quantitative Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-800/40 text-[10px] font-mono">
                    <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-800/60">
                      <span className="text-zinc-500 block">EXPECTED DRIFT</span>
                      <span className="text-emerald-400 font-bold">+24.8% μ</span>
                    </div>
                    <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-800/60">
                      <span className="text-zinc-500 block">VOLATILITY (σ)</span>
                      <span className="text-zinc-200 font-bold">42.1% TTM</span>
                    </div>
                    <div className="bg-zinc-900/60 p-1.5 rounded border border-zinc-800/60">
                      <span className="text-zinc-500 block">VaR (95%)</span>
                      <span className="text-rose-400 font-bold">-7.8% MAX</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Agents Stacked Vertically) */}
              <div className="col-span-5 p-6 flex flex-col gap-4 overflow-hidden bg-zinc-950/60">
                {/* Agent 1: The Bull */}
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                  className="bg-zinc-900/60 border-l-2 border-emerald-500 rounded-lg p-4 text-xs font-mono flex flex-col gap-2 shadow-lg transition-colors cursor-pointer relative hover:border-emerald-500/50 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)] hover:bg-zinc-900/80"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold tracking-wider">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      BULLISH PERSPECTIVE
                    </span>
                    <span className="text-zinc-500">CONFIDENCE: 88%</span>
                  </div>
                  <h4 className="font-sans font-semibold text-zinc-200 text-sm">Cash Flow Acceleration</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    TTM Operating Cash Flow: $14.4B (+63.6% YoY). Data center moat intact across Blackwell transition.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px]">
                    <span className="text-emerald-400 font-bold">SEC 10-Q VERIFIED</span>
                    <span className="text-zinc-500">UPSIDE +28%</span>
                  </div>
                </motion.div>

                {/* Agent 2: The Bear */}
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                  className="bg-zinc-900/60 border-l-2 border-rose-500 rounded-lg p-4 text-xs font-mono flex flex-col gap-2 shadow-lg transition-colors cursor-pointer relative hover:border-rose-500/50 hover:shadow-[0_10px_30px_-10px_rgba(244,63,94,0.3)] hover:bg-zinc-900/80"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold tracking-wider">
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      BEARISH PERSPECTIVE
                    </span>
                    <span className="text-zinc-500">CONVICTION: 76%</span>
                  </div>
                  <h4 className="font-sans font-semibold text-zinc-200 text-sm">Hyperscaler Concentration Risk</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    Top 4 hyperscalers represent 43.1% of revenue. In-house ASIC development poses structural margin headwinds.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px]">
                    <span className="text-rose-400 font-bold">VULNERABILITY FLAGGED</span>
                    <span className="text-zinc-500">MAX DRAWDOWN -18%</span>
                  </div>
                </motion.div>

                {/* Agent 3: The Quant */}
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                  className="bg-zinc-900/60 border-l-2 border-cyan-500 rounded-lg p-4 text-xs font-mono flex flex-col gap-2 shadow-lg transition-colors cursor-pointer relative hover:border-cyan-500/50 hover:shadow-[0_10px_30px_-10px_rgba(6,182,212,0.3)] hover:bg-zinc-900/80"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold tracking-wider">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      RISK ANALYSIS
                    </span>
                    <span className="text-zinc-500">LATENCY: 12ms</span>
                  </div>
                  <h4 className="font-sans font-semibold text-zinc-200 text-sm">Monte Carlo Distribution</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    500 Brownian Motion paths. Expected drift μ=24.8% with tail risk VaR(95%) at -7.8%.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px]">
                    <span className="text-cyan-400 font-bold">STOCHASTIC PASS</span>
                    <span className="text-zinc-500">SHARPE: 2.14</span>
                  </div>
                </motion.div>
              </div>

            </div>

            {/* The Glow Overlay (fades into background) */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-20 pointer-events-none" />
          </div>
        </div>
      </main>

      {/* Target Audience Banner */}
      <div className="w-full border-y border-zinc-800/50 bg-zinc-900/30 py-4 relative z-10 flex justify-center">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-center px-4">
          Built for Quantitative Traders, Family Offices, Equity Researchers, and Active Institutional Managers
        </p>
      </div>

      {/* Bento Grid Architecture */}
      <section id="framework" className="py-24 px-6 relative z-10 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">The Committee Framework</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">Four specialized neural agents working in adversarial harmony to distill signal from noise.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Card 1: The Bull */}
          <motion.div variants={itemVariants} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 hover:border-emerald-500/50 transition-colors group">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">The Bull</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-mono">Fundamental Momentum. Analyzes cash flow, margins, and growth catalysts to build the aggressive upside thesis.</p>
          </motion.div>

          {/* Card 2: The Bear */}
          <motion.div variants={itemVariants} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 hover:border-rose-500/50 transition-colors group">
            <div className="h-10 w-10 bg-rose-500/10 rounded-lg flex items-center justify-center border border-rose-500/20 mb-4 group-hover:bg-rose-500/20 transition-colors">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">The Bear</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-mono">Forensic Risk. Attacks balance sheets, identifies customer concentration, and flags debt maturities.</p>
          </motion.div>

          {/* Card 3: The Quant */}
          <motion.div variants={itemVariants} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 hover:border-cyan-500/50 transition-colors group md:col-span-2 lg:col-span-1">
            <div className="h-10 w-10 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <Calculator className="h-5 w-5 text-cyan-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">The Quant</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-mono">Deterministic Math. Executes pure Python Monte Carlo simulations and Value-at-Risk statistical modeling.</p>
          </motion.div>

          {/* Card 4: The Judge (Spans 2 columns on lg screens) */}
          <motion.div variants={itemVariants} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 hover:border-amber-500/50 transition-colors group md:col-span-2 lg:col-span-3 lg:flex gap-8 items-center">
            <div className="shrink-0 h-16 w-16 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 mb-4 lg:mb-0 group-hover:bg-amber-500/20 transition-colors">
              <Gavel className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">The Judge</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-mono max-w-3xl">Consensus Adjudication. Impartially synthesizes the adversarial arguments into an explainable, 1-100 institutional conviction score based on empirical evidence.</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Performance & Security Metrics */}
      <section className="border-t border-zinc-800/80 bg-zinc-900/50 relative z-10 py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          <div className="flex flex-col items-center pt-8 md:pt-0 px-4">
            <Zap className="h-6 w-6 text-emerald-400 mb-3" />
            <h4 className="text-2xl font-mono font-bold text-zinc-100 mb-1">Sub-50ms</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Engine Latency</p>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0 px-4">
            <Scale className="h-6 w-6 text-zinc-400 mb-3" />
            <h4 className="text-2xl font-mono font-bold text-zinc-100 mb-1">Zero</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Hallucination Math Engine</p>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0 px-4">
            <ShieldCheck className="h-6 w-6 text-cyan-400 mb-3" />
            <h4 className="text-2xl font-mono font-bold text-zinc-100 mb-1">100%</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Cryptographic Security</p>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}
