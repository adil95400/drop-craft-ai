/**
 * AI Marketing Content Generator - Secured + Unified AI Client
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2
import { getSecureCorsHeaders, isAllowedOrigin } from '../_shared/secure-cors.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { callOpenAI } from '../_shared/ai-client.ts';
import { z } from 'https://esm.sh/zod@3.22.4';

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

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin');
    if (!origin || !isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) throw new Error('Authentication required');
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error('Invalid or expired token');

    const rateLimitResult = await checkRateLimit(user.id, 'ai_marketing', 30, 60);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const parseResult = InputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parseResult.error.issues.slice(0, 3).map(i => i.message) }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { contentType, productInfo, platform, campaignGoal } = parseResult.data;

    const contentPrompts: Record<string, string> = {
      email: `Create a compelling email marketing campaign for ${productInfo.name}.\nGoal: ${campaignGoal || 'Increase sales'}\nPlatform: ${platform || 'Email'}\n\nGenerate:\n1. Subject line (50 chars max)\n2. Preview text (100 chars max)\n3. Email body (200-300 words)\n4. Call-to-action\n\nReturn as JSON: {"subject", "previewText", "body", "cta"}`,
      social: `Create engaging social media posts for ${productInfo.name}.\nGoal: ${campaignGoal || 'Increase engagement'}\nPlatform: ${platform || 'Instagram'}\n\nGenerate 3 variations. Include hashtag suggestions. Return as JSON array: [{"text", "hashtags", "callToAction"}]`,
      ad: `Create paid advertising copy for ${productInfo.name}.\nGoal: ${campaignGoal || 'Drive conversions'}\nPlatform: ${platform || 'Facebook'}\n\nGenerate:\n1. Headline (30 chars)\n2. Description (90 chars)\n3. Long description\n4. Display URL\n\nReturn as JSON: {"headline", "description", "longDescription", "displayUrl"}`,
      blog: `Write a blog post outline about ${productInfo.name}.\nGoal: ${campaignGoal || 'Build authority'}\n\nGenerate:\n1. SEO-optimized title\n2. Meta description\n3. Introduction (100 words)\n4. 3-5 section headings\n5. Conclusion\n6. CTA\n\nReturn as JSON: {"title", "metaDescription", "intro", "sections", "conclusion", "cta"}`
    };

    const result = await callOpenAI(
      [
        { role: 'system', content: 'You are an expert digital marketing content creator. Always respond in valid JSON.' },
        { role: 'user', content: contentPrompts[contentType] }
      ],
      { module: 'marketing', temperature: 0.8, enableCache: true }
    );

    const content = result.choices[0].message.content;
    let parsedContent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { content };
    } catch { parsedContent = { content }; }

    return new Response(JSON.stringify({ success: true, contentType, data: parsedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const status = (error as any).status || (error.message?.includes('Authentication') ? 401 : 500);
    return new Response(JSON.stringify({ error: error.message }), {
      status, headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
