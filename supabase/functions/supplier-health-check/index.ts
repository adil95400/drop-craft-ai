import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

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
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { supplierId } = await req.json()

    if (!supplierId) {
      return errorResponse('supplierId is required', corsHeaders)
    }

    console.log(`Running health check for supplier: ${supplierId}`)

    // Get supplier credentials (RLS-scoped)
    const { data: credentials, error: credError } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('supplier_id', supplierId)
      .single()

    if (credError || !credentials) {
      return successResponse({
        result: {
          supplierId,
          supplierName: supplierId,
          status: 'down',
          responseTime: 0,
          lastSync: null,
          productCount: 0,
          errors: ['No credentials found']
        } as HealthCheckResult
      }, corsHeaders)
    }

    const startTime = Date.now()
    const errors: string[] = []
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'

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
            headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': oauthData.accessToken },
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

    // Get product count (RLS-scoped)
    const { count } = await supabase
      .from('supplier_products')
      .select('*', { count: 'exact', head: true })
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

    return successResponse({ result }, corsHeaders)

  } catch (error) {
    if (error instanceof Response) return error
    console.error('Health check error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
