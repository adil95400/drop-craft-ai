import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkProductOperation {
  productIds: string[];
  operation: 'updateStatus' | 'delete' | 'export' | 'optimize' | 'updatePrice' | 'updateCategory';
  payload?: any;
}

export function useBulkProducts() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const bulkOperation = useMutation({
    mutationFn: async ({ productIds, operation, payload }: BulkProductOperation) => {
      if (!user) throw new Error('Non authentifié');

      switch (operation) {
        case 'updateStatus':
          const { error: statusError } = await supabase
            .from('imported_products')
            .update({ 
              status: payload.status,
              updated_at: new Date().toISOString()
            })
            .in('id', productIds)
            .eq('user_id', user.id);

          if (statusError) throw statusError;
          return { success: true, count: productIds.length };

        case 'delete':
          const { error: deleteError } = await supabase
            .from('imported_products')
            .delete()
            .in('id', productIds)
            .eq('user_id', user.id);

          if (deleteError) throw deleteError;
          return { success: true, count: productIds.length };

        case 'export':
          const { data: productsToExport, error: exportError } = await supabase
            .from('imported_products')
            .select('*')
            .in('id', productIds)
            .eq('user_id', user.id);

          if (exportError) throw exportError;
          return { success: true, data: productsToExport };

        case 'optimize':
          // Appeler l'edge function AI pour optimiser
          const { data: optimizeData, error: optimizeError } = await supabase.functions.invoke('ai-product-optimizer', {
            body: { 
              productIds,
              userId: user.id
            }
          });

          if (optimizeError) throw optimizeError;
          return { success: true, count: productIds.length, data: optimizeData };

        case 'updatePrice':
          const { error: priceError } = await supabase
            .from('imported_products')
            .update({ 
              price: payload.price,
              updated_at: new Date().toISOString()
            })
            .in('id', productIds)
            .eq('user_id', user.id);

          if (priceError) throw priceError;
          return { success: true, count: productIds.length };

        case 'updateCategory':
          const { error: categoryError } = await supabase
            .from('imported_products')
            .update({ 
              category: payload.category,
              updated_at: new Date().toISOString()
            })
            .in('id', productIds)
            .eq('user_id', user.id);

          if (categoryError) throw categoryError;
          return { success: true, count: productIds.length };

        default:
          throw new Error('Opération non supportée');
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      
      const operationNames = {
        updateStatus: 'Statut mis à jour',
        delete: 'Supprimés',
        export: 'Exportés',
        optimize: 'Optimisés par IA',
        updatePrice: 'Prix mis à jour',
        updateCategory: 'Catégorie mise à jour'
      };

      toast.success(`${data.count || variables.productIds.length} produits ${operationNames[variables.operation]}`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateBulkStatus = (productIds: string[], status: string) => {
    return bulkOperation.mutate({ productIds, operation: 'updateStatus', payload: { status } });
  };

  const deleteBulkProducts = (productIds: string[]) => {
    return bulkOperation.mutate({ productIds, operation: 'delete' });
  };

  const exportBulkProducts = async (productIds: string[]) => {
    const result = await bulkOperation.mutateAsync({ productIds, operation: 'export' });
    
    if (result.data) {
      const csv = convertProductsToCSV(result.data);
      downloadCSV(csv, `products-export-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const optimizeBulkProducts = (productIds: string[]) => {
    return bulkOperation.mutate({ productIds, operation: 'optimize' });
  };

  const updateBulkPrice = (productIds: string[], price: number) => {
    return bulkOperation.mutate({ productIds, operation: 'updatePrice', payload: { price } });
  };

  const updateBulkCategory = (productIds: string[], category: string) => {
    return bulkOperation.mutate({ productIds, operation: 'updateCategory', payload: { category } });
  };

  return {
    updateBulkStatus,
    deleteBulkProducts,
    exportBulkProducts,
    optimizeBulkProducts,
    updateBulkPrice,
    updateBulkCategory,
    isProcessing: bulkOperation.isPending
  };
}

function convertProductsToCSV(products: any[]): string {
  const headers = [
    'ID',
    'Nom',
    'SKU',
    'Prix',
    'Prix coût',
    'Catégorie',
    'Statut',
    'Stock',
    'Description'
  ];

  const rows = products.map(p => [
    p.id,
    p.name,
    p.sku || '',
    p.price || 0,
    p.cost_price || 0,
    p.category || '',
    p.status || '',
    p.stock_quantity || 0,
    (p.description || '').replace(/,/g, ';').substring(0, 100)
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
