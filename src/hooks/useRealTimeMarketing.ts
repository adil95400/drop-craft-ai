import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface MarketingCampaign {
  id: string; name: string; description?: string; type: string;
  status: 'draft' | 'active' | 'paused' | 'completed'; budget_total?: number; budget_spent: number;
  metrics?: any; user_id: string; created_at: string; updated_at: string;
  scheduled_at?: string; started_at?: string; ended_at?: string; target_audience?: any; content?: any; settings?: any;
}
export interface MarketingSegment { id: string; name: string; description?: string; criteria: any; contact_count: number; last_updated?: string; user_id: string; created_at: string; updated_at: string; }
export interface CRMContact { id: string; name: string; email: string; phone?: string; company?: string; position?: string; status: string; lifecycle_stage: string; lead_score: number; source?: string; tags?: string[]; custom_fields?: any; attribution?: any; user_id: string; created_at: string; updated_at: string; }
export interface AIOptimizationJob { id: string; job_type: string; status: string; progress: number; input_data: any; output_data?: any; started_at?: string; completed_at?: string; error_message?: string; user_id: string; created_at: string; }
export interface MarketingStats { totalCampaigns: number; activeCampaigns: number; totalBudget: number; totalSpent: number; totalContacts: number; totalSegments: number; avgROAS: number; conversionRate: number; totalImpressions: number; totalClicks: number; }
export interface RealTimeMarketingData { campaigns: MarketingCampaign[]; segments: MarketingSegment[]; contacts: CRMContact[]; automationJobs: AIOptimizationJob[]; stats: MarketingStats; isLoading: boolean; }

export const useRealTimeMarketing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-realtime', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('marketing_campaigns').select('*').eq('user_id', user.id);
      return (data || []).map((c: any) => ({ ...c, budget_spent: c.spent || 0 })) as MarketingCampaign[];
    },
    refetchInterval: 30000, enabled: !!user?.id,
  });

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts-realtime', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await (supabase.from('crm_leads') as any).select('*').eq('user_id', user.id);
      return (data || []).map((l: any) => ({ ...l, lifecycle_stage: l.status, lead_score: l.lead_score || 0 })) as CRMContact[];
    },
    refetchInterval: 60000, enabled: !!user?.id,
  });

  const { data: automationJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['ai-optimization-jobs-realtime', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('ai_optimization_jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      return (data || []).map((j: any) => ({ ...j, progress: j.status === 'completed' ? 100 : 0 })) as AIOptimizationJob[];
    },
    refetchInterval: 15000, enabled: !!user?.id,
  });

  const stats: MarketingStats = {
    totalCampaigns: campaigns.length, activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget_spent, 0),
    totalContacts: contacts.length, totalSegments: 0, avgROAS: 0, conversionRate: 0, totalImpressions: 0, totalClicks: 0,
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] });
    queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] });
    queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs-realtime'] });
    setLastActivity(new Date());
    toast({ title: "Données actualisées" });
  };

  return { campaigns, segments: [] as MarketingSegment[], contacts, automationJobs, stats, isLoading: isLoadingCampaigns || isLoadingContacts || isLoadingJobs, lastActivity, refreshData } as RealTimeMarketingData & { lastActivity: Date; refreshData: () => void };
};
