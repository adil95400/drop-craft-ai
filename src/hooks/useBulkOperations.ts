import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

type EntityType = 'imported_products' | 'products' | 'orders' | 'customers' | 'catalog_products';
type OperationType = 'delete' | 'update' | 'duplicate' | 'archive' | 'activate' | 'deactivate' | 'update-prices' | 'export';

interface BulkOperationResult {
  success: boolean;
  data?: {
    success: string[];
    errors: { id: string; error: string }[];
    items?: any[];
  };
  error?: string;
}

interface PriceUpdateOptions {
  multiplier?: number;
  fixedAmount?: number;
  priceOperation?: 'multiply' | 'add' | 'set' | 'margin';
}

export function useBulkOperations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const executeBulkOperation = useCallback(async (
    operation: OperationType,
    entityIds: string[],
    updates?: Record<string, any>,
    entityType: EntityType = 'imported_products'
  ): Promise<BulkOperationResult> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return { success: false, error: 'Not authenticated' };
    }

    if (entityIds.length === 0) {
      toast.error('Aucun élément sélectionné');
      return { success: false, error: 'No items selected' };
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-operations', {
        body: {
          operation,
          entityType,
          entityIds,
          updates
        }
      });

      if (error) throw error;

      // Invalider les caches pertinents
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['user-products'] }),
        queryClient.invalidateQueries({ queryKey: ['imported-products'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
      ]);

      const result = data?.data || data;
      const successCount = result?.success?.length || 0;
      const errorCount = result?.errors?.length || 0;

      setProgress(100);

      if (successCount > 0 && errorCount === 0) {
        toast.success(`${successCount} élément(s) traité(s) avec succès`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`${successCount} réussi(s), ${errorCount} erreur(s)`);
      } else if (errorCount > 0) {
        toast.error(`${errorCount} erreur(s) lors de l'opération`);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in bulk operation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'opération';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [user, queryClient]);

  // Actions spécifiques
  const bulkDelete = useCallback((productIds: string[], entityType: EntityType = 'imported_products') => 
    executeBulkOperation('delete', productIds, undefined, entityType), [executeBulkOperation]);

  const bulkActivate = useCallback((productIds: string[], entityType: EntityType = 'imported_products') => 
    executeBulkOperation('activate', productIds, undefined, entityType), [executeBulkOperation]);

  const bulkDeactivate = useCallback((productIds: string[], entityType: EntityType = 'imported_products') => 
    executeBulkOperation('deactivate', productIds, undefined, entityType), [executeBulkOperation]);

  const bulkDuplicate = useCallback((productIds: string[], entityType: EntityType = 'imported_products') => 
    executeBulkOperation('duplicate', productIds, undefined, entityType), [executeBulkOperation]);

  const bulkArchive = useCallback((productIds: string[], entityType: EntityType = 'imported_products') => 
    executeBulkOperation('archive', productIds, undefined, entityType), [executeBulkOperation]);

  const bulkUpdateCategory = useCallback((productIds: string[], category: string, entityType: EntityType = 'imported_products') => 
    executeBulkOperation('update', productIds, { category }, entityType), [executeBulkOperation]);

  const bulkUpdatePrices = useCallback((
    productIds: string[], 
    options: PriceUpdateOptions,
    entityType: EntityType = 'imported_products'
  ) => {
    return executeBulkOperation('update-prices', productIds, options, entityType);
  }, [executeBulkOperation]);

  const bulkExport = useCallback(async (productIds: string[], entityType: EntityType = 'imported_products') => {
    const result = await executeBulkOperation('export', productIds, undefined, entityType);
    if (result.success && result.data?.items) {
      // Télécharger les données en CSV
      const items = result.data.items;
      if (items.length > 0) {
        const headers = Object.keys(items[0]).join(',');
        const rows = items.map(item => Object.values(item).map(v => `"${v || ''}"`).join(','));
        const csv = [headers, ...rows].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${entityType}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
    return result;
  }, [executeBulkOperation]);

  const bulkUpdate = useCallback((
    productIds: string[], 
    updates: Record<string, any>,
    entityType: EntityType = 'imported_products'
  ) => executeBulkOperation('update', productIds, updates, entityType), [executeBulkOperation]);

  return {
    executeBulkOperation,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    bulkDuplicate,
    bulkArchive,
    bulkUpdateCategory,
    bulkUpdatePrices,
    bulkExport,
    bulkUpdate,
    isProcessing,
    progress
  };
}
