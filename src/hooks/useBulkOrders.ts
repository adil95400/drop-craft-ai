import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkOrderOperation {
  orderIds: string[];
  operation: 'updateStatus' | 'delete' | 'export' | 'assign';
  payload?: any;
}

export function useBulkOrders() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const bulkOperation = useMutation({
    mutationFn: async ({ orderIds, operation, payload }: BulkOrderOperation) => {
      if (!user) throw new Error('Non authentifié');

      switch (operation) {
        case 'updateStatus':
          const { error: statusError } = await supabase
            .from('orders')
            .update({ 
              status: payload.status,
              updated_at: new Date().toISOString()
            })
            .in('id', orderIds)
            .eq('user_id', user.id);

          if (statusError) throw statusError;
          return { success: true, count: orderIds.length };

        case 'delete':
          // Supprimer les items d'abord
          const { error: itemsError } = await supabase
            .from('order_items')
            .delete()
            .in('order_id', orderIds);

          if (itemsError) throw itemsError;

          const { error: ordersError } = await supabase
            .from('orders')
            .delete()
            .in('id', orderIds)
            .eq('user_id', user.id);

          if (ordersError) throw ordersError;
          return { success: true, count: orderIds.length };

        case 'export':
          const { data: ordersToExport, error: exportError } = await supabase
            .from('orders')
            .select(`
              *,
              customer:customers(*),
              items:order_items(
                *,
                product:imported_products(*)
              )
            `)
            .in('id', orderIds)
            .eq('user_id', user.id);

          if (exportError) throw exportError;
          return { success: true, data: ordersToExport };

        case 'assign':
          const { error: assignError } = await supabase
            .from('orders')
            .update({ 
              assigned_to: payload.userId,
              updated_at: new Date().toISOString()
            })
            .in('id', orderIds)
            .eq('user_id', user.id);

          if (assignError) throw assignError;
          return { success: true, count: orderIds.length };

        default:
          throw new Error('Opération non supportée');
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      const operationNames = {
        updateStatus: 'Statut mis à jour',
        delete: 'Supprimées',
        export: 'Exportées',
        assign: 'Assignées'
      };

      toast.success(`${data.count || variables.orderIds.length} commandes ${operationNames[variables.operation]}`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateBulkStatus = (orderIds: string[], status: string) => {
    return bulkOperation.mutate({ orderIds, operation: 'updateStatus', payload: { status } });
  };

  const deleteBulkOrders = (orderIds: string[]) => {
    return bulkOperation.mutate({ orderIds, operation: 'delete' });
  };

  const exportBulkOrders = async (orderIds: string[]) => {
    const result = await bulkOperation.mutateAsync({ orderIds, operation: 'export' });
    
    if (result.data) {
      const csv = convertOrdersToCSV(result.data);
      downloadCSV(csv, `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const assignBulkOrders = (orderIds: string[], userId: string) => {
    return bulkOperation.mutate({ orderIds, operation: 'assign', payload: { userId } });
  };

  return {
    updateBulkStatus,
    deleteBulkOrders,
    exportBulkOrders,
    assignBulkOrders,
    isProcessing: bulkOperation.isPending
  };
}

function convertOrdersToCSV(orders: any[]): string {
  const headers = [
    'Numéro commande',
    'Client',
    'Statut',
    'Total',
    'Devise',
    'Date',
    'Articles'
  ];

  const rows = orders.map(order => [
    order.order_number,
    order.customer?.name || '',
    order.status,
    order.total_amount,
    order.currency || 'EUR',
    new Date(order.created_at).toLocaleDateString(),
    order.items?.length || 0
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
