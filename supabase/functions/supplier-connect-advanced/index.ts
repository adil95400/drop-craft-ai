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
    let connectionStatus = 'connected'
    let testResult = null
    
    try {
      // Call test-connection endpoint
      const testResponse = await fetch(`${supabaseUrl}/functions/v1/supplier-test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ supplierId, credentials })
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
    
    // Store credentials using actual table structure
    const { data: connection, error: insertError } = await supabase
      .from('supplier_credentials_vault')
      .upsert({
        user_id: user.id,
        supplier_id: supplierId,
        api_key_encrypted: credentials?.apiKey || null,
        api_secret_encrypted: credentials?.apiSecret || null,
        access_token_encrypted: credentials?.accessToken || null,
        oauth_data: settings || {},
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
    
    return new Response(
      JSON.stringify({
        success: true,
        connection,
        testResult
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
