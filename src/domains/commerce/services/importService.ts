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
  async getImportJobs(filters?: ImportFilters) {
    try {
      let query = supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        jobs: data as ImportJob[],
        total: count || data?.length || 0
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
        query = query.eq('import_id', importId)
      }

      const { data, error } = await query.limit(200)

      if (error) throw error

      return data as ImportedProductData[]
    } catch (error) {
      console.error('Erreur récupération produits importés:', error)
      throw error
    }
  }

  async startUrlImport(url: string, config?: Record<string, any>) {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Non authentifié')

      // Créer un job d'import
      const { data, error } = await supabase
        .from('import_jobs')
        .insert([{
          user_id: user.user.id,
          source_type: 'url_import',
          source_url: url,
          status: 'pending'
        }])
        .select()
        .single()

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

      const { data, error } = await supabase
        .from('import_jobs')
        .insert([{
          user_id: user.user.id,
          source_type: 'api_sync',
          source_url: `${supplier} API`,
          status: 'pending'
        }])
        .select()
        .single()

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
        .update({
          status: 'published',
          review_status: 'approved',
          published_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString()
        })
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

      // Récupérer le produit importé
      const { data: product, error: fetchError } = await supabase
        .from('imported_products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.user.id)
        .single()

      if (fetchError) throw fetchError

      // Publier vers la table products
      const { data, error } = await supabase
        .from('products')
        .insert([{
          user_id: user.user.id,
          name: product.name,
          description: product.description,
          price: product.price,
          cost_price: product.cost_price,
          status: 'active',
          stock_quantity: product.stock_quantity,
          sku: product.sku,
          category: product.category,
          image_url: product.image_urls?.[0],
          profit_margin: product.cost_price ? 
            ((product.price - product.cost_price) / product.price * 100) : 0
        }])
        .select()
        .single()

      if (error) throw error

      // Marquer comme publié
      await supabase
        .from('imported_products')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', productId)

      return data
    } catch (error) {
      console.error('Erreur publication produit:', error)
      throw error
    }
  }

  clearCache() {
    // Invalider le cache côté client si nécessaire
    console.log('Cache cleared')
  }
}

export const importService = new ImportService()