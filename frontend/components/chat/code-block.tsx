'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800/80 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400"/>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-300">
            {language || 'SCRIPT'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400"/>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5"/>
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-zinc-200 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <pre className="text-emerald-400/90 font-mono text-[13px]">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
