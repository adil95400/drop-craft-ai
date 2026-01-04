import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface StockAlert {
  id: string
  user_id: string
  product_id?: string
  warehouse_id?: string
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'reorder_point' | 'expiring'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  threshold_value: number
  current_value: number
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
  created_at: string
}

export function useStockAlerts(filters?: { resolved?: boolean }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['stock-alerts', filters],
    queryFn: async () => {
      let query = supabase
        .from('stock_alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.resolved !== undefined) {
        query = query.eq('is_resolved', filters.resolved)
      }

      const { data, error } = await query

      if (error) throw error
      return data as StockAlert[]
    }
  })

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('stock_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      toast({ title: 'Alerte résolue' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const dismissAlert = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('stock_alerts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      toast({ title: 'Alerte supprimée' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const stats = {
    total: alerts.length,
    unresolved: alerts.filter(a => !a.is_resolved).length,
    critical: alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length,
    high: alerts.filter(a => a.severity === 'high' && !a.is_resolved).length,
    lowStock: alerts.filter(a => a.alert_type === 'low_stock' && !a.is_resolved).length,
    outOfStock: alerts.filter(a => a.alert_type === 'out_of_stock' && !a.is_resolved).length
  }

  return {
    alerts,
    stats,
    isLoading,
    error,
    refetch,
    resolveAlert: resolveAlert.mutate,
    dismissAlert: dismissAlert.mutate,
    isResolving: resolveAlert.isPending,
    isDismissing: dismissAlert.isPending
  }
}
