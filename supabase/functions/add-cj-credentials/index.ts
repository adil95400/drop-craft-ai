import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { accessToken } = await req.json()

    if (!accessToken) {
      throw new Error('Access Token is required')
    }

    console.log('Adding CJ Dropshipping credentials for user:', user.id)

    // 1. Find or create CJ Dropshipping supplier record
    let supplierId: string
    
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', '%cj%dropshipping%')
      .single()
    
    if (existingSupplier) {
      supplierId = existingSupplier.id
      console.log('Found existing CJ supplier:', supplierId)
    } else {
      // Create new supplier entry
      const { data: newSupplier, error: createError } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          name: 'CJ Dropshipping',
          website: 'https://cjdropshipping.com',
          country: 'China',
          status: 'active',
          rating: 4.5,
          contact_email: 'support@cjdropshipping.com',
          product_count: 0,
          api_type: 'rest',
          sync_frequency: 60
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error('Failed to create supplier:', createError)
        throw new Error('Failed to create supplier record')
      }
      
      supplierId = newSupplier.id
      console.log('Created new CJ supplier:', supplierId)
    }

    // 2. Validate the access token with CJ API
    console.log('Validating CJ access token...')
    
    const validationResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
      method: 'POST',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pageNum: 1,
        pageSize: 1
      })
    })
    
    const validationData = await validationResponse.json()
    
    if (validationData.code !== 200) {
      throw new Error(`Invalid CJ Access Token: ${validationData.message || 'Authentication failed'}`)
    }
    
    console.log('CJ token validated successfully')

    // 3. Store credentials in vault
    const { data: existingCred } = await supabase
      .from('supplier_credentials_vault')
      .select('id')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .single()
    
    if (existingCred) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('supplier_credentials_vault')
        .update({
          connection_status: 'active',
          access_token_encrypted: accessToken,
          oauth_data: {
            accessToken: accessToken,
            connectorId: 'cjdropshipping',
            platform: 'CJ Dropshipping',
            validatedAt: new Date().toISOString()
          },
          last_validation_at: new Date().toISOString(),
          last_error: null,
          error_count: 0
        })
        .eq('id', existingCred.id)
      
      if (updateError) throw updateError
      console.log('Updated existing CJ credentials')
    } else {
      // Insert new credentials
      const { error: insertError } = await supabase
        .from('supplier_credentials_vault')
        .insert({
          user_id: user.id,
          supplier_id: supplierId,
          connection_status: 'active',
          connection_type: 'api',
          access_token_encrypted: accessToken,
          oauth_data: {
            accessToken: accessToken,
            connectorId: 'cjdropshipping',
            platform: 'CJ Dropshipping',
            validatedAt: new Date().toISOString()
          },
          last_validation_at: new Date().toISOString()
        })
      
      if (insertError) throw insertError
      console.log('Created new CJ credentials')
    }

    // 4. Trigger immediate product synchronization
    console.log('Triggering product sync...')
    
    const { data: syncData, error: syncError } = await supabase.functions.invoke('supplier-sync-products', {
      body: { supplierId, limit: 100 },
      headers: {
        Authorization: authHeader
      }
    })

    if (syncError) {
      console.error('Sync trigger error:', syncError)
    } else {
      console.log('Sync triggered successfully:', syncData?.syncStats)
      
      // Update supplier product count
      if (syncData?.syncStats?.imported > 0) {
        await supabase
          .from('suppliers')
          .update({ product_count: syncData.syncStats.imported })
          .eq('id', supplierId)
      }
    }

    // 5. Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'supplier_connect',
        entity_type: 'supplier',
        entity_id: supplierId,
        description: 'Connected CJ Dropshipping supplier',
        metadata: {
          supplier: 'CJ Dropshipping',
          productsImported: syncData?.syncStats?.imported || 0
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'CJ Dropshipping connected and synchronized',
        supplierId,
        syncStats: syncData?.syncStats || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
