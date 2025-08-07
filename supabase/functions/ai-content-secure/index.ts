import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (userId: string, maxRequests = 20, windowMs = 3600000): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (userLimit.count >= maxRequests) {
    return true;
  }
  
  userLimit.count++;
  return false;
};

const sanitizePrompt = (prompt: string): string => {
  // Remove potential prompt injection attempts
  return prompt
    .replace(/ignore previous instructions/gi, '')
    .replace(/system:/gi, '')
    .replace(/assistant:/gi, '')
    .replace(/\[INST\]/gi, '')
    .replace(/\[\/INST\]/gi, '')
    .slice(0, 2000); // Limit prompt length
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error('Non autorisé');
    }

    // Rate limiting
    if (isRateLimited(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Trop de requêtes. Réessayez plus tard.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, type, language = 'fr', keywords = [] } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt requis');
    }

    // Sanitize and validate input
    const sanitizedPrompt = sanitizePrompt(prompt);
    const validTypes = ['product_description', 'blog_article', 'ad_copy', 'seo_content'];
    
    if (type && !validTypes.includes(type)) {
      throw new Error('Type de contenu non valide');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    // Build secure system prompt
    const systemPrompts: Record<string, string> = {
      product_description: 'Tu es un expert en rédaction de descriptions produits pour e-commerce. Crée du contenu engageant et informatif.',
      blog_article: 'Tu es un rédacteur web expert. Crée des articles de blog informatifs et bien structurés.',
      ad_copy: 'Tu es un copywriter expert. Crée des textes publicitaires persuasifs et conformes aux bonnes pratiques.',
      seo_content: 'Tu es un expert en SEO. Crée du contenu optimisé pour les moteurs de recherche.'
    };

    const systemPrompt = systemPrompts[type] || 'Tu es un assistant de rédaction professionnel.';
    
    let userPrompt = `Langue: ${language}\n`;
    if (keywords.length > 0) {
      userPrompt += `Mots-clés à inclure: ${keywords.join(', ')}\n`;
    }
    userPrompt += `Contenu demandé: ${sanitizedPrompt}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la génération du contenu');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Log the generation for monitoring
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'ai_content_generation',
      description: `Génération de contenu IA (${type || 'général'})`,
      entity_type: 'ai_content',
      metadata: {
        type,
        language,
        keywords_count: keywords.length,
        content_length: generatedContent.length
      }
    });

    return new Response(
      JSON.stringify({
        content: generatedContent,
        metadata: {
          type,
          language,
          generated_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erreur dans ai-content-secure:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});