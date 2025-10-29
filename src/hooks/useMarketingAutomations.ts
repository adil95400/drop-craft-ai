import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/integrations/supabase/types'

type MarketingAutomation = Database['public']['Tables']['automated_campaigns']['Row']
type MarketingAutomationInsert = Database['public']['Tables']['automated_campaigns']['Insert']
type MarketingAutomationUpdate = Database['public']['Tables']['automated_campaigns']['Update']

export const useMarketingAutomations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    data: automations = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['marketing-automations', user?.id],
    queryFn: async (): Promise<MarketingAutomation[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  const createAutomation = useMutation({
    mutationFn: async (automationData: Omit<MarketingAutomationInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('automated_campaigns')
        .insert([{ ...automationData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-automations'] })
      toast({
        title: "Automation créée",
        description: "Votre automation a été créée avec succès"
      })
    }
  })

  const updateAutomation = useMutation({
    mutationFn: async ({ id, ...updates }: MarketingAutomationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('automated_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-automations'] })
      toast({
        title: "Automation mise à jour",
        description: "Les modifications ont été enregistrées"
      })
    }
  })

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('automated_campaigns')
        .update({ is_active, status: is_active ? 'running' : 'paused' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-automations'] })
    }
  })

  return {
    automations,
    isLoading,
    error,
    createAutomation: createAutomation.mutate,
    updateAutomation: updateAutomation.mutate,
    toggleAutomation: toggleAutomation.mutate,
    isCreating: createAutomation.isPending,
    isUpdating: updateAutomation.isPending,
    isToggling: toggleAutomation.isPending
  }
}
