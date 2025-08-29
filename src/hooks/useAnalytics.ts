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
        
        // Fetch basic metrics
        const [ordersResult, productsResult, customersResult] = await Promise.all([
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
            .eq('user_id', user.id)
        ]);

        if (ordersResult.error) throw ordersResult.error;
        if (productsResult.error) throw productsResult.error;
        if (customersResult.error) throw customersResult.error;

        const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
        const totalOrders = ordersResult.data?.length || 0;
        const totalProducts = productsResult.data?.length || 0;
        const totalCustomers = customersResult.data?.length || 0;

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