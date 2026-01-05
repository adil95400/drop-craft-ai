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

// Enhanced prompt injection protection patterns (multilingual)
const INJECTION_PATTERNS = [
  // English patterns
  /ignore\s*(all\s*)?(previous|prior|above|earlier|system)\s*(instructions?|prompts?|context|rules)/gi,
  /forget\s*(what|everything)\s*(you|about)\s*(learned|know|were\s*told)/gi,
  /disregard\s*(all\s*)?(previous|prior|above|system)\s*(instructions?|context)/gi,
  /you\s*are\s*now\s*(a|an)\s*(new|different|admin|unrestricted)/gi,
  /bypass\s*(all\s*)?(restrictions?|rules?|limitations?|security)/gi,
  /pretend\s*(you\s*are|to\s*be)\s*(a|an|unrestricted|admin)/gi,
  /override\s*(your\s*)?(instructions?|programming|rules)/gi,
  /jailbreak/gi,
  /dan\s*mode/gi,
  /do\s*anything\s*now/gi,
  // French patterns
  /ignore[rz]?\s*(les\s*)?(instructions?|consignes?|règles?)\s*(précédentes?|antérieures?)/gi,
  /oublie[rz]?\s*(tout\s*ce|ce)\s*(que\s*tu|tu)/gi,
  /ne\s*tiens?\s*pas\s*compte\s*(des?\s*)?(instructions?|consignes?)/gi,
  /contourne[rz]?\s*(les\s*)?(restrictions?|règles?|sécurité)/gi,
  // System/Role markers
  /system\s*:/gi,
  /assistant\s*:/gi,
  /user\s*:/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  // Special characters manipulation
  /\u200B/g, // Zero-width space
  /\u200C/g, // Zero-width non-joiner
  /\u200D/g, // Zero-width joiner
  /\uFEFF/g, // Byte order mark
];

// Normalize text for detection (handles Unicode tricks)
const normalizeText = (text: string): string => {
  return text
    .normalize('NFKC') // Normalize Unicode (handles ı -> i, etc.)
    .toLowerCase()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

const sanitizePrompt = (prompt: string): string => {
  // First normalize the text
  let sanitized = normalizeText(prompt);
  
  // Remove injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Limit prompt length
  return sanitized.slice(0, 2000);
};

// Validate language code (ISO 639-1)
const isValidLanguage = (lang: string): boolean => {
  return /^[a-z]{2}$/.test(lang);
};

// Validate keywords array
const sanitizeKeywords = (keywords: unknown): string[] => {
  if (!Array.isArray(keywords)) return [];
  
  return keywords
    .filter((k): k is string => typeof k === 'string')
    .slice(0, 10) // Max 10 keywords
    .map(k => k.replace(/[^\w\s\-àâäéèêëïîôùûüç]/gi, '').trim()) // Only allow safe characters
    .filter(k => k.length > 0 && k.length <= 50); // Max 50 chars per keyword
};

// Sanitize error messages for production
const sanitizeError = (error: unknown): string => {
  // In production, return generic messages
  const genericMessages: Record<string, string> = {
    'unauthorized': 'Accès non autorisé',
    'rate_limit': 'Trop de requêtes. Réessayez plus tard.',
    'validation': 'Données invalides',
    'api_error': 'Erreur lors de la génération du contenu',
    'default': 'Une erreur est survenue'
  };

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('unauthorized') || message.includes('autorisé')) {
      return genericMessages.unauthorized;
    }
    if (message.includes('rate') || message.includes('limit')) {
      return genericMessages.rate_limit;
    }
    if (message.includes('valid') || message.includes('requis')) {
      return genericMessages.validation;
    }
    if (message.includes('api') || message.includes('génération')) {
      return genericMessages.api_error;
    }
  }
  
  return genericMessages.default;
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }
    
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

    const body = await req.json();
    const { prompt, type, language, keywords } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt requis');
    }

    // Validate type
    const validTypes = ['product_description', 'blog_article', 'ad_copy', 'seo_content'];
    if (type && !validTypes.includes(type)) {
      throw new Error('Type de contenu non valide');
    }

    // Validate and sanitize language
    const validatedLanguage = (typeof language === 'string' && isValidLanguage(language)) 
      ? language 
      : 'fr';

    // Sanitize keywords
    const sanitizedKeywords = sanitizeKeywords(keywords);

    // Sanitize prompt with enhanced protection
    const sanitizedPrompt = sanitizePrompt(prompt);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('Configuration error');
    }

    // Build secure system prompt
    const systemPrompts: Record<string, string> = {
      product_description: 'Tu es un expert en rédaction de descriptions produits pour e-commerce. Crée du contenu engageant et informatif. Réponds uniquement avec la description demandée, sans commentaires additionnels.',
      blog_article: 'Tu es un rédacteur web expert. Crée des articles de blog informatifs et bien structurés. Réponds uniquement avec l\'article demandé.',
      ad_copy: 'Tu es un copywriter expert. Crée des textes publicitaires persuasifs et conformes aux bonnes pratiques. Réponds uniquement avec le texte demandé.',
      seo_content: 'Tu es un expert en SEO. Crée du contenu optimisé pour les moteurs de recherche. Réponds uniquement avec le contenu demandé.'
    };

    const systemPrompt = systemPrompts[type] || 'Tu es un assistant de rédaction professionnel. Réponds uniquement à la demande, sans commentaires additionnels.';
    
    let userPrompt = `Langue: ${validatedLanguage}\n`;
    if (sanitizedKeywords.length > 0) {
      userPrompt += `Mots-clés à inclure: ${sanitizedKeywords.join(', ')}\n`;
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
      console.error('OpenAI API error:', response.status);
      throw new Error('Erreur lors de la génération du contenu');
    }

    const responseData = await response.json();
    const generatedContent = responseData.choices[0].message.content;

    // Log the generation for monitoring (without sensitive data)
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'ai_content_generation',
      description: `Génération de contenu IA (${type || 'général'})`,
      entity_type: 'ai_content',
      source: 'ai-content-secure',
      details: {
        type,
        language: validatedLanguage,
        keywords_count: sanitizedKeywords.length,
        content_length: generatedContent.length
      }
    });

    return new Response(
      JSON.stringify({
        content: generatedContent,
        metadata: {
          type,
          language: validatedLanguage,
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
    
    // Return sanitized error message
    return new Response(
      JSON.stringify({ error: sanitizeError(error) }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
