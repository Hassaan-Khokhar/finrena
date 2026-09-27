/**
 * ProviderRotator: Multi-provider AI inference engine with circuit-breaking failover.
 *
 * Architecture:
 *   Tier 1 → Groq (Llama-3.3-70b-versatile) — primary high-performance inference
 *   Tier 2 → Gemini 1.5 Flash — cross-provider fallback when Groq is rate-limited
 *   Tier 3 → Graceful degradation message (zero compute, zero cost)
 *
 * Key Management:
 *   - GROQ_WORKSPACE_KEY  : Dedicated Groq account key for the workspace/chat feature
 *   - GEMINI_WORKSPACE_KEY: Dedicated Gemini project key for workspace fallback
 *
 * Cooldown Logic:
 *   When a Groq key returns HTTP 429 (Too Many Requests), it is placed in a 60-second
 *   cooldown window. Subsequent requests skip that key until the cooldown expires.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GeminiChatResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// ─── Graceful Degradation Message ────────────────────────────────────────────

const GRACEFUL_DEGRADATION_MESSAGE =
  'I am Finrena. Our institutional servers are currently processing unprecedented market traffic. Please wait 60 seconds for the network connection to stabilize, and submit your research query again.';

// ─── Provider Rotator Class ──────────────────────────────────────────────────

class ProviderRotator {
  private groqKeys: string[] = [];
  private currentGroqIndex = 0;
  private groqCooldowns: Map<number, number> = new Map();

  constructor() {
    this.refreshGroqKeys();
  }

  /**
   * Refreshes the active key pool from environment variables.
   * Supports comma-separated keys for multi-key pooling.
   */
  private refreshGroqKeys(): string[] {
    const workspaceKey = process.env.GROQ_WORKSPACE_KEY || '';
    this.groqKeys = workspaceKey
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    return this.groqKeys;
  }

  private getGroqKeys(): string[] {
    if (this.groqKeys.length === 0) {
      return this.refreshGroqKeys();
    }
    return this.groqKeys;
  }

  /**
   * Returns the next available Groq key that is not in cooldown.
   * Implements round-robin rotation across the key pool.
   */
  private getActiveGroqKey(): string | null {
    const keys = this.getGroqKeys();
    if (keys.length === 0) return null;

    const now = Date.now();
    for (let i = 0; i < keys.length; i++) {
      const index = (this.currentGroqIndex + i) % keys.length;
      const cooldownUntil = this.groqCooldowns.get(index) || 0;
      if (now > cooldownUntil) {
        this.currentGroqIndex = (index + 1) % keys.length;
        return keys[index];
      }
    }
    return null; // All Groq keys are rate-limited
  }

  /**
   * Marks the current Groq key as rate-limited for 60 seconds.
   */
  private cooldownCurrentKey(): void {
    const keys = this.getGroqKeys();
    if (keys.length === 0) return;
    const prevIndex =
      (this.currentGroqIndex - 1 + keys.length) % keys.length;
    this.groqCooldowns.set(prevIndex, Date.now() + 60_000);
  }

  /**
   * Primary entry point: executes chat inference with full failover cascade.
   *
   * Flow:
   *   1. Try Groq (round-robin key pool)
   *   2. If Groq fails (429/5xx), cascade to Gemini 1.5 Flash
   *   3. If Gemini also fails, return graceful degradation message
   */
  public async executeChat(
    messages: ChatMessage[],
    systemPrompt: string,
    model: string = 'llama-3.3-70b-versatile',
    temperature: number = 0.2
  ): Promise<string> {
    // ── Tier 1: Groq ──
    const groqKey = this.getActiveGroqKey();
    if (groqKey) {
      try {
        return await this.callGroq(messages, systemPrompt, groqKey, model, temperature);
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 429 || status === 503 || status === 500) {
          this.cooldownCurrentKey();
          // Try next Groq key if available
          const nextKey = this.getActiveGroqKey();
          if (nextKey) {
            try {
              return await this.callGroq(messages, systemPrompt, nextKey, model, temperature);
            } catch {
              this.cooldownCurrentKey();
            }
          }
        } else {
          console.error('[ProviderRotator] Groq non-retryable error:', err);
        }
      }
    }

    // ── Tier 2: Gemini 1.5 Flash ──
    try {
      return await this.callGeminiFallback(messages, systemPrompt, temperature);
    } catch (err) {
      console.error('[ProviderRotator] Gemini fallback failed:', err);
    }

    // ── Tier 3: Graceful Degradation ──
    return GRACEFUL_DEGRADATION_MESSAGE;
  }

  /**
   * Executes a lightweight classification/enhancement call using the fast 8B model.
   * Falls back to Gemini Flash if Groq is unavailable.
   */
  public async executeClassifier(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    return this.executeChat(messages, systemPrompt, 'llama-3.1-8b-instant', 0.0);
  }

  /**
   * Calls Groq's OpenAI-compatible chat completions endpoint.
   */
  private async callGroq(
    messages: ChatMessage[],
    systemPrompt: string,
    apiKey: string,
    model: string,
    temperature: number
  ): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      // If the model does not exist on this Groq account/tier (404 model_not_found),
      // seamlessly fall back to modern active Groq inference models
      if (res.status === 404 && !model.startsWith('openai/')) {
        const fallbackModel = model.includes('8b') ? 'openai/gpt-oss-20b' : 'openai/gpt-oss-120b';
        console.warn(`[ProviderRotator] Model ${model} returned 404, falling back to ${fallbackModel}`);
        return this.callGroq(messages, systemPrompt, apiKey, fallbackModel, temperature);
      }
      throw { status: res.status, text };
    }

    const data: GroqChatResponse = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Calls Google Gemini 1.5 Flash as the cross-provider fallback.
   */
  private async callGeminiFallback(
    messages: ChatMessage[],
    systemPrompt: string,
    temperature: number = 0.2
  ): Promise<string> {
    const geminiKey = process.env.GEMINI_WORKSPACE_KEY;
    if (!geminiKey) {
      throw new Error('GEMINI_WORKSPACE_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    // Convert OpenAI-style messages to Gemini format
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature,
        maxOutputTokens: 4096,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw { status: res.status, text };
    }

    const data: GeminiChatResponse = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

export const aiRotator = new ProviderRotator();
