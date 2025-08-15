import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { winnersService } from '../services/winnersService'
import { WinnersSearchParams, WinnerProduct, WinnersStats } from '../types'

// Clés de cache optimisées
export const WINNERS_CACHE_KEYS = {
  search: (params: WinnersSearchParams) => ['winners', 'search', params],
  trends: (keyword: string) => ['winners', 'trends', keyword],
  stats: ['winners', 'stats'],
  niches: ['winners', 'niches']
} as const

export const useWinners = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Recherche principale avec cache intelligent
  const searchQuery = useQuery({
    queryKey: ['winners', 'default'],
    queryFn: () => winnersService.searchWinners({
      query: 'trending products 2024',
      limit: 30,
      sources: ['trends', 'ebay', 'amazon']
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: false, // Pas de fetch automatique
    meta: {
      onError: () => {
        toast({
          title: "Erreur de recherche",
          description: "Impossible de récupérer les produits gagnants",
          variant: "destructive"
        })
      }
    }
  })

  // Recherche personnalisée
  const searchMutation = useMutation({
    mutationFn: (params: WinnersSearchParams) => winnersService.searchWinners(params),
    onSuccess: (data, params) => {
      queryClient.setQueryData(['winners', 'default'], data)
      queryClient.setQueryData(WINNERS_CACHE_KEYS.search(params), data)
      
      toast({
        title: "Recherche terminée",
        description: `${data.products.length} produits trouvés`
      })
    },
    onError: () => {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher les produits",
        variant: "destructive"
      })
    }
  })

  // Import de produit
  const importMutation = useMutation({
    mutationFn: (product: WinnerProduct) => winnersService.importProduct(product),
    onSuccess: (data, product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Produit importé !",
        description: `"${product.title}" a été ajouté à votre catalogue`
      })
    },
    onError: () => {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer le produit",
        variant: "destructive"
      })
    }
  })

  // Analyse des tendances
  const trendsMutation = useMutation({
    mutationFn: (keyword: string) => winnersService.analyzeTrends(keyword),
    onSuccess: (data, keyword) => {
      queryClient.setQueryData(WINNERS_CACHE_KEYS.trends(keyword), data)
      toast({
        title: "Analyse terminée",
        description: `Tendances pour "${keyword}" analysées`
      })
    },
    onError: () => {
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser les tendances",
        variant: "destructive"
      })
    }
  })

  // Calcul des statistiques
  const getStats = (): WinnersStats => {
    const data = searchQuery.data
    if (!data) {
      return {
        totalAnalyzed: 0,
        winnersDetected: 0,
        averageScore: 0,
        successRate: 94.2
      }
    }

    return {
      totalAnalyzed: data.meta.total,
      winnersDetected: data.products.filter(p => (p.final_score || 0) > 70).length,
      averageScore: data.stats?.avg_score || 0,
      successRate: 94.2
    }
  }

  return {
    // Data
    products: searchQuery.data?.products || [],
    response: searchQuery.data,
    stats: getStats(),
    
    // États
    isLoading: searchQuery.isLoading,
    isSearching: searchMutation.isPending,
    isImporting: importMutation.isPending,
    isAnalyzingTrends: trendsMutation.isPending,
    error: searchQuery.error,
    
    // Actions
    search: searchMutation.mutate,
    importProduct: importMutation.mutate,
    analyzeTrends: trendsMutation.mutate,
    
    // Utils
    refetch: searchQuery.refetch,
    clearCache: () => winnersService.clearCache()
  }
}