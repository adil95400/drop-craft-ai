import { supabase } from '@/integrations/supabase/client'
import { ImportFilters } from '../types'

export interface ImportJob {
  id: string
  user_id: string
  source_type: string
  source_url?: string
  status: string
  total_rows?: number
  success_rows?: number
  error_rows?: number
  started_at?: string
  completed_at?: string
  result_data?: any
  errors?: string[]
  created_at: string
  source_name?: string
}

export interface ImportedProductData {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  currency: string
  sku?: string
  category?: string
  brand?: string
  supplier_name?: string
  supplier_url?: string
  image_urls?: string[]
  tags?: string[]
  status: string
  ai_optimized: boolean
  created_at: string
  stock_quantity?: number
  seo_title?: string
}

class ImportService {
  /**
   * Get import jobs from the unified `jobs` table (replaces import_jobs view)
   */
  async getImportJobs(filters?: ImportFilters) {
    try {
      let query = (supabase
        .from('jobs') as any)
        .select('*')
        .eq('job_type', 'import')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error, count } = await query

      if (error) throw error

      // Map jobs fields to ImportJob interface
      const jobs = (data || []).map((job: any) => ({
        id: job.id,
        user_id: job.user_id,
        source_type: job.job_subtype || 'unknown',
        source_url: job.metadata?.source_url || job.input_data?.source_url,
        status: job.status,
        total_rows: job.total_items || 0,
        success_rows: (job.processed_items || 0) - (job.failed_items || 0),
        error_rows: job.failed_items || 0,
        started_at: job.started_at,
        completed_at: job.completed_at,
        result_data: job.output_data,
        errors: job.error_message ? [job.error_message] : [],
        created_at: job.created_at,
        source_name: job.name
      }))

      return {
        jobs,
        total: count || jobs.length
      }
    } catch (error) {
      console.error('Erreur récupération import jobs:', error)
      throw error
    }
  }

  async getImportedProducts(importId?: string) {
    try {
      let query = supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (importId) {
        query = query.eq('import_job_id', importId)
      }

      const { data, error } = await query.limit(200)

      if (error) throw error

      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.product_id ? `Product ${item.product_id}` : 'Imported Product',
        description: '',
        price: item.price || 0,
        cost_price: item.price ? item.price * 0.7 : 0,
        currency: 'EUR',
        sku: item.product_id,
        category: item.category,
        brand: '',
        supplier_name: item.source_platform,
        supplier_url: item.source_url,
        image_urls: [],
        tags: [],
        status: item.status || 'imported',
        ai_optimized: false,
        created_at: item.created_at,
        stock_quantity: 0,
        seo_title: ''
      })) as ImportedProductData[]
    } catch (error) {
      console.error('Erreur récupération produits importés:', error)
      throw error
    }
  }

  async startUrlImport(url: string, config?: Record<string, any>) {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Non authentifié')

      const { data, error } = await (supabase
        .from('jobs') as any)
        .insert([{
          user_id: user.user.id,
          job_type: 'import',
          job_subtype: 'url',
          name: `Import URL: ${new URL(url).hostname}`,
          status: 'pending',
          input_data: { source_url: url, ...config },
          metadata: { source_url: url, source_platform: 'url' }
        }])
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur démarrage import URL:', error)
      throw error
    }
  }

  async startSupplierImport(supplier: string, config?: Record<string, any>) {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Non authentifié')

      const { data, error } = await (supabase
        .from('jobs') as any)
        .insert([{
          user_id: user.user.id,
          job_type: 'import',
          job_subtype: 'supplier',
          name: `Import fournisseur: ${supplier}`,
          status: 'pending',
          input_data: { supplier },
          metadata: { source_platform: supplier }
        }])
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur démarrage import fournisseur:', error)
      throw error
    }
  }

  async approveProduct(productId: string) {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('imported_products')
        .update({ status: 'approved' })
        .eq('id', productId)
        .eq('user_id', user.user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur approbation produit:', error)
      throw error
    }
  }

  async publishProduct(productId: string) {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Non authentifié')

      const { data: product, error: fetchError } = await supabase
        .from('imported_products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.user.id)
        .single()

      if (fetchError) throw fetchError

      const importedProduct = product as any

      // Promote to products table using canonical fields
      const { data, error } = await (supabase
        .from('products') as any)
        .insert([{
          user_id: user.user.id,
          title: importedProduct.title || `Imported Product - ${importedProduct.id}`,
          description: importedProduct.description || '',
          price: importedProduct.price || 0,
          cost_price: importedProduct.cost_price || (importedProduct.price ? importedProduct.price * 0.7 : 0),
          status: 'active',
          stock_quantity: importedProduct.stock_quantity || 100,
          sku: importedProduct.sku || `IMP-${Date.now()}`,
          category: importedProduct.category,
          source_type: importedProduct.source_platform || 'import',
          source_url: importedProduct.source_url,
          supplier_name: importedProduct.source_platform
        }])
        .select()
        .single()

      if (error) throw error

      // Mark as promoted with link to canonical product
      await supabase
        .from('imported_products')
        .update({ 
          status: 'published',
          promoted_to_product_id: data.id,
          promotion_status: 'promoted'
        } as any)
        .eq('id', productId)

      return data
    } catch (error) {
      console.error('Erreur publication produit:', error)
      throw error
    }
  }

  clearCache() {
    console.log('Cache cleared')
  }
}

export const importService = new ImportService()
