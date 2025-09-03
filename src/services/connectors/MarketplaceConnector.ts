import { BaseConnector } from './BaseConnector'
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers'

// Common interface for marketplace connectors
export interface MarketplaceCredentials extends SupplierCredentials {
  marketplace: 'amazon' | 'ebay' | 'cdiscount'
  sellerId: string
  region?: string
  environment?: 'sandbox' | 'production'
}

export interface MarketplaceListing {
  id: string
  sku: string
  title: string
  description: string
  price: number
  quantity: number
  category: string
  images: string[]
  attributes: Record<string, any>
  status: 'active' | 'inactive' | 'pending'
  fees: {
    listing?: number
    commission?: number
    shipping?: number
  }
  fulfillment: 'merchant' | 'marketplace'
}

export interface MarketplaceOrder {
  id: string
  marketplace_order_id: string
  status: string
  items: Array<{
    sku: string
    title: string
    quantity: number
    price: number
  }>
  shipping_address: any
  total_amount: number
  fees: number
  created_at: string
}

export abstract class MarketplaceConnector extends BaseConnector {
  protected marketplace: string

  constructor(credentials: MarketplaceCredentials, baseUrl: string) {
    super(credentials, baseUrl)
    this.marketplace = credentials.marketplace
  }

  // Abstract methods for marketplace-specific implementation
  abstract validateCredentials(): Promise<boolean>
  abstract fetchProducts(options?: any): Promise<SupplierProduct[]>
  abstract fetchProduct(sku: string): Promise<SupplierProduct | null>
  abstract updateInventory(products: SupplierProduct[]): Promise<import('./BaseConnector').SyncResult>
  
  // Common marketplace methods
  abstract createListing(product: MarketplaceListing): Promise<any>
  abstract updateListing(listingId: string, updates: Partial<MarketplaceListing>): Promise<any>
  abstract deleteListing(listingId: string): Promise<void>
  abstract getListingFees(product: MarketplaceListing): Promise<MarketplaceListing['fees']>
  abstract fetchOrders(options?: { status?: string; limit?: number; since?: Date }): Promise<MarketplaceOrder[]>
  abstract updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<void>

  // Common utility methods
  protected calculateProfitMargin(sellingPrice: number, costPrice: number, fees: MarketplaceListing['fees']): number {
    const totalFees = (fees.listing || 0) + (fees.commission || 0) + (fees.shipping || 0)
    const profit = sellingPrice - costPrice - totalFees
    return costPrice > 0 ? (profit / costPrice) * 100 : 0
  }

  protected optimizePricing(costPrice: number, targetMargin: number, fees: MarketplaceListing['fees']): number {
    const totalFees = (fees.listing || 0) + (fees.commission || 0) + (fees.shipping || 0)
    const targetProfit = costPrice * (targetMargin / 100)
    return costPrice + targetProfit + totalFees
  }

  protected formatDescription(description: string, maxLength: number = 2000): string {
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength - 3) + '...'
  }

  protected mapCategory(localCategory: string): string {
    // Override in specific marketplace connectors
    return localCategory
  }

  // Common webhook handling
  async handleWebhook(webhookType: string, payload: any): Promise<void> {
    switch (webhookType) {
      case 'order_created':
        await this.handleOrderCreated(payload)
        break
      case 'order_updated':
        await this.handleOrderUpdated(payload)
        break
      case 'listing_updated':
        await this.handleListingUpdated(payload)
        break
      case 'inventory_updated':
        await this.handleInventoryUpdated(payload)
        break
      default:
        console.log(`Unhandled ${this.marketplace} webhook: ${webhookType}`)
    }
  }

  protected abstract handleOrderCreated(order: any): Promise<void>
  protected abstract handleOrderUpdated(order: any): Promise<void>
  protected abstract handleListingUpdated(listing: any): Promise<void>
  protected abstract handleInventoryUpdated(inventory: any): Promise<void>

  // Batch operations
  async batchCreateListings(products: MarketplaceListing[]): Promise<{ success: number; errors: string[] }> {
    let success = 0
    const errors: string[] = []

    for (const product of products) {
      try {
        await this.createListing(product)
        success++
        // Rate limiting
        await this.delay(1000)
      } catch (error) {
        errors.push(`${product.sku}: ${error.message}`)
      }
    }

    return { success, errors }
  }

  async batchUpdateInventory(updates: Array<{ sku: string; quantity: number }>): Promise<{ success: number; errors: string[] }> {
    let success = 0
    const errors: string[] = []

    for (const update of updates) {
      try {
        await this.updateListingInventory(update.sku, update.quantity)
        success++
        await this.delay(500)
      } catch (error) {
        errors.push(`${update.sku}: ${error.message}`)
      }
    }

    return { success, errors }
  }

  protected abstract updateListingInventory(sku: string, quantity: number): Promise<void>

  // Performance analytics
  async getPerformanceMetrics(period: 'day' | 'week' | 'month' = 'month'): Promise<{
    sales: number
    revenue: number
    fees: number
    profit: number
    orders: number
    listings: number
    conversion_rate: number
  }> {
    // Override in specific marketplace connectors
    return {
      sales: 0,
      revenue: 0,
      fees: 0,
      profit: 0,
      orders: 0,
      listings: 0,
      conversion_rate: 0
    }
  }
}