/**
 * Printify REST API Connector
 * 
 * Full Print-on-Demand integration:
 * - Catalog (blueprints, providers, variants)
 * - Products (create, update, publish)
 * - Orders (create, track)
 * - Shops (list, connect)
 * 
 * Docs: https://developers.printify.com/
 */
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

const PRINTIFY_API = 'https://api.printify.com/v1'

class PrintifyClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request(path: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${PRINTIFY_API}${path}`
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ShopOpti/1.0',
      },
    }
    if (body) options.body = JSON.stringify(body)

    const response = await fetch(url, options)
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Printify API ${response.status}: ${errText}`)
    }

    if (response.status === 204) return { success: true }
    return response.json()
  }

  // ---- Shops ----
  async getShops(): Promise<any> { return this.request('/shops.json') }

  // ---- Catalog ----
  async getBlueprints(): Promise<any> { return this.request('/catalog/blueprints.json') }
  async getBlueprintDetail(blueprintId: number): Promise<any> { return this.request(`/catalog/blueprints/${blueprintId}.json`) }
  async getPrintProviders(blueprintId: number): Promise<any> { return this.request(`/catalog/blueprints/${blueprintId}/print_providers.json`) }
  async getVariants(blueprintId: number, providerId: number): Promise<any> { return this.request(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`) }
  async getShipping(blueprintId: number, providerId: number): Promise<any> { return this.request(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`) }

  // ---- Products ----
  async getProducts(shopId: string, page: number = 1): Promise<any> { return this.request(`/shops/${shopId}/products.json?page=${page}`) }
  async getProduct(shopId: string, productId: string): Promise<any> { return this.request(`/shops/${shopId}/products/${productId}.json`) }
  
  async createProduct(shopId: string, productData: {
    title: string
    description: string
    blueprint_id: number
    print_provider_id: number
    variants: Array<{ id: number; price: number; is_enabled: boolean }>
    print_areas: Array<{ variant_ids: number[]; placeholders: Array<{ position: string; images: Array<{ id: string; x: number; y: number; scale: number; angle: number }> }> }>
  }): Promise<any> {
    return this.request(`/shops/${shopId}/products.json`, 'POST', productData)
  }

  async updateProduct(shopId: string, productId: string, updates: any): Promise<any> {
    return this.request(`/shops/${shopId}/products/${productId}.json`, 'PUT', updates)
  }

  async deleteProduct(shopId: string, productId: string): Promise<any> {
    return this.request(`/shops/${shopId}/products/${productId}.json`, 'DELETE')
  }

  async publishProduct(shopId: string, productId: string, publishData: any): Promise<any> {
    return this.request(`/shops/${shopId}/products/${productId}/publish.json`, 'POST', publishData)
  }

  // ---- Images ----
  async uploadImage(shopId: string, fileName: string, imageUrl: string): Promise<any> {
    return this.request(`/uploads/images.json`, 'POST', {
      file_name: fileName,
      url: imageUrl,
    })
  }

  // ---- Orders ----
  async getOrders(shopId: string, page: number = 1): Promise<any> {
    return this.request(`/shops/${shopId}/orders.json?page=${page}`)
  }

  async getOrder(shopId: string, orderId: string): Promise<any> {
    return this.request(`/shops/${shopId}/orders/${orderId}.json`)
  }

  async createOrder(shopId: string, orderData: {
    external_id?: string
    label?: string
    line_items: Array<{ product_id: string; variant_id: number; quantity: number }>
    shipping_method: number
    address_to: { first_name: string; last_name: string; email: string; phone?: string; country: string; region: string; address1: string; address2?: string; city: string; zip: string }
  }): Promise<any> {
    return this.request(`/shops/${shopId}/orders.json`, 'POST', orderData)
  }

  async cancelOrder(shopId: string, orderId: string): Promise<any> {
    return this.request(`/shops/${shopId}/orders/${orderId}/cancel.json`, 'POST')
  }

  // ---- Webhooks ----
  async getWebhooks(shopId: string): Promise<any> {
    return this.request(`/shops/${shopId}/webhooks.json`)
  }

  async createWebhook(shopId: string, topic: string, url: string): Promise<any> {
    return this.request(`/shops/${shopId}/webhooks.json`, 'POST', { topic, url })
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
    const { action, shopId, ...params } = await req.json()

    console.log(`[printify-connector] Action: ${action}, User: ${userId}`)

    // Fetch Printify API token
    const { data: creds } = await supabase
      .from('supplier_credentials_vault')
      .select('oauth_data')
      .eq('user_id', userId)
      .eq('connection_status', 'active')
      .ilike('supplier_id', '%printify%')
      .maybeSingle()

    const accessToken = (creds?.oauth_data as any)?.accessToken || Deno.env.get('PRINTIFY_API_TOKEN') || ''
    if (!accessToken) {
      return errorResponse('Token API Printify non configuré. Générez-le sur printify.com/app/account/api.', corsHeaders, 400)
    }

    const client = new PrintifyClient(accessToken)
    let result: any

    switch (action) {
      // --- Shops ---
      case 'get_shops': result = await client.getShops(); break

      // --- Catalog ---
      case 'get_blueprints': result = await client.getBlueprints(); break
      case 'get_blueprint': result = await client.getBlueprintDetail(params.blueprintId); break
      case 'get_providers': result = await client.getPrintProviders(params.blueprintId); break
      case 'get_variants': result = await client.getVariants(params.blueprintId, params.providerId); break
      case 'get_shipping': result = await client.getShipping(params.blueprintId, params.providerId); break

      // --- Products ---
      case 'get_products': result = await client.getProducts(shopId, params.page); break
      case 'get_product': result = await client.getProduct(shopId, params.productId); break
      case 'create_product': result = await client.createProduct(shopId, params.productData); break
      case 'update_product': result = await client.updateProduct(shopId, params.productId, params.updates); break
      case 'delete_product': result = await client.deleteProduct(shopId, params.productId); break
      case 'publish_product': result = await client.publishProduct(shopId, params.productId, params.publishData); break

      // --- Images ---
      case 'upload_image': result = await client.uploadImage(shopId, params.fileName, params.imageUrl); break

      // --- Orders ---
      case 'get_orders': result = await client.getOrders(shopId, params.page); break
      case 'get_order': result = await client.getOrder(shopId, params.orderId); break
      case 'create_order': result = await client.createOrder(shopId, params.orderData); break
      case 'cancel_order': result = await client.cancelOrder(shopId, params.orderId); break

      // --- Webhooks ---
      case 'get_webhooks': result = await client.getWebhooks(shopId); break
      case 'create_webhook': result = await client.createWebhook(shopId, params.topic, params.webhookUrl); break

      default:
        return errorResponse(`Action non supportée: ${action}`, corsHeaders, 400)
    }

    return successResponse({ data: result, action }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('[printify-connector] Error:', error)
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(req.headers.get('origin')), 500)
  }
})
