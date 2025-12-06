import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useAddCJCredentials() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ accessToken, email }: { accessToken: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('add-cj-credentials', {
        body: { accessToken, email }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: (data) => {
      const productsCount = data?.syncStats?.imported || 0
      toast.success(`CJ Dropshipping connecté! ${productsCount} produits synchronisés.`)
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })
    },
    onError: (error: any) => {
      const message = error.message || 'Erreur de connexion'
      toast.error(`Erreur CJ: ${message}`)
      console.error('Failed to add CJ credentials:', error)
    }
  })
}
