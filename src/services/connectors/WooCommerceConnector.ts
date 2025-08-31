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
  constructor(credentials: WooCommerceCredentials) {
    super(credentials, `${credentials.siteUrl}/wp-json/wc/v3`)
  }

  protected getSupplierName(): string {
    return 'WooCommerce';
  }

  protected getAuthHeaders(): Record<string, string> {
    const credentials = this.credentials as WooCommerceCredentials;
    const auth = btoa(`${credentials.consumerKey}:${credentials.consumerSecret}`);
    return {
      'Authorization': `Basic ${auth}`,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/products?per_page=1');
      return true;
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

    const products: WooCommerceProduct[] = await this.makeRequest(`/products?${params}`)

    return products.map(product => this.transformProduct(product))
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    const products: WooCommerceProduct[] = await this.makeRequest(`/products?sku=${sku}`)

    if (products.length === 0) return null
    return this.transformProduct(products[0])
  }

  async updateInventory(products: SupplierProduct[]): Promise<import('./BaseConnector').SyncResult> {
    try {
      const batchUpdates = products.map((product) => ({
        method: 'PUT',
        path: `/products/${product.sku}`,
        body: {
          stock_quantity: product.stock,
          manage_stock: true,
          stock_status: product.stock > 0 ? 'instock' : 'outofstock'
        }
      }))

      await this.makeRequest('/products/batch', {
        method: 'POST',
        body: JSON.stringify({ update: batchUpdates })
      });

      return {
        total: products.length,
        imported: products.length,
        duplicates: 0,
        errors: [],
      };
    } catch (error) {
      console.error('WooCommerce inventory update failed:', error)
      return {
        total: products.length,
        imported: 0,
        duplicates: 0,
        errors: [error.message],
      };
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

    const createdOrder = await this.makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(wooOrder)
    })
    return createdOrder.id.toString()
  }

  async getOrderStatus(orderId: string): Promise<string> {
    const order = await this.makeRequest(`/orders/${orderId}`)
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
        await this.makeRequest('/webhooks', {
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

}