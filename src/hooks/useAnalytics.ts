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
            .rpc('get_masked_customers')
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

        // Generate mock sales data for the chart
        const mockSalesData: SalesData[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          mockSalesData.push({
            date: date.toISOString().split('T')[0],
            revenue: Math.floor(Math.random() * 1000) + 500,
            orders: Math.floor(Math.random() * 20) + 5
          });
        }
        setSalesData(mockSalesData);

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