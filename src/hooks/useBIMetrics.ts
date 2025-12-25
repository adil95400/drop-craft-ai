import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { startOfMonth, endOfMonth, subMonths, startOfDay, subDays, format } from 'date-fns';

export interface BIMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  orders: {
    current: number;
    previous: number;
    change: number;
  };
  avgOrderValue: number;
  customers: {
    total: number;
    new: number;
    change: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
  }>;
}

export function useBusinessMetrics(period: '7d' | '30d' | '90d' = '30d') {
  const { user } = useUnifiedAuth();

  return useQuery({
    queryKey: ['business-metrics', user?.id, period],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      switch (period) {
        case '7d':
          startDate = subDays(now, 7);
          previousStartDate = subDays(now, 14);
          previousEndDate = subDays(now, 7);
          break;
        case '90d':
          startDate = subDays(now, 90);
          previousStartDate = subDays(now, 180);
          previousEndDate = subDays(now, 90);
          break;
        default:
          startDate = startOfMonth(now);
          previousStartDate = startOfMonth(subMonths(now, 1));
          previousEndDate = endOfMonth(subMonths(now, 1));
      }

      // Current period orders
      const { data: currentOrders } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, customer_id')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Previous period orders
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', user.id)
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString());

      // Total customers
      const { data: allCustomers } = await supabase
        .from('customers')
        .select('id, created_at')
        .eq('user_id', user.id);

      // Order items for top products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          qty,
          total_price,
          order_id,
          orders!inner(user_id, created_at)
        `)
        .eq('orders.user_id', user.id)
        .gte('orders.created_at', startDate.toISOString());

      // Calculate metrics
      const currentRevenue = currentOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const previousRevenue = previousOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;

      const currentOrderCount = currentOrders?.length || 0;
      const previousOrderCount = previousOrders?.length || 0;
      const ordersChange = previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount * 100) : 0;

      const avgOrderValue = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;

      const newCustomers = allCustomers?.filter(c => new Date(c.created_at) >= startDate).length || 0;
      const prevNewCustomers = allCustomers?.filter(c => 
        new Date(c.created_at) >= previousStartDate && new Date(c.created_at) < previousEndDate
      ).length || 0;
      const customersChange = prevNewCustomers > 0 ? ((newCustomers - prevNewCustomers) / prevNewCustomers * 100) : 0;

      // Top products by revenue
      const productMap = new Map<string, { name: string; sales: number; revenue: number }>();
      orderItems?.forEach(item => {
        const current = productMap.get(item.product_id || item.product_name) || { name: item.product_name, sales: 0, revenue: 0 };
        current.sales += item.qty || 1;
        current.revenue += item.total_price || 0;
        productMap.set(item.product_id || item.product_name, current);
      });

      const topProducts = Array.from(productMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Revenue by day
      const revenueByDay: Record<string, number> = {};
      currentOrders?.forEach(order => {
        const day = format(new Date(order.created_at), 'yyyy-MM-dd');
        revenueByDay[day] = (revenueByDay[day] || 0) + (order.total_amount || 0);
      });

      const revenueByDayArray = Object.entries(revenueByDay)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          change: revenueChange,
        },
        orders: {
          current: currentOrderCount,
          previous: previousOrderCount,
          change: ordersChange,
        },
        avgOrderValue,
        customers: {
          total: allCustomers?.length || 0,
          new: newCustomers,
          change: customersChange,
        },
        topProducts,
        revenueByDay: revenueByDayArray,
      } as BIMetrics;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductAnalytics() {
  const { user } = useUnifiedAuth();

  return useQuery({
    queryKey: ['product-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, cost_price, stock_quantity, status')
        .eq('user_id', user.id);

      if (!products) return null;

      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === 'active').length;
      const lowStock = products.filter(p => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length;
      const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0).length;
      
      const avgMargin = products.reduce((sum, p) => {
        if (p.cost_price && p.price) {
          return sum + ((p.price - p.cost_price) / p.price * 100);
        }
        return sum;
      }, 0) / products.filter(p => p.cost_price).length || 0;

      return {
        totalProducts,
        activeProducts,
        lowStock,
        outOfStock,
        avgMargin,
      };
    },
    enabled: !!user?.id,
  });
}

export function useCustomerAnalytics() {
  const { user } = useUnifiedAuth();

  return useQuery({
    queryKey: ['customer-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: customers } = await supabase
        .from('customers')
        .select('id, total_orders, total_spent, created_at')
        .eq('user_id', user.id);

      if (!customers) return null;

      const totalCustomers = customers.length;
      const withOrders = customers.filter(c => (c.total_orders || 0) > 0).length;
      const repeatCustomers = customers.filter(c => (c.total_orders || 0) > 1).length;
      const avgSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / totalCustomers || 0;
      const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

      // Segments
      const vip = customers.filter(c => (c.total_spent || 0) > 500).length;
      const regular = customers.filter(c => (c.total_spent || 0) >= 100 && (c.total_spent || 0) <= 500).length;
      const occasional = customers.filter(c => (c.total_spent || 0) > 0 && (c.total_spent || 0) < 100).length;
      const inactive = customers.filter(c => (c.total_spent || 0) === 0).length;

      return {
        totalCustomers,
        withOrders,
        repeatCustomers,
        repeatRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100) : 0,
        avgSpent,
        totalRevenue,
        segments: { vip, regular, occasional, inactive },
      };
    },
    enabled: !!user?.id,
  });
}
