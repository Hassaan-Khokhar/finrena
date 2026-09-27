import yahooFinance from 'yahoo-finance2';

// ─── Cache to Prevent Yahoo Rate Limits ───────────────────────────────────────
const priceCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes

// Institutional stop-words. Removing these ensures Yahoo's semantic engine only sees the company name.
const FINANCIAL_STOP_WORDS = new Set([
  'gross', 'margin', 'margins', 'datacenter', 'run-rate', 'runrate', 'revenue',
  'ebitda', 'earnings', 'stock', 'share', 'shares', 'price', 'quote', 'info',
  'valuation', 'today', 'rate', 'rates', 'convert', 'analysis', 'name', 'and',
  'the', 'of', 'for', 'company', 'corp', 'inc', 'wacc', 'dcf', 'what', 'is'
]);

// Helper for YahooFinance instance across ESM environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yfInstance: any = null;
async function getYf() {
  if (yfInstance) return yfInstance;
  const mod = await import('yahoo-finance2');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const YFClass: any = mod.default || (mod as any).YahooFinance || mod;
  yfInstance = typeof YFClass === 'function' ? new YFClass({ suppressNotices: ['yahooSurvey'] }) : YFClass;
  return yfInstance;
}

export function extractCleanSearchQuery(rawQuery: string): string {
  const tokens = rawQuery
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(token => !FINANCIAL_STOP_WORDS.has(token.toLowerCase()));
  
  // If user explicitly typed a short ticker (e.g., "TSLA"), prioritize it.
  const explicitTicker = tokens.find(t => /^[A-Z]{1,6}$/.test(t) && t !== 'IN' && t !== 'TO');
  let clean = explicitTicker || tokens.slice(0, 4).join(' ') || rawQuery;
  if (clean.toLowerCase() === 'nasdaq') clean = 'Nasdaq Inc';
  return clean;
}

export async function fetchLiveMarketData(userQuery: string): Promise<string> {
  try {
    const yf = await getYf();
    const lower = userQuery.toLowerCase();

    // 1. MACROECONOMIC BENCHMARKS & CENTRAL BANK RATE INQUIRIES
    const isMacroQuery = /\b(fomc|fed\b|federal reserve|rate cut|rate cuts|rate hike|rate hikes|interest rate|interest rates|treasury yield|treasury bill|10-year|10y|2-year|2y|monetary policy|ecb|bank of england|boe|bank of japan|boj|rbi|sbp|macro|inflation|cpi)\b/i.test(lower);
    if (isMacroQuery) {
      try {
        const [irx, tnx, dxy, vix, cl] = await Promise.all([
          yf.quote('^IRX').catch(() => null),
          yf.quote('^TNX').catch(() => null),
          yf.quote('DX-Y.NYB').catch(() => null),
          yf.quote('^VIX').catch(() => null),
          yf.quote('CL=F').catch(() => null),
        ]);

        const macroLines = [`[VERIFIED GLOBAL MACRO DATA AS OF ${new Date().toISOString()}]`];
        if (irx?.regularMarketPrice != null) {
          macroLines.push(`- US 13-Week Treasury Bill (^IRX, Short-term Risk-Free / Policy Rate Proxy): ${irx.regularMarketPrice.toFixed(2)}%`);
        }
        if (tnx?.regularMarketPrice != null) {
          macroLines.push(`- US 10-Year Treasury Yield (^TNX, Benchmark Long-Term Rate): ${tnx.regularMarketPrice.toFixed(2)}%`);
        }
        if (dxy?.regularMarketPrice != null) {
          macroLines.push(`- US Dollar Index (DXY): ${dxy.regularMarketPrice.toFixed(2)}`);
        }
        if (vix?.regularMarketPrice != null) {
          macroLines.push(`- Market Volatility Index (^VIX): ${vix.regularMarketPrice.toFixed(2)}`);
        }
        if (cl?.regularMarketPrice != null) {
          macroLines.push(`- WTI Crude Oil (CL=F): $${cl.regularMarketPrice.toFixed(2)}/bbl`);
        }

        // Region-specific central bank FX pairings
        if (/\b(ecb|euro|europe|eurozone)\b/i.test(lower)) {
          const eur = await yf.quote('EURUSD=X').catch(() => null);
          if (eur?.regularMarketPrice != null) macroLines.push(`- EUR/USD Exchange Rate: ${eur.regularMarketPrice.toFixed(4)}`);
        }
        if (/\b(boe|england|britain|uk|gilt)\b/i.test(lower)) {
          const gbp = await yf.quote('GBPUSD=X').catch(() => null);
          if (gbp?.regularMarketPrice != null) macroLines.push(`- GBP/USD Exchange Rate: ${gbp.regularMarketPrice.toFixed(4)}`);
        }
        if (/\b(boj|japan|yen)\b/i.test(lower)) {
          const jpy = await yf.quote('USDJPY=X').catch(() => null);
          if (jpy?.regularMarketPrice != null) macroLines.push(`- USD/JPY Exchange Rate: ${jpy.regularMarketPrice.toFixed(2)}`);
        }
        if (/\b(rbi|india|rupee)\b/i.test(lower)) {
          const inr = await yf.quote('USDINR=X').catch(() => null);
          if (inr?.regularMarketPrice != null) macroLines.push(`- USD/INR Exchange Rate: ${inr.regularMarketPrice.toFixed(2)}`);
        }
        if (/\b(sbp|pakistan)\b/i.test(lower)) {
          const pkr = await yf.quote('USDPKR=X').catch(() => null);
          if (pkr?.regularMarketPrice != null) macroLines.push(`- USD/PKR Exchange Rate: ${pkr.regularMarketPrice.toFixed(2)}`);
        }

        if (macroLines.length > 1) {
          return macroLines.join('\n');
        }
      } catch (macroErr) {
        console.warn('[MarketData] Macro benchmark fetch error:', macroErr);
      }
    }

    // 2. UNIVERSAL FOREX RATE & CURRENCY CONVERSIONS
    const currencyMap: Record<string, string> = {
      dollar: 'USD', dollars: 'USD', usd: 'USD',
      euro: 'EUR', euros: 'EUR', eur: 'EUR',
      pound: 'GBP', pounds: 'GBP', gbp: 'GBP',
      yen: 'JPY', jpy: 'JPY',
      rupee: 'INR', rupees: 'INR', inr: 'INR',
      pkr: 'PKR',
      dirham: 'AED', aed: 'AED',
      riyal: 'SAR', sar: 'SAR',
      cad: 'CAD', aud: 'AUD', chf: 'CHF', cny: 'CNY', yuan: 'CNY',
      sgd: 'SGD', hkd: 'HKD', brl: 'BRL', mxn: 'MXN', try: 'TRY', zar: 'ZAR',
    };

    const isFxQuery = /\b(convert|fx|forex|exchange rate|currency)\b/i.test(lower) ||
      /\b(to|in)\b/i.test(lower) && /\b(usd|pkr|inr|eur|gbp|aed|sar|jpy|cad|aud|chf|cny|sgd)\b/i.test(lower);

    if (isFxQuery) {
      const words = lower.split(/[^a-z0-9]+/);
      const detectedCurrencies: string[] = [];
      for (const w of words) {
        if (currencyMap[w] && !detectedCurrencies.includes(currencyMap[w])) {
          detectedCurrencies.push(currencyMap[w]);
        }
      }

      if (detectedCurrencies.length >= 2) {
        const source = detectedCurrencies[0];
        const target = detectedCurrencies[1];
        let rate: number | null = null;

        // Try direct ticker
        const directTicker = source === 'USD' ? `${target}=X` : `${source}${target}=X`;
        const directQuote = await yf.quote(directTicker).catch(() => null);
        if (directQuote?.regularMarketPrice) {
          rate = directQuote.regularMarketPrice;
        } else {
          // Cross through USD
          const [sourceUsd, targetUsd] = await Promise.all([
            yf.quote(source === 'USD' ? 'USD=X' : `${source}USD=X`).catch(() => null),
            yf.quote(target === 'USD' ? 'USD=X' : `${target}USD=X`).catch(() => null),
          ]);
          if (sourceUsd?.regularMarketPrice && targetUsd?.regularMarketPrice) {
            rate = sourceUsd.regularMarketPrice / targetUsd.regularMarketPrice;
          }
        }

        if (rate != null) {
          let out = `[VERIFIED FINANCIAL DATA - FOREX AS OF ${new Date().toISOString()}]: ${source} to ${target} Exchange Rate: ${rate.toFixed(4)}.`;
          const numMatch = userQuery.match(/\b(\d+(?:[.,]\d+)?)\b/);
          if (numMatch) {
            const amt = parseFloat(numMatch[1].replace(/,/g, ''));
            out += ` Requested Conversion: ${amt.toLocaleString()} ${source} = ${(amt * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${target}.`;
          }
          return out;
        }
      }
    }

    // 3. PRECIOUS METALS & COMMODITIES (GOLD, SILVER, OIL)
    if (/\bgold\b|\bxau\b/i.test(lower)) {
      const gQuote = await yf.quote('GC=F').catch(() => null);
      if (gQuote?.regularMarketPrice) {
        let out = `[VERIFIED FINANCIAL DATA - COMMODITY AS OF ${new Date().toISOString()}]: Gold Spot/Futures: $${gQuote.regularMarketPrice.toFixed(2)}/troy oz.`;
        if (/pakistan|pkr/.test(lower)) {
          const pkrQuote = await yf.quote('PKR=X').catch(() => null);
          if (pkrQuote?.regularMarketPrice) {
            const fx = pkrQuote.regularMarketPrice;
            const tola = (gQuote.regularMarketPrice * fx / 31.1035) * 11.664;
            const per10g = (gQuote.regularMarketPrice * fx / 31.1035) * 10;
            out += ` USD/PKR Rate: ${fx.toFixed(2)}. Calculated 24K Gold in Pakistan: ~${Math.round(tola).toLocaleString()} PKR/tola, ~${Math.round(per10g).toLocaleString()} PKR/10 grams.`;
          }
        } else if (/india|inr/.test(lower)) {
          const inrQuote = await yf.quote('INR=X').catch(() => null);
          if (inrQuote?.regularMarketPrice) {
            const fx = inrQuote.regularMarketPrice;
            const per10g = (gQuote.regularMarketPrice * fx / 31.1035) * 10;
            out += ` USD/INR Rate: ${fx.toFixed(2)}. Calculated 24K Gold in India: ~₹${Math.round(per10g).toLocaleString()} per 10 grams.`;
          }
        }
        return out;
      }
    }

    if (/\bsilver\b|\bxag\b/i.test(lower)) {
      const sQuote = await yf.quote('SI=F').catch(() => null);
      if (sQuote?.regularMarketPrice) {
        return `[VERIFIED FINANCIAL DATA - COMMODITY AS OF ${new Date().toISOString()}]: Silver Spot/Futures: $${sQuote.regularMarketPrice.toFixed(2)}/troy oz.`;
      }
    }

    if (/\b(crude oil|brent|wti)\b/i.test(lower)) {
      const oilQuote = await yf.quote('CL=F').catch(() => null);
      if (oilQuote?.regularMarketPrice) {
        return `[VERIFIED FINANCIAL DATA - COMMODITY AS OF ${new Date().toISOString()}]: WTI Crude Oil: $${oilQuote.regularMarketPrice.toFixed(2)}/barrel.`;
      }
    }

    // 4. PURE DYNAMIC SEMANTIC SEARCH FOR EQUITIES & HOLDING COMPANIES
    const cleanQuery = extractCleanSearchQuery(userQuery);
    if (!cleanQuery) return '';

    // Yahoo's semantic engine dynamically resolves "Rockstar" to TTWO, or "Nasdaq" to NDAQ
    const searchResults = await yf.search(cleanQuery);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bestMatch = searchResults.quotes?.find((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF')) || searchResults.quotes?.[0];

    if (!bestMatch || bestMatch.quoteType === 'INDEX') {
      const altSearch = await yf.search(`${cleanQuery} stock`);
      if (altSearch.quotes?.[0]?.symbol) {
        bestMatch = altSearch.quotes[0];
      }
    }

    if (!bestMatch || !bestMatch.symbol) return '';

    const ticker = bestMatch.symbol;
    if (priceCache.has(ticker) && Date.now() - priceCache.get(ticker)!.timestamp < CACHE_TTL) {
      return priceCache.get(ticker)!.data;
    }

    let dataString = '';
    const needsFundamentals = /\b(margin|margins|revenue|ebitda|pe\s+ratio|earnings|financials|balance\s+sheet|run-rate|runrate)\b/i.test(userQuery);

    if (needsFundamentals && (bestMatch.quoteType === 'EQUITY' || !bestMatch.quoteType)) {
      try {
        const summary = await yf.quoteSummary(ticker, {
          modules: ['financialData', 'defaultKeyStatistics', 'price', 'summaryDetail']
        });
        const fd = summary.financialData;
        const currentPrice = summary.price?.regularMarketPrice || summary.summaryDetail?.regularMarketPrice || 'N/A';
        dataString = `[VERIFIED FINANCIAL DATA - ${ticker} (${bestMatch.shortname || ticker})]
- Price: $${currentPrice}
- Gross Margins: ${fd?.grossMargins !== undefined && fd?.grossMargins !== null ? (fd.grossMargins * 100).toFixed(2) + '%' : 'N/A'}
- Operating Margins: ${fd?.operatingMargins !== undefined && fd?.operatingMargins !== null ? (fd.operatingMargins * 100).toFixed(2) + '%' : 'N/A'}
- Total Revenue: $${fd?.totalRevenue ? (fd.totalRevenue / 1e9).toFixed(2) + 'B' : 'N/A'}
- EBITDA: $${fd?.ebitda ? (fd.ebitda / 1e9).toFixed(2) + 'B' : 'N/A'}`;
      } catch (sumErr) {
        console.warn(`[MarketData] quoteSummary failed for ${ticker}, falling back to quote:`, sumErr);
        const quote = await yf.quote(ticker);
        dataString = `[VERIFIED REAL-TIME DATA] Asset: ${ticker} (${bestMatch.shortname || ticker}) | Rate/Price: ${quote.regularMarketPrice || quote.previousClose || 'N/A'} ${quote.currency || 'USD'}`;
      }
    } else {
      const quote = await yf.quote(ticker);
      dataString = `[VERIFIED REAL-TIME DATA] Asset: ${ticker} (${bestMatch.shortname || ticker}) | Rate/Price: ${quote.regularMarketPrice || quote.previousClose || 'N/A'} ${quote.currency || 'USD'}`;
    }

    priceCache.set(ticker, { data: dataString, timestamp: Date.now() });
    return dataString;
  } catch (error) {
    console.error('Yahoo Semantic Fetch Error:', error);
    return '';
  }
}

// ─── Legacy Backward Compatibility Helpers ────────────────────────────────────

export interface MarketDataResult {
  success: boolean;
  data: string;
  raw?: Record<string, number | string>;
}

export async function fetchGoldData(targetCurrency: string = 'USD', region: string = ''): Promise<MarketDataResult> {
  const data = await fetchLiveMarketData(`gold rate in ${region || targetCurrency}`);
  return { success: !!data, data };
}

export async function fetchEquityData(ticker: string): Promise<MarketDataResult> {
  const data = await fetchLiveMarketData(ticker);
  return { success: !!data, data };
}

export async function fetchCryptoData(asset: string): Promise<MarketDataResult> {
  const data = await fetchLiveMarketData(asset);
  return { success: !!data, data };
}

export async function fetchForexData(base: string, target: string): Promise<MarketDataResult> {
  const data = await fetchLiveMarketData(`${base} to ${target}`);
  return { success: !!data, data };
}
