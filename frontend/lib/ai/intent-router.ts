/**
 * Intent Router: Tri-Modal Semantic Classifier for incoming user queries.
 *
 * Architecture:
 *   LANE C → RESTRICTED_CODE  : Zero-compute edge rejection (Regex, no LLM call)
 *   LANE B → GENERAL_KNOWLEDGE: Low-compute inference (no live data tools)
 *   LANE A → FINANCIAL        : Full-power inference with live market data injection
 *
 * The classifier uses Groq's Llama-3.1-8B-Instant for ultra-fast (<200ms)
 * intent detection and prompt enhancement, with Gemini Flash as fallback.
 */

import { aiRotator, type ChatMessage } from './provider-rotator';

// ─── Types ───────────────────────────────────────────────────────────────────

export type IntentClass = 'FINANCIAL' | 'GENERAL_KNOWLEDGE' | 'RESTRICTED_CODE';

export interface RouterOutput {
  intent: IntentClass;
  enhancedPrompt: string;
  entities: {
    asset?: string;           // Ticker symbol or asset name (NVDA, TSLA, BTC, GOLD, GC=F)
    sourceCurrency?: string;  // ISO 4217 code (USD, EUR, GBP)
    targetCurrency?: string;  // ISO 4217 code (PKR, INR, EUR)
    assetClass?: 'FOREX' | 'EQUITY' | 'CRYPTO' | 'COMMODITY';
    region?: string;          // Human-readable region (Pakistan, India)
    unit?: string;            // Measurement unit (tola, gram, oz)
  };
  requiresLiveTools: boolean;
}

// ─── LANE C: Deterministic Edge Regex Filter ─────────────────────────────────

/**
 * Financial "code" safelist: queries containing these phrases should NEVER
 * trigger a code rejection, even if they contain the word "code".
 * Examples: "SWIFT code", "tax code", "ISIN code", "postal code", "area code"
 */
const FINANCIAL_CODE_SAFELIST = /\b(tax\s+code|swift\s+code|isin\s+code|zip\s+code|postal\s+code|area\s+code|country\s+code|currency\s+code|sector\s+code|sic\s+code|naics\s+code|hs\s+code|tariff\s+code|code\s+section|section\s+\d+|code\s+of\s+(conduct|ethics|practice))\b/i;

/**
 * Code/script-related patterns that trigger immediate rejection.
 *
 * Design Principle: Only match UNAMBIGUOUS programming syntax or explicit
 * "write me code" action verbs. Financial domain terms like "tax code",
 * "SWIFT code", "refactor my portfolio" must never trigger this.
 *
 * Protected patterns:
 *   ✅ "write a python script" → REJECT
 *   ✅ "debug my function" → REJECT
 *   ✅ "console.log()" → REJECT
 *   ❌ "What is the SWIFT code for Barclays?" → PASS
 *   ❌ "Explain tax code section 1256" → PASS
 *   ❌ "refactor my portfolio allocation" → PASS
 */
const CODE_REJECTION_PATTERN = /\b(write\s+(a\s+|me\s+a?\s*)?(code|script|program|function|class|component|api|endpoint|bot|crawler|scraper)|debug\s+(my|this|the)\s+(code|script|function|program)|fix\s+(my|this|the)\s+(code|bug|error|exception)|refactor\s+(my|this|the)\s+(code|script|function|codebase)|code\s+(review|snippet|example|sample)\b|import\s+\w+\s+from\s|console\.log|System\.out\.print|printf\s*\(|def\s+\w+\s*\(|function\s+\w+\s*\(|class\s+\w+\s*[\({:]|npm\s+install|pip\s+install|yarn\s+add|beautifulsoup|selenium|puppeteer|requests\.get|async\s+function\s+\w+|const\s+\w+\s*=\s*(await|new|function|\()|let\s+\w+\s*=\s*(await|new|function|\()|var\s+\w+\s*=\s*(await|new|function|\()|=>\s*\{|useState\s*\(|useEffect\s*\(|querySelector\s*\(|getElementById\s*\(|addEventListener\s*\()(?:\s|$|\b)/i;

/**
 * Supplementary pattern for explicit language mentions in coding context.
 * Requires a coding action verb + a programming language/framework name.
 */
const CODE_LANGUAGE_PATTERN = /\b(write|create|build|make|develop|generate|implement|code)\s+(a\s+|an\s+|me\s+a?\s*)?(python|javascript|typescript|java|c\+\+|c#|rust|go|golang|ruby|php|swift|kotlin|dart|html|css|sql|bash|shell|powershell|react|angular|vue|svelte|nextjs|express|django|flask|fastapi|spring)\s+(script|program|function|class|app|application|component|module|package|library|bot|tool|server|client|api|endpoint)\b/i;

/**
 * Checks if a query is a code/programming request that should be rejected
 * at the edge without consuming any LLM compute.
 *
 * Safety: Financial queries containing "code" in a non-programming context
 * (e.g., "tax code", "SWIFT code") are whitelisted and will never be rejected.
 */
export function isCodeRequest(query: string): boolean {
  // Financial safelist takes priority — never reject these queries
  if (FINANCIAL_CODE_SAFELIST.test(query)) {
    return false;
  }

  return CODE_REJECTION_PATTERN.test(query) || CODE_LANGUAGE_PATTERN.test(query);
}


// ─── LANE A/B: LLM-Based Classification ─────────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT = `You are a query classifier for Finrena, an institutional financial AI workspace. Your job is to analyze a user's raw query and return a strict JSON response with exactly these fields:

{
  "intent": "FINANCIAL" | "GENERAL_KNOWLEDGE",
  "enhancedPrompt": "<rewritten institutional-grade query>",
  "entities": {
    "asset": "<ticker symbol or commodity name if applicable, e.g. NVDA, TSLA, BTC, GOLD, GC=F>",
    "sourceCurrency": "<ISO 4217 base currency code if conversion/forex, e.g. USD, EUR, GBP>",
    "targetCurrency": "<ISO 4217 target currency code if conversion/forex or regional price, e.g. PKR, INR, USD, EUR>",
    "assetClass": "FOREX" | "EQUITY" | "CRYPTO" | "COMMODITY",
    "region": "<human-readable region if applicable, e.g. Pakistan, India>",
    "unit": "<measurement unit if applicable, e.g. tola, gram, oz>"
  },
  "requiresLiveTools": true | false
}

Classification Rules:
- FINANCIAL: Any query about stocks, bonds, commodities, crypto, forex, currency conversions, interest rates, GDP, economic indicators, company earnings, financial concepts (P/E, EBITDA, DCF, WACC), market analysis, gold rates, or investment strategy.
  * ALWAYS set requiresLiveTools=true for:
    1. Currency conversions and forex rates (e.g. "convert 100 dollars to pkr", "usd to inr", "forex rate")
    2. Real-time prices or rates requested (e.g. "gold rate today", "NVDA price now", "current bitcoin price")
- GENERAL_KNOWLEDGE: Any non-financial factual question (science, history, cybersecurity, health, geography, etc.). Set requiresLiveTools=false.

Currency & Forex Extraction Rules:
- When a user asks to convert currencies (e.g. "convert 100 dollars to pkr", "100 usd in pkr", "how many rupees in a dollar", "eur to gbp"):
  * sourceCurrency: The source currency code (e.g. "USD", "EUR")
  * targetCurrency: The target currency code (e.g. "PKR", "INR", "GBP")
  * assetClass: "FOREX"
  * requiresLiveTools: true

Gold & Commodity Extraction Rules:
- When a user asks about gold prices (e.g. "gold rate today in pakistan"):
  * asset: "GOLD"
  * assetClass: "COMMODITY"
  * targetCurrency: "PKR" (or whichever currency is relevant)
  * region: "Pakistan"
  * unit: "tola" (or "gram")
  * requiresLiveTools: true

Enhanced Prompt Rules:
- Rewrite the user's raw query into a polished, institutional-grade research question.
- Preserve the user's intent and numerical values exactly; do not add information they did not ask for.

Return ONLY the JSON object. No explanation, no markdown, no wrapping.`;

/**
 * Classifies a user query using the ultra-fast 8B classifier model.
 * Returns a structured RouterOutput with intent, enhanced prompt, and entities.
 *
 * If the LLM classifier fails or returns invalid JSON, falls back to
 * keyword-based heuristic classification.
 */
export async function classifyQuery(query: string): Promise<RouterOutput> {
  // Fast-path: Check for code requests first (zero LLM cost)
  if (isCodeRequest(query)) {
    return {
      intent: 'RESTRICTED_CODE',
      enhancedPrompt: query,
      entities: {},
      requiresLiveTools: false,
    };
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'user', content: query },
    ];

    const response = await aiRotator.executeClassifier(messages, CLASSIFIER_SYSTEM_PROMPT);

    // Parse the JSON response, stripping any markdown fencing the LLM might add
    const cleaned = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed: RouterOutput = JSON.parse(cleaned);

    // Validate the parsed output
    if (!parsed.intent || !['FINANCIAL', 'GENERAL_KNOWLEDGE', 'RESTRICTED_CODE'].includes(parsed.intent)) {
      throw new Error('Invalid intent class');
    }

    return {
      intent: parsed.intent,
      enhancedPrompt: parsed.enhancedPrompt || query,
      entities: parsed.entities || {},
      requiresLiveTools: parsed.requiresLiveTools ?? false,
    };
  } catch (err) {
    console.error('[IntentRouter] Classification failed, using heuristic fallback:', err);
    return heuristicClassify(query);
  }
}

// ─── Heuristic Fallback Classifier ───────────────────────────────────────────

/**
 * Keyword-based fallback when the LLM classifier is unavailable.
 * Less sophisticated but ensures the pipeline never breaks.
 */
function heuristicClassify(query: string): RouterOutput {
  const lower = query.toLowerCase();

  // Financial keyword patterns
  const financialPatterns = [
    /\b(stock|share|equity|ticker|market\s*cap|earnings|revenue|profit|loss|dividend|ipo|nasdaq|nyse|s&p|dow|ftse|nifty|sensex)\b/,
    /\b(gold|silver|platinum|crude|oil|commodity|commodities|futures)\b/,
    /\b(bitcoin|btc|ethereum|eth|crypto|blockchain|defi|nft|altcoin|token)\b/,
    /\b(forex|currency|exchange\s*rate|usd|eur|gbp|jpy|pkr|inr|cny)\b/,
    /\b(fed|fomc|rate\s*cut|rate\s*hike|inflation|cpi|gdp|unemployment|recession|monetary\s*policy)\b/,
    /\b(p\/e|pe\s*ratio|ebitda|dcf|wacc|roe|roa|eps|book\s*value|free\s*cash\s*flow|fcf|margin)\b/,
    /\b(bond|yield|treasury|t-bill|credit|debt|spread|coupon)\b/,
    /\b(invest|portfolio|hedge|bull|bear|long|short|put|call|option|derivative)\b/,
    /\b(nvda|tsla|aapl|msft|googl|amzn|meta|nflx)\b/i,
    /\b(tola|per\s*gram|rate\s*today|price\s*today|current\s*price|current\s*rate|live\s*rate|live\s*price)\b/,
  ];

  const isFinancial = financialPatterns.some((p) => p.test(lower));

  // Check if user is asking for current/live data
  const liveDataPatterns = /\b(today|current|live|now|latest|real-?time|aaj|abhi)\b/i;
  let requiresLiveTools = isFinancial && liveDataPatterns.test(lower);

  // Extract entities heuristically
  const entities: RouterOutput['entities'] = {};

  // Common tickers
  const tickerMatch = query.match(/\b([A-Z]{2,5})\b/);
  if (tickerMatch && isFinancial) {
    entities.asset = tickerMatch[1];
  }

  // Gold-specific
  if (/\bgold\b/i.test(lower)) {
    entities.asset = 'GOLD';
    entities.assetClass = 'COMMODITY';
    requiresLiveTools = true;
  }

  // Currency extraction maps
  const currencyMap: Array<{ code: string; regex: RegExp }> = [
    { code: 'USD', regex: /\b(usd|dollar|dollars|\$)\b/i },
    { code: 'PKR', regex: /\b(pkr|rupee|rupees|pakistani\s+rupee)\b/i },
    { code: 'INR', regex: /\b(inr|indian\s+rupee)\b/i },
    { code: 'EUR', regex: /\b(eur|euro|euros|€)\b/i },
    { code: 'GBP', regex: /\b(gbp|pound|pounds|sterling|£)\b/i },
    { code: 'JPY', regex: /\b(jpy|yen|¥)\b/i },
    { code: 'CAD', regex: /\b(cad|canadian\s+dollar)\b/i },
    { code: 'AUD', regex: /\b(aud|australian\s+dollar)\b/i },
    { code: 'AED', regex: /\b(aed|dirham)\b/i },
    { code: 'SAR', regex: /\b(sar|riyal)\b/i },
  ];

  const isConversion = /\b(convert|conversion|exchange|rate|swap|transfer|how\s+much\s+is|value\s+of)\b/i.test(lower);
  const detectedCurrencies: Array<{ code: string; index: number }> = [];

  for (const { code, regex } of currencyMap) {
    const match = regex.exec(lower);
    if (match) {
      detectedCurrencies.push({ code, index: match.index });
    }
  }

  // Sort by appearance in query to determine source vs target
  detectedCurrencies.sort((a, b) => a.index - b.index);

  if (isConversion || detectedCurrencies.length >= 2) {
    entities.assetClass = 'FOREX';
    requiresLiveTools = true;
    if (detectedCurrencies.length >= 2) {
      entities.sourceCurrency = detectedCurrencies[0].code;
      entities.targetCurrency = detectedCurrencies[1].code;
    } else if (detectedCurrencies.length === 1) {
      if (detectedCurrencies[0].code === 'USD') {
        entities.sourceCurrency = 'USD';
        entities.targetCurrency = lower.includes('india') ? 'INR' : 'PKR';
      } else {
        entities.sourceCurrency = 'USD';
        entities.targetCurrency = detectedCurrencies[0].code;
      }
    }
  }

  // Currency/region detection for regional context
  if (/\bpakistan\b/i.test(lower) || /\bpkr\b/i.test(lower)) {
    entities.targetCurrency = entities.targetCurrency || 'PKR';
    entities.region = 'Pakistan';
    if (/\btola\b/i.test(lower)) entities.unit = 'tola';
  } else if (/\bindia\b/i.test(lower) || /\binr\b/i.test(lower)) {
    entities.targetCurrency = entities.targetCurrency || 'INR';
    entities.region = 'India';
  }

  return {
    intent: isFinancial ? 'FINANCIAL' : 'GENERAL_KNOWLEDGE',
    enhancedPrompt: query,
    entities,
    requiresLiveTools,
  };
}
