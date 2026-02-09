/**
 * useMappingPresets — Migrated to API V1 /v1/import/presets
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { presetsApi } from '@/services/api/client'

export interface MappingPreset {
  id: string
  name: string
  icon?: string
  platform: string
  mapping: Record<string, string>
  is_default: boolean
  use_count: number
  version: number
  columns?: string[]
  columns_signature?: string | null
  has_header?: boolean
  delimiter?: string
  encoding?: string
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export function useMappingPresets(platform?: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['mapping-presets', user?.id, platform],
    queryFn: async () => {
      const resp = await presetsApi.list({ per_page: 100, platform })
      return resp.items as MappingPreset[]
    },
    enabled: !!user?.id,
  })

  const createPreset = useMutation({
    mutationFn: async (params: { name: string; icon?: string; mapping: Record<string, string>; platform?: string; columns?: string[] }) => {
      return presetsApi.create({
        name: params.name,
        icon: params.icon || 'csv',
        mapping: params.mapping,
        platform: params.platform || 'generic',
        columns: params.columns,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping-presets'] })
      toast.success('Preset sauvegardé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deletePreset = useMutation({
    mutationFn: (id: string) => presetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping-presets'] })
      toast.success('Preset supprimé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const trackUsage = useMutation({
    mutationFn: async (id: string) => {
      // Increment usage via update (version auto-increments server-side)
      // We use a lightweight PUT that only touches last_used_at
      const preset = presets.find(p => p.id === id)
      if (!preset) return
      // For now, direct Supabase call since API V1 doesn't have a dedicated "track usage" endpoint
      const { supabase } = await import('@/integrations/supabase/client')
      await supabase.from('mapping_presets').update({
        usage_count: (preset.use_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping-presets'] })
    },
  })

  return {
    presets,
    isLoading,
    createPreset: createPreset.mutate,
    deletePreset: deletePreset.mutate,
    trackUsage: trackUsage.mutate,
    isSaving: createPreset.isPending,
  }
}
