import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StockAlert {
  type: 'out_of_stock' | 'low_stock';
  severity: 'high' | 'medium';
  product: {
    id: string;
    sku: string;
    name: string;
    stock_quantity: number;
  };
}

export interface StockMonitorResult {
  summary: {
    totalChecked: number;
    outOfStock: number;
    lowStock: number;
    alertsCreated: number;
  };
  outOfStock: Array<{
    sku: string;
    name: string;
    stock: number;
    lastChecked: string;
  }>;
  lowStock: Array<{
    sku: string;
    name: string;
    stock: number;
    threshold: number;
    lastChecked: string;
  }>;
  alternatives: Array<{
    sku: string;
    name: string;
    alternativeSuppliers: Array<{
      supplierId: string;
      supplierName: string;
      stock: number;
      price: number;
    }>;
  }>;
  alerts: StockAlert[];
}

export function useSupplierStock(supplierId: string) {
  const queryClient = useQueryClient();

  const monitorStock = useMutation({
    mutationFn: async (threshold: number = 10) => {
      const { data, error } = await supabase.functions.invoke('supplier-stock-monitor', {
        body: { supplierId, threshold },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data as StockMonitorResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications', supplierId] });
      
      const { summary } = data;
      if (summary.outOfStock > 0 || summary.lowStock > 0) {
        toast.warning(`Stock: ${summary.outOfStock} ruptures, ${summary.lowStock} alertes`);
      } else {
        toast.success('Tous les stocks sont OK');
      }
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const productMappings = [];

  return {
    monitorStock: monitorStock.mutate,
    isMonitoring: monitorStock.isPending,
    lastMonitorResult: monitorStock.data,
    productMappings,
  };
}
