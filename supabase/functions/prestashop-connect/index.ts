import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PrestaShopCredentials {
  shop_url: string
  api_key: string
}

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

    const { shop_url, api_key }: PrestaShopCredentials = await req.json()

    console.log('Testing PrestaShop connection:', shop_url)

    // Test PrestaShop API connection
    const cleanUrl = shop_url.replace(/\/$/, '')
    const testUrl = `${cleanUrl}/api/products?output_format=JSON&display=full&limit=1`
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Basic ${btoa(api_key + ':')}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`PrestaShop API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('PrestaShop connection successful')

    // Store credentials in vault
    const { error: vaultError } = await supabase
      .from('supplier_credentials_vault')
      .upsert({
        user_id: user.id,
        supplier_name: 'PrestaShop',
        oauth_data: {
          shop_url: cleanUrl,
          api_key: api_key
        },
        connection_status: 'active',
        last_validated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,supplier_name'
      })

    if (vaultError) {
      console.error('Error storing credentials:', vaultError)
      throw vaultError
    }

    // Create or update supplier record
    const { error: supplierError } = await supabase
      .from('suppliers')
      .upsert({
        user_id: user.id,
        name: 'PrestaShop',
        supplier_type: 'prestashop',
        status: 'active',
        connection_status: 'connected',
        api_url: cleanUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,name'
      })

    if (supplierError) {
      console.error('Error updating supplier:', supplierError)
      throw supplierError
    }

    console.log('PrestaShop credentials stored successfully')

    // Auto-trigger product sync
    try {
      console.log('Triggering automatic product sync...')
      await supabase.functions.invoke('prestashop-sync-products', {
        body: { userId: user.id }
      })
    } catch (syncError) {
      console.error('Auto-sync failed:', syncError)
      // Don't fail the connection if sync fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'PrestaShop connected successfully',
        store_url: cleanUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('PrestaShop connection error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
