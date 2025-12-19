import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function useBulkOperations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const executeBulkOperation = async (
    operation: string,
    entityIds: string[],
    updates?: Record<string, any>
  ) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return { success: false };
    }

    if (entityIds.length === 0) {
      toast.error('Aucun élément sélectionné');
      return { success: false };
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-operations', {
        body: {
          operation,
          entityType: 'imported_products',
          entityIds,
          updates
        }
      });

      if (error) throw error;

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['user-products'] });

      const result = data?.data || data;
      const successCount = result?.success?.length || 0;
      const errorCount = result?.errors?.length || 0;

      if (successCount > 0) {
        toast.success(`${successCount} produit(s) modifié(s) avec succès`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} erreur(s) lors de l'opération`);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in bulk operation:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'opération');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  // Actions spécifiques
  const bulkDelete = (productIds: string[]) => 
    executeBulkOperation('delete', productIds);

  const bulkActivate = (productIds: string[]) => 
    executeBulkOperation('update', productIds, { status: 'active' });

  const bulkDeactivate = (productIds: string[]) => 
    executeBulkOperation('update', productIds, { status: 'inactive' });

  const bulkDuplicate = (productIds: string[]) => 
    executeBulkOperation('duplicate', productIds);

  const bulkUpdateCategory = (productIds: string[], category: string) => 
    executeBulkOperation('update', productIds, { category });

  const bulkUpdatePrices = (productIds: string[], multiplier: number) => {
    // Cette opération nécessite un traitement spécial côté serveur
    toast.info('Mise à jour des prix en cours...');
    return executeBulkOperation('update-prices', productIds, { multiplier });
  };

  return {
    executeBulkOperation,
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    bulkDuplicate,
    bulkUpdateCategory,
    bulkUpdatePrices,
    isProcessing
  };
}
