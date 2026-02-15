/**
 * Système unifié centralisé - remplace tous les hooks dispersés
 * Basé sur les tables Supabase existantes
 */

import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'

// Types centralisés
type ImportedProduct = Database['public']['Tables']['imported_products']['Row']
type ImportJob = Database['public']['Tables']['jobs']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

export interface UnifiedSystemConfig {
  user: any
  profile: any
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

  // Vérification des rôles - utilise la table user_roles sécurisée
  async isAdmin(userId?: string): Promise<boolean> {
    if (!userId) return false
    
    try {
      const { data, error } = await supabase
        .rpc('has_role', { 
          _user_id: userId, 
          _role: 'admin' 
        })
      
      if (error) throw error
      return Boolean(data)
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // Gestion des permissions basée sur les rôles
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    if (!userId) return false
    
    try {
      const isAdmin = await this.isAdmin(userId)
      if (isAdmin) return true // Les admins ont tous les droits
      
      // Vérifier le rôle de l'utilisateur via user_roles
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (error) throw error
      
      const userRole = roleData?.role || 'user'
      
      // Définir les permissions par rôle
      const permissions: Record<string, string[]> = {
        'admin': ['*'], // Toutes permissions
        'user': [
          'products:read', 'products:create', 'products:update', 'products:delete',
          'suppliers:read', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
          'orders:read', 'orders:create', 'orders:update',
          'customers:read', 'customers:create', 'customers:update',
          'analytics:read'
        ]
      }
      
      const userPermissions = permissions[userRole] || []
      return userPermissions.includes('*') || userPermissions.includes(permission)
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }

  // Vérification des feature flags basée sur le plan
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      const plan = data?.subscription_plan || 'standard'
      
      // Vérifier selon le plan
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

  // Gestion des fournisseurs - use premium_suppliers
  async getSuppliers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('premium_suppliers')
        .select('*')
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

  // Alias pour getProducts - utilise les produits importés  
  async getProducts(userId: string) {
    return this.getImportedProducts(userId)
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

  // Gestion des commandes
  async getOrders(userId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching orders:', error)
      return []
    }
  }

  // Gestion des clients
  async getCustomers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching customers:', error)
      return []
    }
  }

  // Créer un nouveau produit
  async createProduct(userId: string, productData: Partial<ImportedProduct> & { name: string; price: number }) {
    try {
      const { data, error } = await supabase
        .from('imported_products')
        .insert([{ 
          ...productData, 
          user_id: userId
        } as any])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating product:', error)
      return { data: null, error }
    }
  }

  // Mettre à jour un produit
  async updateProduct(productId: string, productData: Partial<ImportedProduct>) {
    try {
      const { data, error } = await supabase
        .from('imported_products')
        .update(productData as any)
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating product:', error)
      return { data: null, error }
    }
  }

  // Supprimer un produit
  async deleteProduct(productId: string) {
    try {
      const { error } = await supabase
        .from('imported_products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting product:', error)
      return { error }
    }
  }

  // Créer un job d'import
  async createImportJob(userId: string, jobData: Partial<ImportJob> & { source_type: string }) {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .insert([{ 
          ...jobData, 
          user_id: userId,
          job_type: jobData.source_type,
          status: jobData.status || 'pending',
          total_products: 0,
          successful_imports: 0,
          failed_imports: 0
        } as any])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating import job:', error)
      return { data: null, error }
    }
  }

  // Statistiques du dashboard
  async getDashboardStats(userId: string) {
    try {
      const [suppliers, products, jobs, orders, customers] = await Promise.all([
        this.getSuppliers(userId),
        this.getImportedProducts(userId),
        this.getImportJobs(userId),
        this.getOrders(userId),
        this.getCustomers(userId)
      ])

      return {
        totalSuppliers: suppliers.length,
        totalProducts: products.length,
        totalJobs: jobs.length,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        recentJobs: jobs.slice(0, 5),
        recentOrders: orders.slice(0, 5),
        publishedProducts: products.filter(p => p.status === 'published').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalSuppliers: 0,
        totalProducts: 0,
        totalJobs: 0,
        totalOrders: 0,
        totalCustomers: 0,
        recentJobs: [],
        recentOrders: [],
        publishedProducts: 0,
        pendingOrders: 0
      }
    }
  }
}

// Instance globale
export const unifiedSystem = new UnifiedSystem()
