/**
 * useAutoEmitCrossModuleEvents - Auto-emits cross-module events based on DB state changes
 * Polls key tables and emits events when changes detected
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

  // Watch new orders
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
}
