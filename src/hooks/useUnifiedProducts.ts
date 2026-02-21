import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ProductsUnifiedService, UnifiedProduct } from '@/services/ProductsUnifiedService'
import { ProductHistoryService } from '@/services/ProductHistoryService'
import { supabase } from '@/integrations/supabase/client'
import { useMemo } from 'react'

export type { UnifiedProduct }

export interface ProductFilters {
  search?: string
  category?: string
  status?: 'active' | 'paused' | 'draft' | 'archived'
  minPrice?: number
  maxPrice?: number
  lowStock?: boolean
  source?: 'products' | 'imported' | 'premium' | 'catalog'
}

export function useUnifiedProducts(filters?: ProductFilters) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Requête principale avec gestion d'erreur améliorée
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unified-products', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const allProducts = await ProductsUnifiedService.getAllProducts(user.id, filters)
      
      // Filtrage côté client pour les filtres avancés
      let filtered = allProducts
      
      if (filters?.minPrice !== undefined) {
        filtered = filtered.filter(p => p.price >= filters.minPrice!)
      }
      if (filters?.maxPrice !== undefined) {
        filtered = filtered.filter(p => p.price <= filters.maxPrice!)
      }
      if (filters?.source) {
        filtered = filtered.filter(p => p.source === filters.source)
      }
      
      return filtered
    },
    staleTime: 60 * 1000, // Cache 1 minute pour données plus fraîches
    gcTime: 5 * 60 * 1000, // Garder en cache 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  })

  // Statistiques calculées en temps réel
  const stats = useMemo(() => {
    const active = products.filter(p => p.status === 'active')
    const inactive = products.filter(p => p.status === 'paused' || p.status === 'archived')
    const lowStock = products.filter(p => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0)
    const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0)
    
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0)
    const totalCost = products.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0)
    const totalProfit = totalValue - totalCost
    
    const avgPrice = products.length > 0 
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
      : 0
    
    const avgMargin = products.filter(p => p.profit_margin).length > 0
      ? products.filter(p => p.profit_margin).reduce((sum, p) => sum + (p.profit_margin || 0), 0) / products.filter(p => p.profit_margin).length
      : 0

    // Statistiques par source (all products come from unified API now)
    const bySource = {
      products: products.length,
      imported: 0,
      premium: 0,
      catalog: 0,
      shopify: 0,
      published: 0,
      feed: 0,
      supplier: 0
    }

    // Top catégories
    const categoryCount = products.reduce((acc, p) => {
      if (p.category) {
        acc[p.category] = (acc[p.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    return {
      total: products.length,
      active: active.length,
      inactive: inactive.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      totalValue,
      totalCost,
      totalProfit,
      avgPrice,
      avgMargin,
      bySource,
      topCategories,
      profitMargin: totalValue > 0 ? (totalProfit / totalValue) * 100 : 0
    }
  }, [products])

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedProduct> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Récupérer l'ancien produit pour l'historique
      const oldProduct = products.find(p => p.id === id)
      
      const updatedProduct = await ProductsUnifiedService.upsertProduct(user.id, { id, ...updates })
      
      // Enregistrer dans l'historique
      if (oldProduct) {
        await ProductHistoryService.recordChange(
          user.id,
          id,
          updatedProduct.name,
          'updated',
          oldProduct,
          updatedProduct,
          user.email || undefined
        )
      }
      
      return updatedProduct
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      toast({
        title: "Produit mis à jour",
        description: "Les modifications ont été enregistrées",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive",
      })
    }
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Récupérer le produit pour l'historique avant suppression
      const product = products.find(p => p.id === id)
      
      await ProductsUnifiedService.deleteProduct(user.id, id)
      
      // Enregistrer dans l'historique
      if (product) {
        await ProductHistoryService.recordChange(
          user.id,
          id,
          product.name,
          'deleted',
          product,
          product,
          user.email || undefined
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      })
    }
  })

  const consolidateProducts = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      return await ProductsUnifiedService.consolidateProducts(user.id)
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      toast({
        title: "Consolidation réussie",
        description: `${count} produits ont été consolidés`,
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de consolider les produits",
        variant: "destructive",
      })
    }
  })

  return {
    products,
    stats,
    isLoading,
    error,
    refetch,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
    consolidateProducts: consolidateProducts.mutate,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending,
    isConsolidating: consolidateProducts.isPending
  }
}

// Hook pour un seul produit avec cache optimisé
export function useProduct(productId: string) {
  const { toast } = useToast()
  
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Essayer de le trouver dans plusieurs tables
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single()
      
      if (product) {
        // Parse variants safely
        let variants: any[] = []
        if (product.variants) {
          try {
            variants = Array.isArray(product.variants) ? product.variants : []
          } catch { variants = [] }
        }
        
        return {
          ...product,
          status: (['active', 'paused', 'draft', 'archived'].includes(product.status) ? product.status : 'draft') as UnifiedProduct['status'],
          source: 'products' as const,
          images: product.image_url ? [product.image_url] : [],
          variants
        } as unknown as UnifiedProduct
      }
      
      // Sinon chercher dans imported_products
      const { data: imported } = await supabase
        .from('imported_products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single()
      
      if (imported) {
        return {
          id: imported.id,
          name: `Imported Product ${imported.id.slice(0, 8)}`,
          description: undefined,
          price: imported.price || 0,
          cost_price: undefined,
          status: (imported.status === 'published' ? 'active' : 'draft') as UnifiedProduct['status'],
          stock_quantity: 0,
          sku: undefined,
          category: imported.category || undefined,
          image_url: undefined,
          images: [],
          profit_margin: undefined,
          user_id: imported.user_id,
          source: 'imported' as const,
          created_at: imported.created_at || new Date().toISOString(),
          updated_at: imported.created_at || new Date().toISOString()
        } as unknown as UnifiedProduct
      }
      
      throw new Error('Produit introuvable')
    },
    enabled: !!productId,
    staleTime: 30 * 1000,
    retry: 1
  })
}
