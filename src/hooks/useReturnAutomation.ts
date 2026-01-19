import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AutomationRule {
  id: string
  user_id: string
  name: string
  description?: string
  trigger_conditions: {
    reason_category?: string[]
    amount_max?: number
    amount_min?: number
    customer_order_count?: number
  }
  auto_actions: {
    auto_approve?: boolean
    generate_label?: boolean
    send_notification?: boolean
    create_supplier_return?: boolean
    auto_refund?: boolean
  }
  refund_config?: {
    method?: string
    percentage?: number
    deduct_shipping?: boolean
  }
  priority: number
  is_active: boolean
  execution_count: number
  last_executed_at?: string
  created_at: string
  updated_at: string
}

export interface ReturnLabel {
  id: string
  user_id: string
  return_id: string
  carrier_code: string
  carrier_name?: string
  tracking_number?: string
  label_url?: string
  label_format: string
  from_address: any
  to_address: any
  weight_kg?: number
  dimensions?: any
  shipping_cost?: number
  currency: string
  status: 'created' | 'printed' | 'in_transit' | 'delivered' | 'failed'
  expires_at?: string
  printed_at?: string
  created_at: string
  updated_at: string
}

export function useReturnAutomation() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get automation rules
  const { data: rules = [], isLoading: isLoadingRules, refetch: refetchRules } = useQuery({
    queryKey: ['return-automation-rules'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('return_automation_rules') as any)
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error
      return (data || []) as AutomationRule[]
    }
  })

  // Get return labels
  const { data: labels = [], isLoading: isLoadingLabels } = useQuery({
    queryKey: ['return-labels'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('return_labels') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data || []) as ReturnLabel[]
    }
  })

  // Create automation rule
  const createRule = useMutation({
    mutationFn: async (rule: Omit<AutomationRule, 'id' | 'user_id' | 'execution_count' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await (supabase
        .from('return_automation_rules') as any)
        .insert({
          ...rule,
          user_id: user.id,
          execution_count: 0
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-automation-rules'] })
      toast({ title: 'Règle créée', description: 'La règle d\'automatisation a été créée' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Update automation rule
  const updateRule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationRule> }) => {
      const { data, error } = await (supabase
        .from('return_automation_rules') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-automation-rules'] })
      toast({ title: 'Règle mise à jour' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Delete automation rule
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('return_automation_rules') as any)
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-automation-rules'] })
      toast({ title: 'Règle supprimée' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Auto-process a return
  const autoProcessReturn = useMutation({
    mutationFn: async (returnId: string) => {
      const { data, error } = await supabase.functions.invoke('returns-workflow-automation', {
        body: {
          action: 'auto_process',
          returnId
        }
      })

      if (error) throw error
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      if (data.processed) {
        toast({ 
          title: 'Retour traité automatiquement', 
          description: `Actions: ${data.actions?.join(', ') || 'Aucune'}` 
        })
      } else {
        toast({ 
          title: 'Pas de règle applicable', 
          description: data.reason,
          variant: 'default'
        })
      }
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Generate return label
  const generateLabel = useMutation({
    mutationFn: async ({ returnId, carrierCode, shipmentDetails }: { 
      returnId: string
      carrierCode?: string
      shipmentDetails?: { weight_kg: number; dimensions?: any }
    }) => {
      const { data, error } = await supabase.functions.invoke('returns-workflow-automation', {
        body: {
          action: 'create_label',
          returnId,
          carrierCode,
          shipmentDetails
        }
      })

      if (error) throw error
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['return-labels'] })
      toast({ 
        title: 'Étiquette générée', 
        description: `Tracking: ${data.tracking_number}` 
      })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Create supplier return
  const createSupplierReturn = useMutation({
    mutationFn: async (returnId: string) => {
      const { data, error } = await supabase.functions.invoke('returns-workflow-automation', {
        body: {
          action: 'create_supplier_return',
          returnId
        }
      })

      if (error) throw error
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      if (data.created) {
        toast({ 
          title: 'Retour fournisseur créé', 
          description: `${data.supplier_returns?.length || 0} retour(s) créé(s)` 
        })
      }
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Stats
  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.is_active).length,
    totalExecutions: rules.reduce((sum, r) => sum + (r.execution_count || 0), 0),
    totalLabels: labels.length,
    activeLabels: labels.filter(l => l.status === 'created' || l.status === 'printed').length
  }

  return {
    rules,
    labels,
    stats,
    isLoadingRules,
    isLoadingLabels,
    refetchRules,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    autoProcessReturn: autoProcessReturn.mutate,
    generateLabel: generateLabel.mutate,
    createSupplierReturn: createSupplierReturn.mutate,
    isCreatingRule: createRule.isPending,
    isProcessing: autoProcessReturn.isPending,
    isGeneratingLabel: generateLabel.isPending
  }
}
