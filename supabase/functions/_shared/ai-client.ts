/**
 * Client IA unifié — Appels directs à l'API OpenAI
 * Remplace le Lovable AI Gateway pour une architecture indépendante.
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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

export interface AIRequestOptions {
  model?: string;
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
 * Appelle l'API OpenAI directement.
 * Lève une erreur si OPENAI_API_KEY n'est pas configuré.
 */
export async function callOpenAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<any> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Please add it to your secrets.');
  }

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
    console.error(`[AI-CLIENT] OpenAI error ${response.status}:`, errorText);
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
