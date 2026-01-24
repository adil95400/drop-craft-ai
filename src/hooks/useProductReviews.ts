import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'

export interface ProductReview {
  id: string
  product_id: string
  rating: number
  content: string
  author_name: string | null
  author_email: string | null
  is_verified: boolean
  is_published: boolean
  helpful_count: number
  images: string[] | null
  created_at: string
  source_platform: string | null
}

export function useProductReviews(productId: string | undefined) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      if (!productId) return []
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Use rpc or raw query since product_reviews may not be in typed schema
      const { data, error } = await supabase
        .from('product_reviews' as any)
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
        return []
      }

      return ((data as any[]) || []).map((review: any) => ({
        ...review,
        images: Array.isArray(review.images) 
          ? review.images 
          : typeof review.images === 'string' 
            ? JSON.parse(review.images) 
            : null
      })) as ProductReview[]
    },
    enabled: !!productId,
  })

  // Calculate stats
  const stats = {
    total: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
      : 0,
    distribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    },
    verifiedCount: reviews.filter(r => r.is_verified).length,
    withImagesCount: reviews.filter(r => r.images && r.images.length > 0).length,
  }

  // Import reviews from extension
  const importReviewsMutation = useMutation({
    mutationFn: async (reviewsData: Partial<ProductReview>[]) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      if (!productId) throw new Error('Product ID requis')

      const reviewsToInsert = reviewsData.map(r => ({
        ...r,
        product_id: productId,
        user_id: user.id,
        is_published: true,
      }))

      const { error } = await supabase
        .from('product_reviews' as any)
        .insert(reviewsToInsert)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
      toast({ title: 'Avis importés avec succès' })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur lors de l\'import',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Delete review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('product_reviews' as any)
        .delete()
        .eq('id', reviewId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
      toast({ title: 'Avis supprimé' })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ reviewId, isPublished }: { reviewId: string, isPublished: boolean }) => {
      const { error } = await supabase
        .from('product_reviews' as any)
        .update({ is_published: isPublished })
        .eq('id', reviewId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
    },
  })

  return {
    reviews,
    stats,
    isLoading,
    error,
    importReviews: importReviewsMutation.mutate,
    isImporting: importReviewsMutation.isPending,
    deleteReview: deleteReviewMutation.mutate,
    isDeleting: deleteReviewMutation.isPending,
    togglePublish: togglePublishMutation.mutate,
  }
}
