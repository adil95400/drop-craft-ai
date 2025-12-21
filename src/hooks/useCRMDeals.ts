import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CRMDeal {
  id: string;
  user_id: string;
  name: string;
  contact_id?: string;
  lead_id?: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: any;
  created_at: string;
  updated_at: string;
}

export function useCRMDeals() {
  const queryClient = useQueryClient();

  // Use orders table as CRM deals source
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((order: any) => ({
        id: order.id,
        user_id: order.user_id,
        name: `Commande ${order.order_number}`,
        contact_id: order.customer_id,
        lead_id: order.customer_id,
        stage: order.status === 'delivered' ? 'closed_won' : 
               order.status === 'cancelled' ? 'closed_lost' : 
               order.status === 'pending' ? 'prospecting' : 'negotiation',
        value: order.total_amount || 0,
        probability: order.status === 'delivered' ? 100 : 
                    order.status === 'cancelled' ? 0 : 50,
        expected_close_date: order.created_at,
        actual_close_date: order.status === 'delivered' ? order.updated_at : undefined,
        source: 'order',
        notes: order.notes,
        tags: [],
        custom_fields: {},
        created_at: order.created_at,
        updated_at: order.updated_at
      })) as CRMDeal[];
    },
  });

  const createDeal = useMutation({
    mutationFn: async (dealData: Partial<CRMDeal>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          order_number: `DEAL-${Date.now()}`,
          customer_id: dealData.contact_id,
          status: 'pending',
          total_amount: dealData.value || 0,
          notes: dealData.notes,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Deal créé');
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMDeal> & { id: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({
          total_amount: updates.value,
          notes: updates.notes,
          status: updates.stage === 'closed_won' ? 'delivered' : 
                  updates.stage === 'closed_lost' ? 'cancelled' : 'pending'
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Deal mis à jour');
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Deal supprimé');
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    },
  });

  const stats = {
    total: deals.length,
    prospecting: deals.filter(d => d.stage === 'prospecting').length,
    qualification: deals.filter(d => d.stage === 'qualification').length,
    proposal: deals.filter(d => d.stage === 'proposal').length,
    negotiation: deals.filter(d => d.stage === 'negotiation').length,
    won: deals.filter(d => d.stage === 'closed_won').length,
    lost: deals.filter(d => d.stage === 'closed_lost').length,
    totalValue: deals.reduce((sum, d) => sum + d.value, 0),
    weightedValue: deals
      .filter(d => !d.stage.startsWith('closed'))
      .reduce((sum, d) => sum + (d.value * d.probability / 100), 0),
    avgDealSize: deals.length > 0 
      ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length 
      : 0,
  };

  return {
    deals,
    stats,
    isLoading,
    createDeal: createDeal.mutate,
    updateDeal: updateDeal.mutate,
    deleteDeal: deleteDeal.mutate,
    isCreating: createDeal.isPending,
  };
}
