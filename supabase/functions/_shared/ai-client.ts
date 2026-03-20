/**
 * Client IA unifié — Architecture multi-clés OpenAI par module
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
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Appelle l'API OpenAI directement avec la clé du module approprié.
 */
export async function callOpenAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<any> {
  const apiKey = resolveApiKey(options.module);

  const body: any = {
    model: resolveModel(options.model),
    messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.stream) body.stream = true;
  if (options.tools) body.tools = options.tools;
  if (options.tool_choice) body.tool_choice = options.tool_choice;
  if (options.response_format) body.response_format = options.response_format;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[AI-CLIENT][${options.module ?? 'global'}] OpenAI error ${response.status}:`, errorText);
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  if (options.stream) {
    return response;
  }

  return await response.json();
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
 */
export async function generateJSON<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options: AIRequestOptions = {}
): Promise<T> {
  const text = await generateText(systemPrompt, userPrompt, {
    ...options,
    temperature: options.temperature ?? 0.3,
  });

  // Nettoyer les balises markdown si présentes
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  return JSON.parse(cleaned);
}
