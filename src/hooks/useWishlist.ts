import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface WishlistItem {
  id: string
  product_id: string
  user_id: string
  created_at: string
  product?: {
    id: string
    name: string
    price: number
    image_url?: string
    status: string
  }
}

export const useWishlist = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch wishlist items
  const { data: wishlist = [], isLoading, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('wishlists' as any)
        .select(`
          id,
          product_id,
          user_id,
          created_at,
          product:products(
            id,
            name,
            price,
            image_url,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as any as WishlistItem[]
    }
  })

  // Add to wishlist
  const addToWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('wishlists' as any)
        .insert([{ product_id: productId, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast({
        title: "Ajouté aux favoris",
        description: "Le produit a été ajouté à votre wishlist",
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

  // Remove from wishlist
  const removeFromWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('wishlists' as any)
        .delete()
        .eq('product_id', productId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast({
        title: "Retiré des favoris",
        description: "Le produit a été retiré de votre wishlist",
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

  // Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlist.some(item => item.product_id === productId)
  }

  // Toggle wishlist
  const toggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlist.mutate(productId)
    } else {
      addToWishlist.mutate(productId)
    }
  }

  return {
    wishlist,
    isLoading,
    error,
    addToWishlist: addToWishlist.mutate,
    removeFromWishlist: removeFromWishlist.mutate,
    toggleWishlist,
    isInWishlist,
    isUpdating: addToWishlist.isPending || removeFromWishlist.isPending
  }
}