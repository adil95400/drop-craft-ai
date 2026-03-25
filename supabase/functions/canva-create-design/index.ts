/**
 * Canva Design Integration — Real Canva Connect API
 * Actions: create_design, list_designs, export_design, create_from_product
 * Uses CANVA_API_KEY for authentication
 */
import { createClient } from 'npm:@supabase/supabase-js@2

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

async function canvaFetch(path: string, accessToken: string, options: RequestInit = {}) {
  const url = `${CANVA_API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Canva API] Error ${response.status}: ${errorText}`);
    throw new Error(`Canva API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { action } = body;

    // Resolve Canva access token: user OAuth token first, then API key fallback
    let accessToken: string | null = null;

    const { data: integration } = await supabase
      .from('canva_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .single();

    if (integration?.access_token) {
      // Check token expiry and refresh if needed
      if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
        // Attempt token refresh
        const clientId = Deno.env.get('CANVA_CLIENT_ID');
        const clientSecret = Deno.env.get('CANVA_CLIENT_SECRET');
        if (clientId && clientSecret && integration.refresh_token) {
          try {
            const refreshRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: integration.refresh_token,
                client_id: clientId,
                client_secret: clientSecret,
              }),
            });
            if (refreshRes.ok) {
              const tokens = await refreshRes.json();
              accessToken = tokens.access_token;
              await supabase.from('canva_integrations').update({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || integration.refresh_token,
                token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
              }).eq('id', integration.id);
            }
          } catch (e) {
            console.error('[Canva] Token refresh failed:', e);
          }
        }
      } else {
        accessToken = integration.access_token;
      }
    }

    if (!accessToken) {
      accessToken = Deno.env.get('CANVA_API_KEY') || null;
    }

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'No Canva credentials configured', code: 'NO_CREDENTIALS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    switch (action) {
      case 'create_design': {
        const { title, designType, width, height } = body;
        const result = await canvaFetch('/designs', accessToken, {
          method: 'POST',
          body: JSON.stringify({
            design_type: designType || 'Whiteboard',
            title: title || 'Ad Creative',
            ...(width && height ? { width, height } : {}),
          }),
        });

        // Save to DB
        await supabase.from('canva_designs').insert({
          user_id: user.id,
          canva_integration_id: integration?.id,
          canva_design_id: result.design?.id,
          title: title || 'Ad Creative',
          design_type: designType || 'custom',
          design_url: result.design?.urls?.edit_url,
          thumbnail_url: result.design?.urls?.view_url,
          status: 'created',
          metadata: { width, height, designType },
        });

        return new Response(JSON.stringify({
          success: true,
          designId: result.design?.id,
          editUrl: result.design?.urls?.edit_url,
          viewUrl: result.design?.urls?.view_url,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'create_from_product': {
        const { productName, productPrice, productImage, adFormat } = body;

        // Determine dimensions based on ad format
        const dimensions: Record<string, { width: number; height: number }> = {
          'story': { width: 1080, height: 1920 },
          'square': { width: 1080, height: 1080 },
          'landscape': { width: 1200, height: 628 },
          'banner': { width: 728, height: 90 },
          'pinterest': { width: 1000, height: 1500 },
        };
        const dim = dimensions[adFormat || 'square'] || dimensions.square;

        const result = await canvaFetch('/designs', accessToken, {
          method: 'POST',
          body: JSON.stringify({
            design_type: 'Whiteboard',
            title: `Ad - ${productName}`,
            width: dim.width,
            height: dim.height,
          }),
        });

        await supabase.from('canva_designs').insert({
          user_id: user.id,
          canva_integration_id: integration?.id,
          canva_design_id: result.design?.id,
          title: `Ad - ${productName}`,
          design_type: adFormat || 'square',
          design_url: result.design?.urls?.edit_url,
          thumbnail_url: result.design?.urls?.view_url,
          status: 'created',
          metadata: { productName, productPrice, productImage, adFormat, ...dim },
        });

        return new Response(JSON.stringify({
          success: true,
          designId: result.design?.id,
          editUrl: result.design?.urls?.edit_url,
          viewUrl: result.design?.urls?.view_url,
          dimensions: dim,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'list_designs': {
        const { data: savedDesigns } = await supabase
          .from('canva_designs')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(50);

        // Also try to list from Canva API
        let canvaDesigns: any[] = [];
        try {
          const result = await canvaFetch('/designs?ownership=owned&sort_by=modified_descending', accessToken);
          canvaDesigns = result.items || [];
        } catch (e) {
          console.warn('[Canva] Failed to list designs from API:', e);
        }

        return new Response(JSON.stringify({
          success: true,
          designs: savedDesigns || [],
          canvaDesigns,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'export_design': {
        const { designId, format = 'png', quality = 'regular' } = body;

        // Start export job
        const exportResult = await canvaFetch(`/designs/${designId}/exports`, accessToken, {
          method: 'POST',
          body: JSON.stringify({
            format: { type: format },
            quality,
          }),
        });

        // Poll for export completion (max 30s)
        let exportData = exportResult;
        const jobId = exportResult.job?.id;
        if (jobId) {
          for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const statusRes = await canvaFetch(`/designs/${designId}/exports/${jobId}`, accessToken);
            if (statusRes.job?.status === 'success') {
              exportData = statusRes;
              break;
            }
            if (statusRes.job?.status === 'failed') {
              throw new Error('Export job failed');
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          urls: exportData.job?.urls || exportData.urls || [],
          format,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('[canva-create-design] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
