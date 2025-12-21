import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface MarketingAutomation {
  id: string
  name: string
  trigger_type: string
  trigger_config?: any
  actions?: any
  is_active?: boolean
  last_triggered_at?: string
  trigger_count?: number
  current_metrics?: any
  user_id: string
  created_at: string
  updated_at: string
}

interface MarketingAutomationInsert {
  name: string
  trigger_type?: string
  trigger_config?: any
  actions?: any
  is_active?: boolean
  current_metrics?: any
}

interface MarketingAutomationUpdate extends Partial<MarketingAutomationInsert> {
  id?: string
}

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
        .from('automated_campaigns' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as unknown as MarketingAutomation[]
    },
    enabled: !!user?.id
  })

  const createAutomation = useMutation({
    mutationFn: async (automationData: MarketingAutomationInsert) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('automated_campaigns' as any)
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
        .from('automated_campaigns' as any)
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
        .from('automated_campaigns' as any)
        .update({ is_active })
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
