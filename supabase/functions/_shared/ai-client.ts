/**
 * Client IA unifié — Architecture multi-clés OpenAI par module
 * V2: + Retry exponential backoff + Prompt hash caching + max_tokens defaults
 *
 * Chaque module (seo, product, marketing, chat, automation) utilise sa propre clé API
 * pour un tracking précis des coûts et la possibilité de couper un module indépendamment.
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/** Modules IA disponibles */
export type AIModule = 'seo' | 'product' | 'marketing' | 'chat' | 'automation';

/** Mapping clé d'environnement par module */
const MODULE_KEY_MAP: Record<AIModule, string> = {
  seo: 'OPENAI_API_KEY_SEO',
  product: 'OPENAI_API_KEY_PRODUCT',
  marketing: 'OPENAI_API_KEY_MARKETING',
  chat: 'OPENAI_API_KEY_CHAT',
  automation: 'OPENAI_API_KEY_AUTOMATION',
};

/** Max tokens par défaut selon le module */
const MODULE_MAX_TOKENS: Record<AIModule, number> = {
  seo: 1500,
  product: 1500,
  marketing: 2000,
  chat: 2000,
  automation: 2000,
};

/** Mapping des anciens modèles Lovable Gateway vers les modèles OpenAI natifs */
const MODEL_MAP: Record<string, string> = {
  'openai/gpt-5-nano': 'gpt-4o-mini',
  'openai/gpt-5-mini': 'gpt-4o-mini',
  'openai/gpt-5': 'gpt-4o',
  'openai/gpt-5.2': 'gpt-4o',
  'google/gemini-2.5-flash': 'gpt-4o-mini',
  'google/gemini-2.5-flash-lite': 'gpt-4o-mini',
  'google/gemini-2.5-pro': 'gpt-4o',
  'google/gemini-3-flash-preview': 'gpt-4o-mini',
  'google/gemini-3.1-pro-preview': 'gpt-4o',
};

function resolveModel(model?: string): string {
  if (!model) return 'gpt-4o-mini';
  return MODEL_MAP[model] ?? model;
}

/**
 * Résout la clé API pour un module donné.
 * Fallback: OPENAI_API_KEY (clé globale) si la clé module n'est pas configurée.
 */
function resolveApiKey(module?: AIModule): string {
  if (module) {
    const moduleKey = Deno.env.get(MODULE_KEY_MAP[module]);
    if (moduleKey) return moduleKey;
    console.warn(`[AI-CLIENT] No key for module "${module}", falling back to OPENAI_API_KEY`);
  }
  const globalKey = Deno.env.get('OPENAI_API_KEY');
  if (!globalKey) {
    throw new Error(
      `No OpenAI API key configured${module ? ` for module "${module}"` : ''}. ` +
      `Set ${module ? MODULE_KEY_MAP[module] + ' or ' : ''}OPENAI_API_KEY in your secrets.`
    );
  }
  return globalKey;
}

export interface AIRequestOptions {
  model?: string;
  module?: AIModule;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
  response_format?: any;
  /** Retry config — defaults: 3 attempts, 1s initial delay */
  retries?: number;
  retryDelayMs?: number;
  /** Enable prompt hash caching (default: false) */
  enableCache?: boolean;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── Prompt Hash Cache ──────────────────────────────────────────────────

/**
 * Creates a simple hash from a string (FNV-1a variant).
 * Used for cache lookups, not cryptographic security.
 */
function hashPrompt(messages: AIMessage[], model: string): string {
  const raw = model + '|' + messages.map(m => `${m.role}:${m.content}`).join('|');
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * In-memory LRU cache for prompt results (per Edge Function instance).
 * TTL: 5 minutes. Max 100 entries.
 */
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
  // Evict oldest if at capacity
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

/**
 * Retryable fetch with exponential backoff.
 * Only retries on 429 (rate limit) and 5xx (server errors).
 */
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

      // Don't retry on client errors (except 429)
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      // Retry on 429 or 5xx
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = initialDelayMs * Math.pow(2, attempt);
          const jitter = Math.random() * delay * 0.3;
          console.warn(
            `[AI-CLIENT] Retry ${attempt + 1}/${maxRetries} after ${response.status} — waiting ${Math.round(delay + jitter)}ms`
          );
          await sleep(delay + jitter);
          continue;
        }
      }

      // No more retries — return as-is
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
 * Appelle l'API OpenAI directement avec la clé du module approprié.
 * Inclut retry avec backoff exponentiel et cache optionnel.
 */
export async function callOpenAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<any> {
  const model = resolveModel(options.model);
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

  const apiKey = resolveApiKey(options.module);

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
    OPENAI_API_URL,
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
    console.error(`[AI-CLIENT][${options.module ?? 'global'}] OpenAI error ${status}:`, errorText);

    // Throw structured errors for 429/402
    if (status === 429) {
      const err = new Error('Rate limit exceeded. Please try again later.');
      (err as any).status = 429;
      throw err;
    }
    if (status === 402) {
      const err = new Error('Insufficient credits. Please top up your account.');
      (err as any).status = 402;
      throw err;
    }

    throw new Error(`OpenAI API error (${status}): ${errorText}`);
  }

  if (options.stream) {
    return response;
  }

  const result = await response.json();

  // ── Cache store ──
  if (options.enableCache) {
    const cacheKey = hashPrompt(messages, model);
    setCache(cacheKey, result);
    console.log(`[AI-CLIENT] Cache STORED for hash ${cacheKey}`);
  }

  return result;
}

/**
 * Raccourci pour un appel IA simple (system + user prompt) retournant du texte.
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
 * Inclut le nettoyage des balises markdown et un fallback sur response_format.
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
      response_format: options.response_format ?? { type: 'json_object' },
    }
  );

  const text = result.choices?.[0]?.message?.content ?? '{}';

  // Nettoyer les balises markdown si présentes
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  return JSON.parse(cleaned);
}
