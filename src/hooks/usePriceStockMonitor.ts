import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceStockMonitorService } from '@/services/PriceStockMonitorService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function usePriceStockMonitor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: monitors, isLoading: monitorsLoading } = useQuery({
    queryKey: ['price-stock-monitors', user?.id],
    queryFn: () => priceStockMonitorService.getMonitors(user!.id),
    enabled: !!user?.id
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['price-stock-alerts', user?.id],
    queryFn: () => priceStockMonitorService.getAlerts(user!.id, { limit: 100 }),
    enabled: !!user?.id,
    refetchInterval: 60000 // Refetch every minute
  });

  const createMonitorMutation = useMutation({
    mutationFn: (monitor: any) => priceStockMonitorService.createMonitor(user!.id, monitor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-stock-monitors'] });
      toast.success('Monitor created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create monitor: ${error.message}`);
    }
  });

  const updateMonitorMutation = useMutation({
    mutationFn: ({ monitorId, updates }: any) =>
      priceStockMonitorService.updateMonitor(monitorId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-stock-monitors'] });
      toast.success('Monitor updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update monitor: ${error.message}`);
    }
  });

  const deleteMonitorMutation = useMutation({
    mutationFn: (monitorId: string) => priceStockMonitorService.deleteMonitor(monitorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-stock-monitors'] });
      toast.success('Monitor deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete monitor: ${error.message}`);
    }
  });

  const checkAllMutation = useMutation({
    mutationFn: () => priceStockMonitorService.checkAllMonitors(user!.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-stock-monitors'] });
      queryClient.invalidateQueries({ queryKey: ['price-stock-alerts'] });
      toast.success(`Checked ${data.checked} products, created ${data.alerts.length} alerts`);
    },
    onError: (error: Error) => {
      toast.error(`Check failed: ${error.message}`);
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (alertId: string) => priceStockMonitorService.markAlertAsRead(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-stock-alerts'] });
    }
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) => priceStockMonitorService.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-stock-alerts'] });
      toast.success('Alert resolved');
    }
  });

  return {
    monitors,
    monitorsLoading,
    alerts,
    alertsLoading,
    createMonitor: createMonitorMutation.mutate,
    updateMonitor: updateMonitorMutation.mutate,
    deleteMonitor: deleteMonitorMutation.mutate,
    checkAll: checkAllMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    resolveAlert: resolveAlertMutation.mutate,
    isCreating: createMonitorMutation.isPending,
    isUpdating: updateMonitorMutation.isPending,
    isDeleting: deleteMonitorMutation.isPending,
    isChecking: checkAllMutation.isPending
  };
}
