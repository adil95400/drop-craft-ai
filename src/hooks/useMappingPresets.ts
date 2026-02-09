import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export interface MappingPreset {
  id: string
  user_id: string
  name: string
  icon: string
  mapping: Record<string, string>
  is_default: boolean
  usage_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export function useMappingPresets() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['mapping-presets', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('mapping_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
      if (error) throw error
      return (data || []) as unknown as MappingPreset[]
    },
    enabled: !!user?.id,
  })

  const createPreset = useMutation({
    mutationFn: async (params: { name: string; icon?: string; mapping: Record<string, string> }) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('mapping_presets')
        .insert({
          user_id: user.id,
          name: params.name,
          icon: params.icon || 'csv',
          mapping: params.mapping,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping-presets'] })
      toast.success('Preset sauvegardé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mapping_presets')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping-presets'] })
      toast.success('Preset supprimé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const trackUsage = useMutation({
    mutationFn: async (id: string) => {
      // Use raw update since usage_count increment isn't in generated types
      const preset = presets.find(p => p.id === id)
      if (!preset) return
      const { error } = await supabase
        .from('mapping_presets')
        .update({
          usage_count: (preset.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
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
