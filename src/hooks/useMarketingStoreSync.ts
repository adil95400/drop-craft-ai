import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { toast } from 'sonner'

interface SyncStats {
  active_rules: number; total_rules: number; total_executions: number; success_rate: number
  estimated_savings: number; connected_platforms: number; recent_syncs: any[]
}

interface AutomationRule {
  id: string; name: string; description: string | null; trigger_type: string; action_type: string
  is_active: boolean; trigger_count: number; last_triggered_at: string | null
  trigger_config: any; action_config: any
}

export function useMarketingStoreSync() {
  const queryClient = useQueryClient()

  const { data: stats, isLoading: isLoadingStats } = useQuery<SyncStats>({
    queryKey: ['marketing-sync-stats'],
    queryFn: async () => {
      const res = await shopOptiApi.request<{ stats: SyncStats }>('/marketing/store-sync/stats')
      return res.data?.stats || { active_rules: 0, total_rules: 0, total_executions: 0, success_rate: 0, estimated_savings: 0, connected_platforms: 0, recent_syncs: [] }
    },
    refetchInterval: 30000
  })

  const { data: rules, isLoading: isLoadingRules } = useQuery<AutomationRule[]>({
    queryKey: ['marketing-automation-rules'],
    queryFn: async () => {
      const res = await shopOptiApi.request<{ rules: AutomationRule[] }>('/marketing/store-sync/rules')
      return res.data?.rules || []
    }
  })

  const syncCoupons = useMutation({
    mutationFn: async () => {
      const res = await shopOptiApi.request('/marketing/store-sync/coupons', { method: 'POST' })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-sync-stats'] })
      toast.success(`${data.synced_count} coupons synchronisés`, { description: `Vers ${data.platforms_count} plateformes connectées` })
    },
    onError: (error: Error) => { toast.error('Erreur de synchronisation', { description: error.message }) }
  })

  const importCustomers = useMutation({
    mutationFn: async () => {
      const res = await shopOptiApi.request('/marketing/store-sync/import-customers', { method: 'POST' })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-sync-stats'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`${data.total_imported} clients importés`, { description: `Depuis ${data.platforms_count} boutiques` })
    },
    onError: (error: Error) => { toast.error("Erreur d'import", { description: error.message }) }
  })

  const toggleRule = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const res = await shopOptiApi.request(`/marketing/store-sync/rules/${ruleId}/toggle`, { method: 'PUT', body: { is_active: isActive } })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-automation-rules'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-sync-stats'] })
      toast.success('Règle mise à jour')
    }
  })

  return {
    stats, isLoadingStats, rules: rules || [], isLoadingRules,
    syncCoupons: syncCoupons.mutate, isSyncingCoupons: syncCoupons.isPending,
    importCustomers: importCustomers.mutate, isImportingCustomers: importCustomers.isPending,
    toggleRule: toggleRule.mutate, isTogglingRule: toggleRule.isPending
  }
}
