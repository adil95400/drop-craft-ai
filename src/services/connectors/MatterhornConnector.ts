import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

export class MatterhornConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.matterhorn.eu/v1')
    this.rateLimitDelay = 600
  }

  protected getSupplierName(): string {
    return 'Matterhorn'
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-API-Key': this.credentials.apiKey || '',
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const data = await this.makeRequest('/auth/verify')
      return data.valid === true
    } catch (error) {
      this.handleError(error, 'validateCredentials')
      return false
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        limit: (options.limit || 100).toString(),
      })
      const data = await this.makeRequest(`/products?${params}`)
      return data.products.map((product: any) => this.normalizeProduct(product) as SupplierProduct)
    } catch (error) {
      this.handleError(error, 'fetchProducts')
      return []
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/products/${encodeURIComponent(sku)}`)
      return this.normalizeProduct(data.product) as SupplierProduct
    } catch (error) {
      console.error(`Failed to fetch product ${sku}:`, error)
      return null
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    return {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: ['Inventory updates not supported'],
    }
  }

  async getInventory(sku: string): Promise<number> {
    if (!this.credentials?.apiKey) {
      throw new Error('Missing API key')
    }

    try {
      const response = await fetch(`https://api.matterhorn.eu/v1/inventory/${sku}`, {
        headers: {
          'X-API-Key': this.credentials.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.available || 0
    } catch (error) {
      console.error('Matterhorn inventory check failed:', error)
      return 0
    }
  }

  async placeOrder(orderData: any): Promise<any> {
    if (!this.credentials?.apiKey) {
      throw new Error('Missing API key')
    }

    try {
      const response = await fetch('https://api.matterhorn.eu/v1/orders', {
        method: 'POST',
        headers: {
          'X-API-Key': this.credentials.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_items: orderData.items.map((item: any) => ({
            sku: item.sku,
            quantity: item.quantity,
            variant_id: item.variantId
          })),
          shipping: {
            name: orderData.shippingAddress.name,
            address: orderData.shippingAddress.address,
            city: orderData.shippingAddress.city,
            postal_code: orderData.shippingAddress.postalCode,
            country: orderData.shippingAddress.country
          },
          reference: orderData.orderNumber
        })
      })

      if (!response.ok) {
        throw new Error(`Order failed: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        orderId: result.order_id,
        tracking: result.tracking_number,
        estimatedDelivery: result.estimated_delivery
      }
    } catch (error) {
      console.error('Matterhorn order failed:', error)
      throw error
    }
  }
}
