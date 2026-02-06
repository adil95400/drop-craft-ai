/**
 * Hook pour récupérer les vraies données marketing via Supabase direct
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface Campaign {
  id: string; name: string; type: string; status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number; spent: number; impressions: number; clicks: number; conversions: number;
  ctr: number; roas: number; start_date: string | null; end_date: string | null; created_at: string;
}

export interface MarketingStats {
  activeCampaigns: number; totalSpend: number; totalConversions: number; avgROAS: number;
  totalClicks: number; avgCTR: number; emailsSent: number; openRate: number; isDemo: boolean;
}

export function useMarketingCampaigns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['marketing-campaigns', user?.id],
    queryFn: async (): Promise<Campaign[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('marketing_campaigns')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c, spent: c.spent || 0, impressions: c.impressions || 0, clicks: c.clicks || 0,
        conversions: c.conversions || 0, ctr: c.ctr || 0, roas: c.roas || 0,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useMarketingStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['marketing-stats', user?.id],
    queryFn: async (): Promise<MarketingStats> => {
      if (!user?.id) return { activeCampaigns: 0, totalSpend: 0, totalConversions: 0, avgROAS: 0, totalClicks: 0, avgCTR: 0, emailsSent: 0, openRate: 0, isDemo: true };
      const { data } = await supabase.from('marketing_campaigns')
        .select('*').eq('user_id', user.id);
      const campaigns = data || [];
      const active = campaigns.filter((c: any) => c.status === 'active');
      return {
        activeCampaigns: active.length, totalSpend: campaigns.reduce((s: number, c: any) => s + (c.spent || 0), 0),
        totalConversions: campaigns.reduce((s: number, c: any) => s + (c.conversions || 0), 0),
        avgROAS: campaigns.length > 0 ? campaigns.reduce((s: number, c: any) => s + (c.roas || 0), 0) / campaigns.length : 0,
        totalClicks: campaigns.reduce((s: number, c: any) => s + (c.clicks || 0), 0),
        avgCTR: campaigns.length > 0 ? campaigns.reduce((s: number, c: any) => s + (c.ctr || 0), 0) / campaigns.length : 0,
        emailsSent: 0, openRate: 0, isDemo: campaigns.length === 0,
      };
    },
    enabled: !!user?.id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { name: string; platform: string; budget: number; start_date?: string; end_date?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: result, error } = await supabase.from('marketing_campaigns')
        .insert({ name: data.name, platform: data.platform, budget: data.budget, start_date: data.start_date, end_date: data.end_date, user_id: user.id, status: 'draft' })
        .select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast.success('Campagne créée avec succès');
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`),
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Campaign['status'] }) => {
      const { error } = await supabase.from('marketing_campaigns').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast.success(`Campagne ${variables.status === 'active' ? 'activée' : 'mise en pause'}`);
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`),
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast.success('Campagne supprimée');
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`),
  });
}
