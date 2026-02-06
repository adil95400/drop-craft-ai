/**
 * SEO Issues Edge Function
 * Fetch issues for a specific page
 * SECURITY: JWT auth + ownership via audit chain
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';

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
    const pageId = urlObj.searchParams.get('page_id');
    const severity = urlObj.searchParams.get('severity');

    if (!pageId) throw new ValidationError('page_id requis');

    // Verify ownership: page -> audit -> user
    const { data: page } = await supabase.from('seo_audit_pages')
      .select('audit_id').eq('id', pageId).single();
    if (!page) throw new ValidationError('Page non trouvée');

    const { data: audit } = await supabase.from('seo_audits')
      .select('id').eq('id', page.audit_id).eq('user_id', user.id).single();
    if (!audit) throw new ValidationError('Non autorisé');

    let query = supabase.from('seo_issues')
      .select('*')
      .eq('page_id', pageId);

    if (severity) query = query.eq('severity', severity);

    const { data } = await query.order('created_at', { ascending: false });

    return new Response(JSON.stringify({ items: data || [] }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  }, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' })
);
