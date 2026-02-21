/**
 * ProductPromotionService — Handles the staging → canonical promotion pipeline
 * imported_products (staging) → products (canonical catalog)
 */
import { supabase } from '@/integrations/supabase/client'

export interface PromotionResult {
  success: boolean
  productId?: string
  error?: string
}

export interface PromotionBatchResult {
  total: number
  promoted: number
  failed: number
  results: PromotionResult[]
}

class ProductPromotionService {
  /**
   * Promote a single imported product to the canonical products table
   */
  async promoteProduct(importedProductId: string): Promise<PromotionResult> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Non authentifié')

      // Fetch the imported product
      const { data: imported, error: fetchError } = await supabase
        .from('imported_products')
        .select('*')
        .eq('id', importedProductId)
        .eq('user_id', user.user.id)
        .single()

      if (fetchError || !imported) {
        return { success: false, error: 'Produit importé introuvable' }
      }

      const ip = imported as any

      // Check if already promoted
      if (ip.promotion_status === 'promoted' && ip.promoted_to_product_id) {
        return { success: true, productId: ip.promoted_to_product_id }
      }

      // Build canonical product from staging data
      const canonicalProduct: Record<string, any> = {
        user_id: user.user.id,
        title: ip.title || ip.product_name || `Import ${ip.id.slice(0, 8)}`,
        description: ip.description || '',
        price: ip.price || 0,
        cost_price: ip.cost_price || (ip.price ? Math.round(ip.price * 0.6 * 100) / 100 : 0),
        status: 'draft',
        stock_quantity: ip.stock_quantity || 0,
        sku: ip.sku || `IMP-${Date.now()}`,
        category: ip.category || null,
        source_type: ip.source_platform || 'import',
        source_url: ip.source_url || null,
        supplier_name: ip.source_platform || null,
        primary_image_url: ip.image_url || (Array.isArray(ip.image_urls) ? ip.image_urls[0] : null),
        currency: ip.currency || 'EUR',
      }

      // Insert into canonical products table
      const { data: product, error: insertError } = await (supabase
        .from('products') as any)
        .insert(canonicalProduct)
        .select('id')
        .single()

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      // Update staging record with promotion link
      await supabase
        .from('imported_products')
        .update({
          status: 'published',
          promoted_to_product_id: product.id,
          promotion_status: 'promoted'
        } as any)
        .eq('id', importedProductId)

      return { success: true, productId: product.id }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Promote multiple imported products in batch
   */
  async promoteBatch(importedProductIds: string[]): Promise<PromotionBatchResult> {
    const results: PromotionResult[] = []

    for (const id of importedProductIds) {
      const result = await this.promoteProduct(id)
      results.push(result)
    }

    return {
      total: importedProductIds.length,
      promoted: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  /**
   * Get staging products ready for promotion (approved but not yet promoted)
   */
  async getStagingProducts(): Promise<any[]> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return []

    const { data, error } = await supabase
      .from('imported_products')
      .select('*')
      .eq('user_id', user.user.id)
      .in('status', ['approved', 'imported', 'pending'])
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Error fetching staging products:', error)
      return []
    }

    return data || []
  }
}

export const productPromotionService = new ProductPromotionService()
