import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'automation';
  status: 'draft' | 'active' | 'paused' | 'completed';
  reach: number;
  opens: number;
  clicks: number;
  conversions: number;
  created_at: string;
  scheduled_at?: string;
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  count: number;
  criteria: SegmentCriteria[];
  growth_rate: number;
}

export interface SegmentCriteria {
  field: string;
  operator: string;
  value: string;
}

export interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'inactive';
  steps: AutomationStep[];
  conversions: number;
}

export interface AutomationStep {
  id: string;
  type: 'email' | 'sms' | 'wait' | 'condition';
  content?: string;
  delay?: number;
  condition?: string;
}

export const useMarketing = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Promo Black Friday',
      type: 'email',
      status: 'active',
      reach: 15234,
      opens: 6855,
      clicks: 1828,
      conversions: 1219,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      name: 'Nouveau Client',
      type: 'automation',
      status: 'active',
      reach: 2847,
      opens: 1764,
      clicks: 512,
      conversions: 427,
      created_at: '2024-01-14'
    }
  ]);

  const [segments, setSegments] = useState<Segment[]>([
    {
      id: '1',
      name: 'Nouveaux clients',
      description: 'Clients inscrits dans les 30 derniers jours',
      count: 1247,
      criteria: [
        { field: 'created_at', operator: 'last_days', value: '30' }
      ],
      growth_rate: 12
    },
    {
      id: '2',
      name: 'Clients VIP',
      description: 'Clients avec plus de 5 commandes',
      count: 89,
      criteria: [
        { field: 'order_count', operator: 'greater_than', value: '5' }
      ],
      growth_rate: 5
    }
  ]);

  const [automations, setAutomations] = useState<AutomationFlow[]>([
    {
      id: '1',
      name: 'Bienvenue Nouveau Client',
      trigger: 'user_signup',
      status: 'active',
      conversions: 156,
      steps: [
        { id: '1', type: 'email', content: 'Email de bienvenue' },
        { id: '2', type: 'wait', delay: 24 },
        { id: '3', type: 'email', content: 'Guide produits' }
      ]
    }
  ]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'created_at' | 'reach' | 'opens' | 'clicks' | 'conversions'>) => {
    setLoading(true);
    
    try {
      const newCampaign: Campaign = {
        ...campaignData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        reach: 0,
        opens: 0,
        clicks: 0,
        conversions: 0
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      
      toast({
        title: "Campagne créée",
        description: `Campagne "${newCampaign.name}" créée avec succès`,
      });

      return newCampaign;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la campagne",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const launchCampaign = async (campaignId: string) => {
    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: 'active' as const }
          : campaign
      )
    );

    // Simulate campaign stats
    setTimeout(() => {
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === campaignId 
            ? { 
                ...campaign, 
                reach: Math.floor(Math.random() * 10000) + 1000,
                opens: Math.floor(Math.random() * 5000) + 500,
                clicks: Math.floor(Math.random() * 1000) + 100,
                conversions: Math.floor(Math.random() * 500) + 50
              }
            : campaign
        )
      );
    }, 2000);

    toast({
      title: "Campagne lancée",
      description: "Votre campagne est maintenant active",
    });
  };

  const pauseCampaign = async (campaignId: string) => {
    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: 'paused' as const }
          : campaign
      )
    );

    toast({
      title: "Campagne mise en pause",
      description: "La campagne a été pausée",
    });
  };

  const createSegment = async (segmentData: Omit<Segment, 'id' | 'count' | 'growth_rate'>) => {
    setLoading(true);
    
    try {
      const newSegment: Segment = {
        ...segmentData,
        id: Math.random().toString(36).substr(2, 9),
        count: Math.floor(Math.random() * 1000) + 100,
        growth_rate: Math.floor(Math.random() * 20) - 5
      };

      setSegments(prev => [newSegment, ...prev]);
      
      toast({
        title: "Segment créé",
        description: `Segment "${newSegment.name}" créé avec succès`,
      });

      return newSegment;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le segment",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createAutomation = async (automationData: Omit<AutomationFlow, 'id' | 'conversions'>) => {
    setLoading(true);
    
    try {
      const newAutomation: AutomationFlow = {
        ...automationData,
        id: Math.random().toString(36).substr(2, 9),
        conversions: 0
      };

      setAutomations(prev => [newAutomation, ...prev]);
      
      toast({
        title: "Automation créée",
        description: `Automation "${newAutomation.name}" créée avec succès`,
      });

      return newAutomation;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'automation",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (automationId: string) => {
    setAutomations(prev => 
      prev.map(automation => 
        automation.id === automationId 
          ? { 
              ...automation, 
              status: automation.status === 'active' ? 'inactive' : 'active' 
            }
          : automation
      )
    );

    toast({
      title: "Automation modifiée",
      description: "Le statut de l'automation a été changé",
    });
  };

  const getAnalytics = () => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    
    const avgOpenRate = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.reach > 0 ? (c.opens / c.reach) * 100 : 0), 0) / campaigns.length
      : 0;

    const avgClickRate = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.opens > 0 ? (c.clicks / c.opens) * 100 : 0), 0) / campaigns.length
      : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalReach,
      totalConversions,
      avgOpenRate: Math.round(avgOpenRate * 10) / 10,
      avgClickRate: Math.round(avgClickRate * 10) / 10
    };
  };

  const exportCampaignData = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const csvData = `Campaign Name,Status,Reach,Opens,Clicks,Conversions,Open Rate,Click Rate
${campaign.name},${campaign.status},${campaign.reach},${campaign.opens},${campaign.clicks},${campaign.conversions},${((campaign.opens / campaign.reach) * 100).toFixed(2)}%,${((campaign.clicks / campaign.opens) * 100).toFixed(2)}%`;

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaign.name.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export terminé",
      description: "Les données de la campagne ont été exportées",
    });
  };

  return {
    campaigns,
    segments,
    automations,
    loading,
    createCampaign,
    launchCampaign,
    pauseCampaign,
    createSegment,
    createAutomation,
    toggleAutomation,
    analytics: getAnalytics(),
    exportCampaignData
  };
};