import { BaseConnector } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

interface WooCommerceCredentials extends SupplierCredentials {
  siteUrl: string
  consumerKey: string
  consumerSecret: string
}

interface WooCommerceProduct {
  id: number
  name: string
  description: string
  short_description: string
  price: string
  regular_price: string
  sale_price: string
  sku: string
  stock_quantity: number
  stock_status: 'instock' | 'outofstock'
  categories: Array<{ id: number; name: string; slug: string }>
  images: Array<{ id: number; src: string; alt: string }>
  attributes: Array<{ id: number; name: string; options: string[] }>
  variations: number[]
  permalink: string
  status: 'publish' | 'draft' | 'private'
}

export class WooCommerceConnector extends BaseConnector {
  private apiUrl: string

  constructor(credentials: WooCommerceCredentials) {
    super(credentials)
    this.apiUrl = `${credentials.siteUrl}/wp-json/wc/v3`
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeWooRequest('/products?per_page=1')
      return response.ok
    } catch (error) {
      console.error('WooCommerce credentials validation failed:', error)
      return false
    }
  }

  async fetchProducts(options?: {
    page?: number
    limit?: number
    lastSync?: Date
    category?: string
  }): Promise<SupplierProduct[]> {
    const params = new URLSearchParams({
      per_page: (options?.limit || 100).toString(),
      page: (options?.page || 1).toString(),
      status: 'publish'
    })

    if (options?.category) {
      params.append('category', options.category)
    }

    if (options?.lastSync) {
      params.append('modified_after', options.lastSync.toISOString())
    }

    const response = await this.makeWooRequest(`/products?${params}`)
    const products: WooCommerceProduct[] = await response.json()

    return products.map(product => this.transformProduct(product))
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    const response = await this.makeWooRequest(`/products?sku=${sku}`)
    const products: WooCommerceProduct[] = await response.json()

    if (products.length === 0) return null
    return this.transformProduct(products[0])
  }

  async updateInventory(products: Array<{sku: string, stock: number}>): Promise<boolean> {
    try {
      const batchUpdates = products.map(({ sku, stock }) => ({
        method: 'PUT',
        path: `/products/${sku}`,
        body: {
          stock_quantity: stock,
          manage_stock: true,
          stock_status: stock > 0 ? 'instock' : 'outofstock'
        }
      }))

      const response = await this.makeWooRequest('/products/batch', {
        method: 'POST',
        body: JSON.stringify({ update: batchUpdates })
      })

      return response.ok
    } catch (error) {
      console.error('WooCommerce inventory update failed:', error)
      return false
    }
  }

  async createOrder(order: any): Promise<string> {
    const wooOrder = {
      payment_method: 'cod',
      payment_method_title: 'Cash on delivery',
      set_paid: false,
      billing: order.billing_address,
      shipping: order.shipping_address,
      line_items: order.items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      })),
      shipping_lines: [{
        method_id: 'flat_rate',
        method_title: 'Flat Rate',
        total: order.shipping_cost?.toString() || '0'
      }]
    }

    const response = await this.makeWooRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(wooOrder)
    })

    const createdOrder = await response.json()
    return createdOrder.id.toString()
  }

  async getOrderStatus(orderId: string): Promise<string> {
    const response = await this.makeWooRequest(`/orders/${orderId}`)
    const order = await response.json()
    return order.status
  }

  async setupWebhooks(webhookUrl: string): Promise<boolean> {
    try {
      const webhooks = [
        {
          name: 'Product Updated',
          topic: 'product.updated',
          delivery_url: `${webhookUrl}/woocommerce`,
          secret: 'dropship_webhook_secret'
        },
        {
          name: 'Order Created',
          topic: 'order.created',
          delivery_url: `${webhookUrl}/woocommerce`,
          secret: 'dropship_webhook_secret'
        }
      ]

      for (const webhook of webhooks) {
        await this.makeWooRequest('/webhooks', {
          method: 'POST',
          body: JSON.stringify(webhook)
        })
      }

      return true
    } catch (error) {
      console.error('WooCommerce webhook setup failed:', error)
      return false
    }
  }

  protected transformProduct(product: WooCommerceProduct): SupplierProduct {
    return {
      id: product.id.toString(),
      sku: product.sku,
      title: product.name,
      description: product.description || product.short_description,
      price: parseFloat(product.price) || 0,
      currency: 'EUR', // Default, should be configured
      category: product.categories[0]?.name || 'Uncategorized',
      brand: '', // Extract from attributes if available
      images: product.images.map(img => img.src),
      stock: product.stock_quantity || 0,
      attributes: product.attributes.reduce((acc, attr) => {
        acc[attr.name] = attr.options.join(', ')
        return acc
      }, {} as Record<string, string>),
      supplier: {
        id: 'woocommerce',
        name: 'WooCommerce',
        sku: product.sku
      }
    }
  }

  private async makeWooRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const credentials = this.credentials as WooCommerceCredentials
    const auth = btoa(`${credentials.consumerKey}:${credentials.consumerSecret}`)

    return this.makeRequest(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }
}