import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

export class DropshippingEuropeConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.dropshipping-europe.com/v1')
    this.rateLimitDelay = 1000
  }

  protected getSupplierName(): string {
    return 'Dropshipping Europe'
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-API-Key': this.credentials.apiKey || '',
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const data = await this.makeRequest('/test')
      return data.status === 'ok'
    } catch (error) {
      this.handleError(error, 'validateCredentials')
      return false
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const data = await this.makeRequest('/products')
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
      errors: ['Inventory updates not supported for dropshipping products'],
    }
  }

  async getInventory(sku: string): Promise<number> {
    if (!this.credentials?.apiKey) {
      throw new Error('Missing API key')
    }

    try {
      const response = await fetch(`https://api.dropshipping-europe.com/v1/stock/${sku}`, {
        headers: {
          'X-API-Key': this.credentials.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.quantity || 0
    } catch (error) {
      console.error('Dropshipping Europe inventory check failed:', error)
      return 0
    }
  }

  async placeOrder(orderData: any): Promise<any> {
    if (!this.credentials?.apiKey) {
      throw new Error('Missing API key')
    }

    try {
      const response = await fetch('https://api.dropshipping-europe.com/v1/orders', {
        method: 'POST',
        headers: {
          'X-API-Key': this.credentials.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          products: orderData.items.map((item: any) => ({
            sku: item.sku,
            quantity: item.quantity
          })),
          shipping_address: orderData.shippingAddress,
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
        tracking: result.tracking_number
      }
    } catch (error) {
      console.error('Dropshipping Europe order failed:', error)
      throw error
    }
  }
}
