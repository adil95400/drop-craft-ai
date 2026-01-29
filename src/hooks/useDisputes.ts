import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Dispute {
  id: string
  user_id: string
  return_id?: string
  order_id?: string
  customer_id?: string
  dispute_number: string
  status: 'open' | 'investigating' | 'resolved' | 'escalated' | 'closed'
  dispute_type: 'refund' | 'product_quality' | 'delivery' | 'fraud' | 'chargeback' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description?: string
  customer_complaint?: string
  internal_notes?: string
  resolution_type?: 'full_refund' | 'partial_refund' | 'replacement' | 'store_credit' | 'rejected' | 'other'
  resolution_amount?: number
  resolution_notes?: string
  resolved_by?: string
  resolved_at?: string
  evidence?: any[]
  attachments?: any[]
  timeline?: TimelineEvent[]
  disputed_amount?: number
  due_date?: string
  escalated_at?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id?: string
  event: string
  description: string
  timestamp: string
  user_id?: string
  metadata?: any
}

export interface DisputeInput {
  return_id?: string
  order_id?: string
  customer_id?: string
  title: string
  description?: string
  dispute_type: Dispute['dispute_type']
  priority?: Dispute['priority']
  disputed_amount?: number
  customer_complaint?: string
}

export function useDisputes(filters?: { status?: string; priority?: string; search?: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: disputes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['disputes', filters],
    queryFn: async () => {
      let query = (supabase
        .from('disputes') as any)
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority)
      }

      if (filters?.search) {
        query = query.or(`dispute_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Dispute[]
    }
  })

  const createDispute = useMutation({
    mutationFn: async (disputeData: DisputeInput) => {
      const { data, error } = await supabase.functions.invoke('disputes-manager', {
        body: {
          action: 'create',
          returnId: disputeData.return_id,
          orderId: disputeData.order_id,
          data: disputeData
        }
      })

      if (error) throw error
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      toast({ title: 'Litige créé', description: 'Le litige a été créé avec succès' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const updateDispute = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Dispute> }) => {
      const { data, error } = await supabase.functions.invoke('disputes-manager', {
        body: {
          action: 'update',
          disputeId: id,
          data: updates
        }
      })

      if (error) throw error
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      toast({ title: 'Litige mis à jour' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const resolveDispute = useMutation({
    mutationFn: async ({ 
      id, 
      resolution_type, 
      resolution_amount, 
      resolution_notes 
    }: { 
      id: string
      resolution_type: Dispute['resolution_type']
      resolution_amount?: number
      resolution_notes?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('disputes-manager', {
        body: {
          action: 'resolve',
          disputeId: id,
          data: { resolution_type, resolution_amount, resolution_notes }
        }
      })

      if (error) throw error
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast({ title: 'Litige résolu', description: 'Le litige a été résolu avec succès' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const escalateDispute = useMutation({
    mutationFn: async ({ id, reason, new_priority }: { id: string; reason?: string; new_priority?: string }) => {
      const { data, error } = await supabase.functions.invoke('disputes-manager', {
        body: {
          action: 'escalate',
          disputeId: id,
          data: { reason, new_priority }
        }
      })

      if (error) throw error
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      toast({ title: 'Litige escaladé', description: 'Le litige a été marqué comme urgent' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const addEvidence = useMutation({
    mutationFn: async ({ id, evidence }: { id: string; evidence: any }) => {
      const { data, error } = await supabase.functions.invoke('disputes-manager', {
        body: {
          action: 'add_evidence',
          disputeId: id,
          data: evidence
        }
      })

      if (error) throw error
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      toast({ title: 'Preuve ajoutée' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Statistics
  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    investigating: disputes.filter(d => d.status === 'investigating').length,
    escalated: disputes.filter(d => d.status === 'escalated').length,
    resolved: disputes.filter(d => d.status === 'resolved' || d.status === 'closed').length,
    urgent: disputes.filter(d => d.priority === 'urgent').length,
    totalDisputed: disputes.reduce((sum, d) => sum + (d.disputed_amount || 0), 0),
    totalResolved: disputes
      .filter(d => d.status === 'resolved')
      .reduce((sum, d) => sum + (d.resolution_amount || 0), 0)
  }

  return {
    disputes,
    stats,
    isLoading,
    error,
    refetch,
    createDispute: createDispute.mutate,
    updateDispute: updateDispute.mutate,
    resolveDispute: resolveDispute.mutate,
    escalateDispute: escalateDispute.mutate,
    addEvidence: addEvidence.mutate,
    isCreating: createDispute.isPending,
    isUpdating: updateDispute.isPending,
    isResolving: resolveDispute.isPending
  }
}
