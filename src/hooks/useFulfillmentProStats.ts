import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, differenceInDays, startOfDay } from 'date-fns';

interface FulfillmentStats {
  fulfillmentRate: number;
  fulfillmentRateChange: number;
  avgDeliveryDays: number;
  avgDeliveryDaysChange: number;
  totalShippingCost: number;
  shippingCostChange: number;
  pendingOrders: number;
  pendingChange: number;
  successRate: number;
  autoFulfillRate: number;
  avgCostPerShipment: number;
}

interface TrendPoint {
  date: string;
  fulfilled: number;
  total: number;
}

interface CostPoint {
  carrier: string;
  cost: number;
  count: number;
}

interface FunnelPoint {
  name: string;
  value: number;
  color: string;
}

export function useFulfillmentProStats() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['fulfillment-pro-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return getDefaults();

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);

      // Fetch current period orders
      const { data: currentOrders } = await supabase
        .from('orders')
        .select('id, status, shipping_cost, carrier, created_at, fulfillment_status, updated_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Fetch previous period for comparison
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('id, status, shipping_cost, fulfillment_status')
        .eq('user_id', user.id)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      // Fetch all pending
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);

      const orders = currentOrders || [];
      const prev = prevOrders || [];

      // Calculate stats
      const fulfilled = orders.filter(o => ['shipped', 'delivered'].includes(o.status));
      const prevFulfilled = prev.filter(o => ['shipped', 'delivered'].includes(o.status));
      
      const fulfillmentRate = orders.length ? Math.round((fulfilled.length / orders.length) * 100) : 0;
      const prevFulfillmentRate = prev.length ? Math.round((prevFulfilled.length / prev.length) * 100) : 0;

      // Avg delivery days (use updated_at as proxy for delivered_at)
      const deliveredOrders = orders.filter(o => o.status === 'delivered');
      const avgDays = deliveredOrders.length
        ? deliveredOrders.reduce((sum, o) => {
            return sum + differenceInDays(new Date(o.updated_at), new Date(o.created_at));
          }, 0) / deliveredOrders.length
        : 0;

      const totalCost = orders.reduce((s, o) => s + (o.shipping_cost || 0), 0);
      const prevTotalCost = prev.reduce((s, o) => s + (o.shipping_cost || 0), 0);

      const autoFulfilled = orders.filter(o => o.fulfillment_status === 'auto');

      // Build trends (daily)
      const trendMap = new Map<string, { fulfilled: number; total: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(now, i), 'dd/MM');
        trendMap.set(d, { fulfilled: 0, total: 0 });
      }
      orders.forEach(o => {
        const d = format(new Date(o.created_at), 'dd/MM');
        const entry = trendMap.get(d);
        if (entry) {
          entry.total++;
          if (['shipped', 'delivered'].includes(o.status)) entry.fulfilled++;
        }
      });

      const trends: TrendPoint[] = Array.from(trendMap.entries()).map(([date, v]) => ({
        date, ...v
      }));

      // Cost by carrier
      const carrierMap = new Map<string, { cost: number; count: number }>();
      orders.forEach(o => {
        const carrier = o.carrier || 'Inconnu';
        const entry = carrierMap.get(carrier) || { cost: 0, count: 0 };
        entry.cost += o.shipping_cost || 0;
        entry.count++;
        carrierMap.set(carrier, entry);
      });
      const costData: CostPoint[] = Array.from(carrierMap.entries())
        .map(([carrier, v]) => ({ carrier, ...v }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 6);

      // Funnel
      const statusCounts: Record<string, number> = {};
      orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      
      const funnelData: FunnelPoint[] = [
        { name: 'En attente', value: statusCounts['pending'] || 0, color: 'hsl(var(--muted-foreground))' },
        { name: 'Traitement', value: statusCounts['processing'] || 0, color: 'hsl(45, 93%, 47%)' },
        { name: 'Expédiées', value: statusCounts['shipped'] || 0, color: 'hsl(217, 91%, 60%)' },
        { name: 'Livrées', value: statusCounts['delivered'] || 0, color: 'hsl(142, 76%, 36%)' },
        { name: 'Échouées', value: (statusCounts['failed'] || 0) + (statusCounts['cancelled'] || 0), color: 'hsl(0, 84%, 60%)' },
      ].filter(f => f.value > 0);

      const failed = orders.filter(o => ['failed', 'cancelled'].includes(o.status));
      const successRate = orders.length ? Math.round(((orders.length - failed.length) / orders.length) * 100) : 100;

      const stats: FulfillmentStats = {
        fulfillmentRate,
        fulfillmentRateChange: fulfillmentRate - prevFulfillmentRate,
        avgDeliveryDays: Math.round(avgDays * 10) / 10,
        avgDeliveryDaysChange: 0,
        totalShippingCost: Math.round(totalCost * 100) / 100,
        shippingCostChange: prevTotalCost ? Math.round(((totalCost - prevTotalCost) / prevTotalCost) * 100) : 0,
        pendingOrders: pendingCount || 0,
        pendingChange: 0,
        successRate,
        autoFulfillRate: orders.length ? Math.round((autoFulfilled.length / orders.length) * 100) : 0,
        avgCostPerShipment: fulfilled.length ? totalCost / fulfilled.length : 0,
      };

      return { stats, trends, costData, funnelData };
    },
    staleTime: 60_000,
  });

  return {
    stats: data?.stats || getDefaults().stats,
    trends: data?.trends || [],
    costData: data?.costData || [],
    funnelData: data?.funnelData || [],
    isLoading,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['fulfillment-pro-stats'] }),
  };
}

function getDefaults() {
  return {
    stats: {
      fulfillmentRate: 0, fulfillmentRateChange: 0,
      avgDeliveryDays: 0, avgDeliveryDaysChange: 0,
      totalShippingCost: 0, shippingCostChange: 0,
      pendingOrders: 0, pendingChange: 0,
      successRate: 100, autoFulfillRate: 0, avgCostPerShipment: 0,
    },
    trends: [],
    costData: [],
    funnelData: [],
  };
}
