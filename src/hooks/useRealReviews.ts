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

// Mock reviews for demo purposes
const mockReviews: Review[] = [
  {
    id: '1',
    external_id: 'rev_001',
    platform: 'internal',
    product_id: '1',
    customer_name: 'Marie Dupont',
    title: 'Excellent produit !',
    content: 'Très satisfaite de mon achat, livraison rapide.',
    rating: 5,
    status: 'published',
    verified_purchase: true,
    helpful_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    external_id: 'rev_002',
    platform: 'internal',
    product_id: '2',
    customer_name: 'Pierre Martin',
    title: 'Bon rapport qualité/prix',
    content: 'Produit conforme à la description.',
    rating: 4,
    status: 'published',
    verified_purchase: true,
    helpful_count: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    external_id: 'rev_003',
    platform: 'internal',
    product_id: '1',
    customer_name: 'Sophie Bernard',
    title: 'Très bien',
    content: 'Je recommande ce produit.',
    rating: 5,
    status: 'published',
    verified_purchase: false,
    helpful_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const useRealReviews = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: reviews = mockReviews,
    isLoading,
    error
  } = useQuery({
    queryKey: ['real-reviews'],
    queryFn: async (): Promise<Review[]> => {
      // Since there's no reviews table, return mock data
      // In a real implementation, you would query the reviews table
      return mockReviews
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
