import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

export class BTSWholesalerConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.btswholesaler.com')
    this.rateLimitDelay = 2000
  }

  protected getSupplierName(): string {
    return 'BTS Wholesaler'
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.accessToken || ''}`,
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.credentials.username,
          password: this.credentials.password
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
      errors: ['Inventory updates not supported'],
    }
  }

  async getInventory(sku: string): Promise<number> {
    if (!this.credentials?.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`https://api.btswholesaler.com/stock/${sku}`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.quantity || 0
    } catch (error) {
      console.error('BTS Wholesaler inventory check failed:', error)
      return 0
    }
  }

  async placeOrder(orderData: any): Promise<any> {
    if (!this.credentials?.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('https://api.btswholesaler.com/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: orderData.items.map((item: any) => ({
            sku: item.sku,
            quantity: item.quantity
          })),
          delivery_address: orderData.shippingAddress,
          order_reference: orderData.orderNumber
        })
      })

      if (!response.ok) {
        throw new Error(`Order failed: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        orderId: result.order_id,
        tracking: result.tracking_code
      }
    } catch (error) {
      console.error('BTS Wholesaler order failed:', error)
      throw error
    }
  }
}
