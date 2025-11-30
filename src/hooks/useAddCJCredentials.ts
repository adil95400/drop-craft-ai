import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useAddCJCredentials() {
  return useMutation({
    mutationFn: async (accessToken: string) => {
      const { data, error } = await supabase.functions.invoke('add-cj-credentials', {
        body: { accessToken }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success('CJ Dropshipping connecté avec succès!')
      console.log('CJ credentials added:', data)
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`)
      console.error('Failed to add CJ credentials:', error)
    }
  })
}
