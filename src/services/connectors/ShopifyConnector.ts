import { supabase } from '@/integrations/supabase/client'

export interface ShopifyCredentials {
  shopDomain: string
  accessToken: string
  apiVersion?: string
}

export interface ShopifyProduct {
  id?: number
  title: string
  body_html: string
  vendor: string
  product_type: string
  tags: string
  status: 'draft' | 'active' | 'archived'
  images: Array<{
    src: string
    alt?: string
    position?: number
  }>
  variants: Array<{
    id?: number
    title: string
    price: string
    compare_at_price?: string
    sku: string
    inventory_quantity: number
    weight?: number
    weight_unit?: string
  }>
  options?: Array<{
    name: string
    values: string[]
  }>
  metafields?: Array<{
    namespace: string
    key: string
    value: string
    type: string
  }>
}

export interface ShopifyOrder {
  id?: number
  name: string
  email: string
  total_price: string
  financial_status: string
  fulfillment_status?: string
  line_items: Array<{
    id?: number
    product_id: number
    variant_id: number
    title: string
    quantity: number
    price: string
    sku: string
  }>
  shipping_address: {
    first_name: string
    last_name: string
    address1: string
    city: string
    country: string
    zip: string
  }
}

export class ShopifyConnector {
  private credentials: ShopifyCredentials
  private baseUrl: string
  private apiVersion: string

  constructor(credentials: ShopifyCredentials) {
    this.credentials = credentials
    this.apiVersion = credentials.apiVersion || '2024-01'
    this.baseUrl = `https://${credentials.shopDomain}.myshopify.com/admin/api/${this.apiVersion}`
  }

  // Validation des credentials
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/shop.json', { method: 'GET' })
      const data = await response.json()
      return !!data.shop
    } catch (error) {
      console.error('Shopify credential validation failed:', error)
      return false
    }
  }

  // Création/mise à jour de produit avec variantes
  async createOrUpdateProduct(product: ShopifyProduct): Promise<ShopifyProduct> {
    try {
      // Vérifier si le produit existe déjà par SKU
      const existingProduct = await this.findProductBySku(product.variants[0]?.sku)
      
      if (existingProduct) {
        return await this.updateProduct(existingProduct.id!, product)
      } else {
        return await this.createProduct(product)
      }
    } catch (error) {
      console.error('Failed to create/update Shopify product:', error)
      throw error
    }
  }

  // Gestion des variantes produits
  async createProductVariant(productId: number, variant: ShopifyProduct['variants'][0]): Promise<any> {
    const response = await this.makeRequest(`/products/${productId}/variants.json`, {
      method: 'POST',
      body: JSON.stringify({ variant })
    })

    const data = await response.json()
    if (data.errors) {
      throw new Error(`Shopify API error: ${JSON.stringify(data.errors)}`)
    }

    return data.variant
  }

  async updateProductVariant(variantId: number, variant: Partial<ShopifyProduct['variants'][0]>): Promise<any> {
    const response = await this.makeRequest(`/variants/${variantId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ variant })
    })

    const data = await response.json()
    if (data.errors) {
      throw new Error(`Shopify API error: ${JSON.stringify(data.errors)}`)
    }

    return data.variant
  }

  // Création de produit
  private async createProduct(product: ShopifyProduct): Promise<ShopifyProduct> {
    const response = await this.makeRequest('/products.json', {
      method: 'POST',
      body: JSON.stringify({ product })
    })

    const data = await response.json()
    if (data.errors) {
      throw new Error(`Shopify API error: ${JSON.stringify(data.errors)}`)
    }

    console.log(`Created Shopify product: ${data.product.title}`)
    return data.product
  }

  // Mise à jour de produit
  private async updateProduct(productId: number, product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const response = await this.makeRequest(`/products/${productId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ product })
    })

    const data = await response.json()
    if (data.errors) {
      throw new Error(`Shopify API error: ${JSON.stringify(data.errors)}`)
    }

    console.log(`Updated Shopify product: ${data.product.title}`)
    return data.product
  }

  // Recherche par SKU
  private async findProductBySku(sku: string): Promise<ShopifyProduct | null> {
    if (!sku) return null

    try {
      const response = await this.makeRequest(`/products.json?fields=id,title,variants&limit=250`)
      const data = await response.json()

      for (const product of data.products) {
        const variant = product.variants.find((v: any) => v.sku === sku)
        if (variant) {
          return product
        }
      }

      return null
    } catch (error) {
      console.error('Failed to search product by SKU:', error)
      return null
    }
  }

  // Mise à jour du stock via inventory_levels
  async updateInventory(sku: string, quantity: number): Promise<void> {
    try {
      const product = await this.findProductBySku(sku)
      if (!product) {
        throw new Error(`Product with SKU ${sku} not found`)
      }

      const variant = product.variants.find((v: any) => v.sku === sku)
      if (!variant) {
        throw new Error(`Variant with SKU ${sku} not found`)
      }

      // Récupérer l'inventory item ID
      const inventoryResponse = await this.makeRequest(`/variants/${variant.id}.json`)
      const inventoryData = await inventoryResponse.json()
      const inventoryItemId = inventoryData.variant.inventory_item_id

      // Récupérer les locations d'inventaire
      const locationsResponse = await this.makeRequest('/locations.json')
      const locationsData = await locationsResponse.json()
      const primaryLocation = locationsData.locations[0]

      // Mettre à jour le stock via inventory_levels
      await this.makeRequest('/inventory_levels/set.json', {
        method: 'POST',
        body: JSON.stringify({
          location_id: primaryLocation.id,
          inventory_item_id: inventoryItemId,
          available: quantity
        })
      })

      console.log(`Updated inventory for SKU ${sku}: ${quantity} units`)
    } catch (error) {
      console.error('Failed to update inventory:', error)
      throw error
    }
  }

  // Mise à jour de l'inventaire en masse
  async bulkUpdateInventory(items: Array<{sku: string, quantity: number}>): Promise<void> {
    for (const item of items) {
      try {
        await this.updateInventory(item.sku, item.quantity)
        await new Promise(resolve => setTimeout(resolve, 500)) // Rate limiting
      } catch (error) {
        console.error(`Failed to update inventory for SKU ${item.sku}:`, error)
      }
    }
  }

  // Récupération des commandes
  async fetchOrders(options: {
    status?: string
    limit?: number
    since?: Date
  } = {}): Promise<ShopifyOrder[]> {
    try {
      const params = new URLSearchParams()
      if (options.status) params.append('status', options.status)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.since) params.append('created_at_min', options.since.toISOString())

      const response = await this.makeRequest(`/orders.json?${params}`)
      const data = await response.json()

      return data.orders || []
    } catch (error) {
      console.error('Failed to fetch Shopify orders:', error)
      throw error
    }
  }

  // Mise à jour du statut d'une commande
  async updateOrderFulfillment(orderId: number, trackingNumber?: string): Promise<void> {
    try {
      // Récupérer les line items de la commande
      const orderResponse = await this.makeRequest(`/orders/${orderId}.json`)
      const orderData = await orderResponse.json()

      const lineItems = orderData.order.line_items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity
      }))

      // Créer le fulfillment
      const fulfillmentData: any = {
        location_id: null, // Utilise la location par défaut
        line_items: lineItems,
        notify_customer: true
      }

      if (trackingNumber) {
        fulfillmentData.tracking_number = trackingNumber
        fulfillmentData.tracking_company = 'Other'
      }

      await this.makeRequest(`/orders/${orderId}/fulfillments.json`, {
        method: 'POST',
        body: JSON.stringify({ fulfillment: fulfillmentData })
      })

      console.log(`Updated fulfillment for order ${orderId}`)
    } catch (error) {
      console.error('Failed to update order fulfillment:', error)
      throw error
    }
  }

  // Synchronisation bidirectionnelle
  async syncProducts(localProducts: any[]): Promise<void> {
    console.log(`Syncing ${localProducts.length} products to Shopify`)

    for (const localProduct of localProducts) {
      try {
        const shopifyProduct: ShopifyProduct = this.transformToShopifyProduct(localProduct)
        await this.createOrUpdateProduct(shopifyProduct)

        // Mettre à jour le statut local
        await supabase
          .from('imported_products')
          .update({ 
            published_at: new Date().toISOString(),
            status: 'published'
          })
          .eq('id', localProduct.id)

      } catch (error) {
        console.error(`Failed to sync product ${localProduct.id}:`, error)
        
        // Marquer comme erreur de sync
        await supabase
          .from('imported_products')
          .update({ status: 'error' })
          .eq('id', localProduct.id)
      }
    }
  }

  // Transformation des données locales vers Shopify
  private transformToShopifyProduct(localProduct: any): ShopifyProduct {
    return {
      title: localProduct.name,
      body_html: localProduct.description || '',
      vendor: localProduct.brand || localProduct.supplier_name || 'Unknown',
      product_type: localProduct.category || 'General',
      tags: (localProduct.tags || []).join(', '),
      status: 'active',
      images: (localProduct.image_urls || []).map((url: string, index: number) => ({
        src: url,
        alt: localProduct.name,
        position: index + 1
      })),
      variants: [{
        title: 'Default Title',
        price: localProduct.price?.toString() || '0',
        compare_at_price: localProduct.compare_at_price?.toString(),
        sku: localProduct.sku,
        inventory_quantity: localProduct.stock_quantity || 0,
        weight: localProduct.weight,
        weight_unit: 'kg'
      }],
      metafields: [
        {
          namespace: 'dropcraft',
          key: 'supplier_name',
          value: localProduct.supplier_name || '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'dropcraft',
          key: 'cost_price',
          value: localProduct.cost_price?.toString() || '',
          type: 'single_line_text_field'
        }
      ]
    }
  }

  // Webhook handlers avec products et inventory
  async handleWebhook(webhookType: string, payload: any): Promise<void> {
    switch (webhookType) {
      case 'orders/create':
        await this.handleNewOrder(payload)
        break
      case 'orders/updated':
        await this.handleOrderUpdate(payload)
        break
      case 'orders/paid':
        await this.handleOrderPaid(payload)
        break
      case 'products/update':
        await this.handleProductUpdate(payload)
        break
      case 'inventory_levels/update':
        await this.handleInventoryUpdate(payload)
        break
      default:
        console.log(`Unhandled webhook type: ${webhookType}`)
    }
  }

  private async handleProductUpdate(product: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Synchroniser le produit mis à jour
      await supabase.from('imported_products').upsert({
        user_id: user.id,
        name: product.title,
        description: product.body_html,
        price: parseFloat(product.variants[0]?.price || '0'),
        sku: product.variants[0]?.sku,
        image_urls: product.images?.map((img: any) => img.src) || [],
        supplier_name: 'Shopify',
        updated_at: new Date().toISOString()
      })

      console.log(`Synchronized updated product: ${product.title}`)
    } catch (error) {
      console.error('Failed to handle product update:', error)
    }
  }

  private async handleInventoryUpdate(inventoryLevel: any): Promise<void> {
    try {
      // Mettre à jour le stock local
      const { data: products } = await supabase
        .from('imported_products')
        .select('*')
        .eq('supplier_name', 'Shopify')

      // Trouver et mettre à jour le produit correspondant
      for (const product of products || []) {
        // Logic to match inventory_item_id with product would go here
        // This is a simplified version
        await supabase
          .from('imported_products')
          .update({ 
            stock_quantity: inventoryLevel.available,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
      }

      console.log(`Updated inventory level: ${inventoryLevel.available}`)
    } catch (error) {
      console.error('Failed to handle inventory update:', error)
    }
  }

  private async handleNewOrder(order: ShopifyOrder): Promise<void> {
    // Enregistrer la commande localement
    await supabase.from('orders').insert({
      order_number: order.name || `SHOP-${order.id}`,
      total_amount: parseFloat(order.total_price),
      status: 'pending',
      shipping_address: order.shipping_address,
      user_id: (await supabase.auth.getUser()).data.user?.id || ''
    })

    console.log(`Imported Shopify order: ${order.name}`)
  }

  private async handleOrderUpdate(order: ShopifyOrder): Promise<void> {
    await supabase
      .from('orders')
      .update({
        status: order.fulfillment_status || 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('order_number', order.name || `SHOP-${order.id}`)
  }

  private async handleOrderPaid(order: ShopifyOrder): Promise<void> {
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('order_number', order.name || `SHOP-${order.id}`)
  }

  // Utilitaire pour les requêtes API
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.credentials.accessToken,
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return response
  }
}