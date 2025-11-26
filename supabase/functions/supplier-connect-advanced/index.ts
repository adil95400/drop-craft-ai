import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { supplierId, credentials, settings, connectionType = 'api' } = await req.json()
    
    console.log('Connecting supplier:', supplierId, 'type:', connectionType)
    
    if (!supplierId) {
      throw new Error('supplierId is required')
    }
    
    // Test connection based on supplier type
    let connectionStatus = 'active'
    let testResult = null
    
    // Get the connector ID from settings (for marketplace connectors)
    const connectorId = settings?.connectorId || supplierId
    
    try {
      // Call test-connection endpoint with the connector ID
      const testResponse = await fetch(`${supabaseUrl}/functions/v1/supplier-test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ supplierId: connectorId, credentials })
      })
      
      testResult = await testResponse.json()
      if (!testResult.success) {
        connectionStatus = 'error'
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      connectionStatus = 'error'
      testResult = { error: error.message }
    }
    
    // Store credentials with proper mapping
    const oauth_data: any = {
      ...(settings || {}),
      connectorId: connectorId
    }
    
    // Store credentials based on type
    if (credentials?.apiKey) {
      oauth_data.apiKey = credentials.apiKey
    }
    if (credentials?.username) {
      oauth_data.username = credentials.username
    }
    if (credentials?.password) {
      oauth_data.password = credentials.password
    }
    if (credentials?.appKey) {
      oauth_data.appKey = credentials.appKey
    }
    if (credentials?.appSecret) {
      oauth_data.appSecret = credentials.appSecret
    }
    if (credentials?.clientId) {
      oauth_data.clientId = credentials.clientId
    }
    if (credentials?.clientSecret) {
      oauth_data.clientSecret = credentials.clientSecret
    }
    
    // Store credentials using actual table structure
    const { data: connection, error: insertError } = await supabase
      .from('supplier_credentials_vault')
      .upsert({
        user_id: user.id,
        supplier_id: supplierId,
        api_key_encrypted: credentials?.apiKey || null,
        api_secret_encrypted: credentials?.apiSecret || null,
        access_token_encrypted: credentials?.accessToken || null,
        oauth_data: oauth_data,
        connection_type: connectionType,
        connection_status: connectionStatus,
        last_validation_at: new Date().toISOString(),
        last_error: testResult?.success ? null : testResult?.message
      })
      .select()
      .single()
    
    if (insertError) throw insertError
    
    // Log connection event
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'supplier_connected',
        entity_type: 'supplier',
        entity_id: supplierId,
        description: `Connected to supplier ${supplierId}`,
        metadata: { connectionStatus, testResult }
      })
    
    // Trigger product sync if connection successful
    let syncResult = null
    if (connectionStatus === 'active' && testResult?.success) {
      console.log('Triggering product sync for supplier:', connectorId)
      try {
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/supplier-sync-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({ 
            supplierId: connectorId,
            limit: 100 
          })
        })
        
        syncResult = await syncResponse.json()
        console.log('Sync result:', syncResult)
      } catch (syncError) {
        console.error('Sync trigger failed:', syncError)
        // Don't fail the connection if sync fails
        syncResult = { error: syncError.message }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        connection,
        testResult,
        syncResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Supplier connection error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
