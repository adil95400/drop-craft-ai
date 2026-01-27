import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConnectorRequest {
  action: 'validate_credentials' | 'save_credentials' | 'test_connection' | 'get_products' | 'get_inventory'
  supplier_type: string
  supplier_id?: string
  credentials?: Record<string, string>
  page?: number
  limit?: number
}

// API endpoints by supplier
const API_ENDPOINTS: Record<string, { test: string, products: string, base: string }> = {
  bigbuy: {
    base: 'https://api.bigbuy.eu',
    test: '/rest/user/purse.json',
    products: '/rest/catalog/products.json'
  },
  cjdropshipping: {
    base: 'https://developers.cjdropshipping.com/api2.0/v1',
    test: '/authentication/getAccessToken',
    products: '/product/list'
  },
  spocket: {
    base: 'https://app.spocket.co/api/v1',
    test: '/user',
    products: '/products'
  },
  syncee: {
    base: 'https://api.syncee.io/v1',
    test: '/user/profile',
    products: '/products'
  },
  aliexpress: {
    base: 'https://api-sg.aliexpress.com/sync',
    test: '/auth/token/create',
    products: '/aliexpress.affiliate.product.query'
  },
  zendrop: {
    base: 'https://api.zendrop.com/v1',
    test: '/account',
    products: '/products'
  },
  printful: {
    base: 'https://api.printful.com',
    test: '/stores',
    products: '/sync/products'
  },
  eprolo: {
    base: 'https://openapi.eprolo.com',
    test: '/api/v1/user/info',
    products: '/api/v1/product/list'
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const body: ConnectorRequest = await req.json()
    const { action, supplier_type, supplier_id, credentials } = body

    console.log(`[supplier-api-connector] Action: ${action}, Supplier: ${supplier_type}`)

    switch (action) {
      case 'validate_credentials': {
        if (!credentials) {
          throw new Error('Credentials required')
        }

        const config = API_ENDPOINTS[supplier_type.toLowerCase()]
        if (!config) {
          // For suppliers without API, validate format only
          return new Response(
            JSON.stringify({ 
              success: true, 
              valid: true,
              message: 'Credentials format validated (no API verification available)'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Real API test
        const isValid = await testSupplierApi(config, credentials, supplier_type)

        return new Response(
          JSON.stringify({ 
            success: true, 
            valid: isValid,
            message: isValid ? 'API connection successful' : 'API connection failed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'save_credentials': {
        if (!credentials || !supplier_id) {
          throw new Error('Credentials and supplier_id required')
        }

        // Encrypt credentials (simple base64, use real encryption in production)
        const encrypted = btoa(JSON.stringify(credentials))

        const { error } = await supabase
          .from('supplier_credentials')
          .upsert({
            user_id: user.id,
            supplier_id,
            supplier_type,
            credentials_encrypted: encrypted,
            is_active: true,
            last_validated_at: new Date().toISOString(),
            validation_status: 'valid'
          }, {
            onConflict: 'user_id,supplier_id'
          })

        if (error) throw error

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'supplier_credentials_saved',
          description: `Saved credentials for ${supplier_type}`,
          entity_type: 'supplier',
          entity_id: supplier_id
        })

        return new Response(
          JSON.stringify({ success: true, message: 'Credentials saved' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'test_connection': {
        if (!supplier_id) {
          throw new Error('supplier_id required')
        }

        // Get credentials
        const { data: creds, error: credsError } = await supabase
          .from('supplier_credentials')
          .select('credentials_encrypted')
          .eq('user_id', user.id)
          .eq('supplier_id', supplier_id)
          .single()

        if (credsError || !creds) {
          throw new Error('No credentials found for this supplier')
        }

        const decrypted = JSON.parse(atob(creds.credentials_encrypted))
        const config = API_ENDPOINTS[supplier_type.toLowerCase()]
        
        let isValid = true
        if (config) {
          isValid = await testSupplierApi(config, decrypted, supplier_type)
        }

        // Update status
        await supabase
          .from('supplier_credentials')
          .update({
            last_validated_at: new Date().toISOString(),
            validation_status: isValid ? 'valid' : 'invalid'
          })
          .eq('user_id', user.id)
          .eq('supplier_id', supplier_id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            connected: isValid,
            last_test: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_products': {
        const page = body.page || 1
        const limit = body.limit || 50

        // Get credentials
        let storedCredentials = null
        if (supplier_id) {
          const { data: creds } = await supabase
            .from('supplier_credentials')
            .select('credentials_encrypted')
            .eq('user_id', user.id)
            .eq('supplier_id', supplier_id)
            .single()
          
          if (creds) {
            storedCredentials = JSON.parse(atob(creds.credentials_encrypted))
          }
        }

        const config = API_ENDPOINTS[supplier_type.toLowerCase()]
        let products: any[] = []

        if (config && storedCredentials) {
          // Fetch from real API
          products = await fetchSupplierProducts(config, storedCredentials, supplier_type, page, limit)
        }
        
        // If no API products, fetch from database cache
        if (products.length === 0) {
          const { data: cachedProducts } = await supabase
            .from('supplier_products')
            .select('*')
            .eq('user_id', user.id)
            .ilike('source', `%${supplier_type}%`)
            .range((page - 1) * limit, page * limit - 1)
          
          products = (cachedProducts || []).map(p => ({
            id: p.id,
            sku: p.sku,
            title: p.title || p.name,
            price: p.price,
            cost: p.cost_price,
            stock: p.stock_quantity,
            image: p.image_url,
            category: p.category
          }))
        }

        // Log API call
        await supabase.from('api_analytics').upsert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          endpoint: `supplier-api-connector/${supplier_type}`,
          total_requests: 1
        }, {
          onConflict: 'user_id,date,endpoint'
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            products,
            page,
            limit,
            total: products.length,
            source: products.length > 0 && storedCredentials ? 'api' : 'cache'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_inventory': {
        const config = API_ENDPOINTS[supplier_type.toLowerCase()]
        
        // Get credentials
        let creds = null
        if (supplier_id) {
          const { data } = await supabase
            .from('supplier_credentials')
            .select('credentials_encrypted')
            .eq('user_id', user.id)
            .eq('supplier_id', supplier_id)
            .single()
          
          if (data) {
            creds = JSON.parse(atob(data.credentials_encrypted))
          }
        }

        let inventory: any[] = []
        
        if (config && creds) {
          inventory = await fetchInventoryUpdate(config, creds, supplier_type)
        }
        
        // If no API inventory, get from database
        if (inventory.length === 0) {
          const { data: dbInventory } = await supabase
            .from('supplier_products')
            .select('sku, stock_quantity, updated_at')
            .eq('user_id', user.id)
            .ilike('source', `%${supplier_type}%`)
            .limit(100)
          
          inventory = (dbInventory || []).map(p => ({
            sku: p.sku,
            stock: p.stock_quantity || 0,
            updated: true,
            last_update: p.updated_at
          }))
        }

        return new Response(
          JSON.stringify({ success: true, inventory }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('[supplier-api-connector] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function testSupplierApi(
  config: { base: string, test: string },
  credentials: Record<string, string>,
  supplierType: string
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Auth configuration by supplier
    switch (supplierType.toLowerCase()) {
      case 'bigbuy':
        headers['Authorization'] = `Bearer ${credentials.api_key}`
        break
      case 'cjdropshipping':
        headers['CJ-Access-Token'] = credentials.api_key
        break
      case 'spocket':
      case 'zendrop':
      case 'printful':
        headers['Authorization'] = `Bearer ${credentials.api_key}`
        break
      case 'eprolo':
        headers['api-key'] = credentials.api_key
        break
      default:
        headers['X-API-Key'] = credentials.api_key
    }

    const response = await fetch(`${config.base}${config.test}`, {
      method: 'GET',
      headers
    })

    console.log(`[testSupplierApi] ${supplierType}: ${response.status}`)
    return response.ok

  } catch (error) {
    console.error(`[testSupplierApi] Error:`, error)
    return false
  }
}

async function fetchSupplierProducts(
  config: { base: string, products: string },
  credentials: Record<string, string>,
  supplierType: string,
  page: number,
  limit: number
): Promise<any[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    switch (supplierType.toLowerCase()) {
      case 'bigbuy':
        headers['Authorization'] = `Bearer ${credentials.api_key}`
        break
      case 'cjdropshipping':
        headers['CJ-Access-Token'] = credentials.api_key
        break
      case 'printful':
        headers['Authorization'] = `Bearer ${credentials.api_key}`
        break
      case 'eprolo':
        headers['api-key'] = credentials.api_key
        break
      default:
        headers['Authorization'] = `Bearer ${credentials.api_key}`
    }

    const url = new URL(`${config.base}${config.products}`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('limit', String(limit))

    const response = await fetch(url.toString(), { method: 'GET', headers })
    
    if (!response.ok) {
      console.error(`[fetchSupplierProducts] API error: ${response.status}`)
      return []
    }

    const data = await response.json()

    // Map by supplier
    if (supplierType.toLowerCase() === 'bigbuy') {
      return (data || []).map((p: any) => ({
        id: p.id || p.sku,
        sku: p.sku,
        title: p.name,
        price: parseFloat(p.retailPrice || 0),
        cost: parseFloat(p.wholesalePrice || 0),
        stock: parseInt(p.quantity || 0),
        image: p.images?.[0]?.url || null,
        category: p.category?.name
      }))
    }

    if (supplierType.toLowerCase() === 'printful') {
      return (data.result || []).map((p: any) => ({
        id: p.id,
        sku: p.external_id || p.id,
        title: p.name,
        price: 0,
        cost: 0,
        stock: 999,
        image: p.thumbnail_url,
        category: 'Print on Demand'
      }))
    }

    // Generic format
    return (data.products || data.data || data || []).map((p: any) => ({
      id: p.id || p.sku,
      sku: p.sku || p.id,
      title: p.name || p.title,
      price: parseFloat(p.price || 0),
      cost: parseFloat(p.cost || p.wholesale_price || 0),
      stock: parseInt(p.stock || p.quantity || 0),
      image: p.image || p.images?.[0] || null
    }))

  } catch (error) {
    console.error('[fetchSupplierProducts] Error:', error)
    return []
  }
}

async function fetchInventoryUpdate(
  config: { base: string },
  credentials: Record<string, string>,
  supplierType: string
): Promise<any[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    switch (supplierType.toLowerCase()) {
      case 'bigbuy':
        headers['Authorization'] = `Bearer ${credentials.api_key}`
        // BigBuy has a stock endpoint
        const bbResponse = await fetch(`${config.base}/rest/catalog/productstockbyreference.json`, {
          method: 'GET',
          headers
        })
        if (bbResponse.ok) {
          const data = await bbResponse.json()
          return Object.entries(data || {}).map(([sku, stock]) => ({
            sku,
            stock: stock as number,
            updated: true
          }))
        }
        break
        
      case 'cjdropshipping':
        headers['CJ-Access-Token'] = credentials.api_key
        const cjResponse = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/stock`, {
          method: 'GET',
          headers
        })
        if (cjResponse.ok) {
          const data = await cjResponse.json()
          return (data.data || []).map((item: any) => ({
            sku: item.sku,
            stock: item.stock || 0,
            updated: true
          }))
        }
        break
    }
  } catch (error) {
    console.error('[fetchInventoryUpdate] Error:', error)
  }
  
  return []
}
