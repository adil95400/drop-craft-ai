import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { crmApi } from '@/services/api/client';

export interface CRMDeal {
  id: string; user_id: string; name: string; contact_id?: string; lead_id?: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number; probability: number; expected_close_date?: string; actual_close_date?: string;
  source?: string; notes?: string; tags?: string[]; custom_fields?: any;
  created_at: string; updated_at: string;
}

export function useCRMDeals() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['crm-deals', user?.id],
    queryFn: async () => {
      const res = await crmApi.listDeals();
      return (res.items || []) as CRMDeal[];
    },
    enabled: !!user?.id,
  });

  const createDeal = useMutation({
    mutationFn: async (dealData: Partial<CRMDeal>) => crmApi.createDeal(dealData),
    onSuccess: () => { toast.success('Deal créé'); queryClient.invalidateQueries({ queryKey: ['crm-deals'] }); },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMDeal> & { id: string }) => crmApi.updateDeal(id, updates),
    onSuccess: () => { toast.success('Deal mis à jour'); queryClient.invalidateQueries({ queryKey: ['crm-deals'] }); },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => crmApi.deleteDeal(id),
    onSuccess: () => { toast.success('Deal supprimé'); queryClient.invalidateQueries({ queryKey: ['crm-deals'] }); },
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
    weightedValue: deals.filter(d => !d.stage.startsWith('closed')).reduce((sum, d) => sum + (d.value * d.probability / 100), 0),
    avgDealSize: deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0,
  };

  return { deals, stats, isLoading, createDeal: createDeal.mutate, updateDeal: updateDeal.mutate, deleteDeal: deleteDeal.mutate, isCreating: createDeal.isPending };
}
