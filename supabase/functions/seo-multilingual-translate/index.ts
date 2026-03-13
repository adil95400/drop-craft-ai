const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPPORTED_LANGUAGES: Record<string, string> = {
  fr: 'French', en: 'English', es: 'Spanish', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', sv: 'Swedish', da: 'Danish',
  no: 'Norwegian', fi: 'Finnish', cs: 'Czech', sk: 'Slovak', hu: 'Hungarian',
  ro: 'Romanian', bg: 'Bulgarian', hr: 'Croatian', sl: 'Slovenian', el: 'Greek',
  tr: 'Turkish', ru: 'Russian', uk: 'Ukrainian', ar: 'Arabic', he: 'Hebrew',
  ja: 'Japanese', ko: 'Korean', zh: 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
  th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', hi: 'Hindi',
  bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', ur: 'Urdu',
  fa: 'Persian', sw: 'Swahili', af: 'Afrikaans', tl: 'Filipino',
  ca: 'Catalan', eu: 'Basque', gl: 'Galician', et: 'Estonian',
  lv: 'Latvian', lt: 'Lithuanian', mt: 'Maltese', is: 'Icelandic',
  ga: 'Irish', cy: 'Welsh', sq: 'Albanian', mk: 'Macedonian',
  bs: 'Bosnian', sr: 'Serbian', ka: 'Georgian', hy: 'Armenian',
  az: 'Azerbaijani', kk: 'Kazakh', uz: 'Uzbek',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, texts, sourceLang, targetLangs, contentType, tone, productContext } = await req.json();

    if (action === 'list-languages') {
      return new Response(JSON.stringify({ languages: SUPPORTED_LANGUAGES }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!texts || !targetLangs || targetLangs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'texts and targetLangs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sourceLanguage = SUPPORTED_LANGUAGES[sourceLang || 'fr'] || 'French';
    const results: Record<string, Record<string, string>> = {};

    // Process each target language
    for (const lang of targetLangs) {
      const targetLanguage = SUPPORTED_LANGUAGES[lang];
      if (!targetLanguage) continue;

      const textEntries = Object.entries(texts as Record<string, string>);
      const prompt = buildPrompt(textEntries, sourceLanguage, targetLanguage, contentType, tone, productContext);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev',
          'X-Title': 'ShopOpti Multilingual',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-nano',
          messages: [
            {
              role: 'system',
              content: `You are an expert multilingual e-commerce copywriter and SEO specialist. Translate and adapt content for ${targetLanguage} markets. Maintain SEO value, brand tone, and cultural relevance. Return ONLY valid JSON.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        console.error(`Translation to ${lang} failed:`, response.status);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          results[lang] = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error(`Failed to parse response for ${lang}:`, e);
        // Fallback: simple key-value extraction
        results[lang] = {};
        textEntries.forEach(([key]) => {
          results[lang][key] = `[${targetLanguage}] Translation pending`;
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, translations: results, languageCount: Object.keys(results).length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Translation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(
  textEntries: [string, string][],
  sourceLang: string,
  targetLang: string,
  contentType?: string,
  tone?: string,
  productContext?: string
): string {
  const textsJson = Object.fromEntries(textEntries);
  let prompt = `Translate the following ${contentType || 'e-commerce'} content from ${sourceLang} to ${targetLang}.\n\n`;

  if (tone) prompt += `Tone: ${tone}\n`;
  if (productContext) prompt += `Product context: ${productContext}\n`;

  prompt += `\nIMPORTANT:\n`;
  prompt += `- Adapt for the target market (cultural references, units, date formats)\n`;
  prompt += `- Preserve SEO keywords and their intent\n`;
  prompt += `- Keep HTML tags intact if present\n`;
  prompt += `- Maintain brand voice consistency\n`;
  prompt += `- For product descriptions, highlight benefits relevant to the target market\n\n`;
  prompt += `Source content (JSON):\n${JSON.stringify(textsJson, null, 2)}\n\n`;
  prompt += `Return a JSON object with the same keys, translated values. Only JSON, no explanation.`;

  return prompt;
}
