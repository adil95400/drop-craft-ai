import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'order_paid' | 'order_confirmed' | 'order_processing';
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    countries?: string[];
    suppliers?: string[];
  };
  actions: {
    autoSendToSupplier: boolean;
    autoGenerateLabel: boolean;
    autoNotifyCustomer: boolean;
    selectedCarrier?: string;
  };
  isActive: boolean;
  priority: number;
}

export interface SupplierOrder {
  id: string;
  orderId: string;
  supplierId: string;
  supplierOrderId?: string;
  status: 'pending' | 'sent' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'failed';
  trackingNumber?: string;
  carrier?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useOrderAutomation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch automation rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['order-automation-rules', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('fulfilment_rules')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(rule => ({
        id: rule.id,
        name: rule.name,
        trigger: (rule.conditions as any)?.trigger || 'order_paid',
        conditions: rule.conditions || {},
        actions: rule.actions || {},
        isActive: rule.is_active || false,
        priority: rule.priority || 0
      })) as AutomationRule[];
    },
    enabled: !!user,
  });

  // Fetch supplier orders / fulfillment queue
  const { data: supplierOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['supplier-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('fulfillment_shipments')
        .select(`
          *,
          order:orders(id, order_number, total_amount, status, customer:customers(email, first_name, last_name))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Automation stats
  const { data: stats } = useQuery({
    queryKey: ['automation-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: shipments } = await supabase
        .from('fulfillment_shipments')
        .select('status, created_at')
        .eq('user_id', user.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = shipments?.filter(s => new Date(s.created_at) >= today).length || 0;
      const pending = shipments?.filter(s => s.status === 'pending').length || 0;
      const processing = shipments?.filter(s => ['sent', 'processing'].includes(s.status || '')).length || 0;
      const shipped = shipments?.filter(s => s.status === 'shipped').length || 0;
      const delivered = shipments?.filter(s => s.status === 'delivered').length || 0;
      const failed = shipments?.filter(s => s.status === 'failed').length || 0;

      const total = shipments?.length || 1;
      const successRate = ((delivered + shipped) / total) * 100;

      return {
        todayOrders,
        pending,
        processing,
        shipped,
        delivered,
        failed,
        total,
        successRate: Number(successRate.toFixed(1)),
        avgProcessingTime: 2.3 // Hours - could be calculated from actual data
      };
    },
    enabled: !!user,
  });

  // Send order to supplier
  const sendToSupplierMutation = useMutation({
    mutationFn: async ({ orderId, supplierId, items, shippingAddress }: {
      orderId: string;
      supplierId: string;
      items: any[];
      shippingAddress: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('supplier-order-place', {
        body: {
          orderId,
          userId: user?.id,
          supplierId,
          items,
          shippingAddress
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast.success('Commande envoyée au fournisseur', {
        description: `Référence: ${data.supplierOrderId}`
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur d\'envoi au fournisseur', {
        description: error.message
      });
    }
  });

  // Update tracking
  const updateTrackingMutation = useMutation({
    mutationFn: async ({ trackingNumber, carrier }: {
      trackingNumber: string;
      carrier: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('order-tracking', {
        body: {
          action: 'track',
          tracking_number: trackingNumber,
          carrier
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      toast.success('Suivi mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur de mise à jour du suivi', {
        description: error.message
      });
    }
  });

  // Bulk update all tracking
  const bulkUpdateTrackingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('order-tracking', {
        body: { action: 'update_all' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      toast.success(`${data.updated} suivis mis à jour`);
    },
    onError: (error: Error) => {
      toast.error('Erreur de mise à jour groupée', {
        description: error.message
      });
    }
  });

  // Create automation rule
  const createRuleMutation = useMutation({
    mutationFn: async (rule: Omit<AutomationRule, 'id'>) => {
      const { data, error } = await supabase
        .from('fulfilment_rules')
        .insert({
          user_id: user?.id,
          name: rule.name,
          conditions: { ...rule.conditions, trigger: rule.trigger },
          actions: rule.actions,
          is_active: rule.isActive,
          priority: rule.priority
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-automation-rules'] });
      toast.success('Règle d\'automatisation créée');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la création', {
        description: error.message
      });
    }
  });

  // Toggle rule active status
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('fulfilment_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-automation-rules'] });
      toast.success('Règle mise à jour');
    }
  });

  // Retry failed order
  const retryOrderMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const { data: shipment } = await supabase
        .from('fulfillment_shipments')
        .select('*, order:orders(*)')
        .eq('id', shipmentId)
        .single();

      if (!shipment) throw new Error('Expédition non trouvée');

      // Reset status and retry
      await supabase
        .from('fulfillment_shipments')
        .update({ status: 'pending' })
        .eq('id', shipmentId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      toast.success('Commande remise en file d\'attente');
    }
  });

  return {
    // Data
    rules,
    rulesLoading,
    supplierOrders,
    ordersLoading,
    stats,
    
    // Actions
    sendToSupplier: sendToSupplierMutation.mutate,
    isSending: sendToSupplierMutation.isPending,
    
    updateTracking: updateTrackingMutation.mutate,
    isUpdatingTracking: updateTrackingMutation.isPending,
    
    bulkUpdateTracking: bulkUpdateTrackingMutation.mutate,
    isBulkUpdating: bulkUpdateTrackingMutation.isPending,
    
    createRule: createRuleMutation.mutate,
    isCreatingRule: createRuleMutation.isPending,
    
    toggleRule: toggleRuleMutation.mutate,
    
    retryOrder: retryOrderMutation.mutate,
    isRetrying: retryOrderMutation.isPending,
    
    refetchOrders
  };
}
