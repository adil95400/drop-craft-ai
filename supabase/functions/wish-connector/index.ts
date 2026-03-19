/**
 * Wish Marketplace Connector
 * 
 * Supports: products, orders, shipping, inventory
 * Auth: OAuth2 access token
 * Docs: https://merchant.wish.com/documentation/api/v3
 */
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

const WISH_API_V3 = 'https://merchant.wish.com/api/v3'

class WishApiClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request(path: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${WISH_API_V3}${path}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const options: RequestInit = { method, headers }
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Wish API ${response.status}: ${err}`)
    }
    return response.json()
  }

  // ---- Products ----
  async listProducts(params?: { limit?: number; offset?: number; since?: string }): Promise<any> {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    if (params?.since) qs.set('since', params.since)
    return this.request(`/products?${qs}`)
  }

  async getProduct(productId: string): Promise<any> {
    return this.request(`/products/${productId}`)
  }

  async createProduct(productData: {
    name: string
    description: string
    tags: string[]
    sku: string
    inventory: number
    price: number
    shipping: number
    main_image: string
    extra_images?: string[]
    parent_sku?: string
    brand?: string
    landing_page_url?: string
    upc?: string
    color?: string
    size?: string
  }): Promise<any> {
    return this.request('/products', 'POST', productData)
  }

  async updateProduct(productId: string, updates: Record<string, any>): Promise<any> {
    return this.request(`/products/${productId}`, 'PATCH', updates)
  }

  async enableProduct(productId: string): Promise<any> {
    return this.request(`/products/${productId}/enable`, 'POST')
  }

  async disableProduct(productId: string): Promise<any> {
    return this.request(`/products/${productId}/disable`, 'POST')
  }

  // ---- Variants ----
  async getVariants(productId: string): Promise<any> {
    return this.request(`/products/${productId}/variations`)
  }

  async updateVariant(productId: string, variantSku: string, updates: Record<string, any>): Promise<any> {
    return this.request(`/products/${productId}/variations/${variantSku}`, 'PATCH', updates)
  }

  async updateInventory(productId: string, variantSku: string, inventory: number): Promise<any> {
    return this.updateVariant(productId, variantSku, { inventory })
  }

  // ---- Orders ----
  async listOrders(params?: { limit?: number; offset?: number; since?: string; status?: string }): Promise<any> {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    if (params?.since) qs.set('since', params.since)
    if (params?.status) qs.set('status', params.status)
    return this.request(`/orders?${qs}`)
  }

  async getOrder(orderId: string): Promise<any> {
    return this.request(`/orders/${orderId}`)
  }

  async fulfillOrder(orderId: string, fulfillmentData: {
    tracking_provider: string
    tracking_number: string
    ship_note?: string
    origin_country?: string
  }): Promise<any> {
    return this.request(`/orders/${orderId}/fulfill`, 'POST', fulfillmentData)
  }

  async cancelOrder(orderId: string, reason: string): Promise<any> {
    return this.request(`/orders/${orderId}/cancel`, 'POST', { reason })
  }

  async refundOrder(orderId: string, params: { reason: string; amount?: number }): Promise<any> {
    return this.request(`/orders/${orderId}/refund`, 'POST', params)
  }

  // ---- Shipping ----
  async getShippingProviders(): Promise<any> {
    return this.request('/shipping/providers')
  }

  // ---- Notifications ----
  async getNotifications(limit: number = 50): Promise<any> {
    return this.request(`/notifications?limit=${limit}`)
  }

  // ---- Store Stats ----
  async getPerformanceMetrics(): Promise<any> {
    return this.request('/merchant/metrics')
  }
}

// ==========================================
// MAIN HANDLER
// ==========================================
Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    const { action, ...params } = await req.json()

    console.log(`[wish-connector] Action: ${action}, User: ${userId}`)

    // Fetch Wish credentials
    const { data: creds } = await supabase
      .from('supplier_credentials_vault')
      .select('oauth_data')
      .eq('user_id', userId)
      .eq('connection_status', 'active')
      .ilike('supplier_id', '%wish%')
      .maybeSingle()

    // Also check integrations table
    let accessToken = (creds?.oauth_data as any)?.accessToken || ''

    if (!accessToken) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('credentials_encrypted')
        .eq('user_id', userId)
        .eq('platform', 'wish')
        .eq('is_active', true)
        .maybeSingle()

      accessToken = (integration?.credentials_encrypted as any)?.accessToken || Deno.env.get('WISH_ACCESS_TOKEN') || ''
    }

    if (!accessToken) {
      return errorResponse('Token Wish non configuré. Obtenez-le sur merchant.wish.com/documentation/api.', corsHeaders, 400)
    }

    const client = new WishApiClient(accessToken)
    let result: any

    switch (action) {
      // Products
      case 'list_products': result = await client.listProducts(params); break
      case 'get_product': result = await client.getProduct(params.productId); break
      case 'create_product': result = await client.createProduct(params.productData); break
      case 'update_product': result = await client.updateProduct(params.productId, params.updates); break
      case 'enable_product': result = await client.enableProduct(params.productId); break
      case 'disable_product': result = await client.disableProduct(params.productId); break

      // Variants & Inventory
      case 'get_variants': result = await client.getVariants(params.productId); break
      case 'update_variant': result = await client.updateVariant(params.productId, params.variantSku, params.updates); break
      case 'update_inventory': result = await client.updateInventory(params.productId, params.variantSku, params.inventory); break

      // Orders
      case 'list_orders': result = await client.listOrders(params); break
      case 'get_order': result = await client.getOrder(params.orderId); break
      case 'fulfill_order': result = await client.fulfillOrder(params.orderId, params.fulfillmentData); break
      case 'cancel_order': result = await client.cancelOrder(params.orderId, params.reason); break
      case 'refund_order': result = await client.refundOrder(params.orderId, params); break

      // Shipping & Stats
      case 'shipping_providers': result = await client.getShippingProviders(); break
      case 'notifications': result = await client.getNotifications(params.limit); break
      case 'performance': result = await client.getPerformanceMetrics(); break

      default:
        return errorResponse(`Action non supportée: ${action}`, corsHeaders, 400)
    }

    return successResponse({ data: result, action }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('[wish-connector] Error:', error)
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(req.headers.get('origin')), 500)
  }
})
