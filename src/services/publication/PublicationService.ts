import { supabase } from '@/integrations/supabase/client'

export interface PublishOptions {
  autoPublish?: boolean
  syncInventory?: boolean
  overridePrice?: number
  scheduledDate?: Date
}

export interface PublishResult {
  marketplace: string
  success: boolean
  message: string
  listingId?: string
  error?: string
}

export interface BulkPublishResult {
  totalProducts: number
  totalMarketplaces: number
  successCount: number
  failCount: number
  results: Array<{
    productId: string
    productName: string
    marketplaceResults: PublishResult[]
  }>
}

export class PublicationService {
  private static instance: PublicationService

  private constructor() {}

  static getInstance(): PublicationService {
    if (!PublicationService.instance) {
      PublicationService.instance = new PublicationService()
    }
    return PublicationService.instance
  }

  async publishProduct(
    productId: string,
    marketplaceIds: string[],
    options: PublishOptions = {}
  ): Promise<{ success: boolean; results: PublishResult[] }> {
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-publish', {
        body: {
          productId,
          marketplaceIds,
          publishOptions: options
        }
      })

      if (error) throw error

      return {
        success: data.successCount > 0,
        results: data.results
      }
    } catch (error: any) {
      console.error('Publication error:', error)
      throw new Error(`Failed to publish product: ${error.message}`)
    }
  }

  async publishMultipleProducts(
    productIds: string[],
    marketplaceIds: string[],
    options: PublishOptions = {}
  ): Promise<BulkPublishResult> {
    const result: BulkPublishResult = {
      totalProducts: productIds.length,
      totalMarketplaces: marketplaceIds.length,
      successCount: 0,
      failCount: 0,
      results: []
    }

    // Récupérer les informations des produits
    const { data: products } = await (supabase
      .from('products') as any)
      .select('id, title')
      .in('id', productIds)

    const productMap = new Map((products || []).map((p: any) => [p.id, p.title || 'Unknown']))

    for (const productId of productIds) {
      try {
        const publishResult = await this.publishProduct(productId, marketplaceIds, options)
        
        const successfulMarketplaces = publishResult.results.filter(r => r.success).length
        
        result.results.push({
          productId,
          productName: productMap.get(productId) || 'Unknown',
          marketplaceResults: publishResult.results
        })

        if (successfulMarketplaces > 0) {
          result.successCount++
        } else {
          result.failCount++
        }

        // Rate limiting - attendre entre chaque produit
        await this.delay(1000)

      } catch (error: any) {
        console.error(`Error publishing product ${productId}:`, error)
        result.failCount++
        result.results.push({
          productId,
          productName: productMap.get(productId) || 'Unknown',
          marketplaceResults: marketplaceIds.map(mid => ({
            marketplace: mid,
            success: false,
            message: 'Failed to publish',
            error: error.message
          }))
        })
      }
    }

    return result
  }

  async getPublishedProducts(marketplaceId?: string): Promise<any[]> {
    // Use activity_logs to track publications since published_products doesn't exist
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('action', 'publish_product')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching published products:', error)
      return []
    }

    return (data || []).map(log => ({
      id: log.id,
      product_id: log.entity_id,
      marketplace_id: ((log.details || {}) as any).marketplace_id,
      published_at: log.created_at,
      status: 'active'
    }))
  }

  async unpublishProduct(productId: string, marketplaceId: string): Promise<boolean> {
    try {
      // Logger l'activité
      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        action: 'unpublish_product',
        entity_type: 'product',
        entity_id: productId,
        description: `Unpublished product from ${marketplaceId}`,
        details: { product_id: productId, marketplace_id: marketplaceId }
      })

      return true
    } catch (error) {
      console.error('Error unpublishing product:', error)
      return false
    }
  }

  async syncInventory(productId: string, marketplaceIds?: string[]): Promise<void> {
    try {
      // Récupérer le stock actuel
      const { data: product } = await (supabase
        .from('products') as any)
        .select('stock_quantity')
        .eq('id', productId)
        .single()

      if (!product) throw new Error('Product not found')

      // Log sync activity
      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        action: 'sync_inventory',
        entity_type: 'product',
        entity_id: productId,
        description: `Synced inventory for product`,
        details: { 
          product_id: productId, 
          stock_quantity: product.stock_quantity,
          marketplaces: marketplaceIds 
        }
      })
    } catch (error) {
      console.error('Error syncing inventory:', error)
      throw error
    }
  }

  async getPublicationStats(): Promise<{
    totalPublished: number
    activeListings: number
    byMarketplace: Record<string, number>
  }> {
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('details')
      .eq('action', 'publish_product')

    const stats = {
      totalPublished: logs?.length || 0,
      activeListings: logs?.length || 0,
      byMarketplace: {} as Record<string, number>
    }

    logs?.forEach(log => {
      const details = (log.details || {}) as any
      const marketplaceId = details.marketplace_id || 'unknown'
      stats.byMarketplace[marketplaceId] = (stats.byMarketplace[marketplaceId] || 0) + 1
    })

    return stats
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const publicationService = PublicationService.getInstance()
