import { useEffect, useState, useRef, useCallback } from 'react';
import { AgentMessage, TickerSummary, ExecutiveVerdict, MonteCarloSimulationData, AgentSource } from '../types/arena';
import { MOCK_TICKERS } from './mock-data';

const BULL_TEXT = "Let's examine the numbers filed on August 28, 2026. Over the trailing twelve months, Data Center segment revenue surged from $14.5B to $26.3B—a 154% YoY acceleration driven by the Blackwell architecture rollout. More critically, Operating Cash Flow reached $14.4B this quarter alone, up from $8.8B in the previous period. Their gross margin expansion to 75.1% proves enterprise buyers are absorbing price increases without margin compression. The key growth catalyst isn't just hardware; their enterprise software ecosystem (NVIDIA AI Enterprise) is tracking toward a $2B annual run rate, creating recurring high-margin ARR that Wall Street is severely underpricing.";
const BEAR_TEXT = "The Bull is conflating top-line shipments with sustainable cash realization. Let's look at the balance sheet from the same August 28 filing. First, Accounts Receivable surged 35% quarter-over-quarter to $14.1B. That growth outpaced revenue growth, indicating that hyperscalers are stretching payment terms. Second, customer concentration has reached critical risk levels: Microsoft, Meta, Alphabet, and Amazon accounted for 43% of total Q2 revenue. Hyperscaler CAPEX cycles are cyclical. If Google's internal TPU deployment or Amazon's Trainium chips offset even 10% of external GPU procurement by early 2027, this 48x earnings multiple collapses back to 28x. Bull, where is the pricing power when four buyers control nearly half your pipeline?";
const QUANT_TEXT = "Simulation complete: 500 paths run. Mean 30d forecast: $131.20. Skew: -0.18. Volatility implies a wide confidence band; options markets are pricing in a 12% move on the next earnings call.";
const JUDGE_TEXT = "Adjudication complete. Structural upside currently outpaces multiple compression risks.";

const BULL_SOURCE: AgentSource = {
  title: 'SEC Form 10-Q',
  date: 'August 28, 2026',
  citation: 'Part I, Item 2: Management Discussion & Analysis',
  excerpt: 'Data Center revenue was $26.3 billion, up 154% from a year ago. Operating cash flow was $14.4 billion.'
};

const BEAR_SOURCE: AgentSource = {
  title: 'SEC Form 10-Q',
  date: 'August 28, 2026',
  citation: 'Part I, Item 1 — Note 4: Segment Operations & Concentration',
  excerpt: 'Accounts receivable increased by 35% sequentially. Four direct customers accounted for approximately 43% of total revenue.'
};

export function useArenaSimulation(tickerId: string, start: boolean = true) {
  const [tickerData, setTickerData] = useState<TickerSummary | null>(() => {
    if (!start) return null;
    return MOCK_TICKERS[tickerId] || {
      symbol: tickerId,
      companyName: `${tickerId} Corp`,
      currentPrice: 154.20,
      change: 3.40,
      changePercent: 2.25,
      marketCap: '$2.8T',
      peRatio: 38.5,
      beta: 1.45,
      fiftyTwoWeekHigh: 160.00,
      fiftyTwoWeekLow: 85.00,
      grossMargin: '68.5%',
      fcfYield: '2.8%',
      historicalCandles: MOCK_TICKERS['NVDA']?.historicalCandles || [],
    };
  });
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloSimulationData | null>(null);
  const [verdict, setVerdict] = useState<ExecutiveVerdict | null>(null);
  const [phase, setPhase] = useState<number>(0);
  const [isWaitingForHuman, setIsWaitingForHuman] = useState(false);
  const mounted = useRef(true);
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  const schedule = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(() => {
      if (mounted.current) fn();
    }, ms);
    timeouts.current.push(t);
    return t;
  }, []);

  const streamMessage = useCallback((
    role: 'bull' | 'bear' | 'quant' | 'judge' | 'user',
    authorName: string,
    fullText: string,
    delayMs: number,
    startDelay: number,
    sources?: AgentSource[],
    verdict?: ExecutiveVerdict,
    onComplete?: () => void
  ) => {
    schedule(startDelay, () => {
      const id = Math.random().toString(36).substring(7);
      setMessages(prev => [...prev, { id, role, authorName, content: '', isStreaming: true, timestamp: new Date().toLocaleTimeString(), sources, verdict }]);
      
      const words = fullText.split(' ');
      let currentText = '';
      
      words.forEach((word, index) => {
        schedule(index * delayMs, () => {
          currentText += (index === 0 ? '' : ' ') + word;
          setMessages(prev => prev.map(m => m.id === id ? { ...m, content: currentText, isStreaming: index !== words.length - 1 } : m));
          if (index === words.length - 1 && onComplete) {
            onComplete();
          }
        });
      });
    });
  }, [schedule]);

  useEffect(() => {
    mounted.current = true;
    
    // Dynamic Ticker Generation
    let ticker = MOCK_TICKERS[tickerId];
    if (!ticker) {
      // Create dynamic fallback data
      const isCrypto = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'].includes(tickerId);
      ticker = {
        ...MOCK_TICKERS['NVDA'],
        ticker: tickerId,
        companyName: isCrypto ? `${tickerId} Network` : `${tickerId} Inc`,
        currentPrice: isCrypto ? 3400.50 : 150.25,
        peRatio: isCrypto ? 0 : 25.4,
        marketCap: isCrypto ? '$450B' : '$120B'
      };
    }

    setTickerData(ticker);
    setMessages([]);
    setMonteCarlo(null);
    setVerdict(null);
    setPhase(0);
    setIsWaitingForHuman(false);
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];

    if (!start) return;

    // Phase 0
    setPhase(0);

    // Phase 1 (600ms): Bull
    schedule(600, () => setPhase(1));
    streamMessage('bull', 'The Bull (Groq/Llama 3.1)', BULL_TEXT, 20, 600, [BULL_SOURCE]);

    // Phase 2 (3800ms): Bear
    schedule(3800, () => setPhase(2));
    streamMessage('bear', 'The Bear (Groq/Llama 3.1)', BEAR_TEXT, 20, 3800, [BEAR_SOURCE]);

    // Phase 3 (7500ms): Quant
    schedule(7500, () => setPhase(3));
    streamMessage('quant', 'The Quant (NumPy Engine)', QUANT_TEXT, 10, 7500, undefined, undefined, () => {
      setMonteCarlo(ticker.monteCarlo);
      setIsWaitingForHuman(true); // Wait for the user to interact
    });

    return () => {
      mounted.current = false;
      timeouts.current.forEach(clearTimeout);
    };
  }, [tickerId, start, schedule, streamMessage]);

  const sendUserMessage = (text: string) => {
    if (!isWaitingForHuman) return;
    setIsWaitingForHuman(false);
    
    // Immediately show the user's message
    const id = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, { id, role: 'user', authorName: 'YOU · LEAD ANALYST', content: text, isStreaming: false, timestamp: new Date().toLocaleTimeString() }]);

    // Phase 3.5: Context-Aware Agent Reply
    const lowerText = text.toLowerCase();
    let responderRole: 'bull' | 'bear' | 'quant' = 'bull';
    let responderName = 'The Bull (Groq/Llama 3.1)';
    let replyText = '';
    let replySource: AgentSource | undefined = undefined;

    if (lowerText.includes('export') || lowerText.includes('tsmc') || lowerText.includes('taiwan')) {
      responderRole = 'bull';
      responderName = 'The Bull (Groq/Llama 3.1)';
      replyText = "Acknowledged, Chair. If export restrictions tighten further, we project an immediate 8% revenue haircut from tier-2 international buyers. However, our supply chain analysis indicates TSMC reallocation would quickly pivot those chips to backlogged domestic hyperscalers, dampening the net impact.";
      replySource = { title: 'Commerce Dept Briefing', date: 'Sept 15, 2026', citation: 'Export Control Revisions', excerpt: 'Advanced compute silicon exports subject to new licensing tiers.' };
    } else if (lowerText.includes('multiple') || lowerText.includes('p/e') || lowerText.includes('valuation')) {
      responderRole = 'bull';
      responderName = 'The Bull (Groq/Llama 3.1)';
      replyText = "The 48x P/E multiple is fully justified when evaluating the PEG ratio. With forward earnings projected to grow at 65% CAGR through 2027, the PEG sits at 0.73. Historically, during the 2010s cloud computing transition, infrastructure providers sustained 50x+ multiples as long as topline growth exceeded 40%. The multiple compresses naturally through earnings realization, not price collapse.";
      replySource = { title: 'Goldman Sachs Equities', date: 'Sept 01, 2026', citation: 'Tech Multiples Note', excerpt: 'Hardware supercycles historically support forward P/E multiples of 45-55x during hyper-growth phases.' };
    } else if (lowerText.includes('hyperscaler') || lowerText.includes('concentration')) {
      responderRole = 'bear';
      responderName = 'The Bear (Groq/Llama 3.1)';
      replyText = "Chair, that is exactly the structural risk. Microsoft's Maia and Google's TPUv6 are actively displacing external GPU purchases for internal inferencing workloads. Our channel checks indicate hyperscaler capital intensity will peak in Q4. If they divert just 15% of their CapEx to custom silicon, this earnings multiple is mathematically unsupportable.";
      replySource = { title: 'Bear Cave Analytics', date: 'August 30, 2026', citation: 'CapEx Tracker', excerpt: 'Hyperscalers are signaling a shift toward internal ASIC development starting in H2 2027.' };
    } else {
      // Default / Fallback contextual logic
      responderRole = lowerText.includes('@bear') ? 'bear' : lowerText.includes('@quant') ? 'quant' : 'bull';
      responderName = responderRole === 'bear' ? 'The Bear (Groq/Llama 3.1)' : responderRole === 'quant' ? 'The Quant (NumPy Engine)' : 'The Bull (Groq/Llama 3.1)';
      replyText = `Regarding your point on "${text.substring(0, 30)}...", our models have stress-tested this vector. The underlying structural drivers remain robust, though we are monitoring leading indicators on a weekly basis to adjust our variance parameters.`;
    }

    streamMessage(responderRole, responderName, replyText, 20, 500, replySource ? [replySource] : undefined, undefined, () => {
      // Phase 4: Judge
      setPhase(4);
      const verdictObj: ExecutiveVerdict = {
        score: 74,
        recommendation: 'MODERATE OVERWEIGHT',
        synthesis: "While multiple expansion is stretched, structural tailwinds in AI compute offset balance sheet risks for the next 2 quarters. Stop-loss at $112.",
        bullWeight: 55,
        bearWeight: 45,
        argumentScores: [
          { title: 'Fundamental Momentum', score: '9.0 / 10', winner: 'WON BY BULL', rationale: 'Backlog through 2027 confirmed via TSMC wafer allocations. Software ecosystem moats remain defensible.' },
          { title: 'Balance Sheet Quality', score: '6.5 / 10', winner: 'TIE', rationale: 'Receivables spiked, but DSO (Days Sales Outstanding) remains within historical ranges (48 days).' },
          { title: 'Customer Concentration Risk', score: '8.5 / 10', winner: 'WON BY BEAR', rationale: '43% concentration in 4 hyperscalers represents a non-trivial downside catalyst if CapEx slows in Q4.' },
          { title: 'Valuation & Multiples', score: '5.0 / 10', winner: 'WON BY BEAR', rationale: '48x P/E leaves zero margin for execution error or macro shocks.' }
        ],
        actionableDirective: 'Maintain allocation, but execute an automated stop-loss order at $114. Re-evaluate if hyperscaler earnings indicate CapEx reallocation.',
        stopLossLevel: 112,
        targetPrice: 145
      };

      streamMessage('judge', 'The Judge (Gemini Flash)', JUDGE_TEXT, 20, 1000, undefined, verdictObj, () => {
        setVerdict(verdictObj);
      });
    });
  };

  const forceVerdict = () => {
    if (!isWaitingForHuman) return;
    setIsWaitingForHuman(false);
    setPhase(4);
    const verdictObj: ExecutiveVerdict = {
      score: 74,
      recommendation: 'MODERATE OVERWEIGHT',
      synthesis: "While multiple expansion is stretched, structural tailwinds in AI compute offset balance sheet risks for the next 2 quarters. Stop-loss at $112.",
      bullWeight: 55,
      bearWeight: 45,
      argumentScores: [
        { title: 'Fundamental Momentum', score: '9.0 / 10', winner: 'WON BY BULL', rationale: 'Backlog through 2027 confirmed via TSMC wafer allocations. Software ecosystem moats remain defensible.' },
        { title: 'Balance Sheet Quality', score: '6.5 / 10', winner: 'TIE', rationale: 'Receivables spiked, but DSO (Days Sales Outstanding) remains within historical ranges (48 days).' },
        { title: 'Customer Concentration Risk', score: '8.5 / 10', winner: 'WON BY BEAR', rationale: '43% concentration in 4 hyperscalers represents a non-trivial downside catalyst if CapEx slows in Q4.' },
        { title: 'Valuation & Multiples', score: '5.0 / 10', winner: 'WON BY BEAR', rationale: '48x P/E leaves zero margin for execution error or macro shocks.' }
      ],
      actionableDirective: 'Maintain allocation, but execute an automated stop-loss order at $114. Re-evaluate if hyperscaler earnings indicate CapEx reallocation.',
      stopLossLevel: 112,
      targetPrice: 145
    };

    streamMessage('judge', 'The Judge (Gemini Flash)', JUDGE_TEXT, 20, 500, undefined, verdictObj, () => {
      setVerdict(verdictObj);
    });
  };

  return { tickerData, messages, monteCarlo, verdict, phase, isWaitingForHuman, sendUserMessage, forceVerdict };
}
