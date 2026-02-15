/**
 * SEO Fix Apply Edge Function
 * Applies SEO fixes (title, meta, h1, etc.) to stores via connectors
 * SECURITY: JWT auth + user scoping
 * UNIFIED: Writes to `jobs` table (not background_jobs)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';
import { parseJsonValidated, z } from '../_shared/validators.ts';

const ApplyFixSchema = z.object({
  store_id: z.string().uuid().optional().nullable(),
  page_id: z.string().uuid().optional().nullable(),
  product_id: z.string().uuid().optional().nullable(),
  action: z.enum(['APPLY_TITLE', 'APPLY_META', 'APPLY_H1', 'APPLY_ALT', 'APPLY_CANONICAL']),
  payload: z.record(z.unknown()).default({}),
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

    if (req.method === 'POST') {
      const body = await parseJsonValidated(req, ApplyFixSchema);

      const { data: fix, error } = await supabase.from('seo_fix_applies').insert({
        user_id: user.id,
        store_id: body.store_id || null,
        page_id: body.page_id || null,
        product_id: body.product_id || null,
        action: body.action,
        payload: body.payload,
        status: 'queued',
      }).select().single();

      if (error) throw error;

      // Create job in unified `jobs` table
      const { data: job } = await supabase.from('jobs').insert({
        user_id: user.id,
        job_type: 'seo_audit',
        job_subtype: 'fix',
        status: 'pending',
        name: `SEO Fix: ${body.action}`,
        input_data: { fix_id: fix.id },
      }).select('id').single();

      if (job) {
        await supabase.from('seo_fix_applies')
          .update({ job_id: job.id })
          .eq('id', fix.id);
      }

      console.log(`[SEO-FIX] Created fix ${fix.id} (${body.action}) for user ${user.id}`);

      return new Response(JSON.stringify({
        fix_id: fix.id,
        job_id: job?.id,
        status: 'pending',
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // GET — list fixes
    const urlObj = new URL(req.url);
    const page = parseInt(urlObj.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(urlObj.searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const { data, count } = await supabase.from('seo_fix_applies')
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
