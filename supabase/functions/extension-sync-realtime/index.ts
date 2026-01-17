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
    const token = req.headers.get('x-extension-token')

    console.log('[extension-sync-realtime] Incoming request', {
      method: req.method,
      hasToken: Boolean(token),
      tokenPrefix: token ? token.slice(0, 12) : null,
    })

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Extension token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token
    const { data: authData, error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .select('user_id')
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

    let payload: any
    try {
      payload = await req.json()
    } catch (e) {
      console.warn('[extension-sync-realtime] Invalid JSON body')
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

      for (const product of products) {
        try {
          // Create import job
          const { data: importJob, error: jobError } = await supabase
            .from('extension_data')
            .insert({
              user_id: authData.user_id,
              data_type: 'product_scrape',
              data: product,
              source_url: product.url,
              status: 'pending'
            })
            .select()
            .single()

          if (jobError) throw jobError

          // Try to create product directly
          const { data: newProduct, error: productError } = await supabase
            .from('supplier_products')
            .insert({
              user_id: authData.user_id,
              name: product.title || product.name,
              price: parseFloat(product.price?.toString().replace(/[^\d.]/g, '') || '0'),
              description: product.description || '',
              image_url: product.image,
              source_url: product.url,
              supplier_name: 'Extension Import',
              status: 'active',
              stock_quantity: 100
            })
            .select()
            .single()

          if (productError) {
            errors.push({ product: product.title, error: productError.message })
          } else {
            importResults.push(newProduct)
            
            // Update extension_data status
            await supabase
              .from('extension_data')
              .update({ status: 'imported', imported_product_id: newProduct.id })
              .eq('id', importJob.id)
          }
        } catch (error) {
          errors.push({ product: product.title || 'Unknown', error: error.message })
        }
      }

      // Log analytics
      await supabase.from('extension_analytics').insert({
        user_id: authData.user_id,
        event_type: 'bulk_import',
        event_data: {
          total: products.length,
          successful: importResults.length,
          failed: errors.length
        },
        source_url: products[0]?.url
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

    if (action === 'bulk_import') {
      // Handle bulk import from pending items
      const { items } = payload
      const importResults = []
      const errors = []

      for (const item of (items || [])) {
        try {
          const { data: importJob, error: jobError } = await supabase
            .from('extension_data')
            .insert({
              user_id: authData.user_id,
              data_type: item.type || 'product_scrape',
              data: item,
              source_url: item.url,
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
                name: item.title || item.name,
                price: parseFloat(item.price?.toString().replace(/[^\d.]/g, '') || '0'),
                description: item.description || '',
                image_url: item.image,
                source_url: item.url,
                supplier_name: item.platform || 'Extension Import',
                status: 'active',
                stock_quantity: 100
              })
              .select()
              .single()

            if (productError) {
              errors.push({ item: item.title, error: productError.message })
            } else {
              importResults.push(newProduct)
              await supabase
                .from('extension_data')
                .update({ status: 'imported', imported_product_id: newProduct.id })
                .eq('id', importJob.id)
            }
          }
        } catch (error) {
          errors.push({ item: item.title || 'Unknown', error: error.message })
        }
      }

      await supabase.from('extension_analytics').insert({
        user_id: authData.user_id,
        event_type: 'bulk_import',
        event_data: {
          total: items?.length || 0,
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

      // Get user plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', authData.user_id)
        .single()

      return new Response(
        JSON.stringify({ 
          success: true,
          recentImports,
          userPlan: profile?.plan || 'standard',
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
