import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import type { CatalogProduct } from './useCatalogProducts'

// Export the interface for external use
export type { CatalogProduct }

export const useCatalogProductsDemo = (filters: any = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['catalog-products-real', filters],
    queryFn: async () => {
      let query = supabase.from('catalog_products').select('*').order('created_at', { ascending: false })
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier)
      }
      if (filters.isTrending) {
        query = query.eq('is_trending', true)
      }
      if (filters.isWinner) {
        query = query.eq('is_winner', true)
      }
      if (filters.isBestseller) {
        query = query.eq('is_bestseller', true)
      }
      
      const { data, error } = await query.limit(100)
      
      if (error) throw error
      return data || []
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['catalog-categories-real'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('category')
        .not('category', 'is', null)
      
      if (error) throw error
      
      // Get unique categories
      const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean))]
      return uniqueCategories as string[]
    }
  })
  
  const { data: suppliers = [] } = useQuery({
    queryKey: ['catalog-suppliers-real'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('supplier_id, supplier_name')
        .not('supplier_id', 'is', null)
      
      if (error) throw error
      
      // Get unique suppliers
      const uniqueSuppliers = data?.reduce((acc, p) => {
        if (p.supplier_id && !acc.find(s => s.id === p.supplier_id)) {
          acc.push({ id: p.supplier_id, name: p.supplier_name || p.supplier_id })
        }
        return acc
      }, [] as { id: string; name: string }[])
      
      return uniqueSuppliers || []
    }
  })

  // Favoris utilisateur simulés
  const mockUserFavorites = ["cat_prod_001", "cat_prod_005", "cat_prod_007"]
  
  const { data: userFavorites = mockUserFavorites } = useQuery({
    queryKey: ['user-favorites-demo'],
    queryFn: async () => mockUserFavorites,
    initialData: mockUserFavorites
  })

  const addToFavorites = useMutation({
    mutationFn: async (productId: string) => {
      // Simuler l'ajout en base
      await new Promise(resolve => setTimeout(resolve, 300))
      const currentFavorites = queryClient.getQueryData(['user-favorites-demo']) as string[] || []
      if (!currentFavorites.includes(productId)) {
        queryClient.setQueryData(['user-favorites-demo'], [...currentFavorites, productId])
      }
      return productId
    },
    onSuccess: () => {
      toast({ title: "Favori ajouté", description: "Le produit a été ajouté à vos favoris." })
    }
  })

  const removeFromFavorites = useMutation({
    mutationFn: async (productId: string) => {
      // Simuler la suppression en base
      await new Promise(resolve => setTimeout(resolve, 300))
      const currentFavorites = queryClient.getQueryData(['user-favorites-demo']) as string[] || []
      queryClient.setQueryData(['user-favorites-demo'], currentFavorites.filter(id => id !== productId))
      return productId
    },
    onSuccess: () => {
      toast({ title: "Favori retiré", description: "Le produit a été retiré de vos favoris." })
    }
  })

  const addSourcingHistory = useMutation({
    mutationFn: async ({ productId, action, metadata }: { productId: string; action: string; metadata?: any }) => {
      // Simuler l'ajout d'historique
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log(`Sourcing history: ${action} for product ${productId}`, metadata)
      return { productId, action, metadata }
    }
  })

  const stats = {
    total: products.length,
    winners: products.filter(p => p.is_winner).length,
    trending: products.filter(p => p.is_trending).length,
    bestsellers: products.filter(p => p.is_bestseller).length,
    averageRating: products.length > 0 ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0,
    totalValue: products.reduce((sum, p) => sum + p.price, 0)
  }

  return {
    products,
    categories,
    suppliers,
    userFavorites,
    stats,
    isLoading,
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
    addSourcingHistory: addSourcingHistory.mutate
  }
}