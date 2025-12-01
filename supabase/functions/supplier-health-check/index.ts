import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface HealthCheckResult {
  supplierId: string
  supplierName: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  lastSync: string | null
  productCount: number
  errors: string[]
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

    const { supplierId } = await req.json()

    console.log(`Running health check for supplier: ${supplierId}`)

    // Get supplier credentials
    const { data: credentials, error: credError } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .single()

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({
          success: false,
          result: {
            supplierId,
            supplierName: supplierId,
            status: 'down',
            responseTime: 0,
            lastSync: null,
            productCount: 0,
            errors: ['No credentials found']
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const startTime = Date.now()
    const errors: string[] = []
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'

    // Test API connection based on supplier type
    try {
      const oauthData = credentials.oauth_data as any

      switch (supplierId) {
        case 'bigbuy': {
          const response = await fetch('https://api.bigbuy.eu/rest/catalog/products.json?pageSize=1', {
            headers: { 'Authorization': `Bearer ${oauthData.apiKey}` }
          })
          if (!response.ok) {
            errors.push(`API error: ${response.status}`)
            status = 'degraded'
          }
          break
        }

        case 'cj-dropshipping': {
          const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'CJ-Access-Token': oauthData.accessToken
            },
            body: JSON.stringify({ pageNum: 1, pageSize: 1 })
          })
          if (!response.ok) {
            errors.push(`API error: ${response.status}`)
            status = 'degraded'
          }
          break
        }

        case 'bts-wholesaler': {
          const response = await fetch('https://api.btswholesaler.nl/v2.0/product/page/1?pageSize=1', {
            headers: { 'Authorization': `Bearer ${oauthData.token}` }
          })
          if (!response.ok) {
            errors.push(`API error: ${response.status}`)
            status = 'degraded'
          }
          break
        }

        default:
          errors.push('Health check not implemented for this supplier')
          status = 'degraded'
      }
    } catch (error) {
      console.error('Health check error:', error)
      errors.push(error.message)
      status = 'down'
    }

    const responseTime = Date.now() - startTime

    // Get product count
    const { count } = await supabase
      .from('supplier_products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)

    const result: HealthCheckResult = {
      supplierId,
      supplierName: credentials.supplier_name || supplierId,
      status,
      responseTime,
      lastSync: credentials.last_sync_at,
      productCount: count || 0,
      errors
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Health check error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
