import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderFulfillmentService } from '@/services/OrderFulfillmentService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useOrderFulfillment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['fulfillment-rules', user?.id],
    queryFn: () => orderFulfillmentService.getFulfillmentRules(user!.id),
    enabled: !!user?.id
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['fulfillment-logs', user?.id],
    queryFn: () => orderFulfillmentService.getFulfillmentLogs(user!.id, { limit: 50 }),
    enabled: !!user?.id
  });

  const createRuleMutation = useMutation({
    mutationFn: (rule: any) => orderFulfillmentService.createFulfillmentRule(user!.id, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-rules'] });
      toast.success('Fulfillment rule created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, updates }: any) =>
      orderFulfillmentService.updateFulfillmentRule(ruleId, user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-rules'] });
      toast.success('Rule updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => orderFulfillmentService.deleteFulfillmentRule(ruleId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-rules'] });
      toast.success('Rule deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    }
  });

  const processOrderMutation = useMutation({
    mutationFn: ({ orderId, ruleId }: any) =>
      orderFulfillmentService.processOrder(orderId, ruleId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-logs'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order fulfilled: ${data.supplier_order_id}`);
    },
    onError: (error: Error) => {
      toast.error(`Fulfillment failed: ${error.message}`);
    }
  });

  return {
    rules,
    rulesLoading,
    logs,
    logsLoading,
    createRule: createRuleMutation.mutate,
    updateRule: updateRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    processOrder: processOrderMutation.mutate,
    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
    isProcessing: processOrderMutation.isPending
  };
}
