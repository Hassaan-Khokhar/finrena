'use client';

import { AgentMessage } from '../../types/arena';
import { AgentCard } from './agent-card';
import { useEffect, useRef, useState } from 'react';
import { Input } from '../ui/input';
import { Send, Pause, RefreshCw, Hand, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/button';

export function AgentTerminal({ 
  messages,
  isWaitingForHuman,
  onSendMessage,
  onForceVerdict,
  isMaximized,
  onToggleMaximize,
}: { 
  messages: AgentMessage[];
  isWaitingForHuman: boolean;
  onSendMessage: (msg: string) => void;
  onForceVerdict: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isMaximized]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !isWaitingForHuman) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 overflow-hidden">
      
      {/* Top Committee Controls Bar */}
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex flex-col gap-2 shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Live Arena Feed</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isWaitingForHuman ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isWaitingForHuman ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {isWaitingForHuman ? 'WAITING FOR CHAIR' : 'Connected — 12ms'}
              </span>
            </div>

            {onToggleMaximize && (
              <button
                type="button"
                onClick={onToggleMaximize}
                title={isMaximized ? "Restore split" : "Maximize chat"}
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ml-1"
                aria-label={isMaximized ? "Restore split" : "Maximize chat"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-3.5 w-3.5 text-emerald-400 hover:text-emerald-300" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Steering Controls */}
        <div className="flex items-center gap-2 justify-between bg-zinc-950 border border-zinc-800 rounded p-1">
          <div className="text-[10px] font-mono text-zinc-500 uppercase px-2 shrink-0 hidden sm:block">Committee Controls:</div>
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-zinc-400 hover:text-zinc-200" onClick={onForceVerdict}>
              <Pause className="h-3 w-3 mr-1" /> Pause Debate
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-zinc-400 hover:text-zinc-200" onClick={onForceVerdict}>
              <RefreshCw className="h-3 w-3 mr-1" /> Force Cross-Exam
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-zinc-400 hover:text-zinc-200" onClick={() => {}}>
              <Hand className="h-3 w-3 mr-1" /> Interject
            </Button>
          </div>
        </div>
      </div>
      
      {/* Scrollable Message List */}
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        <div className="flex flex-col justify-end min-h-full">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-600 font-mono text-sm py-10">
              [WAITING FOR SYSTEM INITIALIZATION...]
            </div>
          ) : (
            messages.map(msg => (
              <AgentCard key={msg.id} message={msg} />
            ))
          )}
        </div>
      </div>

      {/* Bottom Input & Prompt Chips */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/30 flex flex-col gap-3 shrink-0">
        {/* Interactive Prompt Chips */}
        {isWaitingForHuman && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onSendMessage("What about export license limits?")} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700 transition-colors">
              <span className="font-bold text-rose-400 mr-1">Ask Bear:</span> What about export limits?
            </button>
            <button onClick={() => onSendMessage("Defend the 48x P/E multiple against historical norms.")} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700 transition-colors">
              <span className="font-bold text-emerald-400 mr-1">Ask Bull:</span> Defend 48x P/E
            </button>
            <button onClick={() => onSendMessage("Simulate a 15% revenue miss next quarter.")} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700 transition-colors">
              <span className="font-bold text-cyan-400 mr-1">Ask Quant:</span> Simulate 15% miss
            </button>
          </div>
        )}

        <form 
          className="relative flex items-center"
          onSubmit={handleSubmit}
        >
          <Input 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={!isWaitingForHuman}
            className="w-full bg-zinc-950 border-zinc-800 text-sm font-sans placeholder:text-zinc-600 pr-24 disabled:opacity-50"
            placeholder={isWaitingForHuman ? "Interject as Committee Chair..." : "Agents are actively debating..."}
          />
          <div className="absolute right-1 flex items-center gap-1">
            <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline-block mr-1">CHAIR</span>
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              disabled={!isWaitingForHuman || !inputValue.trim()}
              className="h-7 w-7 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
