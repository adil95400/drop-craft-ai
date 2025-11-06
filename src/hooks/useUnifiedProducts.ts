import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ProductsUnifiedService, UnifiedProduct } from '@/services/ProductsUnifiedService'
import { supabase } from '@/integrations/supabase/client'

export type { UnifiedProduct }

export function useUnifiedProducts(filters?: {
  search?: string
  category?: string
  status?: 'active' | 'inactive'
  minPrice?: number
  maxPrice?: number
  lowStock?: boolean
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['unified-products', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      return await ProductsUnifiedService.getAllProducts(user.id, filters)
    },
    staleTime: 2 * 60 * 1000 // Cache 2 minutes
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedProduct> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      return await ProductsUnifiedService.upsertProduct(user.id, { id, ...updates })
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
      
      return await ProductsUnifiedService.deleteProduct(user.id, id)
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

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length,
    lowStock: products.filter(p => (p.stock_quantity || 0) < 10).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0),
    bySource: {
      products: products.filter(p => p.source === 'products').length,
      imported: products.filter(p => p.source === 'imported').length,
      premium: products.filter(p => p.source === 'premium').length,
      catalog: products.filter(p => p.source === 'catalog').length
    }
  }

  return {
    products,
    stats,
    isLoading,
    error,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
    consolidateProducts: consolidateProducts.mutate,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending,
    isConsolidating: consolidateProducts.isPending
  }
}
