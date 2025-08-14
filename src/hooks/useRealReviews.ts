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
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'published' | 'pending' | 'rejected'
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
      const { data, error } = await supabase
        .from('reviews')
        .update({ helpful_count: reviews.find(r => r.id === reviewId)?.helpful_count + 1 || 1 })
        .eq('id', reviewId)
        .select()
        .single()
      
      if (error) throw error
      return data
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