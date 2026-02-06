import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface CRMLead {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  lead_score: number;
  estimated_value?: number;
  expected_close_date?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: any;
  converted_to_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export function useCRMLeads() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['crm-leads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase.from('crm_leads') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CRMLead[];
    },
    enabled: !!user?.id,
  });

  const createLead = useMutation({
    mutationFn: async (leadData: Partial<CRMLead>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase.from('crm_leads') as any)
        .insert({ ...leadData, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lead créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: () => toast.error('Erreur lors de la création du lead'),
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMLead> & { id: string }) => {
      const { data, error } = await (supabase.from('crm_leads') as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lead mis à jour');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('crm_leads') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lead supprimé');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
    totalValue: leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
    avgScore: leads.length > 0 ? leads.reduce((sum, l) => sum + l.lead_score, 0) / leads.length : 0,
  };

  return {
    leads, stats, isLoading, error,
    createLead: createLead.mutate,
    updateLead: updateLead.mutate,
    deleteLead: deleteLead.mutate,
    isCreating: createLead.isPending,
    isUpdating: updateLead.isPending,
    isDeleting: deleteLead.isPending,
  };
}
