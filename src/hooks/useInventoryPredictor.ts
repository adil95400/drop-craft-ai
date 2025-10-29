import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useInventoryPredictor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const { data: predictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ['inventory-predictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_predictions' as any)
        .select('*, inventory_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any;
    },
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts' as any)
        .select('*, inventory_items(*)')
        .eq('is_resolved', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['restock-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restock_suggestions' as any)
        .select('*, inventory_items(*)')
        .eq('is_applied', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const addItem = useMutation({
    mutationFn: async (params: any) => {
      const { data, error } = await supabase
        .from('inventory_items' as any)
        .insert({
          product_name: params.productName,
          sku: params.sku,
          current_stock: params.currentStock,
          reorder_point: params.reorderPoint,
          reorder_quantity: params.reorderQuantity,
          unit_cost: params.unitCost,
          category: params.category,
          supplier: params.supplier,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Produit ajouté!' });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ itemId, newStock }: any) => {
      const { data, error } = await supabase
        .from('inventory_items' as any)
        .update({ current_stock: newStock } as any)
        .eq('id', itemId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Stock mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });

  const generatePrediction = useMutation({
    mutationFn: async (itemId: string) => {
      const item = items?.find((i: any) => i.id === itemId);
      if (!item) throw new Error('Item not found');

      const { data, error } = await supabase.functions.invoke('inventory-predictor', {
        body: {
          itemId,
          salesHistory: item.sales_history || [],
          currentStock: item.current_stock,
          reorderPoint: item.reorder_point,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Prédiction générée!' });
      queryClient.invalidateQueries({ queryKey: ['inventory-predictions', 'stock-alerts', 'restock-suggestions'] });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('stock_alerts' as any)
        .update({ is_resolved: true, resolved_at: new Date().toISOString() } as any)
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Alerte résolue' });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });

  const applySuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('restock_suggestions' as any)
        .update({ is_applied: true, applied_at: new Date().toISOString() } as any)
        .eq('id', suggestionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Suggestion appliquée!' });
      queryClient.invalidateQueries({ queryKey: ['restock-suggestions'] });
    },
  });

  return {
    items,
    isLoadingItems,
    predictions,
    isLoadingPredictions,
    alerts,
    isLoadingAlerts,
    suggestions,
    isLoadingSuggestions,
    addItem: addItem.mutate,
    isAddingItem: addItem.isPending,
    updateStock: (itemId: string, newStock: number) => updateStock.mutate({ itemId, newStock }),
    isUpdatingStock: updateStock.isPending,
    generatePrediction: generatePrediction.mutate,
    isGeneratingPrediction: generatePrediction.isPending,
    resolveAlert: resolveAlert.mutate,
    applySuggestion: applySuggestion.mutate,
  };
}