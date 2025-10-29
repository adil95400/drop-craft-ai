import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useExtensionConfig() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['extension-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('extension_configs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Config doesn't exist, create default
        const { data: newConfig, error: insertError } = await supabase
          .from('extension_configs')
          .insert({
            user_id: user.id,
            auto_import_enabled: false,
            price_monitoring_enabled: true,
            stock_alerts_enabled: true
          })
          .select()
          .single()

        if (insertError) throw insertError
        return newConfig
      }

      if (error) throw error
      return data
    }
  })

  const updateConfig = useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('extension_configs')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extension-config'] })
      toast({ title: 'Configuration saved' })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    config,
    isLoading,
    updateConfig
  }
}
