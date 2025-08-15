import { supabase } from '@/integrations/supabase/client'
import { ImportJob, ImportedProduct, ImportFilters } from '../types'

export class ImportService {
  private static instance: ImportService
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutes

  public static getInstance(): ImportService {
    if (!ImportService.instance) {
      ImportService.instance = new ImportService()
    }
    return ImportService.instance
  }

  async getImportJobs(filters?: ImportFilters): Promise<{ jobs: any[]; total: number }> {
    const cacheKey = `import_jobs_${JSON.stringify(filters || {})}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('import_jobs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.source) {
        query = query.eq('source_type', filters.source)
      }
      if (filters?.dateRange) {
        query = query.gte('created_at', filters.dateRange[0]).lte('created_at', filters.dateRange[1])
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const result = {
        jobs: data || [],
        total: count || 0
      }

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Import jobs fetch failed:', error)
      throw error
    }
  }

  async getImportedProducts(importId?: string): Promise<any[]> {
    const cacheKey = `imported_products_${importId || 'all'}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)

      if (importId) {
        query = query.eq('import_id', importId)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      this.cache.set(cacheKey, { data: data || [], timestamp: Date.now() })
      return data || []
    } catch (error) {
      console.error('Imported products fetch failed:', error)
      throw error
    }
  }

  async startUrlImport(url: string, config?: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('url-import', {
        body: {
          url,
          config: config || {},
          ai_processing: true
        }
      })

      if (error) throw error

      // Clear cache to refresh data
      this.clearCache()
      return data
    } catch (error) {
      console.error('URL import failed:', error)
      throw error
    }
  }

  async startSupplierImport(supplier: string, config?: Record<string, any>): Promise<any> {
    try {
      const functionName = supplier === 'bigbuy' ? 'import-bigbuy' : 'process-import'
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          supplier,
          config: config || {},
          ai_processing: true,
          filters: config?.filters || {}
        }
      })

      if (error) throw error

      // Clear cache to refresh data
      this.clearCache()
      return data
    } catch (error) {
      console.error('Supplier import failed:', error)
      throw error
    }
  }

  async approveProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('imported_products')
        .update({
          review_status: 'reviewed',
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error

      // Clear cache to refresh data
      this.clearCache()
    } catch (error) {
      console.error('Product approval failed:', error)
      throw error
    }
  }

  async publishProduct(productId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get imported product
      const { data: importedProduct, error: fetchError } = await supabase
        .from('imported_products')
        .select('*')
        .eq('id', productId)
        .single()

      if (fetchError) throw fetchError

      // Create product in main products table
      const { error: insertError } = await supabase
        .from('products')
        .insert([{
          user_id: user.id,
          name: importedProduct.name,
          description: importedProduct.description,
          price: importedProduct.price,
          cost_price: importedProduct.cost_price,
          currency: importedProduct.currency,
          sku: importedProduct.sku,
          category: importedProduct.category,
          image_url: importedProduct.image_urls?.[0],
          tags: importedProduct.tags,
          supplier: importedProduct.supplier_name,
          status: 'active',
          stock_quantity: 100,
          seo_title: importedProduct.meta_title,
          seo_description: importedProduct.meta_description,
          seo_keywords: importedProduct.keywords
        }])

      if (insertError) throw insertError

      // Update imported product status
      const { error: updateError } = await supabase
        .from('imported_products')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) throw updateError

      // Clear cache to refresh data
      this.clearCache()
    } catch (error) {
      console.error('Product publishing failed:', error)
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

export const importService = ImportService.getInstance()