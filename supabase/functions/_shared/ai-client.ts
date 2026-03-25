/**
 * Client IA unifié — Lovable AI Gateway
 * Utilise le gateway Lovable (compatible OpenAI) avec LOVABLE_API_KEY
 * Inclut retry exponentiel, cache LRU, et gestion des erreurs 429/402
 */

const LOVABLE_AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';

/** Modules IA disponibles (pour tracking) */
export type AIModule = 'seo' | 'product' | 'marketing' | 'chat' | 'automation';

/** Max tokens par défaut selon le module */
const MODULE_MAX_TOKENS: Record<AIModule, number> = {
  seo: 1500,
  product: 1500,
  marketing: 2000,
  chat: 2000,
  automation: 2000,
};

export interface AIRequestOptions {
  model?: string;
  module?: AIModule;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
  response_format?: any;
  retries?: number;
  retryDelayMs?: number;
  enableCache?: boolean;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── Prompt Hash Cache ──────────────────────────────────────────────────

function hashPrompt(messages: AIMessage[], model: string): string {
  const raw = model + '|' + messages.map(m => `${m.role}:${m.content}`).join('|');
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const promptCache = new Map<string, { result: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_SIZE = 100;

function getCached(key: string): any | null {
  const entry = promptCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    promptCache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(key: string, result: any): void {
  if (promptCache.size >= CACHE_MAX_SIZE) {
    const firstKey = promptCache.keys().next().value;
    if (firstKey) promptCache.delete(firstKey);
  }
  promptCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Retry Logic ────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries: number,
  initialDelayMs: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);

      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = initialDelayMs * Math.pow(2, attempt);
          const jitter = Math.random() * delay * 0.3;
          console.warn(`[AI-CLIENT] Retry ${attempt + 1}/${maxRetries} after ${response.status} — waiting ${Math.round(delay + jitter)}ms`);
          await sleep(delay + jitter);
          continue;
        }
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        console.warn(`[AI-CLIENT] Network error retry ${attempt + 1}/${maxRetries}: ${lastError.message}`);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error('All retries exhausted');
}

// ── Main API ───────────────────────────────────────────────────────────

/**
 * Appelle le Lovable AI Gateway (compatible OpenAI).
 * Utilise LOVABLE_API_KEY automatiquement.
 */
export async function callOpenAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<any> {
  const model = options.model || DEFAULT_MODEL;
  const maxRetries = options.retries ?? 3;
  const retryDelay = options.retryDelayMs ?? 1000;

  // ── Cache check ──
  if (options.enableCache && !options.stream) {
    const cacheKey = hashPrompt(messages, model);
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[AI-CLIENT] Cache HIT for hash ${cacheKey}`);
      return cached;
    }
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not configured. Lovable AI Gateway cannot be used.');
  }

  const defaultMaxTokens = options.module ? MODULE_MAX_TOKENS[options.module] : 1500;

  const body: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? defaultMaxTokens,
  };

  if (options.stream) body.stream = true;
  if (options.tools) body.tools = options.tools;
  if (options.tool_choice) body.tool_choice = options.tool_choice;
  if (options.response_format) body.response_format = options.response_format;

  const response = await fetchWithRetry(
    LOVABLE_AI_GATEWAY_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    maxRetries,
    retryDelay
  );

  if (!response.ok) {
    const errorText = await response.text();
    const status = response.status;
    console.error(`[AI-CLIENT][${options.module ?? 'global'}] Gateway error ${status}:`, errorText);

    if (status === 429) {
      const err = new Error('RATE_LIMITED');
      (err as any).status = 429;
      throw err;
    }
    if (status === 402) {
      const err = new Error('CREDITS_EXHAUSTED');
      (err as any).status = 402;
      throw err;
    }

    throw new Error(`AI Gateway error (${status}): ${errorText}`);
  }

  if (options.stream) {
    return response;
  }

  const result = await response.json();

  // ── Cache store ──
  if (options.enableCache) {
    const cacheKey = hashPrompt(messages, model);
    setCache(cacheKey, result);
  }

  return result;
}

/**
 * Raccourci pour un appel IA simple retournant du texte.
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: AIRequestOptions = {}
): Promise<string> {
  const result = await callOpenAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    options
  );

  return result.choices?.[0]?.message?.content ?? '';
}

/**
 * Raccourci pour un appel IA retournant du JSON parsé.
 */
export async function generateJSON<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options: AIRequestOptions = {}
): Promise<T> {
  const result = await callOpenAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      ...options,
      temperature: options.temperature ?? 0.3,
    }
  );

  const text = result.choices?.[0]?.message?.content ?? '{}';

  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  return JSON.parse(cleaned);
}
