/**
 * Shopee Open Platform Connector
 * 
 * Supports: products, orders, logistics, shop info
 * Auth: Partner ID + Partner Key + Shop ID (HMAC-SHA256 signed)
 * Docs: https://open.shopee.com/documents
 */
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

const SHOPEE_API_HOSTS: Record<string, string> = {
  sg: 'https://partner.shopeemobile.com',
  my: 'https://partner.shopeemobile.com',
  th: 'https://partner.shopeemobile.com',
  id: 'https://partner.shopeemobile.com',
  vn: 'https://partner.shopeemobile.com',
  ph: 'https://partner.shopeemobile.com',
  tw: 'https://partner.shopeemobile.com',
  br: 'https://openplatform.shopee.com.br',
  mx: 'https://openplatform.shopee.com.mx',
  co: 'https://openplatform.shopee.com.co',
  cl: 'https://openplatform.shopee.cl',
  pl: 'https://openplatform.shopee.pl',
}

// ==========================================
// SHOPEE SIGNATURE
// ==========================================
async function signRequest(
  partnerId: number, partnerKey: string, path: string,
  timestamp: number, accessToken?: string, shopId?: number
): Promise<string> {
  let baseStr = `${partnerId}${path}${timestamp}`
  if (accessToken) baseStr += accessToken
  if (shopId) baseStr += shopId

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(partnerKey),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(baseStr))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ==========================================
// SHOPEE API CLIENT
// ==========================================
class ShopeeClient {
  private partnerId: number
  private partnerKey: string
  private shopId: number
  private accessToken: string
  private host: string

  constructor(partnerId: number, partnerKey: string, shopId: number, accessToken: string, region: string = 'sg') {
    this.partnerId = partnerId
    this.partnerKey = partnerKey
    this.shopId = shopId
    this.accessToken = accessToken
    this.host = SHOPEE_API_HOSTS[region] || SHOPEE_API_HOSTS.sg
  }

  private async request(path: string, method: string = 'GET', body?: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000)
    const sign = await signRequest(this.partnerId, this.partnerKey, path, timestamp, this.accessToken, this.shopId)

    const qs = new URLSearchParams({
      partner_id: String(this.partnerId),
      timestamp: String(timestamp),
      sign,
      access_token: this.accessToken,
      shop_id: String(this.shopId),
    })

    const url = `${this.host}${path}?${qs}`
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (body) options.body = JSON.stringify(body)

    const response = await fetch(url, options)
    const data = await response.json()
    if (data.error) throw new Error(`Shopee: ${data.error} - ${data.message || ''}`)
    return data
  }

  // ---- Shop ----
  async getShopInfo(): Promise<any> { return this.request('/api/v2/shop/get_shop_info') }
  async getShopProfile(): Promise<any> { return this.request('/api/v2/shop/get_profile') }

  // ---- Products ----
  async getItemList(params: { offset?: number; page_size?: number; item_status?: string }): Promise<any> {
    const path = '/api/v2/product/get_item_list'
    return this.request(path, 'GET')
  }

  async getItemDetail(itemIds: number[]): Promise<any> {
    return this.request('/api/v2/product/get_item_base_info', 'GET')
  }

  async addItem(itemData: {
    original_price: number
    description: string
    item_name: string
    normal_stock: number
    logistic_info: Array<{ logistic_id: number; enabled: boolean }>
    category_id: number
    image: { image_id_list: string[] }
    weight: number
  }): Promise<any> {
    return this.request('/api/v2/product/add_item', 'POST', itemData)
  }

  async updateItem(itemId: number, updates: Record<string, any>): Promise<any> {
    return this.request('/api/v2/product/update_item', 'POST', { item_id: itemId, ...updates })
  }

  async updateStock(itemId: number, stock: number, modelId?: number): Promise<any> {
    const body: any = { item_id: itemId, stock_list: [{ stock: stock }] }
    if (modelId) body.stock_list[0].model_id = modelId
    return this.request('/api/v2/product/update_stock', 'POST', body)
  }

  async updatePrice(itemId: number, price: number, modelId?: number): Promise<any> {
    const body: any = { item_id: itemId, price_list: [{ original_price: price }] }
    if (modelId) body.price_list[0].model_id = modelId
    return this.request('/api/v2/product/update_price', 'POST', body)
  }

  async deleteItem(itemId: number): Promise<any> {
    return this.request('/api/v2/product/delete_item', 'POST', { item_id: itemId })
  }

  // ---- Categories ----
  async getCategories(language?: string): Promise<any> {
    return this.request('/api/v2/product/get_category')
  }

  // ---- Orders ----
  async getOrderList(params: { time_range_field: string; time_from: number; time_to: number; page_size?: number; cursor?: string; order_status?: string }): Promise<any> {
    return this.request('/api/v2/order/get_order_list', 'GET')
  }

  async getOrderDetail(orderIds: string[]): Promise<any> {
    return this.request('/api/v2/order/get_order_detail', 'GET')
  }

  async shipOrder(orderSn: string, params: { pickup?: any; dropoff?: any; tracking_number?: string }): Promise<any> {
    return this.request('/api/v2/logistics/ship_order', 'POST', { order_sn: orderSn, ...params })
  }

  // ---- Logistics ----
  async getLogisticChannels(): Promise<any> { return this.request('/api/v2/logistics/get_channel_list') }
  async getTrackingNumber(orderSn: string): Promise<any> { return this.request('/api/v2/logistics/get_tracking_number') }
  async getTrackingInfo(orderSn: string): Promise<any> { return this.request('/api/v2/logistics/get_tracking_info') }

  // ---- Media ----
  async uploadImage(imageUrl: string): Promise<any> {
    return this.request('/api/v2/media_space/upload_image', 'POST', { image_url: imageUrl })
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
    const { action, region = 'sg', ...params } = await req.json()

    console.log(`[shopee-connector] Action: ${action}, Region: ${region}, User: ${userId}`)

    // Fetch credentials
    const { data: creds } = await supabase
      .from('supplier_credentials_vault')
      .select('oauth_data')
      .eq('user_id', userId)
      .eq('connection_status', 'active')
      .ilike('supplier_id', '%shopee%')
      .maybeSingle()

    let oauthData = (creds?.oauth_data as Record<string, any>) || {}
    if (!oauthData.partnerId) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('credentials_encrypted')
        .eq('user_id', userId)
        .eq('platform', 'shopee')
        .eq('is_active', true)
        .maybeSingle()
      oauthData = (integration?.credentials_encrypted as Record<string, any>) || {}
    }

    const partnerId = oauthData.partnerId || Deno.env.get('SHOPEE_PARTNER_ID')
    const partnerKey = oauthData.partnerKey || Deno.env.get('SHOPEE_PARTNER_KEY')
    const shopId = oauthData.shopId
    const accessToken = oauthData.accessToken

    if (!partnerId || !partnerKey) {
      return errorResponse('Identifiants Shopee non configurés. Partner ID et Partner Key requis.', corsHeaders, 400)
    }
    if (!shopId || !accessToken) {
      return errorResponse('Shop ID et Access Token Shopee requis. Autorisez votre boutique via OAuth2.', corsHeaders, 400)
    }

    const client = new ShopeeClient(Number(partnerId), partnerKey, Number(shopId), accessToken, region)
    let result: any

    switch (action) {
      // Shop
      case 'shop_info': result = await client.getShopInfo(); break
      case 'shop_profile': result = await client.getShopProfile(); break

      // Products
      case 'list_items': result = await client.getItemList(params); break
      case 'item_detail': result = await client.getItemDetail(params.itemIds); break
      case 'add_item': result = await client.addItem(params.itemData); break
      case 'update_item': result = await client.updateItem(params.itemId, params.updates); break
      case 'update_stock': result = await client.updateStock(params.itemId, params.stock, params.modelId); break
      case 'update_price': result = await client.updatePrice(params.itemId, params.price, params.modelId); break
      case 'delete_item': result = await client.deleteItem(params.itemId); break
      case 'get_categories': result = await client.getCategories(); break

      // Orders
      case 'list_orders': result = await client.getOrderList(params); break
      case 'order_detail': result = await client.getOrderDetail(params.orderIds); break
      case 'ship_order': result = await client.shipOrder(params.orderSn, params); break

      // Logistics
      case 'logistic_channels': result = await client.getLogisticChannels(); break
      case 'tracking_number': result = await client.getTrackingNumber(params.orderSn); break
      case 'tracking_info': result = await client.getTrackingInfo(params.orderSn); break

      // Media
      case 'upload_image': result = await client.uploadImage(params.imageUrl); break

      default:
        return errorResponse(`Action non supportée: ${action}`, corsHeaders, 400)
    }

    return successResponse({ data: result, action }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('[shopee-connector] Error:', error)
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(req.headers.get('origin')), 500)
  }
})
