import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CRMCustomer {
  id: string; email: string; first_name?: string; last_name?: string; full_name: string;
  phone?: string; status: 'active' | 'inactive'; total_orders: number; total_spent: number;
  last_order_date?: string; segment: 'vip' | 'loyal' | 'new' | 'at_risk' | 'inactive';
  lifetime_value: number; avg_order_value: number; days_since_last_order?: number;
}

export interface CRMMetrics {
  total_customers: number; active_customers: number; vip_customers: number;
  at_risk_customers: number; new_this_month: number; churn_rate: number;
  avg_lifetime_value: number; avg_customer_value: number;
}

export interface CustomerSegment {
  id: string; name: string; count: number; percentage: number; avg_value: number; color: string;
}

export const useRealCRMDashboard = () => {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['crm-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return { customers: [], metrics: null, segments: [] };

      // Fetch leads as CRM customers proxy
      const { data: leads } = await (supabase.from('crm_leads') as any)
        .select('*').eq('user_id', user.id);

      const leadsData = leads || [];
      const customers: CRMCustomer[] = leadsData.map((l: any) => ({
        id: l.id, email: l.email || '', full_name: l.name,
        status: l.status === 'won' ? 'active' : 'inactive',
        total_orders: 0, total_spent: l.estimated_value || 0,
        segment: l.lead_score >= 80 ? 'vip' : l.lead_score >= 50 ? 'loyal' : 'new',
        lifetime_value: l.estimated_value || 0, avg_order_value: 0,
      }));

      const metrics: CRMMetrics = {
        total_customers: customers.length,
        active_customers: customers.filter(c => c.status === 'active').length,
        vip_customers: customers.filter(c => c.segment === 'vip').length,
        at_risk_customers: customers.filter(c => c.segment === 'at_risk').length,
        new_this_month: leadsData.filter((l: any) => {
          const d = new Date(l.created_at);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
        churn_rate: 0,
        avg_lifetime_value: customers.length > 0 ? customers.reduce((s, c) => s + c.lifetime_value, 0) / customers.length : 0,
        avg_customer_value: 0,
      };

      const segments: CustomerSegment[] = [
        { id: 'vip', name: 'VIP', count: metrics.vip_customers, percentage: customers.length ? (metrics.vip_customers / customers.length) * 100 : 0, avg_value: 0, color: '#10b981' },
        { id: 'loyal', name: 'Fidèles', count: customers.filter(c => c.segment === 'loyal').length, percentage: 0, avg_value: 0, color: '#3b82f6' },
        { id: 'new', name: 'Nouveaux', count: metrics.new_this_month, percentage: 0, avg_value: 0, color: '#8b5cf6' },
      ];

      return { customers, metrics, segments };
    },
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000,
  });

  return {
    customers: data?.customers || [], metrics: data?.metrics || null,
    segments: data?.segments || [], isLoading, error, refetch,
  };
};
