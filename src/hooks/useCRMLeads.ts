import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMLead[];
    },
  });

  const createLead = useMutation({
    mutationFn: async (leadData: Partial<CRMLead>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('crm_leads')
        .insert([{
          user_id: user.id,
          name: leadData.name || '',
          email: leadData.email || '',
          phone: leadData.phone,
          company: leadData.company,
          position: leadData.position,
          source: leadData.source,
          status: leadData.status || 'new',
          lead_score: leadData.lead_score || 0,
          estimated_value: leadData.estimated_value,
          expected_close_date: leadData.expected_close_date,
          notes: leadData.notes,
          tags: leadData.tags,
          custom_fields: leadData.custom_fields,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lead créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: () => {
      toast.error('Erreur lors de la création du lead');
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMLead> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_leads')
        .update(updates)
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
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lead supprimé');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
    totalValue: leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
    avgScore: leads.length > 0 
      ? leads.reduce((sum, l) => sum + l.lead_score, 0) / leads.length 
      : 0,
  };

  return {
    leads,
    stats,
    isLoading,
    error,
    createLead: createLead.mutate,
    updateLead: updateLead.mutate,
    deleteLead: deleteLead.mutate,
    isCreating: createLead.isPending,
    isUpdating: updateLead.isPending,
    isDeleting: deleteLead.isPending,
  };
}
