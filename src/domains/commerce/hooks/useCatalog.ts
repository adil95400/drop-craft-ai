import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { catalogService } from '../services/catalogService'
import { CommerceFilters, CatalogProduct } from '../types'

// Clés de cache optimisées
export const CATALOG_CACHE_KEYS = {
  products: (filters?: CommerceFilters) => ['catalog', 'products', filters],
  product: (id: string) => ['catalog', 'product', id],
  marketplace: (filters?: CommerceFilters) => ['catalog', 'marketplace', filters],
  stats: ['catalog', 'stats']
} as const

export const useCatalog = (filters?: CommerceFilters) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupération des produits catalogue
  const productsQuery = useQuery({
    queryKey: CATALOG_CACHE_KEYS.products(filters),
    queryFn: () => catalogService.getProducts(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    enabled: true
  })

  // Récupération des produits marketplace
  const marketplaceQuery = useQuery({
    queryKey: CATALOG_CACHE_KEYS.marketplace(filters),
    queryFn: () => catalogService.getMarketplaceProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: false // Ne charge que sur demande
  })

  // Import de produit
  const importMutation = useMutation({
    mutationFn: (productId: string) => catalogService.importProduct(productId),
    onSuccess: (data, productId) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      
      toast({
        title: "Produit importé !",
        description: "Le produit a été ajouté à votre catalogue"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    // Data
    products: productsQuery.data?.products || [],
    total: productsQuery.data?.total || 0,
    marketplaceProducts: marketplaceQuery.data?.products || [],
    marketplaceTotal: marketplaceQuery.data?.total || 0,
    
    // États
    isLoading: productsQuery.isLoading,
    isMarketplaceLoading: marketplaceQuery.isLoading,
    isImporting: importMutation.isPending,
    error: productsQuery.error,
    
    // Actions
    importProduct: importMutation.mutate,
    loadMarketplace: marketplaceQuery.refetch,
    
    // Utils
    refetch: productsQuery.refetch,
    clearCache: () => catalogService.clearCache()
  }
}

export const useCatalogProduct = (id: string) => {
  const { toast } = useToast()

  const productQuery = useQuery({
    queryKey: CATALOG_CACHE_KEYS.product(id),
    queryFn: () => catalogService.getProduct(id),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    enabled: !!id
  })

  return {
    product: productQuery.data,
    isLoading: productQuery.isLoading,
    error: productQuery.error,
    refetch: productQuery.refetch
  }
}