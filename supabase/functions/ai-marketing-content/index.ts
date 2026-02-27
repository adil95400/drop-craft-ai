/**
 * AI Marketing Content Generator - Secured Implementation
 * P0.1: JWT authentication required
 * P0.4: Secure CORS with allowlist
 * P0.6: Rate limiting per user
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from '../_shared/secure-cors.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { z } from 'https://esm.sh/zod@3.22.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Input validation schema
const InputSchema = z.object({
  contentType: z.enum(['email', 'social', 'ad', 'blog']),
  productInfo: z.object({
    name: z.string().max(200),
    description: z.string().max(2000).optional(),
    price: z.number().optional(),
    category: z.string().max(100).optional()
  }),
  platform: z.string().max(50).optional(),
  campaignGoal: z.string().max(500).optional()
});

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return { user, supabase };
}

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin');
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // P0.1: Require authentication
    const { user } = await authenticateUser(req);
    
    // P0.6: Rate limiting - 30 requests per hour for AI content
    const rateLimitResult = await checkRateLimit(user.id, 'ai_marketing', 30, 60);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const parseResult = InputSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: parseResult.error.issues.slice(0, 3).map(i => i.message)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { contentType, productInfo, platform, campaignGoal } = parseResult.data;
    
    // Use Lovable AI Gateway (no external API key needed)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    const contentPrompts: Record<string, string> = {
      email: `Create a compelling email marketing campaign for ${productInfo.name}.
      
Goal: ${campaignGoal || 'Increase sales'}
Platform: ${platform || 'Email'}

Generate:
1. Subject line (attention-grabbing, 50 characters max)
2. Preview text (complement subject, 100 characters max)
3. Email body (HTML-friendly, 200-300 words)
4. Call-to-action (clear and actionable)

Return as JSON with structure: {"subject", "previewText", "body", "cta"}`,

      social: `Create engaging social media posts for ${productInfo.name}.

Goal: ${campaignGoal || 'Increase engagement'}
Platform: ${platform || 'Instagram'}

Generate 3 variations:
1. Short punchy post (280 characters)
2. Story-driven post (with emoji)
3. Question/engagement post

Include hashtag suggestions. Return as JSON array: [{"text", "hashtags", "callToAction"}]`,

      ad: `Create paid advertising copy for ${productInfo.name}.

Goal: ${campaignGoal || 'Drive conversions'}
Platform: ${platform || 'Facebook'}

Generate:
1. Headline (30 characters)
2. Description (90 characters)
3. Long description (if applicable)
4. Display URL suggestions

Return as JSON: {"headline", "description", "longDescription", "displayUrl"}`,

      blog: `Write a blog post outline about ${productInfo.name}.

Goal: ${campaignGoal || 'Build authority'}

Generate:
1. SEO-optimized title
2. Meta description
3. Introduction (100 words)
4. 3-5 main section headings with brief descriptions
5. Conclusion summary
6. CTA

Return as JSON with structure: {"title", "metaDescription", "intro", "sections", "conclusion", "cta"}`
    };

    const prompt = contentPrompts[contentType];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an expert digital marketing content creator with expertise in conversion optimization. Always respond in valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit reached. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsedContent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { content };
    } catch (e) {
      console.error('JSON parsing error:', e);
      parsedContent = { content };
    }

    return new Response(JSON.stringify({
      success: true,
      contentType,
      data: parsedContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const status = error.message?.includes('Authentication') ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
