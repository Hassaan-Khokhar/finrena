'use client';

import Link from 'next/link';
import { Activity } from 'lucide-react';
import { useAuthModal } from '../../context/auth-modal-context';

export function Footer() {
  const { openAuthModal } = useAuthModal();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12 relative z-10 shrink-0">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-emerald-500" />
            <span className="font-bold tracking-tight text-lg text-zinc-100">Finrena</span>
          </Link>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
            Autonomous multi-agent financial stress-testing terminal. 
            Built for precision, engineered for alpha.
          </p>
        </div>
        <div>
          <h5 className="font-semibold text-zinc-100 mb-4 text-sm">Platform</h5>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link href="/arena" className="hover:text-emerald-400 transition-colors">The Arena</Link></li>
            <li><button onClick={openAuthModal} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">Sign In</button></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold text-zinc-100 mb-4 text-sm">Legal & Compliance</h5>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link href="/legal" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            <li><Link href="/legal" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 font-mono gap-4">
        <div className="flex flex-col items-center md:items-start gap-2">
          <p>© {new Date().getFullYear()} Finrena Platform. All rights reserved.</p>
          <a href="https://www.softagelabs.tech" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors group">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors" /> 
            A project by <strong className="text-zinc-300 font-semibold tracking-wide group-hover:text-emerald-400 transition-colors">Softage Labs</strong>
          </a>
        </div>
        <p className="text-center md:text-right">Not financial advice. Quantitative research environment only.</p>
      </div>
    </footer>
  );
}
