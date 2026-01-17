import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Token can come from header (preferred) or JSON body fallback
    const rawHeaderToken = req.headers.get('x-extension-token')

    console.log('[extension-sync-realtime] Incoming request', {
      method: req.method,
      hasToken: Boolean(rawHeaderToken),
      tokenPrefix: rawHeaderToken ? rawHeaderToken.slice(0, 12) : null,
    })

    // Parse body early so we can also read token from body if header missing
    let payload: any = null
    try {
      payload = await req.json()
    } catch {
      payload = null
    }

    const sanitizeToken = (value: unknown): string | null => {
      if (!value || typeof value !== 'string') return null
      const sanitized = value.replace(/[^a-zA-Z0-9-_]/g, '')
      if (sanitized.length < 10 || sanitized.length > 150) return null
      return sanitized
    }

    const token = sanitizeToken(rawHeaderToken || payload?.token)

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Extension token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token
    const { data: authData, error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .select('id, user_id, expires_at, usage_count')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError) {
      console.warn('[extension-sync-realtime] Token lookup error', tokenError)
    }

    if (!authData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiration (if present)
    if (authData.expires_at && new Date(authData.expires_at) < new Date()) {
      await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false })
        .eq('id', authData.id)

      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last-used counters (best-effort)
    await supabase
      .from('extension_auth_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (authData.usage_count || 0) + 1,
      })
      .eq('id', authData.id)

    // If body JSON failed earlier, now we must fail for actions needing a body
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, products } = payload

    console.log('[extension-sync-realtime] Action', { action, userId: authData.user_id })

    if (action === 'import_products') {
      // Process products from extension
      const importResults = []
      const errors = []

      const productList = products || []
      console.log('[extension-sync-realtime] Processing', productList.length, 'products')

      for (const product of productList) {
        try {
          // Create import job
          const { data: importJob, error: jobError } = await supabase
            .from('extension_data')
            .insert({
              user_id: authData.user_id,
              data_type: 'product_scrape',
              data: product,
              source_url: product.url || '',
              status: 'pending'
            })
            .select()
            .single()

          if (jobError) {
            console.error('[extension-sync-realtime] extension_data insert error:', jobError)
            throw jobError
          }

          // Try to create product directly - use correct column names for supplier_products
          const { data: newProduct, error: productError } = await supabase
            .from('supplier_products')
            .insert({
              user_id: authData.user_id,
              title: product.title || product.name || 'Produit importé',
              price: parseFloat(product.price?.toString().replace(/[^\d.]/g, '') || '0'),
              description: product.description || '',
              image_url: product.image || product.imageUrl || '',
              source_url: product.url || '',
              stock_quantity: 100,
              is_active: true
            })
            .select()
            .single()

          if (productError) {
            console.error('[extension-sync-realtime] supplier_products insert error:', productError)
            errors.push({ product: product.title || product.name, error: productError.message })
          } else {
            importResults.push(newProduct)
            console.log('[extension-sync-realtime] Product imported:', newProduct.id)
            
            // Update extension_data status
            await supabase
              .from('extension_data')
              .update({ status: 'imported', imported_product_id: newProduct.id })
              .eq('id', importJob.id)
          }
        } catch (error) {
          console.error('[extension-sync-realtime] Product import error:', error)
          errors.push({ product: product.title || product.name || 'Unknown', error: error.message })
        }
      }

      // Log analytics
      await supabase.from('extension_analytics').insert({
        user_id: authData.user_id,
        event_type: 'bulk_import',
        event_data: {
          total: productList.length,
          successful: importResults.length,
          failed: errors.length
        },
        source_url: productList[0]?.url || ''
      })

      console.log('[extension-sync-realtime] Import complete:', { imported: importResults.length, failed: errors.length })

      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: importResults.length,
          failed: errors.length,
          results: importResults,
          errors: errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'bulk_import') {
      // Handle bulk import from pending items
      const { items } = payload
      const importResults = []
      const errors = []

      const itemList = items || []
      console.log('[extension-sync-realtime] Bulk import:', itemList.length, 'items')

      for (const item of itemList) {
        try {
          const { data: importJob, error: jobError } = await supabase
            .from('extension_data')
            .insert({
              user_id: authData.user_id,
              data_type: item.type || 'product_scrape',
              data: item,
              source_url: item.url || '',
              status: 'pending'
            })
            .select()
            .single()

          if (jobError) throw jobError

          if (item.type === 'product' || !item.type) {
            const { data: newProduct, error: productError } = await supabase
              .from('supplier_products')
              .insert({
                user_id: authData.user_id,
                title: item.title || item.name || 'Produit importé',
                price: parseFloat(item.price?.toString().replace(/[^\d.]/g, '') || '0'),
                description: item.description || '',
                image_url: item.image || item.imageUrl || '',
                source_url: item.url || '',
                stock_quantity: 100,
                is_active: true
              })
              .select()
              .single()

            if (productError) {
              errors.push({ item: item.title || item.name, error: productError.message })
            } else {
              importResults.push(newProduct)
              await supabase
                .from('extension_data')
                .update({ status: 'imported', imported_product_id: newProduct.id })
                .eq('id', importJob.id)
            }
          }
        } catch (error) {
          errors.push({ item: item.title || item.name || 'Unknown', error: error.message })
        }
      }

      await supabase.from('extension_analytics').insert({
        user_id: authData.user_id,
        event_type: 'bulk_import',
        event_data: {
          total: itemList.length,
          successful: importResults.length,
          failed: errors.length
        }
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: importResults.length,
          failed: errors.length,
          results: importResults,
          errors: errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync_status') {
      // Get user's import status
      const { data: recentImports } = await supabase
        .from('extension_data')
        .select('*')
        .eq('user_id', authData.user_id)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: analytics } = await supabase
        .from('extension_analytics')
        .select('*')
        .eq('user_id', authData.user_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Get user plan - use correct column name
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', authData.user_id)
        .single()

      return new Response(
        JSON.stringify({ 
          success: true,
          recentImports,
          userPlan: profile?.subscription_plan || 'standard',
          todayStats: {
            imports: analytics?.length || 0,
            successful: analytics?.filter(a => a.event_type === 'bulk_import').reduce((sum, a) => sum + (a.event_data?.successful || 0), 0) || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Extension sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
