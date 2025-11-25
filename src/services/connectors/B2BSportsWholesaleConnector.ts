import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

export class B2BSportsWholesaleConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.b2bsportswholesale.com/v1')
    this.rateLimitDelay = 1000
  }

  protected getSupplierName(): string {
    return 'B2B Sports Wholesale'
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey || ''}`,
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const data = await this.makeRequest('/ping')
      return data.pong === true
    } catch (error) {
      this.handleError(error, 'validateCredentials')
      return false
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const data = await this.makeRequest('/products')
      return data.items.map((product: any) => this.normalizeProduct(product) as SupplierProduct)
    } catch (error) {
      this.handleError(error, 'fetchProducts')
      return []
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/products/${encodeURIComponent(sku)}`)
      return this.normalizeProduct(data.item) as SupplierProduct
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
      const response = await fetch(`https://api.b2bsportswholesale.com/v1/stock/${sku}`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.available || 0
    } catch (error) {
      console.error('B2B Sports inventory check failed:', error)
      return 0
    }
  }

  async placeOrder(orderData: any): Promise<any> {
    if (!this.credentials?.apiKey) {
      throw new Error('Missing API key')
    }

    try {
      const response = await fetch('https://api.b2bsportswholesale.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          products: orderData.items,
          shipping_address: orderData.shippingAddress,
          customer_reference: orderData.orderNumber
        })
      })

      if (!response.ok) {
        throw new Error(`Order failed: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        orderId: result.order_id,
        tracking: result.tracking
      }
    } catch (error) {
      console.error('B2B Sports order failed:', error)
      throw error
    }
  }
}
