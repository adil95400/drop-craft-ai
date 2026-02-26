/**
 * @module WinnersService
 * @description Service for discovering and importing winning products.
 *
 * Uses a singleton pattern with an in-memory cache (5 min TTL) to avoid
 * redundant calls to the `winners-aggregator` and `winners-trends` edge functions.
 *
 * Key capabilities:
 *  - Multi-source search (Google Trends, eBay, Amazon)
 *  - Trend analysis by keyword
 *  - One-click product import into the user's catalog
 */
import { supabase } from '@/integrations/supabase/client'
import { WinnersResponse, WinnersSearchParams, WinnerProduct } from '../types'

export class WinnersService {
  private static instance: WinnersService
  /** In-memory response cache keyed by serialized search params. */
  private cache = new Map<string, { data: WinnersResponse; timestamp: number }>()
  /** Cache entries expire after 5 minutes. */
  private readonly cacheTimeout = 5 * 60 * 1000

  /** Get or create the singleton instance. */
  public static getInstance(): WinnersService {
    if (!WinnersService.instance) {
      WinnersService.instance = new WinnersService()
    }
    return WinnersService.instance
  }

  /**
   * Search for winning products across multiple data sources.
   * Results are cached for {@link cacheTimeout} ms.
   *
   * @param params - Search criteria (query, category, limits, sources, filters).
   * @returns Aggregated response with scored product results.
   */
  async searchWinners(params: WinnersSearchParams): Promise<WinnersResponse> {
    const cacheKey = JSON.stringify(params)
    const cached = this.cache.get(cacheKey)
    
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

      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      console.error('Winners search failed:', error)
      throw error
    }
  }

  /**
   * Analyze trending keywords and their momentum.
   * @param keyword - The keyword or niche to analyze.
   * @returns Trend data with volume, growth rate, and related queries.
   */
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

  /**
   * Import a winning product into the authenticated user's catalog.
   * Automatically computes estimated cost (30% margin) and generates a unique SKU.
   *
   * @param product - The winning product to import.
   * @returns The newly created product record.
   * @throws Error if the user is not authenticated.
   */
  async importProduct(product: WinnerProduct): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

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

  /** Invalidate the entire in-memory cache. */
  clearCache(): void {
    this.cache.clear()
  }

  /** Return cache diagnostics (size and active keys). */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

/** Pre-instantiated singleton for convenience. */
export const winnersService = WinnersService.getInstance()
