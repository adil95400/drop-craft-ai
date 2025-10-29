import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useStockAlerts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*, products(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const createAlert = useMutation({
    mutationFn: async (alert: any) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .insert(alert)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      toast({
        title: 'Stock alert enabled',
        description: 'You will be notified when stock is low'
      })
    }
  })

  const updateAlert = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      toast({ title: 'Alert updated' })
    }
  })

  const deleteAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_alerts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      toast({ title: 'Alert deleted' })
    }
  })

  return {
    alerts,
    isLoading,
    createAlert,
    updateAlert,
    deleteAlert
  }
}
