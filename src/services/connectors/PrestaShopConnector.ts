import { BaseConnector } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

interface PrestaShopCredentials extends SupplierCredentials {
  shopUrl: string
  apiKey: string
  language?: string
  currency?: string
}

interface PrestaShopProduct {
  id?: number
  name: string
  description: string
  description_short: string
  reference: string
  price: string
  wholesale_price: string
  quantity: number
  active: boolean
  category_default: number
  manufacturer: string
  images?: Array<{
    id?: number
    image_url: string
    cover?: boolean
    position?: number
  }>
  combinations?: Array<{
    id?: number
    reference: string
    price: string
    quantity: number
    attributes: Array<{
      group: string
      value: string
    }>
  }>
  features?: Array<{
    id: number
    value: string
  }>
  tags?: string
  meta_title?: string
  meta_description?: string
  link_rewrite?: string
}

export class PrestaShopConnector extends BaseConnector {
  constructor(credentials: PrestaShopCredentials) {
    super(credentials, `${credentials.shopUrl}/api`)
  }

  protected getSupplierName(): string {
    return 'PrestaShop'
  }

  protected getAuthHeaders(): Record<string, string> {
    const credentials = this.credentials as PrestaShopCredentials
    const auth = btoa(`${credentials.apiKey}:`)
    return {
      'Authorization': `Basic ${auth}`,
      'Output-Format': 'JSON'
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/products?display=id&limit=1')
      return true
    } catch (error) {
      console.error('PrestaShop credentials validation failed:', error)
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
      display: 'full',
      limit: (options?.limit || 100).toString()
    })

    if (options?.page) {
      params.append('page', options.page.toString())
    }

    if (options?.category) {
      params.append('filter[id_category_default]', options.category)
    }

    if (options?.lastSync) {
      params.append('filter[date_upd]', `>[${options.lastSync.toISOString().split('T')[0]} 00:00:00]`)
    }

    const response = await this.makeRequest(`/products?${params}`)
    const products = response.products || []

    return Promise.all(products.map((product: any) => this.transformProduct(product)))
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/products?filter[reference]=${sku}&display=full`)
      const products = response.products || []
      
      if (products.length === 0) return null
      return this.transformProduct(products[0])
    } catch (error) {
      console.error('Error fetching PrestaShop product:', error)
      return null
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<import('./BaseConnector').SyncResult> {
    let imported = 0
    const errors: string[] = []

    for (const product of products) {
      try {
        // Find product by SKU
        const response = await this.makeRequest(`/products?filter[reference]=${product.sku}&display=id`)
        const existingProducts = response.products || []
        
        if (existingProducts.length > 0) {
          const productId = existingProducts[0].id
          
          // Update stock via stock_availables
          const stockResponse = await this.makeRequest(`/stock_availables?filter[id_product]=${productId}&display=full`)
          const stocks = stockResponse.stock_availables || []
          
          if (stocks.length > 0) {
            const stockId = stocks[0].id
            await this.makeRequest(`/stock_availables/${stockId}`, {
              method: 'PUT',
              body: JSON.stringify({
                stock_available: {
                  id: stockId,
                  quantity: product.stock
                }
              })
            })
            imported++
          }
        }
      } catch (error) {
        console.error(`Error updating PrestaShop inventory for ${product.sku}:`, error)
        errors.push(`${product.sku}: ${error.message}`)
      }
    }

    return {
      total: products.length,
      imported,
      duplicates: 0,
      errors
    }
  }

  async createProduct(product: PrestaShopProduct): Promise<any> {
    const response = await this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify({ product })
    })

    console.log(`Created PrestaShop product: ${product.name}`)
    return response.product
  }

  async updateProduct(productId: number, product: Partial<PrestaShopProduct>): Promise<any> {
    const response = await this.makeRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ product: { ...product, id: productId } })
    })

    console.log(`Updated PrestaShop product: ${product.name}`)
    return response.product
  }

  async createOrUpdateProduct(localProduct: any): Promise<any> {
    const prestaProduct: PrestaShopProduct = this.transformToPrestaShopProduct(localProduct)
    
    // Check if product exists
    const response = await this.makeRequest(`/products?filter[reference]=${prestaProduct.reference}&display=id`)
    const existingProducts = response.products || []
    
    if (existingProducts.length > 0) {
      return await this.updateProduct(existingProducts[0].id, prestaProduct)
    } else {
      return await this.createProduct(prestaProduct)
    }
  }

  async syncProducts(localProducts: any[]): Promise<void> {
    console.log(`Syncing ${localProducts.length} products to PrestaShop`)

    for (const localProduct of localProducts) {
      try {
        await this.createOrUpdateProduct(localProduct)
        
        // Update local status
        await import('@/integrations/supabase/client').then(({ supabase }) => 
          supabase
            .from('imported_products')
            .update({ 
              published_at: new Date().toISOString(),
              status: 'published'
            })
            .eq('id', localProduct.id)
        )
      } catch (error) {
        console.error(`Failed to sync product ${localProduct.id}:`, error)
        
        await import('@/integrations/supabase/client').then(({ supabase }) => 
          supabase
            .from('imported_products')
            .update({ status: 'error' })
            .eq('id', localProduct.id)
        )
      }
    }
  }

  protected transformProduct(product: any): SupplierProduct {
    return {
      id: product.id?.toString(),
      sku: product.reference,
      title: product.name,
      description: product.description || product.description_short,
      price: parseFloat(product.price) || 0,
      costPrice: parseFloat(product.wholesale_price) || undefined,
      currency: 'EUR',
      category: 'General',
      brand: product.manufacturer,
      images: product.associations?.images?.map((img: any) => 
        `${(this.credentials as PrestaShopCredentials).shopUrl}/img/p/${img.id}.jpg`
      ) || [],
      stock: parseInt(product.quantity) || 0,
      attributes: {},
      supplier: {
        id: 'prestashop',
        name: 'PrestaShop',
        sku: product.reference
      }
    }
  }

  private transformToPrestaShopProduct(localProduct: any): PrestaShopProduct {
    return {
      name: localProduct.name,
      description: localProduct.description || '',
      description_short: localProduct.description?.substring(0, 400) || '',
      reference: localProduct.sku,
      price: localProduct.price?.toString() || '0',
      wholesale_price: localProduct.cost_price?.toString() || '0',
      quantity: localProduct.stock_quantity || 0,
      active: true,
      category_default: 1, // Default category
      manufacturer: localProduct.brand || 'Unknown',
      meta_title: localProduct.seo_title || localProduct.name,
      meta_description: localProduct.seo_description || '',
      link_rewrite: this.generateUrlSlug(localProduct.name),
      tags: (localProduct.tags || []).join(',')
    }
  }

  private generateUrlSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Webhook support
  async handleWebhook(webhookType: string, payload: any): Promise<void> {
    switch (webhookType) {
      case 'order_created':
        await this.handleNewOrder(payload)
        break
      case 'product_updated':
        await this.handleProductUpdate(payload)
        break
      case 'stock_updated':
        await this.handleStockUpdate(payload)
        break
      default:
        console.log(`Unhandled PrestaShop webhook: ${webhookType}`)
    }
  }

  private async handleNewOrder(order: any): Promise<void> {
    // Handle new order from PrestaShop
    console.log(`New PrestaShop order received: ${order.reference}`)
  }

  private async handleProductUpdate(product: any): Promise<void> {
    // Sync updated product from PrestaShop
    console.log(`PrestaShop product updated: ${product.reference}`)
  }

  private async handleStockUpdate(stock: any): Promise<void> {
    // Sync stock update from PrestaShop
    console.log(`PrestaShop stock updated: ${stock.id}`)
  }
}