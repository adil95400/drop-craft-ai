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

  // Use customers table as CRM leads source
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((customer: any) => ({
        id: customer.id,
        user_id: customer.user_id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
        email: customer.email,
        phone: customer.phone,
        company: customer.address,
        position: '',
        source: 'customer',
        status: customer.total_orders > 0 ? 'won' : 'new',
        lead_score: Math.min(100, (customer.total_orders || 0) * 20 + 10),
        estimated_value: customer.total_spent || 0,
        expected_close_date: customer.created_at,
        notes: customer.notes,
        tags: customer.tags || [],
        custom_fields: {},
        converted_to_customer_id: customer.total_orders > 0 ? customer.id : undefined,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      })) as CRMLead[];
    },
  });

  const createLead = useMutation({
    mutationFn: async (leadData: Partial<CRMLead>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const nameParts = (leadData.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: leadData.email || '',
          phone: leadData.phone,
          address: leadData.company,
          notes: leadData.notes,
          tags: leadData.tags,
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
      const nameParts = (updates.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase
        .from('customers')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: updates.email,
          phone: updates.phone,
          address: updates.company,
          notes: updates.notes,
          tags: updates.tags,
        })
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
        .from('customers')
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
