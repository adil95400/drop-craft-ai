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

    const { supplierId, credentials, settings } = await req.json()
    
    console.log('Connecting supplier:', supplierId)
    
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
    
    // Store encrypted credentials
    const { data: connection, error: insertError } = await supabase
      .from('supplier_credentials_vault')
      .upsert({
        user_id: user.id,
        supplier_id: supplierId,
        credentials_encrypted: credentials, // Should be encrypted in production
        connection_status: connectionStatus,
        connection_settings: settings || {},
        last_test_at: new Date().toISOString(),
        test_result: testResult
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
