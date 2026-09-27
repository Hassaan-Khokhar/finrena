'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FinrenaLogo } from '../shared/finrena-logo';
import { GhostIcon } from '../shared/ghost-icon';
import { useAuthModal } from '../../context/auth-modal-context';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';
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

// Workspace-isolated markdown and terminal code-fence renderer
export const FormattedMessage = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} value={codeText} />;
            }
            if (!inline && codeText.includes('\n')) {
              return <CodeBlock language="text" value={codeText} />;
            }
            return (
              <code className="bg-zinc-800/80 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left border-collapse text-xs font-mono">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-semibold">{children}</thead>;
          },
          th({ children }) {
            return <th className="p-2.5 text-zinc-200">{children}</th>;
          },
          td({ children }) {
            return <td className="p-2.5 border-t border-zinc-800/50 text-zinc-400">{children}</td>;
          },
          h1({ children }) {
            return <h1 className="text-lg font-bold text-zinc-100 mt-6 mb-3 tracking-tight border-b border-zinc-800 pb-1.5">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-semibold text-zinc-100 mt-5 mb-2.5 tracking-tight border-b border-zinc-800/60 pb-1">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold text-emerald-400/90 mt-4 mb-2 tracking-wide uppercase">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="list-disc list-outside pl-4 space-y-1.5 my-2.5 text-zinc-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-outside pl-4 space-y-1.5 my-2.5 text-zinc-300">{children}</ol>;
          },
          hr() {
            return <hr className="my-6 border-zinc-800/80" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

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
  const [isStreaming, setIsStreaming] = useState(false); // true once character-by-character rendering begins
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
      // Request uncompressed, Whisper-optimized audio parameters
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Whisper natively processes at 16kHz. Bypassing resampling prevents data loss.
          channelCount: 1,   // Mono audio (stereo confuses transcription models)
          echoCancellation: true,
          noiseSuppression: true, 
          autoGainControl: true 
        } 
      });
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
      console.error('Microphone access unavailable or denied:', err);
      setMediaStream(null);
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
      formData.append('file', audioBlob, 'audio.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        // Fail silently to client, do not alert infrastructure names
        console.error('Voice input unavailable at this time.');
        return;
      }

      const data = await res.json();
      if (data.text) {
        // Append the transcribed text to the existing input field smoothly
        setInput((prev) => (prev ? `${prev} ${data.text.trim()}` : data.text.trim()));
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch (err) {
      // Catch network errors silently without breaking the UI
      console.error('Network error during voice input.');
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

  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup streaming interval and in-flight fetch on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Calls the real /api/chat backend endpoint and streams the response
   * character-by-character for a premium typing effect.
   */
  const generateLeadAnalystResponse = async (userQuery: string, allMessages: Message[]) => {
    if (isSubmittingRef.current || !userQuery.trim()) return;
    isSubmittingRef.current = true;
    setIsGenerating(true);

    // Cancel any lingering in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Build the messages payload for the API (convert 'agent' role to 'assistant')
      const apiMessages = allMessages.map((m) => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          conversationHistory: apiMessages.slice(0, -1),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        console.error('Chat API returned non-OK status:', res.status);
        setMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            content:
              'I am Finrena. Our institutional servers are currently processing unprecedented market traffic. Please wait 60 seconds for the network connection to stabilize, and submit your research query again.',
          },
        ]);
        setIsGenerating(false);
        return;
      }

      const data = await res.json();
      const fullText: string = data.content || data.reply || 'Analysis unavailable at this time.';

      // Character-by-character streaming animation for premium feel
      let charIndex = 0;
      const CHARS_PER_TICK = 3; // Speed: 3 characters every 12ms ≈ 250 chars/sec
      const TICK_MS = 12;

      // Add an empty agent message that we'll fill progressively
      setMessages((prev) => [...prev, { role: 'agent', content: '' }]);
      setIsStreaming(true); // Switch from loading skeleton to character render mode

      streamingIntervalRef.current = setInterval(() => {
        charIndex += CHARS_PER_TICK;

        if (charIndex >= fullText.length) {
          // Streaming complete — set final text and stop
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'agent', content: fullText };
            return updated;
          });
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
          }
          setIsStreaming(false);
          setIsGenerating(false);
        } else {
          // Update the last message with progressively more characters
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'agent',
              content: fullText.slice(0, charIndex),
            };
            return updated;
          });
        }
      }, TICK_MS);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return; // Request was aborted cleanly, ignore
      }
      console.error('Network error calling chat API:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content:
            'I am Finrena. A network interruption occurred while connecting to our institutional servers. Please check your connection and try again.',
        },
      ]);
      setIsStreaming(false);
      setIsGenerating(false);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!input.trim() || isGenerating || isTranscribing || isSubmittingRef.current) return;

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
      const newMessages: Message[] = [...messages, { role: 'user', content: query }];
      setMessages(newMessages);
      setInput('');
      generateLeadAnalystResponse(query, newMessages);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
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
    const newMessages: Message[] = [{ role: 'user', content: item.query }];
    setMessages(newMessages);
    generateLeadAnalystResponse(item.query, newMessages);
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
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-[15.5px] text-white font-sans tracking-normal leading-none">
                Finrena
              </span>
              <span className="text-[7.5px] font-mono text-zinc-500 font-medium uppercase tracking-wider leading-none">
                WORKSPACE
              </span>
            </div>
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

              {/* Phase 1: Server-side processing indicator (before streaming begins) */}
              {isGenerating && !isStreaming && (
                <div className="flex items-start gap-3 max-w-[90%]">
                  <div className="shrink-0 mt-0.5">
                    <FinrenaLogo className="w-6 h-6" />
                  </div>
                  <div className="flex-1 font-sans">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-emerald-400 font-medium">Lead Analyst</span>
                      <span className="text-[10px] font-mono text-zinc-500 animate-pulse">Analyzing institutional order book...</span>
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
                    <span
                      className={`text-[11px] font-mono tracking-wider uppercase transition-colors leading-none ${
                        isDebateMode
                          ? 'text-emerald-400 font-medium'
                          : 'text-zinc-400 group-hover:text-zinc-300'
                      }`}
                    >
                      Debate Mode
                    </span>
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
