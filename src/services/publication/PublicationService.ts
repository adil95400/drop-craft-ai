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
    let query = supabase
      .from('published_products')
      .select(`
        *,
        imported_products (
          id,
          name,
          sku,
          price,
          stock_quantity,
          image_urls
        )
      `)
      .order('published_at', { ascending: false })

    if (marketplaceId) {
      query = query.eq('marketplace_id', marketplaceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching published products:', error)
      return []
    }

    return data || []
  }

  async unpublishProduct(productId: string, marketplaceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('published_products')
        .update({ status: 'inactive', unpublished_at: new Date().toISOString() })
        .eq('product_id', productId)
        .eq('marketplace_id', marketplaceId)

      if (error) throw error

      // Logger l'activité
      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        action: 'unpublish_product',
        description: `Unpublished product from ${marketplaceId}`,
        metadata: { product_id: productId, marketplace_id: marketplaceId }
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
      const { data: product } = await supabase
        .from('imported_products')
        .select('stock_quantity')
        .eq('id', productId)
        .single()

      if (!product) throw new Error('Product not found')

      // Récupérer les publications
      let query = supabase
        .from('published_products')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'active')

      if (marketplaceIds) {
        query = query.in('marketplace_id', marketplaceIds)
      }

      const { data: publications } = await query

      if (!publications || publications.length === 0) return

      // Synchroniser le stock sur chaque marketplace
      for (const pub of publications) {
        await supabase.functions.invoke('marketplace-sync', {
          body: {
            integrationId: pub.marketplace_id,
            type: 'stock',
            products: [{
              sku: pub.external_listing_id,
              quantity: product.stock_quantity
            }]
          }
        })
      }
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
    const { data: publications } = await supabase
      .from('published_products')
      .select('marketplace_id, status')

    const stats = {
      totalPublished: publications?.length || 0,
      activeListings: publications?.filter(p => p.status === 'active').length || 0,
      byMarketplace: {} as Record<string, number>
    }

    publications?.forEach(pub => {
      stats.byMarketplace[pub.marketplace_id] = (stats.byMarketplace[pub.marketplace_id] || 0) + 1
    })

    return stats
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const publicationService = PublicationService.getInstance()
