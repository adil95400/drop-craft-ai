/**
 * useRealAIRecommendations — Powered by ai-recommendations-engine Edge Function
 * Real collaborative filtering, AI-driven insights, and cross-sell analysis
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface AIRecommendation {
  id: string
  type: string
  recommendation_type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  confidence: number
  confidence_score: number
  impact_estimate: string | null
  impact_value: number | null
  reasoning: string | null
  status: 'pending' | 'accepted' | 'dismissed' | 'applied' | 'expired'
  source_product_id: string | null
  target_product_id: string | null
  actions: Array<{ label: string; action: string; data?: any }>
  metrics?: {
    potential_revenue?: number
    time_savings?: string
    conversion_lift?: number
  }
  createdAt: string
  created_at: string
  expires_at: string | null
}

export interface ProductAffinity {
  id: string
  product_a_id: string
  product_b_id: string
  co_occurrence_count: number
  affinity_score: number
  product_a?: { id: string; title: string; sale_price: number; image_url: string | null }
  product_b?: { id: string; title: string; sale_price: number; image_url: string | null }
}

function mapPriority(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 80) return 'high'
  if (confidence >= 60) return 'medium'
  return 'low'
}

function mapTypeToLegacy(type: string): string {
  const map: Record<string, string> = {
    trending: 'product', cross_sell: 'product', upsell: 'product',
    restock: 'inventory', pricing: 'pricing', bundle: 'marketing',
  }
  return map[type] || 'product'
}

export const useRealAIRecommendations = (limit = 10, types?: string[]) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch stored recommendations from DB
  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-recommendations', limit, types],
    queryFn: async (): Promise<AIRecommendation[]> => {
      const { data, error } = await (supabase.from('ai_recommendations') as any)
        .select('*')
        .in('status', ['pending', 'accepted'])
        .order('confidence_score', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map((rec: any) => ({
        ...rec,
        type: mapTypeToLegacy(rec.recommendation_type),
        priority: mapPriority(rec.confidence_score),
        impact: rec.impact_estimate || '',
        confidence: rec.confidence_score,
        actions: [
          { label: 'Appliquer', action: 'apply' },
          { label: 'Ignorer', action: 'dismiss' },
        ],
        createdAt: rec.created_at,
      }))
    },
    staleTime: 60_000,
  })

  // Fetch cross-sell affinities
  const { data: affinities, isLoading: affinitiesLoading } = useQuery({
    queryKey: ['product-affinities'],
    queryFn: async (): Promise<ProductAffinity[]> => {
      const { data, error } = await (supabase.from('product_affinities') as any)
        .select(`
          *,
          product_a:products!product_affinities_product_a_id_fkey(id, title, sale_price, image_url),
          product_b:products!product_affinities_product_b_id_fkey(id, title, sale_price, image_url)
        `)
        .order('affinity_score', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    },
    staleTime: 120_000,
  })

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ['recommendation-metrics'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('recommendation_metrics') as any)
        .select('*')
        .order('period_start', { ascending: false })
        .limit(30)
      if (error) throw error
      return data || []
    },
    staleTime: 300_000,
  })

  // Generate new recommendations via AI
  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-recommendations-engine', {
        body: { action: 'generate_all' },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Generation failed')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['recommendation-metrics'] })
      toast({
        title: '🤖 Recommandations IA générées',
        description: `${data.recommendations?.length || 0} insights basés sur ${data.stats?.products_analyzed || 0} produits et ${data.stats?.orders_analyzed || 0} commandes`,
      })
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur de génération',
        description: err.message?.includes('429') 
          ? 'Trop de requêtes, réessayez dans quelques instants' 
          : err.message?.includes('402')
            ? 'Crédits IA épuisés, rechargez votre compte'
            : err.message || 'Erreur inattendue',
        variant: 'destructive',
      })
    },
  })

  // Compute cross-sell
  const computeCrossSell = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-recommendations-engine', {
        body: { action: 'cross_sell' },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Failed')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-affinities'] })
      toast({ title: 'Affinités produits calculées', description: 'Paires fréquemment achetées ensemble identifiées' })
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    },
  })

  // Update status (accept/dismiss)
  const updateStatus = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'dismiss' }) => {
      const updates: any = {
        status: action === 'accept' ? 'accepted' : 'dismissed',
        ...(action === 'dismiss' 
          ? { dismissed_at: new Date().toISOString() } 
          : { applied_at: new Date().toISOString() }),
      }
      const { error } = await (supabase.from('ai_recommendations') as any)
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] })
    },
  })

  return {
    recommendations: recommendations || [],
    affinities: affinities || [],
    affinitiesLoading,
    metrics: metrics || [],
    isLoading,
    error,
    refetch,
    generate,
    computeCrossSell,
    updateStatus,
  }
}
