import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useInventoryManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Warehouses
  const warehouses = useQuery({
    queryKey: ['warehouses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Stock levels with product info
  const stockLevels = useQuery({
    queryKey: ['stock-levels', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_levels')
        .select('*, products(title, sku, price, image_url), warehouses(name, code)')
        .eq('user_id', userId!)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Stock alerts (unresolved)
  const stockAlerts = useQuery({
    queryKey: ['stock-alerts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*, products(title, sku, image_url), warehouses(name)')
        .eq('user_id', userId!)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Stock movements (audit trail)
  const stockMovements = useQuery({
    queryKey: ['stock-movements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, products(title, sku), warehouses(name)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Add warehouse
  const addWarehouse = useMutation({
    mutationFn: async (warehouse: { name: string; code?: string; address?: string; city?: string; country?: string; warehouse_type?: string; capacity?: number }) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert({ ...warehouse, user_id: userId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Entrepôt ajouté');
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  // Record stock movement
  const recordMovement = useMutation({
    mutationFn: async (movement: {
      product_id: string;
      warehouse_id?: string;
      movement_type: string;
      quantity: number;
      reason?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({ ...movement, user_id: userId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      toast.success('Mouvement enregistré');
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });

  // Resolve alert
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('stock_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: userId })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast.success('Alerte résolue');
    },
  });

  // Stats
  const totalProducts = stockLevels.data?.length ?? 0;
  const lowStockCount = stockLevels.data?.filter(sl => 
    sl.quantity != null && sl.min_stock_level != null && sl.quantity <= sl.min_stock_level
  ).length ?? 0;
  const outOfStockCount = stockLevels.data?.filter(sl => (sl.quantity ?? 0) === 0).length ?? 0;
  const activeAlerts = stockAlerts.data?.length ?? 0;
  const totalWarehouses = warehouses.data?.filter(w => w.is_active !== false).length ?? 0;

  return {
    warehouses,
    stockLevels,
    stockAlerts,
    stockMovements,
    addWarehouse,
    recordMovement,
    resolveAlert,
    stats: { totalProducts, lowStockCount, outOfStockCount, activeAlerts, totalWarehouses },
  };
}
