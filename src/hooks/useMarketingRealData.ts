/**
 * Hook pour récupérer les vraies données marketing depuis Supabase
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subDays } from 'date-fns';

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  roas: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface MarketingStats {
  activeCampaigns: number;
  totalSpend: number;
  totalConversions: number;
  avgROAS: number;
  totalClicks: number;
  avgCTR: number;
  emailsSent: number;
  openRate: number;
  isDemo: boolean;
}

export function useMarketingCampaigns() {
  return useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: campaigns, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (campaigns || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.platform || 'display',
        status: (c.status as Campaign['status']) || 'draft',
        budget: c.budget || 0,
        spent: c.spend || 0,
        impressions: c.impressions || 0,
        clicks: c.clicks || 0,
        conversions: c.conversions || 0,
        ctr: c.ctr || 0,
        roas: c.roas || 0,
        start_date: c.start_date,
        end_date: c.end_date,
        created_at: c.created_at
      }));
    }
  });
}

export function useMarketingStats() {
  return useQuery({
    queryKey: ['marketing-stats'],
    queryFn: async (): Promise<MarketingStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Campagnes
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('status, spend, conversions, clicks, impressions, roas')
        .eq('user_id', user.id);

      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalSpend = campaigns?.reduce((sum, c) => sum + (c.spend || 0), 0) || 0;
      const totalConversions = campaigns?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0;
      const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
      const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;
      
      const avgROAS = campaigns?.length 
        ? campaigns.reduce((sum, c) => sum + (c.roas || 0), 0) / campaigns.length 
        : 0;
      
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Email campaigns
      const { data: emailCampaigns } = await supabase
        .from('email_campaigns')
        .select('total_sent, total_opened')
        .eq('user_id', user.id);

      const emailsSent = emailCampaigns?.reduce((sum, c) => sum + ((c as any).total_sent || 0), 0) || 0;
      const totalOpens = emailCampaigns?.reduce((sum, c) => sum + ((c as any).total_opened || 0), 0) || 0;
      const openRate = emailsSent > 0 ? (totalOpens / emailsSent) * 100 : 0;

      const isDemo = (!campaigns || campaigns.length === 0) && (!emailCampaigns || emailCampaigns.length === 0);

      if (isDemo) {
        return {
          activeCampaigns: 5,
          totalSpend: 12500,
          totalConversions: 342,
          avgROAS: 3.2,
          totalClicks: 8540,
          avgCTR: 2.8,
          emailsSent: 15000,
          openRate: 24.5,
          isDemo: true
        };
      }

      return {
        activeCampaigns,
        totalSpend,
        totalConversions,
        avgROAS,
        totalClicks,
        avgCTR,
        emailsSent,
        openRate,
        isDemo: false
      };
    }
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      platform: string;
      budget: number;
      start_date?: string;
      end_date?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: campaign, error } = await supabase
        .from('ad_campaigns')
        .insert({
          user_id: user.id,
          name: data.name,
          platform: data.platform,
          budget: data.budget,
          status: 'draft',
          start_date: data.start_date,
          end_date: data.end_date,
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0
        })
        .select()
        .single();

      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast.success('Campagne créée avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Campaign['status'] }) => {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast.success(`Campagne ${variables.status === 'active' ? 'activée' : 'mise en pause'}`);
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast.success('Campagne supprimée');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}
