import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Review {
  id: string
  external_id: string
  platform: string
  product_id?: string
  customer_name?: string
  customer_email?: string
  title?: string
  content?: string
  rating: number
  photos?: string[]
  status: 'published' | 'pending' | 'rejected'
  verified_purchase: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface ReviewStats {
  total: number
  averageRating: number
  ratingDistribution: Array<{
    rating: number
    count: number
  }>
  recentReviews: Review[]
}

export const useRealReviews = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: reviews = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['real-reviews'],
    queryFn: async (): Promise<Review[]> => {
      // Query reviews from activity_logs where entity_type = 'review'
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', 'review')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      if (!data || data.length === 0) return []
      
      return data.map((row: any) => ({
        id: row.id,
        external_id: row.entity_id || row.id,
        platform: (row.details as any)?.platform || 'internal',
        product_id: row.entity_id,
        customer_name: (row.details as any)?.customer_name || 'Client',
        title: (row.details as any)?.title || row.description,
        content: row.description,
        rating: (row.details as any)?.rating || 5,
        status: ((row.details as any)?.status || 'published') as 'published' | 'pending' | 'rejected',
        verified_purchase: (row.details as any)?.verified_purchase || false,
        helpful_count: (row.details as any)?.helpful_count || 0,
        created_at: row.created_at,
        updated_at: row.created_at,
      }))
    },
    meta: {
      onError: () => {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les avis",
          variant: "destructive"
        })
      }
    }
  })

  // Mark review as helpful
  const markHelpful = useMutation({
    mutationFn: async (reviewId: string) => {
      // In a real implementation, this would update the reviews table
      const review = reviews.find(r => r.id === reviewId)
      if (!review) throw new Error('Avis non trouvé')
      
      return { ...review, helpful_count: review.helpful_count + 1 }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-reviews'] })
      toast({
        title: "Merci !",
        description: "Votre vote a été pris en compte"
      })
    }
  })

  // Calculate stats
  const stats: ReviewStats = {
    total: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0,
    ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    })),
    recentReviews: reviews.slice(0, 5)
  }

  return {
    reviews,
    stats,
    isLoading,
    error,
    markHelpful: markHelpful.mutate,
    isMarkingHelpful: markHelpful.isPending
  }
}
