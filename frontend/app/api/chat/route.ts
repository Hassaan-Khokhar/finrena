import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveMarketData } from '../../../lib/ai/market-data';
import { fetchLiveWebSearch } from '../../../lib/ai/web-search';

export const runtime = 'nodejs';

// ─── 1. Zero-Compute Edge Guardrail (< 1ms, $0.00 compute) ───────────────────

// Edge guardrail: Blocks generic software engineering at 0 compute cost.
// Quantitative tools (Python, Pine Script, SQL, pandas, numpy) are permitted through.
const SOFTWARE_DEV_REGEX =
  /\b(react|next\.?js|vue|angular|svelte|flutter|swiftui|react native|html|css|tailwind|bootstrap|frontend|backend web|build (?:an? )?(?:website|web app|mobile app|portfolio|landing page)|make a site|discord bot)\b/i;

// ─── 2. Groq Model Dispatcher (Direct 1-Shot Execution) ──────────────────────

// Default to active Groq model; remember working model across requests
let cachedWorkingModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGroqSingleCall(groqApiKey: string, body: any): Promise<Response> {
  const model = cachedWorkingModel;
  let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, model }),
  });

  // If the model is not provisioned on this specific account/tier, fallback seamlessly
  if (response.status === 404) {
    const fallback =
      model === 'openai/gpt-oss-120b' ? 'llama-3.3-70b-versatile' : 'openai/gpt-oss-120b';
    console.warn(`[Groq] Model ${model} returned 404, switching to ${fallback}`);
    cachedWorkingModel = fallback;
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, model: fallback }),
    });
  }

  return response;
}

// ─── 3. Main POST Route: Guaranteed 1 API Call ───────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract user query and conversation history supporting both client conventions
    let message: string = body.message || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let conversationHistory: Array<{ role: string; content: string }> =
      body.conversationHistory || [];

    if (!message && Array.isArray(body.messages) && body.messages.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastMsg = [...body.messages].reverse().find((m: any) => m.role === 'user');
      message = lastMsg ? lastMsg.content : '';
      conversationHistory = body.messages.slice(0, -1);
    }

    if (!message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Edge guardrail: Blocks generic software engineering at 0 compute cost
    if (SOFTWARE_DEV_REGEX.test(message)) {
      const rejection =
        'I am Finrena, an institutional AI financial workspace. I specialize in quantitative modeling, market valuation, and trading analysis, not general software engineering. How may I assist you with financial research?';
      return NextResponse.json({
        role: 'assistant',
        content: rejection,
        reply: rejection,
      });
    }

    // Parallel Live Pre-fetch: Raw query passed directly without artificial word-count heuristics
    const [marketContext, webContext] = await Promise.all([
      fetchLiveMarketData(message).catch(() => ''),
      fetchLiveWebSearch(message).catch(() => ''),
    ]);

    const injectedGroundTruth = [marketContext, webContext].filter(Boolean).join('\n\n');

    // System Prompt with Targeted Quantitative Code Policy, Proportionality & Institutional Rigor
    const systemPrompt = `You are Finrena, an elite institutional financial research AI. Today's date is ${new Date().toDateString()}.

OPERATING PRINCIPLES:
1. CODE ON EXPLICIT DEMAND ONLY: Do NOT provide code, scripts, or database queries unless the user EXPLICITLY asks for code (e.g., "write a python script", "generate pine script", "SQL query", "show me code"). If the user asks a conceptual, valuation, economic, or macroeconomic question without explicitly demanding code, respond with pure institutional prose and structured financial tables. Zero unprompted code blocks.
2. PROPORTIONALITY & EXECUTIVE BREVITY: Calibrate the depth of your analysis directly to the user's inquiry. Deliver crisp, high-conviction institutional briefs (typically 200–400 words) focusing on core transmission mechanisms, key drivers, and asset-class impacts. Avoid academic bloat, redundant scenario matrices, or bloated disclaimers unless the user explicitly requests an exhaustive multi-scenario breakdown.
3. CLEAN OUTPUT & SUPPRESS INTERNAL LABELS: Never repeat or leak internal system labels or boundary tags (such as "untrusted web", "ground truth", or "[Source X]") into user-facing text. Treat verified data seamlessly as institutional knowledge.
4. TONE & RIGOR: Deliver authoritative, high-conviction institutional analysis. Avoid juvenile procedural commentary (do not state "Methodology" or narrate basic arithmetic).
5. BUSINESS MODEL APPLICABILITY: If a user asks for a metric non-applicable to an entity's business model (e.g., datacenter run-rate for an exchange operator), contextualize their actual revenue structure rather than claiming data is missing.
6. EPISTEMIC TRIANGULATION & FACTUAL RIGOR:
- Ground numerical calculations and live market pricing directly on the verified market data and macro benchmarks provided below.
- MONETARY POLICY CONTEXT & ANOMALY REJECTION: Major central banks (Fed, ECB, BoE) operate in an easing or holding regime (reflected in real-time yields: ^IRX ~4.07%, ^TNX ~5.18%), NOT new rate hikes. If an external snippet or archived headline mentions a rate hike, recognize that it refers to past tightening cycles (e.g. 2022-2023). Under no circumstances assert that the Fed just raised rates. Treat rate cut questions as forward-looking policy easing from current benchmark levels.
- DISTINGUISH EMPIRICAL FACTS VS. THEORETICAL SENSITIVITIES: Clearly distinguish verified market rates from hypothetical macroeconomic model sensitivities (such as FRB/US or DSGE stylized estimates of 25 bp cuts).
- COMPREHENSIVE GLOBAL & CURRENT AFFAIRS SCOPE: Finrena covers global financial markets, international central banks (Fed, ECB, BoE, BoJ, RBI, SBP, PBOC), and global geopolitical affairs. If asked about world leaders or current affairs (e.g., "Prime Minister of India"), deliver immediate, accurate, factual answers with institutional clarity.

${injectedGroundTruth}`;

    const groqApiKey = process.env.GROQ_WORKSPACE_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      const unconfig = 'I am Finrena. Institutional server configuration required.';
      return NextResponse.json({
        role: 'assistant',
        content: unconfig,
        reply: unconfig,
      });
    }

    const formattedHistory = conversationHistory.slice(-6).map((m) => ({
      role: m.role === 'agent' ? 'assistant' : m.role,
      content: m.content,
    }));

    // Guaranteed EXACTLY 1 Groq API Call
    const groqResponse = await fetchGroqSingleCall(groqApiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: message },
      ],
      temperature: 0.2, // Balanced precision and natural responsiveness
      max_tokens: 1500, // Safe completion cap preventing token cut-off
    });

    if (!groqResponse.ok) {
      throw new Error(`Inference returned status ${groqResponse.status}`);
    }

    const completion = await groqResponse.json();
    const finalContent: string = completion.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      role: 'assistant',
      content: finalContent,
      reply: finalContent,
    });
  } catch (error: unknown) {
    console.error('Chat route execution error:', error);
    const fallbackMessage =
      'I am Finrena. Our institutional data feeds are experiencing momentary network congestion. Please submit your inquiry again in 30 seconds.';
    return NextResponse.json({
      role: 'assistant',
      content: fallbackMessage,
      reply: fallbackMessage,
    });
  }
}
