'use client';

import { AgentMessage } from '../../types/arena';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, ChevronRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const roleColors = {
  bull: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  bear: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  quant: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  judge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  user: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
};

const roleInitials = {
  bull: 'BL',
  bear: 'BR',
  quant: 'QT',
  judge: 'JG',
  user: 'YOU',
};

export function AgentCard({ message }: { message: AgentMessage }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card className={`p-4 border ${roleColors[message.role].split(' ')[0]} bg-zinc-950/50`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 mt-1 border border-zinc-800 shrink-0">
            <AvatarFallback className={`text-xs font-bold ${roleColors[message.role].split(' ')[1]} ${roleColors[message.role].split(' ')[2]}`}>
              {roleInitials[message.role]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-semibold tracking-wider uppercase ${roleColors[message.role].split(' ')[2]}`}>
                {message.authorName}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono shrink-0 ml-2">
                {message.timestamp}
              </span>
            </div>
            
            <p className="text-sm text-zinc-300 leading-relaxed font-sans mb-2">
              {message.content}
              {message.isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-1.5 h-4 ml-1 align-middle bg-zinc-400"
                />
              )}
            </p>

            {/* Judicial Adjudication Scorecard for Judge */}
            {message.verdict && !message.isStreaming && (
              <div className="mt-4 bg-zinc-900/50 border border-amber-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-amber-500 tracking-widest uppercase">Adjudication Scorecard</h4>
                  <span className="text-xs font-mono font-bold text-zinc-100 bg-amber-500/20 px-2 py-1 rounded">
                    {message.verdict.recommendation} ({message.verdict.score}/100)
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  {message.verdict.argumentScores.map((score, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs font-mono border-b border-zinc-800 pb-2 last:border-0 last:pb-0">
                      <div className="pr-4">
                        <span className="text-zinc-300 font-sans font-semibold block mb-0.5">{score.title}</span>
                        <span className={`font-bold ${score.winner.includes('BULL') ? 'text-emerald-400' : score.winner.includes('BEAR') ? 'text-rose-400' : 'text-zinc-400'}`}>
                          {score.winner}
                        </span>
                      </div>
                      <span className="text-zinc-500 shrink-0">{score.score}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded text-xs text-amber-500/90 leading-relaxed font-semibold">
                  <AlertTriangle className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
                  {message.verdict.actionableDirective}
                </div>
              </div>
            )}
            
            {/* Rich Interactive Evidence Drawer */}
            {message.sources && message.sources.length > 0 && !message.isStreaming && (
              <div className="mt-3">
                <button 
                  onClick={() => setSourcesOpen(!sourcesOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-widest border border-zinc-800/60 rounded-md bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors w-full text-left"
                >
                  <FileSearch className="h-3.5 w-3.5" />
                  Inspect Evidence
                  <ChevronRight className={`h-3.5 w-3.5 ml-auto transition-transform ${sourcesOpen ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {sourcesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2">
                        {message.sources.map((src, i) => (
                          <div key={i} className="bg-zinc-950/80 border border-zinc-800 rounded p-3 text-xs font-mono">
                            <div className="flex justify-between text-zinc-500 mb-2 border-b border-zinc-800/50 pb-2">
                              <span className="font-semibold text-zinc-300">{src.title}</span>
                              <span>Filed {src.date}</span>
                            </div>
                            <div className="text-emerald-400/80 mb-2 font-semibold">
                              {src.citation}
                            </div>
                            <div className="text-zinc-400 italic pl-2 border-l-2 border-zinc-700 bg-zinc-900/30 p-2 rounded-r">
                              "{src.excerpt}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
