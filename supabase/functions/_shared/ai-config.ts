/**
 * Centralized AI model configuration
 * All edge functions should import from here for consistency.
 */

/** Default text model for all AI tasks */
export const AI_MODEL = 'gpt-4o-mini';

/** Image generation model (kept on Gemini as GPT doesn't support image gen) */
export const AI_IMAGE_MODEL = 'google/gemini-2.5-flash-image-preview';

/** Lovable AI Gateway URL */
export const AI_GATEWAY_URL = 'https://api.openai.com/v1/chat/completions';
