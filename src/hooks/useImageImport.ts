import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ImageImportOptions {
  imageUrls: string[]
  productInfo?: {
    name?: string
    description?: string
    price?: number
    cost_price?: number
    category?: string
    brand?: string
    stock_quantity?: number
  }
}

export const useImageImport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)

  const imageImportMutation = useMutation({
    mutationFn: async (options: ImageImportOptions) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      if (!options.imageUrls || options.imageUrls.length === 0) {
        throw new Error('Aucune image fournie')
      }

      setProgress(10)

      // Call image import edge function
      const { data, error } = await supabase.functions.invoke('image-product-import', {
        body: {
          imageUrls: options.imageUrls,
          productInfo: options.productInfo || {}
        }
      })

      if (error) throw error

      setProgress(100)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
      
      toast({
        title: "Import images réussi",
        description: `${data.imported || 0} produits créés depuis les images`
      })
      
      setTimeout(() => setProgress(0), 2000)
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'import images",
        description: error.message,
        variant: "destructive"
      })
      setProgress(0)
    }
  })

  return {
    importFromImages: imageImportMutation.mutate,
    isImporting: imageImportMutation.isPending,
    progress
  }
}
