import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface TemuCredentials {
  apiKey: string
  sellerId: string
  environment?: 'production' | 'sandbox'
}

export function useTemuConnector() {
  const queryClient = useQueryClient()

  const connectTemu = useMutation({
    mutationFn: async ({ 
      supplier_id, 
      user_id, 
      credentials 
    }: { 
      supplier_id: string
      user_id: string
      credentials: TemuCredentials 
    }) => {
      const { data, error } = await supabase.functions.invoke('temu-connector', {
        body: { 
          action: 'connect', 
          supplier_id, 
          user_id, 
          credentials 
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: 'Temu connecté',
        description: 'Votre compte Temu a été connecté avec succès'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const syncTemuProducts = useMutation({
    mutationFn: async ({ 
      supplier_id, 
      user_id 
    }: { 
      supplier_id: string
      user_id: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('temu-connector', {
        body: { 
          action: 'sync', 
          supplier_id, 
          user_id 
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })
      toast({
        title: 'Synchronisation réussie',
        description: `${data.products_synced} produits importés depuis Temu`
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    connectTemu: connectTemu.mutate,
    isConnecting: connectTemu.isPending,
    syncTemuProducts: syncTemuProducts.mutate,
    isSyncing: syncTemuProducts.isPending
  }
}
