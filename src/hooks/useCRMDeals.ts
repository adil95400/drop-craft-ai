import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';
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

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: async () => {
      const res = await shopOptiApi.request<CRMDeal[]>('/crm/deals');
      return res.data || [];
    },
  });

  const createDeal = useMutation({
    mutationFn: async (dealData: Partial<CRMDeal>) => {
      const res = await shopOptiApi.request('/crm/deals', {
        method: 'POST',
        body: dealData,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
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
      const res = await shopOptiApi.request(`/crm/deals/${id}`, {
        method: 'PUT',
        body: updates,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Deal mis à jour');
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/crm/deals/${id}`, { method: 'DELETE' });
      if (!res.success) throw new Error(res.error);
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
