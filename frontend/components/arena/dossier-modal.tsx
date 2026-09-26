'use client';

import { ExecutiveVerdict } from '../../types/arena';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Printer, Scale, AlertTriangle, TrendingUp } from 'lucide-react';

export function DossierModal({ 
  verdict, 
  isOpen, 
  onClose 
}: { 
  verdict: ExecutiveVerdict | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!verdict) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        
        {/* Printable Area */}
        <div id="dossier-print-area" className="max-h-[85vh] overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-500 tracking-widest uppercase mb-1">
                Judicial Adjudication Scorecard
              </h2>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Overall Ruling
              </DialogTitle>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-4xl font-mono font-bold text-amber-400">
                {verdict.score}
                <span className="text-lg text-zinc-600">/100</span>
              </div>
              <div className="text-sm font-bold text-amber-500/80 mt-1">
                {verdict.recommendation}
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-800 my-6" />

          {/* Argument Scoring Breakdown */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              Argument Scoring & Weighting Breakdown
            </h3>
            <div className="space-y-4">
              {verdict.argumentScores.map((arg, idx) => (
                <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-zinc-200">
                      {idx + 1}. {arg.title}
                    </span>
                    <span className="font-mono text-amber-400 text-sm">{arg.score}</span>
                  </div>
                  <div className="text-sm">
                    <span className={`font-bold mr-2 uppercase ${arg.winner.includes('BULL') ? 'text-emerald-400' : arg.winner.includes('BEAR') ? 'text-rose-400' : 'text-zinc-400'}`}>
                      VERDICT: {arg.winner}.
                    </span>
                    <span className="text-zinc-400 leading-relaxed">
                      {arg.rationale}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quantitative Model Evidence */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Quantitative Model Evidence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-md flex items-center justify-between">
                <span className="text-sm text-zinc-400">Monte Carlo 30-Day VaR (95% CI)</span>
                <span className="font-mono text-rose-400">-$9.80 (-7.8%)</span>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-md flex items-center justify-between">
                <span className="text-sm text-zinc-400">Implied Volatility</span>
                <span className="font-mono text-zinc-200">42.1%</span>
              </div>
            </div>
          </div>

          {/* Actionable Directive */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Actionable Committee Directive
            </h3>
            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-md">
              <p className="text-sm text-amber-500/90 leading-relaxed font-semibold">
                "{verdict.actionableDirective}"
              </p>
            </div>
          </div>

          {/* Key Pricing Levels */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-md">
              <div className="text-xs text-zinc-500 uppercase">Target Price</div>
              <div className="text-lg font-mono text-zinc-200 mt-1">${verdict.targetPrice}</div>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-md">
              <div className="text-xs text-zinc-500 uppercase">Stop Loss</div>
              <div className="text-lg font-mono text-rose-400 mt-1">${verdict.stopLossLevel}</div>
            </div>
          </div>
        </div>

        {/* Action Footer (Non-printable ideally, handled by CSS in globals) */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-950/80 backdrop-blur flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
          <Button variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={onClose}>
            Back to Live Terminal
          </Button>
          <Button 
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Download Signed PDF Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
