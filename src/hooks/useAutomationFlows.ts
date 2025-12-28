import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface AutomationStep {
  id: string
  type: 'email' | 'sms' | 'wait' | 'condition' | 'action'
  name: string
  config: Record<string, any>
  position: { x: number; y: number }
  next_step_id?: string
  condition_true_step_id?: string
  condition_false_step_id?: string
}

export interface AutomationFlow {
  id: string
  user_id: string
  name: string
  description?: string
  trigger_type: 'cart_abandonment' | 'post_purchase' | 'welcome' | 'birthday' | 'inactive' | 'custom' | 'product_view' | 'order_status'
  trigger_config: Record<string, any>
  steps: AutomationStep[]
  status: 'draft' | 'active' | 'paused'
  stats: {
    entered: number
    completed: number
    converted: number
  }
  created_at: string
  updated_at: string
}

export interface AutomationExecution {
  id: string
  flow_id: string
  contact_email: string
  contact_data: Record<string, any>
  current_step: number
  status: 'active' | 'completed' | 'exited' | 'failed'
  entered_at: string
  completed_at?: string
  last_action_at?: string
  actions_log: Array<{
    step_id: string
    action: string
    timestamp: string
    result: any
  }>
}

const TRIGGER_LABELS: Record<string, string> = {
  cart_abandonment: 'Panier abandonné',
  post_purchase: 'Après achat',
  welcome: 'Bienvenue',
  birthday: 'Anniversaire',
  inactive: 'Client inactif',
  custom: 'Personnalisé',
  product_view: 'Vue produit',
  order_status: 'Statut commande'
}

export function useAutomationFlows() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ['automation-flows', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('automation_flows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as unknown as AutomationFlow[]).map(flow => ({
        ...flow,
        steps: Array.isArray(flow.steps) ? flow.steps : [],
        stats: typeof flow.stats === 'object' && flow.stats !== null 
          ? flow.stats as AutomationFlow['stats']
          : { entered: 0, completed: 0, converted: 0 }
      }))
    },
    enabled: !!user?.id
  })

  const { data: executions = [] } = useQuery({
    queryKey: ['automation-executions', user?.id],
    queryFn: async () => {
      if (!user?.id || flows.length === 0) return []
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .in('flow_id', flows.map(f => f.id))
        .order('entered_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as unknown as AutomationExecution[]
    },
    enabled: !!user?.id && flows.length > 0
  })

  const createFlow = useMutation({
    mutationFn: async (flow: Partial<AutomationFlow>) => {
      if (!user?.id) throw new Error('Not authenticated')
      if (!flow.name || !flow.trigger_type) throw new Error('Name and trigger required')
      const { data, error } = await supabase
        .from('automation_flows')
        .insert([{ 
          name: flow.name,
          description: flow.description,
          trigger_type: flow.trigger_type,
          trigger_config: flow.trigger_config || {},
          user_id: user.id,
          steps: JSON.parse(JSON.stringify(flow.steps || [])),
          stats: { entered: 0, completed: 0, converted: 0 }
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-flows'] })
      toast({ title: 'Flow créé', description: 'L\'automation a été créée avec succès' })
    }
  })

  const updateFlow = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutomationFlow> & { id: string }) => {
      const updateData: Record<string, any> = { ...updates }
      if (updates.steps) updateData.steps = JSON.parse(JSON.stringify(updates.steps))
      if (updates.stats) updateData.stats = JSON.parse(JSON.stringify(updates.stats))
      
      const { data, error } = await supabase
        .from('automation_flows')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-flows'] })
      toast({ title: 'Flow mis à jour', description: 'Les modifications ont été enregistrées' })
    }
  })

  const deleteFlow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_flows')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-flows'] })
      toast({ title: 'Flow supprimé', description: 'L\'automation a été supprimée' })
    }
  })

  const duplicateFlow = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated')
      const flow = flows.find(f => f.id === id)
      if (!flow) throw new Error('Flow not found')

      const { data, error } = await supabase
        .from('automation_flows')
        .insert([{
          user_id: user.id,
          name: `${flow.name} (copie)`,
          description: flow.description,
          trigger_type: flow.trigger_type,
          trigger_config: flow.trigger_config || {},
          steps: JSON.parse(JSON.stringify(flow.steps)),
          status: 'draft',
          stats: { entered: 0, completed: 0, converted: 0 }
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-flows'] })
      toast({ title: 'Flow dupliqué', description: 'Une copie a été créée' })
    }
  })

  const toggleFlowStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' }) => {
      const { data, error } = await supabase
        .from('automation_flows')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automation-flows'] })
      toast({ 
        title: variables.status === 'active' ? 'Flow activé' : 'Flow en pause',
        description: variables.status === 'active' 
          ? 'L\'automation est maintenant active' 
          : 'L\'automation a été mise en pause'
      })
    }
  })

  // Stats
  const stats = {
    totalFlows: flows.length,
    activeFlows: flows.filter(f => f.status === 'active').length,
    totalEntered: flows.reduce((acc, f) => acc + (f.stats?.entered || 0), 0),
    totalCompleted: flows.reduce((acc, f) => acc + (f.stats?.completed || 0), 0),
    totalConverted: flows.reduce((acc, f) => acc + (f.stats?.converted || 0), 0),
    conversionRate: flows.reduce((acc, f) => acc + (f.stats?.entered || 0), 0) > 0
      ? (flows.reduce((acc, f) => acc + (f.stats?.converted || 0), 0) / flows.reduce((acc, f) => acc + (f.stats?.entered || 0), 0)) * 100
      : 0
  }

  return {
    flows,
    executions,
    stats,
    isLoading,
    TRIGGER_LABELS,
    createFlow: createFlow.mutate,
    updateFlow: updateFlow.mutate,
    deleteFlow: deleteFlow.mutate,
    duplicateFlow: duplicateFlow.mutate,
    toggleFlowStatus: toggleFlowStatus.mutate,
    isCreating: createFlow.isPending
  }
}
