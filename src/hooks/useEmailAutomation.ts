import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface EmailAutomationRule {
  id: string
  name: string
  trigger: string
  status: 'active' | 'paused'
  sent: number
  openRate: number
  description: string
}

export function useEmailAutomation() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['email-automations', user?.id],
    queryFn: async (): Promise<EmailAutomationRule[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((automation: any) => {
        const metrics = (automation.current_metrics || {}) as any
        const config = (automation.trigger_config || {}) as any
        
        return {
          id: automation.id,
          name: automation.name,
          trigger: config.trigger_description || automation.trigger_type,
          status: automation.is_active ? 'active' : 'paused',
          sent: metrics.sent || automation.trigger_count || 0,
          openRate: metrics.open_rate || 0,
          description: config.description || `Automation ${automation.trigger_type}`
        }
      })
    },
    enabled: !!user?.id
  })

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('automated_campaigns')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-automations'] })
      toast({
        title: "Automation mise à jour",
        description: "Le statut a été modifié"
      })
    }
  })

  // Calculate stats
  const stats = {
    totalSent: automations.reduce((acc, a) => acc + a.sent, 0),
    avgOpenRate: automations.length > 0 
      ? automations.reduce((acc, a) => acc + a.openRate, 0) / automations.length 
      : 0,
    conversions: Math.floor(automations.reduce((acc, a) => acc + a.sent, 0) * 0.16)
  }

  return {
    automations,
    stats,
    isLoading,
    toggleAutomation: toggleAutomation.mutate
  }
}
