export type AgentRole = 'bull' | 'bear' | 'quant' | 'judge' | 'user';

export interface AgentSource {
  title: string;
  date: string;
  citation: string;
  excerpt: string;
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  authorName: string;
  content: string;
  isStreaming: boolean;
  timestamp: string;
  metricsCited?: { label: string; value: string; sentiment: 'positive' | 'negative' | 'neutral' }[];
  sources?: AgentSource[];
  verdict?: ExecutiveVerdict;
}

export interface CandlestickData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MonteCarloSimulationData {
  timeSteps: string[];
  paths: number[][]; // Array of 500 paths with projected price arrays
  confidence95Upper: number[];
  confidence95Lower: number[];
  meanPath: number[];
  volatility: number;
  valueAtRisk95: number;
}

export interface TickerSummary {
  ticker: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  peRatio: number;
  marketCap: string;
  freeCashFlow: string;
  totalDebt: string;
  historicalCandles: CandlestickData[];
  monteCarlo: MonteCarloSimulationData;
}

export interface ExecutiveVerdict {
  score: number; // 1 to 100
  recommendation: 'STRONG OVERWEIGHT' | 'MODERATE OVERWEIGHT' | 'NEUTRAL / HOLD' | 'UNDERWEIGHT';
  synthesis: string;
  bullWeight: number;
  bearWeight: number;
  argumentScores: {
    title: string;
    score: string;
    winner: string;
    rationale: string;
  }[];
  actionableDirective: string;
  stopLossLevel: number;
  targetPrice: number;
}
