/**
 * SEO Audit Edge Function
 * Handles: create audit, get audit, list audits, list pages, list issues, export
 * SECURITY: JWT auth + user scoping
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';
import { parseJsonValidated, z } from '../_shared/validators.ts';
import { logConsumption } from '../_shared/consumption.ts';

const CreateAuditSchema = z.object({
  mode: z.enum(['single_url', 'sitemap', 'crawl']),
  base_url: z.string().url().max(2000),
  sitemap_url: z.string().url().max(2000).optional().nullable(),
  max_urls: z.number().int().min(1).max(10000).default(200),
  max_depth: z.number().int().min(1).max(20).optional().nullable(),
  rate_limit_rps: z.number().min(0.1).max(10).default(1.0),
  respect_robots: z.boolean().default(true),
  include_query_params: z.boolean().default(false),
  page_type_filters: z.array(z.string().max(50)).max(20).default([]),
  url_patterns_include: z.array(z.string().max(500)).max(20).default([]),
  url_patterns_exclude: z.array(z.string().max(500)).max(20).default([]),
  store_id: z.string().uuid().optional().nullable(),
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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Routes: POST / | GET / | GET /:id | GET /:id/pages | GET /:id/issues | GET /:id/export

    if (req.method === 'POST') {
      // Create audit
      const body = await parseJsonValidated(req, CreateAuditSchema);

      const { data: audit, error } = await supabase.from('seo_audits').insert({
        user_id: user.id,
        store_id: body.store_id || null,
        mode: body.mode,
        base_url: body.base_url,
        sitemap_url: body.sitemap_url || null,
        status: 'queued',
        requested_by: user.id,
        max_urls: body.max_urls,
        max_depth: body.max_depth || null,
        rate_limit_rps: body.rate_limit_rps,
        respect_robots: body.respect_robots,
        include_query_params: body.include_query_params,
        page_type_filters: body.page_type_filters,
        url_patterns_include: body.url_patterns_include,
        url_patterns_exclude: body.url_patterns_exclude,
      }).select().single();

      if (error) throw error;

      // Create job in unified `jobs` table
      const { data: job } = await supabase.from('jobs').insert({
        user_id: user.id,
        job_type: 'seo_audit',
        job_subtype: body.mode,
        status: 'queued',
        name: `SEO Audit: ${body.base_url}`,
        input_data: { audit_id: audit.id },
        metadata: { base_url: body.base_url, mode: body.mode },
      }).select('id').single();

      console.log(`[SEO-AUDIT] Created audit ${audit.id} for user ${user.id}`);

      // Track consumption
      await logConsumption(supabase, { userId: user.id, action: 'seo_audit', metadata: { audit_id: audit.id, mode: body.mode } });

      return new Response(JSON.stringify({
        audit_id: audit.id,
        job_id: job?.id,
        status: 'queued',
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // GET requests
    const auditId = pathParts.length >= 2 ? pathParts[pathParts.length - 1] : null;
    const subRoute = pathParts.length >= 2 ? pathParts[pathParts.length - 1] : null;

    // Detect sub-routes like /seo-audit/<audit_id>/pages
    const hasSubRoute = pathParts.length >= 3;
    const parentId = hasSubRoute ? pathParts[pathParts.length - 2] : auditId;

    if (hasSubRoute && subRoute === 'pages') {
      // GET /:audit_id/pages
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
      const offset = (page - 1) * limit;
      const pageType = url.searchParams.get('page_type');
      const sort = url.searchParams.get('sort') || 'score_desc';

      // Verify ownership
      const { data: audit } = await supabase.from('seo_audits')
        .select('id').eq('id', parentId).eq('user_id', user.id).single();
      if (!audit) throw new ValidationError('Audit non trouvé');

      let query = supabase.from('seo_audit_pages')
        .select('id, url, page_type, http_status, score, issues_summary, title, meta_description, h1', { count: 'exact' })
        .eq('audit_id', parentId!);

      if (pageType) query = query.eq('page_type', pageType);

      const minScore = url.searchParams.get('min_score');
      const maxScore = url.searchParams.get('max_score');
      if (minScore) query = query.gte('score', parseInt(minScore));
      if (maxScore) query = query.lte('score', parseInt(maxScore));

      query = sort === 'score_asc'
        ? query.order('score', { ascending: true })
        : query.order('score', { ascending: false });

      const { data, count } = await query.range(offset, offset + limit - 1);

      return new Response(JSON.stringify({
        items: data || [],
        page,
        limit,
        total: count || 0,
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (hasSubRoute && subRoute === 'export') {
      // GET /:audit_id/export
      const { data: audit } = await supabase.from('seo_audits')
        .select('id').eq('id', parentId).eq('user_id', user.id).single();
      if (!audit) throw new ValidationError('Audit non trouvé');

      const { data: pages } = await supabase.from('seo_audit_pages')
        .select('url, page_type, http_status, score, title_length, meta_description_length, images_missing_alt_count, issues_summary')
        .eq('audit_id', parentId!)
        .order('score', { ascending: false })
        .limit(1000);

      return new Response(JSON.stringify({ items: pages || [], audit_id: parentId }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (auditId && !hasSubRoute && auditId !== 'seo-audit') {
      // GET /:audit_id — single audit detail
      const { data: audit } = await supabase.from('seo_audits')
        .select('*').eq('id', auditId).eq('user_id', user.id).single();
      if (!audit) throw new ValidationError('Audit non trouvé');

      const { count } = await supabase.from('seo_audit_pages')
        .select('id', { count: 'exact', head: true })
        .eq('audit_id', auditId);

      return new Response(JSON.stringify({
        audit_id: audit.id,
        status: audit.status,
        mode: audit.mode,
        base_url: audit.base_url,
        progress: {
          discovered: audit.summary?.discovered || 0,
          processed: count || 0,
          failed: audit.summary?.failed || 0,
        },
        summary: audit.summary || {},
        started_at: audit.started_at,
        finished_at: audit.finished_at,
        created_at: audit.created_at,
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // GET / — list audits
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const { data, count } = await supabase.from('seo_audits')
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
