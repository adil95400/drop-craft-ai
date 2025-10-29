import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function usePriceMonitoring() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: monitors, isLoading } = useQuery({
    queryKey: ['price-monitoring'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_monitoring')
        .select('*, products(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const createMonitor = useMutation({
    mutationFn: async (monitor: any) => {
      const { data, error } = await supabase
        .from('price_monitoring')
        .insert(monitor)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-monitoring'] })
      toast({
        title: 'Price monitoring enabled',
        description: 'You will be notified when the price changes'
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateMonitor = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('price_monitoring')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-monitoring'] })
      toast({ title: 'Monitor updated' })
    }
  })

  const deleteMonitor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('price_monitoring')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-monitoring'] })
      toast({ title: 'Monitor deleted' })
    }
  })

  return {
    monitors,
    isLoading,
    createMonitor,
    updateMonitor,
    deleteMonitor
  }
}
