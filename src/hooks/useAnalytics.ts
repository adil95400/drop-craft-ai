import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export function useAnalytics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch basic metrics with error handling
        const [ordersResult, productsResult, customersResult] = await Promise.allSettled([
          supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', user.id),
          supabase
            .from('imported_products')
            .select('id')
            .eq('user_id', user.id),
          supabase
            .from('customers')
            .select('id')
            .limit(1000)
        ]);

        // Handle orders result
        const orders = ordersResult.status === 'fulfilled' && !ordersResult.value.error 
          ? ordersResult.value.data || [] 
          : [];
        
        // Handle products result
        const products = productsResult.status === 'fulfilled' && !productsResult.value.error 
          ? productsResult.value.data || [] 
          : [];
        
        // Handle customers result
        const customers = customersResult.status === 'fulfilled' && !customersResult.value.error 
          ? customersResult.value.data || [] 
          : [];

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        const totalOrders = orders.length;
        const totalProducts = products.length;
        const totalCustomers = customers.length;

        setMetrics({
          totalRevenue,
          totalOrders,
          totalProducts,
          totalCustomers,
          conversionRate: totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        });

        // Fetch real sales data from orders grouped by date
        const { data: ordersWithDates, error: ordersDateError } = await supabase
          .from('orders')
          .select('created_at, total_amount')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (ordersWithDates && !ordersDateError) {
          // Group orders by date
          const salesByDate = ordersWithDates.reduce((acc, order) => {
            const date = order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
            if (!acc[date]) {
              acc[date] = { revenue: 0, orders: 0 };
            }
            acc[date].revenue += Number(order.total_amount || 0);
            acc[date].orders += 1;
            return acc;
          }, {} as Record<string, { revenue: number; orders: number }>);

          // Convert to array and fill missing dates
          const realSalesData: SalesData[] = [];
          const today = new Date();
          for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            realSalesData.push({
              date: dateStr,
              revenue: salesByDate[dateStr]?.revenue || 0,
              orders: salesByDate[dateStr]?.orders || 0
            });
          }
          setSalesData(realSalesData);
        } else {
          setSalesData([]);
        }

      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  return {
    metrics,
    salesData,
    loading,
    error,
    refetch: () => {
      if (user) {
        setLoading(true);
        // Re-fetch logic would go here
        setTimeout(() => setLoading(false), 1000);
      }
    }
  };
}