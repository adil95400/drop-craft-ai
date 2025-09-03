import { MarketplaceConnector, MarketplaceCredentials, MarketplaceListing, MarketplaceOrder } from './MarketplaceConnector'
import { SupplierProduct } from '@/types/suppliers'

interface AmazonCredentials extends MarketplaceCredentials {
  marketplace: 'amazon'
  accessKeyId: string
  secretAccessKey: string
  roleArn: string
  marketplaceId: string
  refreshToken: string
}

interface AmazonProduct {
  asin?: string
  sku: string
  title: string
  description: string
  price: string
  quantity: number
  product_type: string
  category: string
  brand: string
  images: Array<{
    url: string
    variant: 'Main' | 'PT01' | 'PT02'
  }>
  attributes: Record<string, any>
  fulfillment_channel: 'DEFAULT' | 'AMAZON_NA'
}

export class AmazonConnector extends MarketplaceConnector {
  constructor(credentials: AmazonCredentials) {
    super(credentials, 'https://sellingpartnerapi-na.amazon.com')
  }

  protected getSupplierName(): string {
    return 'Amazon'
  }

  protected getAuthHeaders(): Record<string, string> {
    // Amazon SP-API requires AWS Signature Version 4
    // This is a simplified version - in production, use proper AWS SDK
    return {
      'Content-Type': 'application/json',
      'X-Amz-Access-Token': this.getAccessToken(),
      'Authorization': this.generateAwsAuth()
    }
  }

  private getAccessToken(): string {
    // In production, implement proper LWA token refresh
    return 'ACCESS_TOKEN'
  }

  private generateAwsAuth(): string {
    // In production, implement proper AWS Signature Version 4
    return 'AWS4-HMAC-SHA256 Credential=...'
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/seller/v1/marketplaceParticipations')
      return true
    } catch (error) {
      console.error('Amazon credentials validation failed:', error)
      return false
    }
  }

  async fetchProducts(options?: {
    page?: number
    limit?: number
    lastSync?: Date
  }): Promise<SupplierProduct[]> {
    const params = new URLSearchParams({
      MarketplaceIds: (this.credentials as AmazonCredentials).marketplaceId,
      MaxResults: (options?.limit || 100).toString()
    })

    if (options?.page && options.page > 1) {
      params.append('NextToken', `page_${options.page}`)
    }

    const response = await this.makeRequest(`/catalog/2022-04-01/items?${params}`)
    const items = response.items || []

    return items.map((item: any) => this.transformProduct(item))
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/catalog/2022-04-01/items/${sku}`, {
        headers: {
          ...this.getAuthHeaders(),
          'MarketplaceIds': (this.credentials as AmazonCredentials).marketplaceId
        }
      })

      return this.transformProduct(response)
    } catch (error) {
      console.error('Error fetching Amazon product:', error)
      return null
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<import('./BaseConnector').SyncResult> {
    let imported = 0
    const errors: string[] = []

    // Amazon uses feeds for bulk operations
    const feedData = this.generateInventoryFeed(products)
    
    try {
      const feedResponse = await this.makeRequest('/feeds/2021-06-30/feeds', {
        method: 'POST',
        body: JSON.stringify({
          feedType: 'POST_INVENTORY_AVAILABILITY_DATA',
          marketplaceIds: [(this.credentials as AmazonCredentials).marketplaceId],
          inputFeedDocumentId: await this.uploadFeedDocument(feedData)
        })
      })

      // Poll for feed processing result
      const feedResult = await this.pollFeedResult(feedResponse.feedId)
      imported = feedResult.success
      errors.push(...feedResult.errors)

    } catch (error) {
      console.error('Amazon inventory update failed:', error)
      errors.push(error.message)
    }

    return {
      total: products.length,
      imported,
      duplicates: 0,
      errors
    }
  }

  async createListing(product: MarketplaceListing): Promise<any> {
    const amazonProduct = this.transformToAmazonProduct(product)
    
    // Create listing via Product Type Definitions API
    const feedData = this.generateProductFeed([amazonProduct])
    
    const feedResponse = await this.makeRequest('/feeds/2021-06-30/feeds', {
      method: 'POST',
      body: JSON.stringify({
        feedType: 'POST_PRODUCT_DATA',
        marketplaceIds: [(this.credentials as AmazonCredentials).marketplaceId],
        inputFeedDocumentId: await this.uploadFeedDocument(feedData)
      })
    })

    return await this.pollFeedResult(feedResponse.feedId)
  }

  async updateListing(listingId: string, updates: Partial<MarketplaceListing>): Promise<any> {
    const updateData = this.transformToAmazonProduct(updates as MarketplaceListing)
    
    const feedData = this.generateProductFeed([{ ...updateData, sku: listingId }])
    
    const feedResponse = await this.makeRequest('/feeds/2021-06-30/feeds', {
      method: 'POST',
      body: JSON.stringify({
        feedType: 'POST_PRODUCT_DATA',
        marketplaceIds: [(this.credentials as AmazonCredentials).marketplaceId],
        inputFeedDocumentId: await this.uploadFeedDocument(feedData)
      })
    })

    return await this.pollFeedResult(feedResponse.feedId)
  }

  async deleteListing(listingId: string): Promise<void> {
    const feedData = this.generateDeleteFeed([listingId])
    
    await this.makeRequest('/feeds/2021-06-30/feeds', {
      method: 'POST',
      body: JSON.stringify({
        feedType: 'POST_PRODUCT_DATA',
        marketplaceIds: [(this.credentials as AmazonCredentials).marketplaceId],
        inputFeedDocumentId: await this.uploadFeedDocument(feedData)
      })
    })
  }

  async getListingFees(product: MarketplaceListing): Promise<MarketplaceListing['fees']> {
    try {
      const response = await this.makeRequest('/products/fees/v0/listings/my-fees', {
        method: 'POST',
        body: JSON.stringify({
          FeesEstimateRequest: {
            MarketplaceId: (this.credentials as AmazonCredentials).marketplaceId,
            IsAmazonFulfilled: product.fulfillment === 'marketplace',
            PriceToEstimateFees: {
              ListingPrice: { CurrencyCode: 'USD', Amount: product.price }
            },
            Identifier: product.sku
          }
        })
      })

      const fees = response.payload.FeesEstimate.TotalFeesEstimate
      
      return {
        commission: parseFloat(fees.Amount),
        listing: 0, // Amazon doesn't charge listing fees
        shipping: 0 // Included in commission
      }
    } catch (error) {
      console.error('Error fetching Amazon fees:', error)
      return { commission: product.price * 0.15 } // Default 15% commission
    }
  }

  async fetchOrders(options?: { status?: string; limit?: number; since?: Date }): Promise<MarketplaceOrder[]> {
    const params = new URLSearchParams({
      MarketplaceIds: (this.credentials as AmazonCredentials).marketplaceId,
      MaxResultsPerPage: (options?.limit || 100).toString()
    })

    if (options?.since) {
      params.append('CreatedAfter', options.since.toISOString())
    }

    if (options?.status) {
      params.append('OrderStatuses', options.status)
    }

    const response = await this.makeRequest(`/orders/v0/orders?${params}`)
    const orders = response.payload.Orders || []

    return orders.map((order: any) => this.transformOrder(order))
  }

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<void> {
    if (trackingNumber) {
      await this.makeRequest(`/orders/v0/orders/${orderId}/shipment`, {
        method: 'POST',
        body: JSON.stringify({
          packageDetail: {
            packageReferenceId: `PKG-${Date.now()}`,
            carrierCode: 'UPS',
            trackingNumber: trackingNumber,
            shipDate: new Date().toISOString()
          }
        })
      })
    }
  }

  protected async updateListingInventory(sku: string, quantity: number): Promise<void> {
    const feedData = this.generateInventoryFeed([{ sku, stock: quantity } as any])
    
    const feedResponse = await this.makeRequest('/feeds/2021-06-30/feeds', {
      method: 'POST',
      body: JSON.stringify({
        feedType: 'POST_INVENTORY_AVAILABILITY_DATA',
        marketplaceIds: [(this.credentials as AmazonCredentials).marketplaceId],
        inputFeedDocumentId: await this.uploadFeedDocument(feedData)
      })
    })

    await this.pollFeedResult(feedResponse.feedId)
  }

  // Helper methods
  private generateInventoryFeed(products: SupplierProduct[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
    xml += '<Header><DocumentVersion>1.01</DocumentVersion><MerchantIdentifier>MERCHANT_ID</MerchantIdentifier></Header>\n'
    xml += '<MessageType>Inventory</MessageType>\n'
    
    products.forEach((product, index) => {
      xml += `<Message><MessageID>${index + 1}</MessageID>\n`
      xml += `<Inventory><SKU>${product.sku}</SKU><Quantity>${product.stock}</Quantity></Inventory>\n`
      xml += '</Message>\n'
    })
    
    xml += '</AmazonEnvelope>'
    return xml
  }

  private generateProductFeed(products: AmazonProduct[]): string {
    // Generate Amazon Product Feed XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
    xml += '<Header><DocumentVersion>1.01</DocumentVersion><MerchantIdentifier>MERCHANT_ID</MerchantIdentifier></Header>\n'
    xml += '<MessageType>Product</MessageType>\n'
    
    products.forEach((product, index) => {
      xml += `<Message><MessageID>${index + 1}</MessageID>\n`
      xml += `<Product><SKU>${product.sku}</SKU><ProductTaxCode>A_GEN_NOTAX</ProductTaxCode>\n`
      xml += `<DescriptionData><Title>${product.title}</Title><Description>${product.description}</Description></DescriptionData>\n`
      xml += '</Product></Message>\n'
    })
    
    xml += '</AmazonEnvelope>'
    return xml
  }

  private generateDeleteFeed(skus: string[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
    xml += '<Header><DocumentVersion>1.01</DocumentVersion><MerchantIdentifier>MERCHANT_ID</MerchantIdentifier></Header>\n'
    xml += '<MessageType>Product</MessageType>\n'
    
    skus.forEach((sku, index) => {
      xml += `<Message><MessageID>${index + 1}</MessageID>\n`
      xml += `<Product><SKU>${sku}</SKU><StandardProductID><Type>UPC</Type><Value>DELETE</Value></StandardProductID></Product>\n`
      xml += '</Message>\n'
    })
    
    xml += '</AmazonEnvelope>'
    return xml
  }

  private async uploadFeedDocument(feedData: string): Promise<string> {
    // Upload feed document and return document ID
    const response = await this.makeRequest('/feeds/2021-06-30/documents', {
      method: 'POST',
      body: JSON.stringify({
        contentType: 'text/xml'
      })
    })

    // Upload to S3 URL
    await fetch(response.url, {
      method: 'PUT',
      body: feedData,
      headers: { 'Content-Type': 'text/xml' }
    })

    return response.feedDocumentId
  }

  private async pollFeedResult(feedId: string): Promise<{ success: number; errors: string[] }> {
    // Poll feed processing status
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      await this.delay(10000) // Wait 10 seconds
      
      const status = await this.makeRequest(`/feeds/2021-06-30/feeds/${feedId}`)
      
      if (status.processingStatus === 'DONE') {
        return { success: 1, errors: [] }
      } else if (status.processingStatus === 'FATAL') {
        return { success: 0, errors: ['Feed processing failed'] }
      }
      
      attempts++
    }

    return { success: 0, errors: ['Feed processing timeout'] }
  }

  protected transformProduct(product: any): SupplierProduct {
    return {
      id: product.asin,
      sku: product.sku || product.asin,
      title: product.summaries?.[0]?.itemName || '',
      description: product.summaries?.[0]?.itemDescription || '',
      price: parseFloat(product.offers?.[0]?.buyingPrice?.amount || '0'),
      currency: product.offers?.[0]?.buyingPrice?.currencyCode || 'USD',
      category: product.summaries?.[0]?.browseClassification?.displayName || '',
      brand: product.summaries?.[0]?.brand || '',
      images: product.images?.map((img: any) => img.link) || [],
      stock: product.offers?.[0]?.fulfillmentChannels?.[0]?.inventory?.quantity || 0,
      attributes: {},
      supplier: {
        id: 'amazon',
        name: 'Amazon',
        sku: product.sku || product.asin
      }
    }
  }

  private transformToAmazonProduct(product: MarketplaceListing): AmazonProduct {
    return {
      sku: product.sku,
      title: product.title,
      description: this.formatDescription(product.description, 2000),
      price: product.price.toString(),
      quantity: product.quantity,
      product_type: 'PRODUCT',
      category: this.mapCategory(product.category),
      brand: product.attributes.brand || 'Generic',
      images: product.images.map((url, index) => ({
        url,
        variant: index === 0 ? 'Main' : `PT0${index}` as any
      })),
      attributes: product.attributes,
      fulfillment_channel: product.fulfillment === 'marketplace' ? 'AMAZON_NA' : 'DEFAULT'
    }
  }

  private transformOrder(order: any): MarketplaceOrder {
    return {
      id: order.AmazonOrderId,
      marketplace_order_id: order.AmazonOrderId,
      status: order.OrderStatus,
      items: order.OrderItems?.map((item: any) => ({
        sku: item.SellerSKU,
        title: item.Title,
        quantity: item.QuantityOrdered,
        price: parseFloat(item.ItemPrice?.Amount || '0')
      })) || [],
      shipping_address: order.DefaultShipFromLocationAddress,
      total_amount: parseFloat(order.OrderTotal?.Amount || '0'),
      fees: parseFloat(order.MarketplaceFee?.Amount || '0'),
      created_at: order.PurchaseDate
    }
  }

  protected async handleOrderCreated(order: any): Promise<void> {
    console.log(`New Amazon order: ${order.AmazonOrderId}`)
  }

  protected async handleOrderUpdated(order: any): Promise<void> {
    console.log(`Amazon order updated: ${order.AmazonOrderId}`)
  }

  protected async handleListingUpdated(listing: any): Promise<void> {
    console.log(`Amazon listing updated: ${listing.sku}`)
  }

  protected async handleInventoryUpdated(inventory: any): Promise<void> {
    console.log(`Amazon inventory updated: ${inventory.sku}`)
  }
}