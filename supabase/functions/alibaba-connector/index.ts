/**
 * Alibaba Open Platform API Connector
 * 
 * Supports: product search, detail, categories, supplier info
 * Auth: App Key + App Secret (HMAC-SHA256 signature)
 * Docs: https://developer.alibaba.com/en/doc.htm
 */
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

const ALIBABA_API_BASE = 'https://eco.taobao.com/router/rest'
const ALIBABA_INTL_BASE = 'https://api.alibaba.com/openapi'

// ==========================================
// SIGNATURE GENERATION (Alibaba style)
// ==========================================
async function generateSignature(params: Record<string, string>, appSecret: string): Promise<string> {
  const sorted = Object.keys(params).sort()
  let signStr = appSecret
  for (const key of sorted) {
    signStr += key + params[key]
  }
  signStr += appSecret

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signStr))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

// ==========================================
// ALIBABA OPEN PLATFORM CLIENT
// ==========================================
class AlibabaApiClient {
  private appKey: string
  private appSecret: string

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey
    this.appSecret = appSecret
  }

  private async signedRequest(method: string, apiParams: Record<string, string>): Promise<any> {
    const baseParams: Record<string, string> = {
      app_key: this.appKey,
      method,
      sign_method: 'hmac-sha256',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      format: 'json',
      v: '2.0',
      ...apiParams,
    }

    baseParams.sign = await generateSignature(baseParams, this.appSecret)
    const qs = new URLSearchParams(baseParams).toString()
    const url = `${ALIBABA_API_BASE}?${qs}`

    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) throw new Error(`Alibaba API HTTP ${response.status}`)
    return response.json()
  }

  // ---------- Product Search ----------
  async searchProducts(params: {
    keyword: string
    categoryId?: string
    page?: number
    pageSize?: number
    sortBy?: string
    minPrice?: number
    maxPrice?: number
  }): Promise<any> {
    const apiParams: Record<string, string> = {
      keywords: params.keyword,
      page_no: String(params.page || 1),
      page_size: String(Math.min(params.pageSize || 20, 50)),
    }
    if (params.categoryId) apiParams.category_id = params.categoryId
    if (params.sortBy) apiParams.sort = params.sortBy
    if (params.minPrice) apiParams.original_price_start = String(params.minPrice)
    if (params.maxPrice) apiParams.original_price_end = String(params.maxPrice)

    return this.signedRequest('alibaba.product.search', apiParams)
  }

  // ---------- Product Detail ----------
  async getProductDetail(productId: string): Promise<any> {
    return this.signedRequest('alibaba.product.get', { product_id: productId })
  }

  // ---------- Categories ----------
  async getCategories(parentId?: string): Promise<any> {
    const params: Record<string, string> = {}
    if (parentId) params.parent_cat_id = parentId
    return this.signedRequest('alibaba.category.get', params)
  }

  // ---------- Supplier Info ----------
  async getSupplierInfo(supplierId: string): Promise<any> {
    return this.signedRequest('alibaba.supplier.get', { member_id: supplierId })
  }

  // ---------- Shipping Templates ----------
  async getShippingInfo(productId: string, country: string = 'FR', quantity: number = 1): Promise<any> {
    return this.signedRequest('alibaba.logistics.freightCalculate', {
      product_id: productId,
      destination_country: country,
      quantity: String(quantity),
    })
  }
}

// ==========================================
// 1688 API CLIENT (China domestic B2B)
// ==========================================
class Api1688Client {
  private appKey: string
  private appSecret: string
  private accessToken: string

  constructor(appKey: string, appSecret: string, accessToken: string) {
    this.appKey = appKey
    this.appSecret = appSecret
    this.accessToken = accessToken
  }

  private async request(apiPath: string, params: Record<string, string> = {}): Promise<any> {
    const allParams: Record<string, string> = {
      access_token: this.accessToken,
      _aop_timestamp: String(Date.now()),
      ...params,
    }

    const sign = await generateSignature(allParams, this.appSecret)
    allParams._aop_signature = sign

    const url = `${ALIBABA_INTL_BASE}${apiPath}?${new URLSearchParams(allParams)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`1688 API HTTP ${response.status}`)
    return response.json()
  }

  async searchProducts(keyword: string, page: number = 1): Promise<any> {
    return this.request('/param2/1/com.alibaba.product/alibaba.product.search', {
      keyword,
      page: String(page),
      pageSize: '20',
    })
  }

  async getProductDetail(offerId: string): Promise<any> {
    return this.request('/param2/1/com.alibaba.product/alibaba.cross.syncProductDetail', {
      productId: offerId,
    })
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
    const body = await req.json()
    const { action, platform = 'alibaba', ...params } = body

    console.log(`[alibaba-connector] Action: ${action}, Platform: ${platform}, User: ${userId}`)

    // Fetch stored credentials
    const { data: creds } = await supabase
      .from('supplier_credentials_vault')
      .select('oauth_data')
      .eq('user_id', userId)
      .eq('connection_status', 'active')
      .ilike('supplier_id', `%${platform}%`)
      .maybeSingle()

    const oauthData = (creds?.oauth_data as Record<string, string>) || {}
    const appKey = oauthData.appKey || Deno.env.get('ALIBABA_APP_KEY') || ''
    const appSecret = oauthData.appSecret || Deno.env.get('ALIBABA_APP_SECRET') || ''

    if (!appKey || !appSecret) {
      return errorResponse('Identifiants Alibaba non configurés. Ajoutez votre App Key et App Secret.', corsHeaders, 400)
    }

    const client = new AlibabaApiClient(appKey, appSecret)
    let result: any

    switch (action) {
      case 'search': {
        result = await client.searchProducts({
          keyword: params.keyword,
          categoryId: params.categoryId,
          page: params.page,
          pageSize: params.pageSize,
          sortBy: params.sortBy,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
        })
        break
      }

      case 'detail': {
        if (!params.productId) return errorResponse('productId requis', corsHeaders, 400)
        result = await client.getProductDetail(params.productId)
        break
      }

      case 'categories': {
        result = await client.getCategories(params.parentId)
        break
      }

      case 'supplier_info': {
        if (!params.supplierId) return errorResponse('supplierId requis', corsHeaders, 400)
        result = await client.getSupplierInfo(params.supplierId)
        break
      }

      case 'shipping': {
        if (!params.productId) return errorResponse('productId requis', corsHeaders, 400)
        result = await client.getShippingInfo(params.productId, params.country, params.quantity)
        break
      }

      case '1688_search': {
        const accessToken = oauthData.accessToken || ''
        if (!accessToken) return errorResponse('Access Token 1688 requis', corsHeaders, 400)
        const api1688 = new Api1688Client(appKey, appSecret, accessToken)
        result = await api1688.searchProducts(params.keyword, params.page)
        break
      }

      case '1688_detail': {
        const accessToken = oauthData.accessToken || ''
        if (!accessToken) return errorResponse('Access Token 1688 requis', corsHeaders, 400)
        const api1688 = new Api1688Client(appKey, appSecret, accessToken)
        result = await api1688.getProductDetail(params.offerId)
        break
      }

      default:
        return errorResponse(`Action non supportée: ${action}`, corsHeaders, 400)
    }

    return successResponse({ data: result, platform, action }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('[alibaba-connector] Error:', error)
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(req.headers.get('origin')), 500)
  }
})
