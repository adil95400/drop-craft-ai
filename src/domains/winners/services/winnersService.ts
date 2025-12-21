import { supabase } from '@/integrations/supabase/client'
import { WinnersResponse, WinnersSearchParams, WinnerProduct } from '../types'

export class WinnersService {
  private static instance: WinnersService
  private cache = new Map<string, { data: WinnersResponse; timestamp: number }>()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutes

  public static getInstance(): WinnersService {
    if (!WinnersService.instance) {
      WinnersService.instance = new WinnersService()
    }
    return WinnersService.instance
  }

  async searchWinners(params: WinnersSearchParams): Promise<WinnersResponse> {
    const cacheKey = JSON.stringify(params)
    const cached = this.cache.get(cacheKey)
    
    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      const { data, error } = await supabase.functions.invoke('winners-aggregator', {
        body: {
          q: params.query,
          category: params.category || '',
          limit: params.limit || 30,
          sources: params.sources || ['trends', 'ebay', 'amazon'],
          min_score: params.minScore,
          max_price: params.maxPrice
        }
      })

      if (error) throw error

      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      
      return data
    } catch (error) {
      console.error('Winners search failed:', error)
      throw error
    }
  }

  async analyzeTrends(keyword: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('winners-trends', {
        body: { q: keyword, limit: 10 }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Trends analysis failed:', error)
      throw error
    }
  }

  async importProduct(product: WinnerProduct): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Calculate estimated cost (30% margin)
      const estimatedCost = product.price * 0.7

      const { data, error } = await supabase
        .from('products')
        .insert([{
          user_id: user.id,
          title: product.title,
          name: product.title,
          description: `Produit gagnant importé depuis ${product.source}`,
          price: product.price,
          cost_price: estimatedCost,
          category: product.category || 'Imported Winners',
          supplier: product.source,
          supplier_url: product.url,
          image_url: product.image,
          tags: product.tags || ['winner', 'imported', product.source],
          status: 'active',
          sku: `WIN-${Date.now()}`,
          stock_quantity: 100
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Product import failed:', error)
      throw error
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const winnersService = WinnersService.getInstance()