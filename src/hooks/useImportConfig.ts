import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useToast } from '@/hooks/use-toast'

export interface ImportConfig {
  auto_optimize: boolean
  auto_translate: boolean
  price_rules: boolean
  duplicate_check: boolean
  auto_publish: boolean
  default_margin: number
  round_prices: boolean
  currency: string
  default_category?: string
  default_tags?: string[]
}

const DEFAULT_CONFIG: ImportConfig = {
  auto_optimize: true,
  auto_translate: true,
  price_rules: true,
  duplicate_check: true,
  auto_publish: false,
  default_margin: 30,
  round_prices: true,
  currency: 'EUR',
  default_category: undefined,
  default_tags: []
}

export function useImportConfig() {
  const { user } = useUnifiedAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch config from user_settings.import_config column
  const { data: config = DEFAULT_CONFIG, isLoading } = useQuery({
    queryKey: ['import-config', user?.id],
    queryFn: async (): Promise<ImportConfig> => {
      if (!user?.id) return DEFAULT_CONFIG

      const { data, error } = await supabase
        .from('user_settings')
        .select('import_config')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching import config:', error)
        return DEFAULT_CONFIG
      }

      if (!data || !data.import_config) return DEFAULT_CONFIG

      const importConfig = typeof data.import_config === 'object' ? data.import_config : {}
      return { ...DEFAULT_CONFIG, ...importConfig as Partial<ImportConfig> }
    },
    enabled: !!user?.id,
    staleTime: 60000
  })

  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: async (newConfig: Partial<ImportConfig>) => {
      if (!user?.id) throw new Error('Non authentifié')

      const mergedConfig = { ...config, ...newConfig }

      // Check if user_settings row exists
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        // Update existing row
        const { error } = await supabase
          .from('user_settings')
          .update({
            import_config: mergedConfig,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Insert new row
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            import_config: mergedConfig
          })

        if (error) throw error
      }

      return mergedConfig
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['import-config', user?.id], data)
      toast({
        title: 'Configuration sauvegardée',
        description: 'Vos préférences d\'import ont été mises à jour'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Toggle single config option
  const toggleOption = (key: keyof ImportConfig) => {
    const currentValue = config[key]
    if (typeof currentValue === 'boolean') {
      updateMutation.mutate({ [key]: !currentValue })
    }
  }

  // Update single config value
  const updateOption = <K extends keyof ImportConfig>(key: K, value: ImportConfig[K]) => {
    updateMutation.mutate({ [key]: value })
  }

  // Reset to defaults
  const resetToDefaults = () => {
    updateMutation.mutate(DEFAULT_CONFIG)
  }

  return {
    config,
    isLoading,
    updateConfig: updateMutation.mutate,
    toggleOption,
    updateOption,
    resetToDefaults,
    isSaving: updateMutation.isPending
  }
}
