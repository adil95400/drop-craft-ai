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

    // Insert credentials into supplier_credentials_vault
    const { data: credential, error: credError } = await supabase
      .from('supplier_credentials_vault')
      .insert({
        user_id: user.id,
        supplier_id: 'cjdropshipping',
        connection_status: 'active',
        oauth_data: {
          accessToken: accessToken
        },
        last_validation_at: new Date().toISOString()
      })
      .select()
      .single()

    if (credError) {
      // If already exists, update it
      if (credError.code === '23505') {
        const { data: updated, error: updateError } = await supabase
          .from('supplier_credentials_vault')
          .update({
            connection_status: 'active',
            oauth_data: {
              accessToken: accessToken
            },
            last_validation_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('supplier_id', 'cjdropshipping')
          .select()
          .single()

        if (updateError) throw updateError
        
        console.log('Updated existing CJ credentials')
      } else {
        throw credError
      }
    } else {
      console.log('Created new CJ credentials')
    }

    // Trigger product synchronization
    console.log('Triggering product sync...')
    const { data: syncData, error: syncError } = await supabase.functions.invoke('supplier-sync-products', {
      body: { supplierId: 'cjdropshipping', limit: 1000 }
    })

    if (syncError) {
      console.error('Sync error:', syncError)
    } else {
      console.log('Sync triggered successfully:', syncData)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'CJ Dropshipping credentials added and sync triggered',
        syncData
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
