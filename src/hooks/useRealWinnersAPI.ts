import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface WinnerProduct {
  id: string
  title: string
  price: number
  currency: string
  image: string
  source: string
  url: string
  reviews?: number
  rating?: number
  sales?: number
  trending_score: number
  market_demand: number
  final_score?: number
}

export interface WinnersResponse {
  products: WinnerProduct[]
  sources?: Record<string, any>
  meta: {
    total: number
    sources_used?: string[]
    query: string
    category?: string
    timestamp: string
    source?: string
    scoring_algorithm?: string
  }
  stats?: {
    avg_score: number
    total_sources: number
    products_per_source: number[]
  }
}

export const useRealWinnersAPI = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Search winning products from multiple sources
  const searchWinners = useQuery({
    queryKey: ['real-winners-api'],
    queryFn: async (): Promise<WinnersResponse> => {
      const { data, error } = await supabase.functions.invoke('winners-aggregator', {
        body: {
          q: 'trending products 2024',
          category: '',
          limit: 30,
          sources: ['trends', 'ebay', 'amazon']
        }
      })

      if (error) throw error
      return data
    },
    enabled: false, // Only fetch when explicitly called
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

  // Search with custom parameters
  const searchCustom = useMutation({
    mutationFn: async (params: {
      query: string
      category?: string
      sources?: string[]
      limit?: number
    }) => {
      const { data, error } = await supabase.functions.invoke('winners-aggregator', {
        body: {
          q: params.query,
          category: params.category || '',
          limit: params.limit || 30,
          sources: params.sources || ['trends', 'ebay', 'amazon']
        }
      })

      if (error) throw error
      return data as WinnersResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['real-winners-api'], data)
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

  // Import product to catalog
  const importProduct = useMutation({
    mutationFn: async (product: WinnerProduct) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Calculate estimated cost (assuming 30% margin)
      const estimatedCost = product.price * 0.7

      const { data, error } = await supabase
        .from('products')
        .insert([{
          user_id: user.id,
          title: product.title,
          description: `Imported from ${product.source}`,
          price: product.price,
          cost_price: estimatedCost,
          category: 'Imported',
          image_url: product.image,
          tags: ['winner', 'imported', product.source],
          status: 'active',
          sku: `WIN-${Date.now()}`,
          stock_quantity: 100
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
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

  // Analyze trends for specific keyword
  const analyzeTrends = useMutation({
    mutationFn: async (keyword: string) => {
      const { data, error } = await supabase.functions.invoke('winners-trends', {
        body: { q: keyword, limit: 10 }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Analyse terminée",
        description: `Tendances pour "${data.trends?.keyword || 'mot-clé'}" analysées`
      })
    }
  })

  return {
    // Data
    winners: searchWinners.data?.products || [],
    winnersData: searchWinners.data,
    
    // States
    isLoading: searchWinners.isLoading || searchCustom.isPending,
    isSearching: searchCustom.isPending,
    isImporting: importProduct.isPending,
    isAnalyzing: analyzeTrends.isPending,
    error: searchWinners.error,

    // Actions
    searchWinners: searchCustom.mutate,
    importProduct: importProduct.mutate,
    analyzeTrends: analyzeTrends.mutate,
    
    // Utils
    refetch: searchWinners.refetch
  }
}
