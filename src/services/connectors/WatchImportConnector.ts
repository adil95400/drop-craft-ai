import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

export class WatchImportConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.watchimport.com')
    this.rateLimitDelay = 2000
  }

  protected getSupplierName(): string {
    return 'Watch Import'
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Token ${this.credentials.accessToken || ''}`,
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: this.credentials.username,
          pass: this.credentials.password
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        this.credentials.accessToken = data.token
        return true
      }
      return false
    } catch (error) {
      this.handleError(error, 'validateCredentials')
      return false
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const data = await this.makeRequest('/catalog')
      return data.watches.map((watch: any) => this.normalizeProduct(watch) as SupplierProduct)
    } catch (error) {
      this.handleError(error, 'fetchProducts')
      return []
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/catalog/${encodeURIComponent(sku)}`)
      return this.normalizeProduct(data.watch) as SupplierProduct
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
    if (!this.credentials?.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`https://api.watchimport.com/stock/${sku}`, {
        headers: {
          'Authorization': `Token ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.available || 0
    } catch (error) {
      console.error('Watch Import inventory check failed:', error)
      return 0
    }
  }

  async placeOrder(orderData: any): Promise<any> {
    if (!this.credentials?.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('https://api.watchimport.com/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: orderData.items.map((item: any) => ({
            ref: item.sku,
            qty: item.quantity
          })),
          shipping: orderData.shippingAddress,
          order_ref: orderData.orderNumber
        })
      })

      if (!response.ok) {
        throw new Error(`Order failed: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        orderId: result.order_number,
        tracking: result.tracking_code
      }
    } catch (error) {
      console.error('Watch Import order failed:', error)
      throw error
    }
  }
}
