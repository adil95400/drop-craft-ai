import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string
  verified_purchase: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    avatar_url?: string
  }
  product?: {
    name: string
    image_url?: string
  }
}

export const useReviews = (productId?: string) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch reviews
  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      let query = supabase
        .from('reviews' as any)
        .select(`
          id,
          product_id,
          rating,
          comment,
          verified_purchase,
          helpful_count,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as any as Review[]
    }
  })

  // Add review
  const addReview = useMutation({
    mutationFn: async (newReview: {
      product_id: string
      rating: number
      comment: string
      verified_purchase?: boolean
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('reviews' as any)
        .insert([newReview])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast({
        title: "Avis ajouté",
        description: "Votre avis a été publié avec succès",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Mark helpful
  const markHelpful = useMutation({
    mutationFn: async (reviewId: string) => {
      const { data: review } = await supabase
        .from('reviews' as any)
        .select('helpful_count')
        .eq('id', reviewId)
        .single()

      if (!review) throw new Error('Review not found')

      const { error } = await supabase
        .from('reviews' as any)
        .update({ helpful_count: (review as any).helpful_count + 1 })
        .eq('id', reviewId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast({
        title: "Marqué comme utile",
        description: "Merci pour votre retour",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Calculate stats
  const stats = {
    total: reviews.length,
    averageRating: 0,
    ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: 0
    }))
  }

  return {
    reviews,
    stats,
    isLoading,
    error,
    addReview: addReview.mutate,
    isAddingReview: addReview.isPending,
    markHelpful: markHelpful.mutate,
    isMarkingHelpful: markHelpful.isPending
  }
}
