/**
 * SEO AI Generate Edge Function
 * Generates SEO content (meta, title, h1, etc.) via Lovable AI
 * SECURITY: JWT auth + user scoping + quota tracking
 * UNIFIED: Writes to `jobs` table (not background_jobs)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';
import { parseJsonValidated, z } from '../_shared/validators.ts';

const GenerateSchema = z.object({
  type: z.enum(['meta_description', 'title', 'h1', 'alt_text', 'faq']),
  page_id: z.string().uuid().optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
  language: z.string().max(10).default('fr'),
  tone: z.string().max(50).default('professional'),
  keywords: z.array(z.string().max(100)).max(20).default([]),
  variants: z.number().int().min(1).max(5).default(3),
});

serve(
  withErrorHandler(async (req) => {
    const preflight = handleCorsPreflightSecure(req);
    if (preflight) return preflight;

    const origin = req.headers.get('origin');
    const cors = getSecureCorsHeaders(origin);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new ValidationError('Non authentifié');

    const urlObj = new URL(req.url);

    if (req.method === 'POST') {
      const body = await parseJsonValidated(req, GenerateSchema);

      let audit_id: string | null = null;
      if (body.page_id) {
        const { data: page } = await supabase.from('seo_audit_pages')
          .select('audit_id').eq('id', body.page_id).single();
        if (page) audit_id = page.audit_id;
      }

      const { data: gen, error } = await supabase.from('seo_ai_generations').insert({
        user_id: user.id,
        audit_id,
        page_id: body.page_id || null,
        url: body.url || null,
        type: body.type,
        language: body.language,
        tone: body.tone,
        input: { keywords: body.keywords, variants: body.variants },
      }).select().single();

      if (error) throw error;

      // Create job in unified `jobs` table
      const { data: job } = await supabase.from('jobs').insert({
        user_id: user.id,
        job_type: 'ai_generation',
        job_subtype: 'seo',
        status: 'pending',
        name: `SEO AI: ${body.type}`,
        input_data: { generation_id: gen.id },
      }).select('id').single();

      console.log(`[SEO-AI] Created generation ${gen.id} for user ${user.id}`);

      return new Response(JSON.stringify({
        generation_id: gen.id,
        job_id: job?.id,
        status: 'pending',
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // GET /:generation_id
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const genId = parts[parts.length - 1];

    if (genId && genId !== 'seo-ai-generate') {
      const { data, error } = await supabase.from('seo_ai_generations')
        .select('*').eq('id', genId).eq('user_id', user.id).single();
      if (error || !data) throw new ValidationError('Génération non trouvée');

      return new Response(JSON.stringify(data), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const page = parseInt(urlObj.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(urlObj.searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const { data, count } = await supabase.from('seo_ai_generations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return new Response(JSON.stringify({
      items: data || [],
      page,
      limit,
      total: count || 0,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  }, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' })
);
