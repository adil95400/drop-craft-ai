import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { action, data } = await req.json()
    const authHeader = req.headers.get('Authorization')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Publish extension to marketplace
    if (action === 'publish') {
      const { name, description, version, category, source_url, icon_url, screenshots } = data

      // Validate extension package
      const validation = await validateExtensionPackage(data)
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: validation.errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create marketplace listing
      const { data: listing, error: listingError } = await supabase
        .from('marketplace_extensions')
        .insert({
          developer_id: user.id,
          name,
          description,
          version,
          category,
          source_url,
          icon_url,
          screenshots,
          status: 'pending_review',
          published_at: null
        })
        .select()
        .single()

      if (listingError) throw listingError

      // Create review request
      await supabase.from('extension_reviews').insert({
        extension_id: listing.id,
        status: 'pending',
        requested_by: user.id
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          listing,
          message: 'Extension soumise pour review. Elle sera publiée après validation.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get marketplace listings
    if (action === 'list') {
      const { category, search, status = 'approved' } = data

      let query = supabase
        .from('marketplace_extensions')
        .select(`
          *,
          profiles:developer_id(full_name, company),
          extension_installs:marketplace_extension_installs(count)
        `)
        .eq('status', status)

      if (category) {
        query = query.eq('category', category)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data: extensions, error } = await query
        .order('install_count', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, extensions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Install extension
    if (action === 'install') {
      const { extensionId } = data

      // Check if already installed
      const { data: existing } = await supabase
        .from('marketplace_extension_installs')
        .select('id')
        .eq('user_id', user.id)
        .eq('extension_id', extensionId)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({ success: false, error: 'Already installed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Install extension
      const { data: install, error: installError } = await supabase
        .from('marketplace_extension_installs')
        .insert({
          user_id: user.id,
          extension_id: extensionId,
          installed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (installError) throw installError

      // Increment install count
      await supabase.rpc('increment_extension_installs', { 
        extension_id: extensionId 
      })

      // Log analytics
      await supabase.from('extension_analytics').insert({
        user_id: user.id,
        event_type: 'marketplace_install',
        event_data: { extension_id: extensionId }
      })

      return new Response(
        JSON.stringify({ success: true, install }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Review extension (admin only)
    if (action === 'review') {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { extensionId, approved, feedback } = data

      // Update extension status
      await supabase
        .from('marketplace_extensions')
        .update({
          status: approved ? 'approved' : 'rejected',
          published_at: approved ? new Date().toISOString() : null,
          review_feedback: feedback
        })
        .eq('id', extensionId)

      // Update review record
      await supabase
        .from('extension_reviews')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          feedback
        })
        .eq('extension_id', extensionId)

      return new Response(
        JSON.stringify({ success: true, message: `Extension ${approved ? 'approved' : 'rejected'}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Marketplace error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function validateExtensionPackage(data: any) {
  const errors = []

  if (!data.name || data.name.length < 3) {
    errors.push('Name must be at least 3 characters')
  }

  if (!data.description || data.description.length < 20) {
    errors.push('Description must be at least 20 characters')
  }

  if (!data.version || !/^\d+\.\d+\.\d+$/.test(data.version)) {
    errors.push('Invalid version format (expected: X.Y.Z)')
  }

  if (!data.category) {
    errors.push('Category is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
