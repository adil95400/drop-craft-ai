/**
 * useAutoEmitCrossModuleEvents - Auto-emits cross-module events based on DB state changes
 * Watches: low stock, new orders, AI recommendations, products without pricing, price sync queue
 */
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrossModuleEvents } from '@/services/cross-module/CrossModuleEventBus';

export function useAutoEmitCrossModuleEvents() {
  const emit = useCrossModuleEvents(s => s.emit);
  const prevStockLow = useRef<number>(0);
  const prevOrderCount = useRef<number>(0);
  const prevRecommendationCount = useRef<number>(0);
  const prevUnpricedCount = useRef<number>(0);
  const prevSyncQueueCount = useRef<number>(0);

  // Watch low stock products
  const { data: lowStockCount = 0 } = useQuery({
    queryKey: ['cross-module-low-stock'],
    queryFn: async () => {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .lte('stock_quantity', 5)
        .gt('stock_quantity', 0);
      return count || 0;
    },
    refetchInterval: 60_000,
  });

  // Watch new orders (last 5 min)
  const { data: recentOrderCount = 0 } = useQuery({
    queryKey: ['cross-module-orders'],
    queryFn: async () => {
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since);
      return count || 0;
    },
    refetchInterval: 30_000,
  });

  // Watch AI recommendations
  const { data: pendingRecommendations = 0 } = useQuery({
    queryKey: ['cross-module-recommendations'],
    queryFn: async () => {
      const { count } = await supabase
        .from('ai_recommendations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    },
    refetchInterval: 120_000,
  });

  // Watch products with cost_price but no proper margin (need pricing rules)
  const { data: unpricedCount = 0 } = useQuery({
    queryKey: ['cross-module-unpriced'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      // Products with cost but price = cost (no markup applied)
      const { data } = await supabase
        .from('products')
        .select('id, price, cost_price')
        .eq('user_id', user.id)
        .not('cost_price', 'is', null)
        .gt('cost_price', 0)
        .limit(200);
      return (data || []).filter(p => 
        p.price && p.cost_price && Math.abs(p.price - p.cost_price) < 0.01
      ).length;
    },
    refetchInterval: 300_000, // 5 min
  });

  // Watch pending sync queue via unified_sync_queue
  const { data: syncQueueCount = 0 } = useQuery({
    queryKey: ['cross-module-sync-queue'],
    queryFn: async () => {
      const { count } = await supabase
        .from('unified_sync_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    },
    refetchInterval: 60_000,
  });

  // Emit events on changes
  useEffect(() => {
    if (lowStockCount > prevStockLow.current && prevStockLow.current !== 0) {
      emit('stock.low', 'stock-monitor', { count: lowStockCount });
    }
    prevStockLow.current = lowStockCount;
  }, [lowStockCount, emit]);

  useEffect(() => {
    if (recentOrderCount > prevOrderCount.current && prevOrderCount.current !== 0) {
      emit('orders.created', 'order-monitor', { count: recentOrderCount - prevOrderCount.current });
    }
    prevOrderCount.current = recentOrderCount;
  }, [recentOrderCount, emit]);

  useEffect(() => {
    if (pendingRecommendations > prevRecommendationCount.current && prevRecommendationCount.current !== 0) {
      emit('ai.recommendation_ready', 'ai-monitor', { count: pendingRecommendations });
    }
    prevRecommendationCount.current = pendingRecommendations;
  }, [pendingRecommendations, emit]);

  // Products needing pricing
  useEffect(() => {
    if (unpricedCount > 0 && unpricedCount > prevUnpricedCount.current) {
      emit('products.imported', 'pricing-monitor', { 
        count: unpricedCount, 
        message: `${unpricedCount} produits sans markup — appliquez vos règles de prix` 
      });
    }
    prevUnpricedCount.current = unpricedCount;
  }, [unpricedCount, emit]);

  // Price sync queue growing
  useEffect(() => {
    if (syncQueueCount > 0 && syncQueueCount > prevSyncQueueCount.current) {
      emit('pricing.auto_adjusted', 'sync-monitor', {
        count: syncQueueCount,
        message: `${syncQueueCount} changements de prix en attente de synchronisation`
      });
    }
    prevSyncQueueCount.current = syncQueueCount;
  }, [syncQueueCount, emit]);
}
