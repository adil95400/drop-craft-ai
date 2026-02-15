/**
 * Sprint 10: Advanced Analytics Hook
 * Real data from orders/products with period comparison, time series, breakdowns
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { format, subDays, eachDayOfInterval, parseISO, startOfDay } from 'date-fns';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'custom';

export interface PeriodRange {
  start: string;
  end: string;
}

export interface TimeSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  orders: number;
  products: number;
}

export interface PlatformBreakdown {
  platform: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsOverview {
  revenue: number;
  orders: number;
  avg_order_value: number;
  products_active: number;
  products_total: number;
  revenue_prev: number;
  orders_prev: number;
  avg_order_value_prev: number;
}

export interface AdvancedAnalyticsData {
  overview: AnalyticsOverview;
  timeSeries: TimeSeriesPoint[];
  byCategory: CategoryBreakdown[];
  byPlatform: PlatformBreakdown[];
  topProducts: Array<{ id: string; title: string; revenue: number; orders: number }>;
}

function getPeriodRange(period: AnalyticsPeriod, custom?: PeriodRange): { current: PeriodRange; previous: PeriodRange } {
  const now = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;

  if (period === 'custom' && custom) {
    const diffMs = new Date(custom.end).getTime() - new Date(custom.start).getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      current: custom,
      previous: {
        start: format(subDays(parseISO(custom.start), diffDays), 'yyyy-MM-dd'),
        end: format(subDays(parseISO(custom.end), diffDays), 'yyyy-MM-dd'),
      },
    };
  }

  return {
    current: {
      start: format(subDays(now, days), 'yyyy-MM-dd'),
      end: format(now, 'yyyy-MM-dd'),
    },
    previous: {
      start: format(subDays(now, days * 2), 'yyyy-MM-dd'),
      end: format(subDays(now, days), 'yyyy-MM-dd'),
    },
  };
}

export function useAdvancedAnalytics(period: AnalyticsPeriod = '30d', customRange?: PeriodRange) {
  const { user } = useUnifiedAuth();
  const ranges = useMemo(() => getPeriodRange(period, customRange), [period, customRange]);

  // Fetch current period orders
  const { data: currentOrders, isLoading: loadingCurrent } = useQuery({
    queryKey: ['analytics-orders-current', user?.id, ranges.current],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, currency, status, external_platform, created_at, customer_name')
        .eq('user_id', user.id)
        .gte('created_at', ranges.current.start)
        .lte('created_at', ranges.current.end + 'T23:59:59')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch previous period orders
  const { data: prevOrders, isLoading: loadingPrev } = useQuery({
    queryKey: ['analytics-orders-prev', user?.id, ranges.previous],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', ranges.previous.start)
        .lte('created_at', ranges.previous.end + 'T23:59:59');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch products summary
  const { data: products } = useQuery({
    queryKey: ['analytics-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, title, status, category, price')
        .eq('user_id', user.id)
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Compute analytics
  const analytics = useMemo((): AdvancedAnalyticsData | null => {
    if (!currentOrders || !prevOrders || !products) return null;

    const curRevenue = currentOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const curOrders = currentOrders.length;
    const prevRevenue = prevOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const prevOrderCount = prevOrders.length;

    // Time series
    const start = parseISO(ranges.current.start);
    const end = parseISO(ranges.current.end);
    const days = eachDayOfInterval({ start, end });
    const ordersByDay = new Map<string, { revenue: number; count: number }>();
    for (const order of currentOrders) {
      const day = format(startOfDay(parseISO(order.created_at)), 'yyyy-MM-dd');
      const existing = ordersByDay.get(day) || { revenue: 0, count: 0 };
      existing.revenue += order.total_amount || 0;
      existing.count += 1;
      ordersByDay.set(day, existing);
    }
    const timeSeries: TimeSeriesPoint[] = days.map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const dayData = ordersByDay.get(key) || { revenue: 0, count: 0 };
      return {
        date: key,
        revenue: Math.round(dayData.revenue * 100) / 100,
        orders: dayData.count,
        avg_order_value: dayData.count > 0 ? Math.round((dayData.revenue / dayData.count) * 100) / 100 : 0,
      };
    });

    // By platform
    const platformMap = new Map<string, { revenue: number; orders: number }>();
    for (const order of currentOrders) {
      const p = (order as any).external_platform || 'Direct';
      const existing = platformMap.get(p) || { revenue: 0, orders: 0 };
      existing.revenue += order.total_amount || 0;
      existing.orders += 1;
      platformMap.set(p, existing);
    }
    const byPlatform = Array.from(platformMap.entries()).map(([platform, data]) => ({
      platform,
      ...data,
    })).sort((a, b) => b.revenue - a.revenue);

    // By category
    const catMap = new Map<string, { revenue: number; orders: number; products: number }>();
    for (const p of products) {
      const cat = p.category || 'Non catégorisé';
      const existing = catMap.get(cat) || { revenue: 0, orders: 0, products: 0 };
      existing.products += 1;
      catMap.set(cat, existing);
    }
    const byCategory = Array.from(catMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    })).sort((a, b) => b.products - a.products).slice(0, 10);

    // Top products (placeholder — would need order_items join)
    const topProducts: Array<{ id: string; title: string; revenue: number; orders: number }> = products
      .filter(p => p.status === 'active')
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        title: p.title || 'Sans titre',
        revenue: p.price || 0,
        orders: 0,
      }));

    return {
      overview: {
        revenue: curRevenue,
        orders: curOrders,
        avg_order_value: curOrders > 0 ? curRevenue / curOrders : 0,
        products_active: products.filter(p => p.status === 'active').length,
        products_total: products.length,
        revenue_prev: prevRevenue,
        orders_prev: prevOrderCount,
        avg_order_value_prev: prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0,
      },
      timeSeries,
      byCategory,
      byPlatform,
      topProducts,
    };
  }, [currentOrders, prevOrders, products, ranges]);

  return {
    data: analytics,
    isLoading: loadingCurrent || loadingPrev,
    period,
    ranges,
  };
}
