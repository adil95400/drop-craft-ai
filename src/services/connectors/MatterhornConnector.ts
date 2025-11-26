import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

export class MatterhornConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://matterhorn-wholesale.com/B2BAPI')
    this.rateLimitDelay = 600
  }

  protected getSupplierName(): string {
    return 'Matterhorn'
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': this.credentials.apiKey || '',
      'accept': 'application/json'
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Try to fetch first page of products to validate credentials
      const data = await this.makeRequest('/ITEMS/?page=1&limit=1')
      return Array.isArray(data) || (data && typeof data === 'object')
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
      const data = await this.makeRequest(`/ITEMS/?${params}`)
      const products = Array.isArray(data) ? data : []
      return products.map((product: any) => this.normalizeProduct(product) as SupplierProduct)
    } catch (error) {
      this.handleError(error, 'fetchProducts')
      return []
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/ITEMS/${encodeURIComponent(sku)}`)
      return this.normalizeProduct(data) as SupplierProduct
    } catch (error) {
      console.error(`Failed to fetch product ${sku}:`, error)
      return null
    }
  }

  protected normalizeProduct(product: any): Partial<SupplierProduct> {
    const variants = product.variants?.map((v: any) => ({
      id: v.variant_uid,
      sku: v.variant_uid,
      title: v.name,
      price: product.prices?.EUR || 0,
      stock: parseInt(v.stock) || 0,
      attributes: { size: v.name }
    })) || []

    return {
      id: product.id,
      sku: product.id,
      title: product.name_without_number || product.name,
      description: product.description || '',
      price: product.prices?.EUR || 0,
      currency: 'EUR',
      stock: parseInt(product.stock_total) || 0,
      images: product.images || [],
      category: product.category_name || '',
      brand: product.brand,
      variants,
      attributes: {
        color: product.color,
        category_path: product.category_path,
        new_collection: product.new_collection
      },
      supplier: {
        id: 'matterhorn',
        name: 'Matterhorn',
        sku: product.id
      }
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
      const product = await this.fetchProduct(sku)
      return product?.stock || 0
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
      const payload = {
        items: orderData.items.map((item: any) => ({
          variant_uid: parseInt(item.variantId || item.sku),
          quantity: item.quantity
        })),
        delivery_to: {
          first_name: orderData.shippingAddress.firstName || orderData.shippingAddress.name?.split(' ')[0],
          second_name: orderData.shippingAddress.lastName || orderData.shippingAddress.name?.split(' ').slice(1).join(' '),
          country: orderData.shippingAddress.country?.toLowerCase(),
          street: orderData.shippingAddress.street || orderData.shippingAddress.address,
          house_number: orderData.shippingAddress.houseNumber || '',
          zip: orderData.shippingAddress.postalCode || orderData.shippingAddress.zip,
          city: orderData.shippingAddress.city
        },
        currency: 'EUR',
        delivery_method_id: orderData.deliveryMethodId || 160
      }

      const response = await fetch('https://matterhorn-wholesale.com/B2BAPI/ACCOUNT/ORDERS/', {
        method: 'PUT',
        headers: {
          'Authorization': this.credentials.apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Order failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return {
        success: true,
        orderId: result.id,
        tracking: result.shipping_number,
        trackingUrl: result.tracking_url,
        paymentUrl: result.payment_url,
        estimatedDelivery: null
      }
    } catch (error) {
      console.error('Matterhorn order failed:', error)
      throw error
    }
  }
}
