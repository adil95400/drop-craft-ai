/**
 * Système unifié centralisé - remplace tous les hooks dispersés
 * Basé sur les tables Supabase existantes
 */

import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'

// Types centralisés
type Profile = Database['public']['Tables']['profiles']['Row']
type Supplier = Database['public']['Tables']['suppliers']['Row']
type ImportedProduct = Database['public']['Tables']['imported_products']['Row']
type ImportJob = Database['public']['Tables']['import_jobs']['Row']

export interface UnifiedSystemConfig {
  user: any
  profile: Profile | null
  loading: boolean
}

export class UnifiedSystem {
  private static instance: UnifiedSystem | null = null
  
  constructor() {
    if (UnifiedSystem.instance) {
      return UnifiedSystem.instance
    }
    UnifiedSystem.instance = this
  }

  // Vérification des rôles
  async isAdmin(userId?: string): Promise<boolean> {
    if (!userId) return false
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data?.role === 'admin' || false
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // Vérification des feature flags basée sur le plan
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan, feature_flags')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      const plan = data?.plan || 'standard'
      const featureFlags = data?.feature_flags as any
      
      // Vérifier d'abord les feature flags personnalisés
      if (featureFlags && typeof featureFlags === 'object') {
        if (featureFlags[feature] !== undefined) {
          return featureFlags[feature]
        }
      }
      
      // Sinon, vérifier selon le plan
      const planFeatures: Record<string, string[]> = {
        'standard': ['basic_import', 'bulk_import'],
        'pro': ['basic_import', 'bulk_import', 'advanced_analytics'],
        'ultra_pro': ['basic_import', 'bulk_import', 'advanced_analytics', 'ai_import', 'marketing_automation', 'premium_integrations']
      }
      
      return planFeatures[plan]?.includes(feature) || false
    } catch (error) {
      console.error('Error checking feature flag:', error)
      return false
    }
  }

  // Gestion des fournisseurs
  async getSuppliers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      return []
    }
  }

  // Gestion des produits importés
  async getImportedProducts(userId: string) {
    try {
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching imported products:', error)
      return []
    }
  }

  // Gestion des jobs d'import
  async getImportJobs(userId: string) {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching import jobs:', error)
      return []
    }
  }

  // Statistiques du dashboard
  async getDashboardStats(userId: string) {
    try {
      const [suppliers, products, jobs] = await Promise.all([
        this.getSuppliers(userId),
        this.getImportedProducts(userId),
        this.getImportJobs(userId)
      ])

      return {
        totalSuppliers: suppliers.length,
        totalProducts: products.length,
        totalJobs: jobs.length,
        recentJobs: jobs.slice(0, 5),
        publishedProducts: products.filter(p => p.status === 'published').length
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalSuppliers: 0,
        totalProducts: 0,
        totalJobs: 0,
        recentJobs: [],
        publishedProducts: 0
      }
    }
  }
}

// Instance globale
export const unifiedSystem = new UnifiedSystem()