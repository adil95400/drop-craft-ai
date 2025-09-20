import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TenantConfig {
  name: string
  domain?: string
  branding: {
    logo_url?: string
    primary_color: string
    secondary_color: string
    custom_css?: string
  }
  features: string[]
  settings: Record<string, any>
}

interface WhiteLabelUpdate {
  tenant_id: string
  branding?: Partial<TenantConfig['branding']>
  settings?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role for multi-tenant features
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, plan')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.plan !== 'ultra_pro')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { pathname } = new URL(req.url)
    const method = req.method

    console.log(`MultiTenant API - ${method} ${pathname} - User: ${user.id}`)

    // GET /multi-tenant - Get user's tenants
    if (method === 'GET' && pathname === '/multi-tenant') {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
          *,
          tenant_users(count)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tenants:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch tenants' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ tenants }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /multi-tenant/create - Create new tenant
    if (method === 'POST' && pathname === '/multi-tenant/create') {
      const body: TenantConfig = await req.json()

      const { data: tenant, error } = await supabase
        .from('tenants')
        .insert({
          owner_id: user.id,
          name: body.name,
          domain: body.domain,
          branding: body.branding,
          features: body.features,
          settings: body.settings,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating tenant:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create tenant' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Tenant created:', tenant.id)
      return new Response(
        JSON.stringify({ tenant }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /multi-tenant/branding - Update tenant white-label branding
    if (method === 'PUT' && pathname === '/multi-tenant/branding') {
      const body: WhiteLabelUpdate = await req.json()

      // Verify tenant ownership
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', body.tenant_id)
        .eq('owner_id', user.id)
        .single()

      if (tenantError || !tenant) {
        return new Response(
          JSON.stringify({ error: 'Tenant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updatedBranding = { ...tenant.branding, ...body.branding }
      const updatedSettings = { ...tenant.settings, ...body.settings }

      const { data: updatedTenant, error } = await supabase
        .from('tenants')
        .update({
          branding: updatedBranding,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', body.tenant_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating tenant:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update tenant' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Tenant updated:', updatedTenant.id)
      return new Response(
        JSON.stringify({ tenant: updatedTenant }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /multi-tenant/analytics - Get tenant analytics
    if (method === 'GET' && pathname === '/multi-tenant/analytics') {
      const url = new URL(req.url)
      const tenantId = url.searchParams.get('tenant_id')

      if (!tenantId) {
        return new Response(
          JSON.stringify({ error: 'tenant_id parameter required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify tenant ownership
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', tenantId)
        .eq('owner_id', user.id)
        .single()

      if (!tenant) {
        return new Response(
          JSON.stringify({ error: 'Tenant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get tenant analytics (mocked for now)
      const analytics = {
        tenant_id: tenantId,
        users_count: Math.floor(Math.random() * 50) + 10,
        active_users_today: Math.floor(Math.random() * 20) + 5,
        revenue_this_month: Math.floor(Math.random() * 10000) + 1000,
        api_calls_today: Math.floor(Math.random() * 1000) + 100,
        storage_used_mb: Math.floor(Math.random() * 500) + 50,
        features_usage: {
          sso: Math.random() > 0.5,
          custom_domain: Math.random() > 0.7,
          white_label: true,
          api_access: Math.random() > 0.3
        }
      }

      return new Response(
        JSON.stringify({ analytics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('MultiTenant API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})