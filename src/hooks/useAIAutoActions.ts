import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AIAutoActionConfig {
  id?: string
  action_type: string
  is_enabled: boolean
  threshold_score: number
  scope: string
  max_daily_actions: number
  actions_today?: number
  last_run_at?: string
  config?: Record<string, any>
}

export interface AIAutoActionLog {
  id: string
  product_id: string | null
  action_type: string
  field_name: string
  old_value: string | null
  new_value: string | null
  confidence_score: number
  status: string
  created_at: string
}

const DEFAULT_CONFIGS: AIAutoActionConfig[] = [
  { action_type: 'optimize_title', is_enabled: false, threshold_score: 70, scope: 'all', max_daily_actions: 50 },
  { action_type: 'optimize_description', is_enabled: false, threshold_score: 70, scope: 'all', max_daily_actions: 50 },
  { action_type: 'generate_tags', is_enabled: false, threshold_score: 80, scope: 'all', max_daily_actions: 100 },
  { action_type: 'fix_seo', is_enabled: false, threshold_score: 80, scope: 'all', max_daily_actions: 50 },
]

export function useAIAutoConfigs() {
  return useQuery({
    queryKey: ['ai-auto-configs'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-auto-actions', {
        body: { action: 'get_configs' },
      })
      if (error) throw error
      const configs = data?.configs || []
      // Merge with defaults for missing types
      const configMap = new Map(configs.map((c: any) => [c.action_type, c]))
      return DEFAULT_CONFIGS.map(d => configMap.get(d.action_type) || d)
    },
  })
}

export function useSaveAIAutoConfigs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (configs: AIAutoActionConfig[]) => {
      const { data, error } = await supabase.functions.invoke('ai-auto-actions', {
        body: { action: 'save_configs', configs },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-auto-configs'] })
      toast.success('Configuration sauvegardée')
    },
    onError: (e: any) => toast.error(`Erreur: ${e.message}`),
  })
}

export function useRunAIAutoActions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (productIds?: string[]) => {
      const { data, error } = await supabase.functions.invoke('ai-auto-actions', {
        body: { action: 'run_auto_actions', productIds },
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ai-auto-configs'] })
      qc.invalidateQueries({ queryKey: ['ai-auto-logs'] })
      toast.success(`${data.applied} actions appliquées`)
    },
    onError: (e: any) => toast.error(`Erreur: ${e.message}`),
  })
}

export function useAIAutoLogs() {
  return useQuery({
    queryKey: ['ai-auto-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-auto-actions', {
        body: { action: 'get_logs' },
      })
      if (error) throw error
      return (data?.logs || []) as AIAutoActionLog[]
    },
  })
}

export function useRevertAIAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (logId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-auto-actions', {
        body: { action: 'revert', configId: logId },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-auto-logs'] })
      toast.success('Action réversée')
    },
    onError: (e: any) => toast.error(`Erreur: ${e.message}`),
  })
}
