import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Return {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'received' | 'refunded';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  refundAmount?: number;
  refundMethod?: 'original_payment' | 'store_credit' | 'bank_transfer';
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  autoProcessed?: boolean;
}

export interface ReturnRule {
  id: string;
  name: string;
  triggerConditions: {
    reasons: string[];
    maxDaysSinceOrder?: number;
    maxAmount?: number;
    productCategories?: string[];
  };
  autoApprove: boolean;
  autoRefund: boolean;
  autoSendConfirmation: boolean;
  refundPercentage: number;
  isActive: boolean;
  priority: number;
}

export function useReturnsManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch returns - use orders table with return status as fallback
  const { data: returns = [], isLoading: returnsLoading, refetch } = useQuery({
    queryKey: ['returns-management', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Try to get returns from orders with specific statuses
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(id, email, first_name, last_name)
        `)
        .eq('user_id', user.id)
        .in('status', ['return_requested', 'return_approved', 'return_received', 'refunded'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (orders || []).map(order => ({
        id: order.id,
        orderId: order.id,
        orderNumber: order.order_number,
        customerId: order.customer?.id,
        customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Client inconnu',
        customerEmail: order.customer?.email || '',
        reason: order.notes || 'Non spécifié',
        status: mapOrderStatusToReturnStatus(order.status),
        items: [],
        refundAmount: order.total_amount,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      })) as Return[];
    },
    enabled: !!user,
  });

  // Return stats
  const { data: stats } = useQuery({
    queryKey: ['returns-stats', user?.id],
    queryFn: async () => {
      const pending = returns.filter(r => r.status === 'pending').length;
      const approved = returns.filter(r => r.status === 'approved').length;
      const received = returns.filter(r => r.status === 'received').length;
      const refunded = returns.filter(r => r.status === 'refunded').length;
      const rejected = returns.filter(r => r.status === 'rejected').length;
      
      const totalRefundAmount = returns
        .filter(r => r.status === 'refunded')
        .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

      const avgProcessingDays = 2.5; // Could calculate from actual data

      return {
        pending,
        approved,
        received,
        refunded,
        rejected,
        total: returns.length,
        totalRefundAmount,
        avgProcessingDays,
        approvalRate: returns.length > 0 
          ? ((approved + received + refunded) / returns.length * 100).toFixed(1) 
          : 0
      };
    },
    enabled: returns.length >= 0,
  });

  // Process return (approve/reject)
  const processReturnMutation = useMutation({
    mutationFn: async ({ returnId, action, refundAmount, notes }: {
      returnId: string;
      action: 'approve' | 'reject';
      refundAmount?: number;
      notes?: string;
    }) => {
      const newStatus = action === 'approve' ? 'return_approved' : 'cancelled';

      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          notes: notes || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: `return_${action}`,
        entity_type: 'return',
        entity_id: returnId,
        description: `Retour ${action === 'approve' ? 'approuvé' : 'rejeté'}`,
        details: { refundAmount, notes }
      });

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['returns-management'] });
      toast.success(variables.action === 'approve' ? 'Retour approuvé' : 'Retour rejeté');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du traitement', {
        description: error.message
      });
    }
  });

  // Process refund
  const processRefundMutation = useMutation({
    mutationFn: async ({ returnId, amount, method }: {
      returnId: string;
      amount: number;
      method: 'original_payment' | 'store_credit' | 'bank_transfer';
    }) => {
      const { data, error } = await supabase.functions.invoke('returns-automation', {
        body: {
          action: 'auto_refund',
          return_id: returnId,
          amount,
          method
        }
      });

      if (error) throw error;

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', returnId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-management'] });
      toast.success('Remboursement effectué');
    },
    onError: (error: Error) => {
      toast.error('Erreur de remboursement', {
        description: error.message
      });
    }
  });

  // Auto-process return using AI/rules
  const autoProcessMutation = useMutation({
    mutationFn: async (returnId: string) => {
      const { data, error } = await supabase.functions.invoke('returns-automation', {
        body: {
          action: 'process_return',
          return_id: returnId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns-management'] });
      if (data.auto_approved) {
        toast.success('Retour approuvé automatiquement');
      } else {
        toast.info('Retour traité - approbation manuelle requise');
      }
    },
    onError: (error: Error) => {
      toast.error('Erreur de traitement automatique', {
        description: error.message
      });
    }
  });

  // Create return request
  const createReturnMutation = useMutation({
    mutationFn: async ({ orderId, reason, items }: {
      orderId: string;
      reason: string;
      items: Array<{ productId: string; quantity: number }>;
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'return_requested',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-management'] });
      toast.success('Demande de retour créée');
    }
  });

  return {
    returns,
    returnsLoading,
    stats,
    refetch,

    processReturn: processReturnMutation.mutate,
    isProcessing: processReturnMutation.isPending,

    processRefund: processRefundMutation.mutate,
    isRefunding: processRefundMutation.isPending,

    autoProcess: autoProcessMutation.mutate,
    isAutoProcessing: autoProcessMutation.isPending,

    createReturn: createReturnMutation.mutate,
    isCreating: createReturnMutation.isPending
  };
}

function mapOrderStatusToReturnStatus(status: string | null): Return['status'] {
  switch (status) {
    case 'return_requested':
      return 'pending';
    case 'return_approved':
      return 'approved';
    case 'return_received':
      return 'received';
    case 'refunded':
      return 'refunded';
    case 'cancelled':
      return 'rejected';
    default:
      return 'pending';
  }
}
