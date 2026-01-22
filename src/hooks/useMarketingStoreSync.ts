import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface SyncStats {
  active_rules: number
  total_rules: number
  total_executions: number
  success_rate: number
  estimated_savings: number
  connected_platforms: number
  recent_syncs: any[]
}

interface AutomationRule {
  id: string
  name: string
  description: string | null
  trigger_type: string
  action_type: string
  is_active: boolean
  trigger_count: number
  last_triggered_at: string | null
  trigger_config: any
  action_config: any
}

export function useMarketingStoreSync() {
  const queryClient = useQueryClient()

  // Fetch sync stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<SyncStats>({
    queryKey: ['marketing-sync-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('marketing-store-sync', {
        body: { action: 'get_sync_stats' }
      })

      if (error) throw error
      return data.stats
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Fetch automation rules
  const { data: rules, isLoading: isLoadingRules } = useQuery<AutomationRule[]>({
    queryKey: ['marketing-automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('marketing-store-sync', {
        body: { action: 'get_automation_rules' }
      })

      if (error) throw error
      return data.rules || []
    }
  })

  // Sync coupons to stores
  const syncCoupons = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('marketing-store-sync', {
        body: { action: 'sync_coupons_to_stores' }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-sync-stats'] })
      toast.success(`${data.synced_count} coupons synchronisés`, {
        description: `Vers ${data.platforms_count} plateformes connectées`
      })
    },
    onError: (error: Error) => {
      toast.error('Erreur de synchronisation', {
        description: error.message
      })
    }
  })

  // Import customers from stores
  const importCustomers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('marketing-store-sync', {
        body: { action: 'import_customers_from_stores' }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-sync-stats'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`${data.total_imported} clients importés`, {
        description: `Depuis ${data.platforms_count} boutiques`
      })
    },
    onError: (error: Error) => {
      toast.error('Erreur d\'import', {
        description: error.message
      })
    }
  })

  // Toggle automation rule
  const toggleRule = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { data, error } = await supabase.functions.invoke('marketing-store-sync', {
        body: { 
          action: 'toggle_automation_rule',
          rule_id: ruleId,
          is_active: isActive
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-automation-rules'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-sync-stats'] })
      toast.success('Règle mise à jour')
    }
  })

  return {
    stats,
    isLoadingStats,
    rules: rules || [],
    isLoadingRules,
    syncCoupons: syncCoupons.mutate,
    isSyncingCoupons: syncCoupons.isPending,
    importCustomers: importCustomers.mutate,
    isImportingCustomers: importCustomers.isPending,
    toggleRule: toggleRule.mutate,
    isTogglingRule: toggleRule.isPending
  }
}
