import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FlashSale {
  id: string;
  name: string;
  discount_percent: number;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  start_date: string;
  end_date: string;
  products_count: number;
  sold_count: number;
  stock_total: number;
  revenue: number;
  views: number;
}

export function useFlashSales() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Derive flash sale data from real ad_campaigns + orders
  const { data, isLoading } = useQuery({
    queryKey: ['flash-sales-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return { campaigns: [], products: [], orders: [] };
      const [campaignsRes, productsRes, ordersRes] = await Promise.all([
        supabase.from('ad_campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('id, price, stock_quantity, status').eq('user_id', user.id),
        supabase.from('orders').select('id, total_amount, status, created_at').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);
      return {
        campaigns: campaignsRes.data || [],
        products: productsRes.data || [],
        orders: ordersRes.data || [],
      };
    },
    enabled: !!user?.id,
  });

  const products = data?.products || [];
  const orders = data?.orders || [];

  const totalProducts = products.length;
  const totalStock = products.reduce((s: number, p: any) => s + (p.stock_quantity || 0), 0);
  const recentRevenue = orders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
  const completedOrders = orders.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length;

  const stats = {
    activeSales: 0,
    scheduledSales: 0,
    completedSales: orders.length,
    totalRevenue: recentRevenue,
    totalProductsSold: completedOrders,
    avgDiscount: 0,
    conversionRate: orders.length > 0 ? Math.min(((completedOrders / orders.length) * 100), 100) : 0,
    totalProducts,
    totalStock,
  };

  return {
    flashSales: [] as FlashSale[],
    stats,
    isLoading,
    products,
    orders,
  };
}
