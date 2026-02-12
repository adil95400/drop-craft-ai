import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { marketingApi, api } from '@/services/api/client';

export interface MarketingCampaign {
  id: string; name: string; description?: string; type: 'email' | 'sms' | 'social' | 'ads' | 'retargeting';
  status: 'draft' | 'active' | 'paused' | 'completed'; budget_total?: number; budget_spent: number;
  scheduled_at?: string; started_at?: string; ended_at?: string; target_audience?: any; content?: any;
  settings?: any; metrics?: any; user_id: string; created_at: string; updated_at: string;
}

export interface MarketingSegment {
  id: string; name: string; description?: string; criteria: any; contact_count: number;
  last_updated?: string; user_id: string; created_at: string; updated_at: string;
}

export interface CRMContact {
  id: string; external_id?: string; name: string; email: string; phone?: string; company?: string;
  position?: string; tags?: string[]; lead_score?: number; status?: string; lifecycle_stage?: string;
  source?: string; user_id: string; created_at: string; last_activity_at?: string; updated_at: string;
  last_contacted_at?: string; custom_fields?: any; attribution?: any;
}

export const useUnifiedMarketing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-unified', user?.id],
    queryFn: async () => {
      const resp = await marketingApi.listCampaigns({ per_page: 100 });
      return (resp.items ?? []).map((c: any) => ({ ...c, budget_spent: c.spent || 0 })) as MarketingCampaign[];
    },
    enabled: !!user?.id,
  });

  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments-unified', user?.id],
    queryFn: async () => {
      try {
        const resp = await api.get<{ items: any[] }>('/marketing/segments');
        return (resp.items ?? []) as MarketingSegment[];
      } catch {
        return [] as MarketingSegment[];
      }
    },
    enabled: !!user?.id,
  });

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts-unified', user?.id],
    queryFn: async () => {
      try {
        const resp = await api.get<{ items: any[] }>('/crm/contacts');
        return (resp.items ?? []).map((l: any) => ({ ...l, lifecycle_stage: l.status, lead_score: l.lead_score || 0 })) as CRMContact[];
      } catch {
        return [] as CRMContact[];
      }
    },
    enabled: !!user?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: any) => marketingApi.createCampaign({ name: campaign.name, description: campaign.description, status: campaign.status || 'draft', budget: campaign.budget_total }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-unified'] }); toast({ title: "Campagne créée" }); },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => marketingApi.updateCampaign(id, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-unified'] }); toast({ title: "Campagne mise à jour" }); },
  });

  const createSegment = useMutation({
    mutationFn: async (segment: any) => api.post('/marketing/segments', { name: segment.name, description: segment.description, criteria: segment.criteria, is_dynamic: segment.is_dynamic }, crypto.randomUUID()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-segments-unified'] }); toast({ title: "Segment créé" }); },
  });

  const createContact = useMutation({
    mutationFn: async (contact: any) => api.post('/crm/contacts', { name: contact.name, email: contact.email, phone: contact.phone, company: contact.company }, crypto.randomUUID()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-contacts-unified'] }); toast({ title: "Contact créé" }); },
  });

  const stats = {
    totalCampaigns: campaigns.length, activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget_spent, 0),
    totalSegments: segments.length, totalContacts: contacts.length,
    avgROAS: campaigns.reduce((sum, c) => sum + ((c.metrics as any)?.roas || 0), 0) / Math.max(campaigns.length, 1),
    conversionRate: 0, totalImpressions: 0, totalClicks: 0,
  };

  return {
    campaigns, segments, contacts, stats,
    isLoading: isLoadingCampaigns || isLoadingSegments || isLoadingContacts,
    isLoadingCampaigns, isLoadingSegments, isLoadingContacts,
    createCampaign: createCampaign.mutate, updateCampaign: updateCampaign.mutate,
    createSegment: createSegment.mutate, createContact: createContact.mutate,
    isCreatingCampaign: createCampaign.isPending, isUpdatingCampaign: updateCampaign.isPending,
    isCreatingSegment: createSegment.isPending, isCreatingContact: createContact.isPending,
  };
};
