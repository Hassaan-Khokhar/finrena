'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FinrenaLogo } from '../shared/finrena-logo';
import { GhostIcon } from '../shared/ghost-icon';
import { useAuthModal } from '../../context/auth-modal-context';
import { 
  ArrowUp, 
  Sparkles, 
  PanelLeft, 
  Plus, 
  MessageSquare,
  Mic,
  Square,
  Loader2
} from 'lucide-react';
import { AudioVisualizer } from '../shared/audio-visualizer';

interface Message {
  role: 'agent' | 'user';
  content: string;
}

interface HistoryItem {
  id: string;
  title: string;
  query: string;
}

interface UserProfile {
  name: string;
  plan: string;
  avatarUrl?: string;
}

const ACTION_CHIPS = [
  'Analyze TSLA Q3 Cash Flow',
  'Macro impact of FOMC rate cuts',
  'NVDA gross margins & datacenter run-rate',
  'Evaluate AAPL supply chain & capex guidance',
];

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'h1',
    title: 'NVIDIA Q3 Earnings & Run-Rate',
    query: 'NVDA gross margins & datacenter run-rate',
  },
  {
    id: 'h2',
    title: 'Macro: Fed Rate Cuts Transmission',
    query: 'Macro impact of FOMC rate cuts',
  },
  {
    id: 'h3',
    title: 'Tesla Q3 Cash Flow & CapEx',
    query: 'Analyze TSLA Q3 Cash Flow',
  },
  {
    id: 'h4',
    title: 'Apple Supply Chain Margins',
    query: 'Evaluate AAPL supply chain & capex guidance',
  },
];

// Helper to format structured financial analysis without raw markdown leaking
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="font-sans text-sm text-zinc-300 leading-relaxed space-y-2 select-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading (### ...)
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-sans font-semibold text-base text-zinc-100 tracking-tight pt-2 pb-0.5 border-b border-zinc-800/60">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        // Bullet point (• ...)
        if (trimmed.startsWith('• ')) {
          const rawBullet = trimmed.replace('• ', '');
          const parts = rawBullet.split(/(\*\*.*?\*\*)/g);

          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
              <p className="flex-1 font-sans text-zinc-300">
                {parts.map((p, i) => {
                  if (p.startsWith('**') && p.endsWith('**')) {
                    return (
                      <strong key={i} className="font-semibold text-zinc-100 font-sans">
                        {p.slice(2, -2)}
                      </strong>
                    );
                  }
                  return p;
                })}
              </p>
            </div>
          );
        }

        // Subhead (**1. Heading:**)
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <p key={idx} className="font-sans font-semibold text-zinc-100 text-[13px] pt-1 uppercase tracking-wide text-emerald-400/90 font-mono">
              {trimmed.slice(2, -2)}
            </p>
          );
        }

        // Tip callout
        if (trimmed.startsWith('*Tip:')) {
          return (
            <div key={idx} className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-sans text-emerald-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{trimmed.replace(/\*/g, '')}</span>
            </div>
          );
        }

        // Standard text with bold support
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx} className="font-sans text-zinc-300">
            {parts.map((p, i) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return (
                  <strong key={i} className="font-semibold text-zinc-100 font-sans">
                    {p.slice(2, -2)}
                  </strong>
                );
              }
              return p;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function ResearchWorkspace() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();

  // App Shell State - default to closed for pristine focus and clean mobile landing
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isDebateMode, setIsDebateMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSessionTitle, setActiveSessionTitle] = useState('New Chat');
  
  // Ghost & Voice Recording States
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // User Profile State with default mock props
  const [user, setUser] = useState<UserProfile>({
    name: 'Hassaan Ali',
    plan: 'Free Tier',
  });

  // Dynamic time-of-day greeting (Claude/Gemini style) with mounted fade-in to prevent hydration flash
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
    setMounted(true);

    // Restore desktop preference if previously toggled
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const saved = localStorage.getItem('finrena_sidebar_open');
      if (saved !== null) {
        setIsSidebarOpen(saved === 'true');
      }
    }
  }, []);

  // Cleanup media stream tracks if component unmounts mid-recording
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  const handleToggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open);
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      localStorage.setItem('finrena_sidebar_open', String(open));
    }
  };

  // --- VOICE RECORDING HANDLERS (Groq Whisper-Large-V3) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);

      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop()); // Release mic hardware
        setMediaStream(null);
        await sendAudioToTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setMediaStream(null);
      alert('Microphone access was denied or is not supported in this browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Transcription failed');
      }

      const data = await res.json();
      if (data.text) {
        setInput((prev) => (prev ? `${prev} ${data.text.trim()}` : data.text.trim()));
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      alert(err.message || 'Voice transcription failed. Verify your GROQ_API_KEY in .env.local.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user profile from cache or keep default
  useEffect(() => {
    const cached = typeof window !== 'undefined' ? localStorage.getItem('finrena_user') : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser({
          name: parsed.fullName || parsed.name || 'Hassaan Ali',
          plan: parsed.plan || 'Free Tier',
          avatarUrl: parsed.avatarUrl || parsed.picture,
        });
      } catch (e) {
        setUser({ name: 'Hassaan Ali', plan: 'Free Tier' });
      }
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const generateLeadAnalystResponse = (userQuery: string) => {
    setIsGenerating(true);

    setTimeout(() => {
      let responseText = '';
      const queryLower = userQuery.toLowerCase();

      if (queryLower.includes('tsla') || queryLower.includes('tesla')) {
        responseText = `### Executive Summary: Tesla Inc. (TSLA) Cash Flow & CapEx Trajectory

**1. Operating Cash Flow (OCF):**
• Q3 Operating Cash Flow generated **$6.25B**, driven by working capital normalization, inventory liquidations in North America, and record energy storage deployments (+125% YoY).
• Automotive regulatory credits contributed **$739M** (+33% YoY), representing high-margin earnings that temporarily cushion core automotive gross margin contraction (17.1% ex-credits).

**2. Free Cash Flow (FCF) & AI Infrastructure CapEx:**
• Free Cash Flow reached **$2.74B**, exceeding consensus estimates of $1.61B.
• Full-year CapEx is paced at **>$11.0B**, predominantly directed toward compute clustering (Cortex datacenter, 50k+ H100/H200 equivalents) and Robotaxi validation compute.

**3. Quantitative Verdict:**
• **Balance Sheet:** Fortress liquidity with **$33.6B** in cash & investments and negligible debt.
• **Primary Risk:** Continued margin compression if EV price cuts resume in EMEA and APAC.

*Tip: Enable the Debate Mode toggle below to stress-test TSLA valuation against our Bull, Bear, and Quant agents.*`;
      } else if (queryLower.includes('fomc') || queryLower.includes('rate') || queryLower.includes('macro')) {
        responseText = `### Macro Analysis: FOMC Rate Cut Cycle & Capital Allocations

**1. Transmission Channels & Discount Rates:**
• A 50bps terminal rate compression lowers the weighted average cost of capital (WACC) across high-multiple growth equities by **~38–45bps**, disproportionately expanding forward P/E multiples for Tier-1 mega-cap tech.
• High-yield spreads have tightened to historical percentiles (300bps over SOFR), indicating minimal immediate credit stress across leveraged issuers.

**2. Fixed Income & Liquidity Repositioning:**
• Short-duration cash yields (Treasury bills, reverse repos) are dropping from ~5.25% toward ~4.50%, triggering capital migration toward investment-grade corporate credit and dividend-aristocrat equities.
• Dollar index (DXY) softness provides immediate tailwinds for multinational EPS translations and emerging market sovereign debt servicing.

**3. Strategic Portfolio Posture:**
• Overweight defensive quality compounders; neutral on non-profitable high-beta SaaS. Monitor 2Y/10Y yield curve steepening velocity.`;
      } else if (queryLower.includes('nvda') || queryLower.includes('nvidia')) {
        responseText = `### Institutional Dossier: NVIDIA Corp (NVDA) Run-Rate & Margins

**1. Datacenter Revenue Velocity:**
• Datacenter segment annualized run-rate currently tracking **>$110B**, propelled by Hopper (H100/H200) transition demand and initial Blackwell (B200/GB200) allocations across hyperscalers (MSFT, AMZN, GOOGL, META).
• Blackwell capacity booked out 12+ months forward with TSMC CoWoS packaging constraints operating at maximum utilization.

**2. Gross Margin Sustainability:**
• Non-GAAP gross margins sustained at **~75.0%**, supported by complete system architecture sales (NVLink, InfiniBand, Quantum-2 switches) rather than standalone accelerator silicon.
• Software run-rate (NVIDIA AI Enterprise) is compounding at triple-digit rates, introducing recurring high-margin ARR.

**3. Key Adjudication Metric:**
• Hyperscaler CapEx-to-Revenue return on investment (ROI). If software monetization lags silicon spend into 2026, capex digestion risk becomes paramount.`;
      } else {
        responseText = `### Institutional Synthesis: Lead Analyst Dossier

**Inquiry:** "${userQuery}"

**1. Core Quantitative Assessment:**
• Synthesizing live SEC 10-K/10-Q filings, consensus sell-side revisions, and institutional order book telemetry.
• Cross-asset liquidity and implied volatility surfaces (VIX term structure) indicate balanced market pricing with elevated dispersion across individual equity constituents.

**2. Strategic Risk Parameters:**
• Macro sensitivity to real rates, corporate earnings revisions breadth, and factor rotation between Momentum and Value.

**3. Recommended Action:**
• For a full multi-agent stress test including Monte Carlo simulations and adversarial Bull/Bear debate cross-examination, toggle the Debate Mode switch below and re-submit your prompt.`;
      }

      setMessages((prev) => [...prev, { role: 'agent', content: responseText }]);
      setIsGenerating(false);
    }, 700);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating || isTranscribing) return;

    const query = input.trim();

    if (isDebateMode) {
      const words = query.split(/\s+/);
      const tickerMatch = words.find((w) => /^[A-Za-z]{1,5}$/.test(w) && w.toUpperCase() === w && w.length >= 2);
      const targetParam = tickerMatch ? tickerMatch.toUpperCase() : query;
      router.push(`/arena/${encodeURIComponent(targetParam)}`);
    } else {
      if (!isGhostMode) {
        setActiveSessionTitle(query.slice(0, 32));
      } else {
        // Ghost Mode: Explicitly bypass DB calls; message lives only in React state
        console.log('Ghost Mode active: Database persistence bypassed');
      }
      setMessages((prev) => [...prev, { role: 'user', content: query }]);
      setInput('');
      generateLeadAnalystResponse(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setActiveSessionTitle('New Chat');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setActiveSessionTitle(item.title);
    setMessages([
      { role: 'user', content: item.query },
    ]);
    generateLeadAnalystResponse(item.query);
    // On mobile, auto-close drawer on select so the chat view is immediately visible
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 overflow-hidden font-sans text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Mobile Backdrop for Sidebar (< 1024px) */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => handleToggleSidebar(false)} 
      />

      {/* Step 3, 4, 5: The Collapsible History Drawer */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col bg-zinc-900 border-r border-zinc-800/80 transition-all duration-300 ease-in-out font-sans flex-shrink-0 ${
          isSidebarOpen 
            ? 'w-64 translate-x-0' 
            : 'w-64 -translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-none'
        }`}
      >
        {/* Step 3: Sidebar Top (Branding + Drawer Toggle) */}
        <div className="px-4 py-5 flex items-center justify-between border-b border-zinc-800/80 mb-2">
          <div className="flex items-center gap-2.5">
            <FinrenaLogo className="w-5 h-5"/>
            <span className="font-semibold text-sm tracking-tight text-white font-sans flex items-center">
              Finrena <span className="text-[10px] font-mono text-zinc-500 font-normal ml-1.5 uppercase">WORKSPACE</span>
            </span>
          </div>
          {/* Drawer toggle button with PanelLeft icon */}
          <button 
            type="button"
            onClick={() => handleToggleSidebar(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800/60 hover:text-white px-3 py-2 rounded-lg transition-colors w-full border border-zinc-800/60 bg-zinc-900/40 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Step 3: Sidebar Middle (History List - Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-1 flex flex-col gap-1">
          <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Recent Chats
          </div>
          {MOCK_HISTORY.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLoadHistory(item)}
              className={`text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 px-3 py-2 rounded-lg truncate cursor-pointer transition-colors text-left flex items-center gap-2.5 group w-full ${
                activeSessionTitle === item.title ? 'bg-zinc-800/60 text-zinc-100 font-medium' : ''
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0" />
              <span className="truncate font-sans">{item.title}</span>
            </button>
          ))}
        </div>

        {/* Step 4: Dynamic User Profile (Sidebar Bottom) */}
        <div 
          onClick={openAuthModal}
          className="p-4 border-t border-zinc-800/80 hover:bg-zinc-800/40 transition-colors cursor-pointer flex items-center gap-3"
        >
          {/* Profile Picture Slot */}
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-zinc-300">{user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          
          {/* User Info & Badge */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-zinc-200 truncate">{user?.name || 'Guest User'}</span>
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase mt-0.5">{user?.plan || 'Free Tier'}</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col min-w-0 relative h-[100dvh] bg-zinc-950 font-sans overflow-hidden">
        
        {/* Step 1 & 2: Minimalist Header with Logo Hover-Swap Toggle Button (Only when drawer is closed) */}
        {!isSidebarOpen && (
          <header className="absolute top-0 left-0 p-4 z-40 flex items-center">
            <button 
              onClick={() => handleToggleSidebar(true)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-800/60 transition-colors focus:outline-none cursor-pointer"
              aria-label="Open Sidebar"
              title="Open sidebar"
            >
              {/* The Logo (Visible by default, fades out on hover) */}
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0 pointer-events-none">
                <FinrenaLogo className="w-6 h-6"/>
              </div>
              
              {/* The PanelLeft Icon (Hidden by default, fades in on hover) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-zinc-300 pointer-events-none">
                <PanelLeft className="w-5 h-5"/>
              </div>
            </button>
          </header>
        )}

        {/* Top Right Header: Ghost Session Mode Toggle */}
        <header className="absolute top-0 right-0 p-4 z-40 flex items-center gap-3 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsGhostMode(!isGhostMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all border cursor-pointer select-none ${
              isGhostMode
                ? 'bg-zinc-900 border-emerald-500/80 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Toggle Ghost Session (Disappearing Chat - Bypasses Database)"
          >
            <GhostIcon className={`w-3.5 h-3.5 ${isGhostMode ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span>{isGhostMode ? 'GHOST ACTIVE' : 'STANDARD'}</span>
          </button>
        </header>

        {/* Chat Feed (With scrollbar-hide & strict sans-serif) */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pt-16 pb-36 px-4 lg:px-8 font-sans">
          
          {messages.length === 0 ? (
            /* Empty State: Claude/Gemini Greeting & Clean Action Chips */
            <div className="flex-1 min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
              <div className="mb-3.5 opacity-90 transition-transform duration-300 hover:scale-105">
                <FinrenaLogo className="w-9 h-9" />
              </div>

              <div className="text-center mb-6 space-y-1.5">
                <h1 
                  className={`text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans transition-opacity duration-700 ease-in-out ${
                    mounted ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {greeting}, <span className="text-zinc-200">{firstName}</span>.
                </h1>
                <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-lg mx-auto leading-relaxed">
                  What financial asset, macro thesis, or strategy are we researching today?
                </p>
              </div>

              {/* 2x2 Action Chips Grid (Clean, sparkles removed) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {ACTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInput(chip);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="p-3.5 border border-zinc-800/60 rounded-xl bg-zinc-900/30 hover:bg-zinc-800/60 text-sm text-zinc-300 cursor-pointer transition-all text-left hover:text-zinc-100 hover:border-zinc-700/80 group font-sans leading-snug"
                  >
                    <span>{chip}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Step 5: Clamped Message Container for Reading Comfort on 60-inch screens */
            <div className="w-full max-w-4xl mx-auto space-y-6 pt-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    /* User Bubble */
                    <div className="bg-zinc-800 text-zinc-100 px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm font-sans">
                      {msg.content}
                    </div>
                  ) : (
                    /* Agent Bubble */
                    <div className="flex items-start gap-3 max-w-[90%]">
                      <div className="shrink-0 mt-0.5">
                        <FinrenaLogo className="w-6 h-6" />
                      </div>
                      <div className="flex-1 font-sans">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono text-emerald-400 font-medium">Lead Analyst</span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Autonomous Model</span>
                        </div>
                        <FormattedMessage content={msg.content} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Generating / Typing Indicator */}
              {isGenerating && (
                <div className="flex items-start gap-3 max-w-[90%]">
                  <div className="shrink-0 mt-0.5">
                    <FinrenaLogo className="w-6 h-6" />
                  </div>
                  <div className="flex-1 font-sans">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-emerald-400 font-medium">Lead Analyst</span>
                      <span className="text-[10px] font-mono text-zinc-500 animate-pulse">Synthesizing telemetry...</span>
                    </div>
                    <div className="flex items-center gap-1.5 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* Input Dock (Floating at bottom of active workspace, clamped to max-w-4xl) */}
        <div className="absolute bottom-0 w-full z-20 pointer-events-none">
          <div className="w-full max-w-4xl mx-auto p-4 pb-6">
            
            <div
              className={`relative flex flex-col bg-zinc-900/80 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 pointer-events-auto ${
                isRecording
                  ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : isGhostMode
                  ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : isDebateMode
                  ? 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
                  : 'border-zinc-700/60 focus-within:border-zinc-500/80'
              }`}
            >
              {/* Textarea Input / Real-time Audio Visualizer Swap */}
              <div className="relative flex items-center min-h-[52px]">
                {isRecording ? (
                  // Active Recording Visualizer State
                  <div className="flex items-center w-full px-4 pr-24 py-1.5 h-[52px]">
                    <AudioVisualizer stream={mediaStream} />
                  </div>
                ) : (
                  // Standard Text Input State
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isTranscribing
                        ? "Processing high-fidelity transcription (Groq Whisper-V3)..."
                        : isGhostMode
                        ? "Ghost Session: Messages will disappear on exit..."
                        : isDebateMode
                        ? "Enter asset or thesis for Multi-Agent Debate (e.g. NVDA, TSLA)..."
                        : "Ask a question or request ticker analysis..."
                    }
                    className="w-full bg-transparent text-zinc-100 px-4 py-3.5 pr-24 focus:outline-none resize-none placeholder:text-zinc-500 text-sm leading-relaxed font-sans"
                  />
                )}

                {/* Action Buttons: Voice & Send */}
                <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                  {/* Mic Button */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                        : isTranscribing
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                    title={isRecording ? 'Stop recording voice' : isTranscribing ? 'Transcribing...' : 'Start voice transcription (Groq Whisper-V3)'}
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : isRecording ? (
                      <Square className="w-4 h-4 fill-current text-red-400" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  {/* Submit Button */}
                  <button
                    type="button"
                    disabled={!input.trim() || isGenerating || isTranscribing}
                    onClick={() => handleSubmit()}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      input.trim() && !isGenerating && !isTranscribing
                        ? isDebateMode
                          ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                          : 'bg-white text-black hover:bg-zinc-200'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                    }`}
                    title={isDebateMode ? "Launch Debate Mode" : "Send query to Lead Analyst"}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Bar with physical-feeling toggle switch */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 border-t border-zinc-800/80">
                
                {/* Left Side: Physical-feeling Toggle Switch & Ghost Protocol status */}
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setIsDebateMode(!isDebateMode)}
                    className="flex items-center gap-2 cursor-pointer select-none group"
                    title="Toggle between single Lead Analyst research and multi-agent debate mode"
                  >
                    {/* The Switch */}
                    <div
                      className={`w-8 h-4 rounded-full relative transition-colors border ${
                        isDebateMode
                          ? 'bg-emerald-500/20 border-emerald-500/50'
                          : 'bg-zinc-800 border-zinc-700 group-hover:border-zinc-600'
                      }`}
                    >
                      {/* The Thumb */}
                      <div
                        className={`w-3 h-3 rounded-full absolute top-[1px] transition-all duration-200 ${
                          isDebateMode ? 'bg-emerald-400 left-[17px]' : 'bg-zinc-500 left-[1px]'
                        }`}
                      />
                    </div>

                    {/* The Label */}
                    <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      Debate Mode
                    </span>

                    {/* Visual Status Indicator */}
                    {isDebateMode && (
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 hidden sm:inline-block ml-1">
                        Debate On
                      </span>
                    )}
                  </div>

                  {/* Ghost Protocol Active Pill */}
                  {isGhostMode && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                      <GhostIcon className="w-3 h-3 text-emerald-400" />
                      <span>EPHEMERAL (NO DB)</span>
                    </div>
                  )}
                </div>

                {/* Right Side: Return Shortcut or Voice State */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline-block">
                    {isRecording
                      ? 'Listening to microphone...'
                      : isTranscribing
                      ? 'Groq Whisper-V3...'
                      : isDebateMode
                      ? 'Routes to Multi-Agent Debate'
                      : 'Lead Analyst Q&A'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">
                    Return ↵
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>

      </main>

    </div>
  );
}
