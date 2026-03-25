/**
 * Translation Service - Secure Edge Function
 * Migrated to shared AI client + quota checking
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';
import { parseJsonValidated, z } from '../_shared/validators.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { generateText } from '../_shared/ai-client.ts';
import { checkAndIncrementQuota, quotaExceededResponse } from '../_shared/ai-quota.ts';

const TranslationSchema = z.object({
  text: z.string().min(1, 'Text is required').max(50000, 'Text too long (max 50000 chars)'),
  source_lang: z.string().optional(),
  target_lang: z.string().min(2, 'Target language required').max(10),
  preserve_formatting: z.boolean().optional()
});

serve(
  withErrorHandler(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    const extensionToken = req.headers.get("x-extension-token");
    let userId: string;

    if (extensionToken) {
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('validate_extension_token', { p_token: extensionToken });
      if (tokenError || !tokenResult?.success) throw new ValidationError("Invalid extension token");
      userId = tokenResult.user?.id;
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) throw new ValidationError("Invalid authentication");
      userId = userData.user.id;
    } else {
      throw new ValidationError("Authentication required");
    }

    // Rate limiting
    const rateLimitOk = await checkRateLimit(supabase, `translate:${userId}`, 100, 3600000);
    if (!rateLimitOk) throw new ValidationError("Rate limit exceeded. Please try again later.");

    // Quota check
    const quota = await checkAndIncrementQuota(userId, 'translation');
    if (!quota.allowed) return quotaExceededResponse(corsHeaders, quota);

    const { text, source_lang, target_lang, preserve_formatting } =
      await parseJsonValidated(req, TranslationSchema);

    console.log(`[Translate] User ${userId}, to ${target_lang}, length: ${text.length}`);

    const sourceInfo = source_lang ? `from ${source_lang}` : '';
    const formattingNote = preserve_formatting
      ? 'Preserve all HTML tags, line breaks, and formatting exactly as in the original.'
      : 'Clean up the text but preserve essential formatting.';

    const systemPrompt = `You are a professional translator specializing in e-commerce product content.
Translate the following text ${sourceInfo} to ${target_lang}.
${formattingNote}

Guidelines:
- Maintain the original meaning and tone
- Keep product names, brand names, and technical terms if appropriate
- Adapt units and measurements for the target market if needed
- Make the text sound natural in the target language
- For color names, size labels, and common terms, use the standard translations

Return ONLY the translated text, no explanations or additional text.`;

    const translatedText = await generateText(systemPrompt, text, {
      module: 'seo',
      temperature: 0.3,
      maxTokens: Math.max(text.length * 2, 1000),
      enableCache: true,
    });

    if (!translatedText) throw new Error("No translation generated");

    console.log(`[Translate] Success for user ${userId}, output length: ${translatedText.length}`);

    // Log usage
    await supabase.from('translation_usage').insert({
      user_id: userId,
      source_lang: source_lang || 'auto',
      target_lang,
      char_count: text.length,
      translated_count: 1,
      text_count: 1
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        translated_text: translatedText,
        source_lang: source_lang || 'auto',
        target_lang,
        original_length: text.length,
        translated_length: translatedText.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }, corsHeaders)
);
