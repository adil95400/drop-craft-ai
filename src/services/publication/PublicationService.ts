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
    const { data: products } = await supabase
      .from('imported_products')
      .select('id, name')
      .in('id', productIds)

    const productMap = new Map(products?.map(p => [p.id, p.name]) || [])

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
    // TODO: Implement when published_products table is created
    console.log('getPublishedProducts not yet implemented')
    return []
  }

  async unpublishProduct(productId: string, marketplaceId: string): Promise<boolean> {
    // TODO: Implement when published_products table is created
    console.log('unpublishProduct not yet implemented')
    return true
  }

  async syncInventory(productId: string, marketplaceIds?: string[]): Promise<void> {
    // TODO: Implement when published_products table is created
    console.log('syncInventory not yet implemented')
  }

  async getPublicationStats(): Promise<{
    totalPublished: number
    activeListings: number
    byMarketplace: Record<string, number>
  }> {
    // TODO: Implement when published_products table is created
    return {
      totalPublished: 0,
      activeListings: 0,
      byMarketplace: {}
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const publicationService = PublicationService.getInstance()
