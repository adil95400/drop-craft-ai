import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ProductImage {
  id: string
  product_id: string
  variant_id?: string
  url: string
  alt_text?: string
  position: number
  is_primary: boolean
  width?: number
  height?: number
  file_size?: number
  user_id: string
  created_at: string
}

export type ProductImageInput = Omit<ProductImage, 'id' | 'user_id' | 'created_at'>

export function useProductImages(productId: string | undefined) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      if (!productId) return []

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true })

      if (error) throw error
      return data as ProductImage[]
    },
    enabled: !!productId
  })

  const addImage = useMutation({
    mutationFn: async (image: ProductImageInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('product_images')
        .insert([{ ...image, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      toast({ title: 'Image ajoutée' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const updateImage = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductImage> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('product_images')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      toast({ title: 'Image mise à jour' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      toast({ title: 'Image supprimée' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const setPrimaryImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Remove primary from all images of this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)
        .eq('user_id', user.id)

      // Set new primary
      const { data, error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      toast({ title: 'Image principale mise à jour' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const reorderImages = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Update positions
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('product_images')
          .update({ position: index })
          .eq('id', id)
          .eq('user_id', user.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      toast({ title: 'Ordre des images mis à jour' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const uploadImage = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${productId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)

    if (uploadError) {
      // If bucket doesn't exist, return a placeholder URL
      console.warn('Storage bucket may not exist, using direct URL')
      return URL.createObjectURL(file)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  return {
    images,
    isLoading,
    error,
    addImage: addImage.mutate,
    updateImage: updateImage.mutate,
    deleteImage: deleteImage.mutate,
    setPrimaryImage: setPrimaryImage.mutate,
    reorderImages: reorderImages.mutate,
    uploadImage,
    isAdding: addImage.isPending,
    isUpdating: updateImage.isPending,
    isDeleting: deleteImage.isPending
  }
}
