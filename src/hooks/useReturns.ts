import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ReturnItem {
  product_id: string
  product_name: string
  sku?: string
  quantity: number
  price: number
  reason?: string
  order_item_id?: string
  image_url?: string
}

export interface ReturnAttachment {
  name: string
  url: string
  type: string
  size: number
}

export interface Return {
  id: string
  order_id?: string
  customer_id?: string
  user_id: string
  rma_number: string
  status: 'pending' | 'approved' | 'received' | 'inspecting' | 'refunded' | 'rejected' | 'completed'
  reason: string
  reason_category?: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'damaged_shipping' | 'other'
  description?: string
  items: ReturnItem[]
  attachments?: ReturnAttachment[]
  refund_amount?: number
  refund_method?: 'original_payment' | 'store_credit' | 'exchange'
  tracking_number?: string
  carrier?: string
  received_at?: string
  inspected_at?: string
  refunded_at?: string
  notes?: string
  images?: string[]
  created_at: string
  updated_at: string
}

export type ReturnInput = Omit<Return, 'id' | 'user_id' | 'rma_number' | 'created_at' | 'updated_at'>

export function useReturns(filters?: { status?: string; search?: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: returns = [], isLoading, error, refetch } = useQuery({
    queryKey: ['returns', filters],
    queryFn: async () => {
      let query = supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.search) {
        query = query.or(`rma_number.ilike.%${filters.search}%,reason.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []).map((item: any) => ({
        ...item,
        items: Array.isArray(item.items) ? item.items : []
      })) as Return[]
    }
  })

  const createReturn = useMutation({
    mutationFn: async (returnData: ReturnInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Generate RMA number
      const { data: rmaNumber, error: rmaError } = await supabase.rpc('generate_rma_number')
      if (rmaError) throw rmaError

      const { data, error } = await supabase
        .from('returns')
        .insert([{
          ...returnData,
          user_id: user.id,
          rma_number: rmaNumber,
          items: returnData.items as any,
          attachments: returnData.attachments as any
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast({ title: 'Retour créé', description: 'La demande de retour a été créée avec succès' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const updateReturn = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Return> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('returns')
        .update({
          ...updates,
          items: updates.items as any,
          attachments: updates.attachments as any
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast({ title: 'Retour mis à jour' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: Return['status']; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const updates: any = { status }
      
      // Auto-set timestamps based on status
      if (status === 'received') updates.received_at = new Date().toISOString()
      if (status === 'inspecting') updates.inspected_at = new Date().toISOString()
      if (status === 'refunded') updates.refunded_at = new Date().toISOString()
      if (notes) updates.notes = notes

      const { data, error } = await supabase
        .from('returns')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast({ 
        title: 'Statut mis à jour', 
        description: `Le retour est maintenant "${variables.status}"` 
      })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const deleteReturn = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('returns')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast({ title: 'Retour supprimé' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Statistics
  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    received: returns.filter(r => r.status === 'received').length,
    completed: returns.filter(r => r.status === 'completed' || r.status === 'refunded').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    totalRefunded: returns
      .filter(r => r.status === 'refunded' || r.status === 'completed')
      .reduce((sum, r) => sum + (r.refund_amount || 0), 0)
  }

  return {
    returns,
    stats,
    isLoading,
    error,
    refetch,
    createReturn: createReturn.mutate,
    updateReturn: updateReturn.mutate,
    updateStatus: updateStatus.mutate,
    deleteReturn: deleteReturn.mutate,
    isCreating: createReturn.isPending,
    isUpdating: updateReturn.isPending || updateStatus.isPending,
    isDeleting: deleteReturn.isPending
  }
}
