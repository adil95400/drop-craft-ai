/**
 * Centralized AI model configuration
 * All edge functions should import from here for consistency.
 */

/** Default text model for all AI tasks */
export const AI_MODEL = 'gpt-4o-mini';

/** Higher-quality model for complex reasoning */
export const AI_MODEL_PRO = 'gpt-4o';

/** OpenAI API URL — all AI calls go through this */
export const AI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * @deprecated Use AI_API_URL instead. Kept for backward compatibility.
 */
export const AI_GATEWAY_URL = AI_API_URL;
