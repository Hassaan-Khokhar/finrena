import { CandlestickData, MonteCarloSimulationData, TickerSummary } from '../types/arena';

// Helper to generate a realistic-looking candle series
function generateCandles(startPrice: number, days: number, volatility: number = 0.02): CandlestickData[] {
  const candles: CandlestickData[] = [];
  let currentPrice = startPrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Random walk
    const change = currentPrice * volatility * (Math.random() - 0.45);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (currentPrice * volatility * Math.random());
    const low = Math.min(open, close) - (currentPrice * volatility * Math.random());
    const volume = Math.floor(Math.random() * 50000000) + 10000000;
    
    candles.push({ time: dateStr, open, high, low, close, volume });
    currentPrice = close;
  }
  return candles;
}

// Helper to generate Monte Carlo paths
function generateMonteCarlo(startPrice: number, days: number = 30, pathsCount: number = 500): MonteCarloSimulationData {
  const paths: number[][] = [];
  const timeSteps: string[] = [];
  const startDate = new Date();
  
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    timeSteps.push(d.toISOString().split('T')[0]);
  }

  const dailyVolatility = 0.025; // 2.5% daily
  const dailyDrift = 0.0005;

  for (let p = 0; p < pathsCount; p++) {
    const path = [startPrice];
    let current = startPrice;
    for (let i = 1; i < days; i++) {
      // Basic Geometric Brownian Motion
      const shock = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 3; // Approx normal
      const ret = dailyDrift + dailyVolatility * shock;
      current = current * Math.exp(ret);
      path.push(current);
    }
    paths.push(path);
  }

  // Calculate stats at each step
  const upper: number[] = [];
  const lower: number[] = [];
  const mean: number[] = [];

  for (let step = 0; step < days; step++) {
    const slice = paths.map(p => p[step]).sort((a, b) => a - b);
    lower.push(slice[Math.floor(pathsCount * 0.025)]);
    upper.push(slice[Math.floor(pathsCount * 0.975)]);
    mean.push(slice.reduce((a, b) => a + b, 0) / pathsCount);
  }

  const finalPrices = paths.map(p => p[days - 1]).sort((a, b) => a - b);
  const var95 = (finalPrices[Math.floor(pathsCount * 0.05)] - startPrice) / startPrice;

  return {
    timeSteps,
    paths,
    confidence95Lower: lower,
    confidence95Upper: upper,
    meanPath: mean,
    volatility: 42.1,
    valueAtRisk95: parseFloat((var95 * 100).toFixed(2))
  };
}

export const MOCK_TICKERS: Record<string, TickerSummary> = {
  'NVDA': {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corp',
    currentPrice: 124.50,
    change: 4.20,
    changePercent: 3.49,
    peRatio: 48.2,
    marketCap: '$3.0T',
    freeCashFlow: '$27.1B',
    totalDebt: '$8.4B',
    historicalCandles: generateCandles(100, 180, 0.03),
    monteCarlo: generateMonteCarlo(124.50, 30, 500)
  },
  'TSLA': {
    ticker: 'TSLA',
    companyName: 'Tesla Inc',
    currentPrice: 215.30,
    change: -1.80,
    changePercent: -0.83,
    peRatio: 45.1,
    marketCap: '$680B',
    freeCashFlow: '$4.2B',
    totalDebt: '$12.5B',
    historicalCandles: generateCandles(200, 180, 0.04),
    monteCarlo: generateMonteCarlo(215.30, 30, 500)
  },
  'AAPL': {
    ticker: 'AAPL',
    companyName: 'Apple Inc',
    currentPrice: 185.10,
    change: 0.90,
    changePercent: 0.49,
    peRatio: 28.5,
    marketCap: '$2.9T',
    freeCashFlow: '$105B',
    totalDebt: '$110B',
    historicalCandles: generateCandles(170, 180, 0.015),
    monteCarlo: generateMonteCarlo(185.10, 30, 500)
  }
};
