import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  status: 'active' | 'inactive';
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  address?: any;
  platform_customer_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export function useCustomers(search?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          console.log('Customers table not found, returning empty array');
          return [];
        }
        throw error;
      }

      return data || [];
    },
    meta: {
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: "Impossible de charger les clients",
          variant: "destructive"
        });
      }
    }
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Succès",
        description: "Client mis à jour avec succès"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le client",
        variant: "destructive"
      });
    }
  });
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('status, total_spent, total_orders');

      if (error) {
        if (error.code === '42P01') {
          return {
            total: 0,
            active: 0,
            inactive: 0,
            totalRevenue: 0,
            avgOrderValue: 0
          };
        }
        throw error;
      }

      const stats = {
        total: customers?.length || 0,
        active: customers?.filter(c => c.status === 'active').length || 0,
        inactive: customers?.filter(c => c.status === 'inactive').length || 0,
        totalRevenue: customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0,
        avgOrderValue: 0
      };

      const totalOrders = customers?.reduce((sum, c) => sum + (c.total_orders || 0), 0) || 0;
      stats.avgOrderValue = totalOrders > 0 ? stats.totalRevenue / totalOrders : 0;

      return stats;
    }
  });
}
