import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  commission_rate: number;
  total_sales: number;
  total_revenue: number;
  total_commission: number;
  total_clicks: number;
  conversion_rate: number;
  referral_code: string;
  payout_method: string | null;
  created_at: string;
}

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  url: string;
  label: string;
  clicks: number;
  conversions: number;
  revenue: number;
  created_at: string;
}

export function useAffiliateProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Use orders table to derive affiliate data (simulated from real order data)
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['affiliate-program-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return { orders: [], customers: [] };
      const [ordersRes, customersRes] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status, created_at, customer_email').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('customers').select('id, first_name, last_name, email, total_spent, orders_count, source, created_at').eq('user_id', user.id),
      ]);
      return {
        orders: ordersRes.data || [],
        customers: customersRes.data || [],
      };
    },
    enabled: !!user?.id,
  });

  // Build affiliate-like data from customers with referral sources
  const affiliates: Affiliate[] = (orderData?.customers || [])
    .filter((c: any) => c.source && c.source !== 'direct' && c.source !== 'organic')
    .slice(0, 20)
    .map((c: any, i: number) => ({
      id: c.id,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email?.split('@')[0] || `Affilié ${i + 1}`,
      email: c.email || '',
      status: (c.orders_count > 0 ? 'active' : 'pending') as 'active' | 'pending',
      commission_rate: 10,
      total_sales: c.orders_count || 0,
      total_revenue: Number(c.total_spent) || 0,
      total_commission: (Number(c.total_spent) || 0) * 0.1,
      total_clicks: (c.orders_count || 0) * 15,
      conversion_rate: c.orders_count > 0 ? Math.min(((c.orders_count / ((c.orders_count || 0) * 15 || 1)) * 100), 25) : 0,
      referral_code: `REF-${c.id.substring(0, 6).toUpperCase()}`,
      payout_method: null,
      created_at: c.created_at,
    }));

  const stats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter(a => a.status === 'active').length,
    totalRevenue: affiliates.reduce((s, a) => s + a.total_revenue, 0),
    totalCommissions: affiliates.reduce((s, a) => s + a.total_commission, 0),
    totalClicks: affiliates.reduce((s, a) => s + a.total_clicks, 0),
    avgConversionRate: affiliates.length > 0
      ? affiliates.reduce((s, a) => s + a.conversion_rate, 0) / affiliates.length
      : 0,
    topPerformer: affiliates.sort((a, b) => b.total_revenue - a.total_revenue)[0] || null,
  };

  return {
    affiliates,
    stats,
    isLoading,
  };
}
