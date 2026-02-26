import { supabase } from '@/integrations/supabase/client';

export interface MarketingCampaign {
  id: string;
  user_id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'display' | 'search';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  target_segment_id?: string;
  content: Record<string, any>;
  settings: Record<string, any>;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  budget?: number;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingAutomation {
  id: string;
  user_id: string;
  name: string;
  trigger_type: 'signup' | 'purchase' | 'abandoned_cart' | 'inactivity' | 'custom_event';
  trigger_conditions: Record<string, any>;
  workflow_steps: Array<{
    id: string;
    type: 'wait' | 'email' | 'sms' | 'condition' | 'action';
    configuration: Record<string, any>;
    delay?: number;
  }>;
  is_active: boolean;
  metrics: {
    triggered: number;
    completed: number;
    conversion_rate: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MarketingIntelligence {
  id: string;
  user_id: string;
  analysis_type: 'audience' | 'campaign_performance' | 'competitor' | 'trend' | 'roi';
  insights: Record<string, any>;
  recommendations: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    expected_impact: string;
    implementation_effort: 'easy' | 'medium' | 'complex';
  }>;
  confidence_score: number;
  generated_at: string;
  expires_at?: string;
}

export class RealMarketingService {
  private static instance: RealMarketingService;

  static getInstance(): RealMarketingService {
    if (!RealMarketingService.instance) {
      RealMarketingService.instance = new RealMarketingService();
    }
    return RealMarketingService.instance;
  }

  // Campaign Management
  async getCampaigns(filters?: {
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<MarketingCampaign[]> {
    let query = (supabase as any)
      .from('marketing_campaigns')
      .select('*');

    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
    }

    query = query
      .order('updated_at', { ascending: false })
      .limit(filters?.limit || 50);

    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map((campaign: any) => ({
      id: campaign.id,
      user_id: campaign.user_id,
      name: campaign.name,
      type: campaign.type || 'email',
      status: campaign.status || 'draft',
      content: {},
      settings: {},
      metrics: typeof campaign.metrics === 'object' && campaign.metrics !== null
        ? campaign.metrics as any
        : { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
      budget: campaign.budget,
      scheduled_at: campaign.scheduled_at,
      started_at: campaign.start_date,
      completed_at: campaign.end_date,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
    } as MarketingCampaign));
  }

  async createCampaign(campaign: Omit<MarketingCampaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MarketingCampaign> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await (supabase as any)
      .from('marketing_campaigns')
      .insert({
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        budget: campaign.budget,
        metrics: campaign.metrics || { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
        user_id: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      type: data.type || 'email',
      status: data.status || 'draft',
      content: {},
      settings: {},
      metrics: typeof data.metrics === 'object' && data.metrics !== null
        ? data.metrics as any
        : { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
      budget: data.budget,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as MarketingCampaign;
  }

  async updateCampaign(id: string, updates: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.budget !== undefined) updateData.budget = updates.budget;
    if (updates.metrics !== undefined) updateData.metrics = updates.metrics;

    const { data, error } = await (supabase as any)
      .from('marketing_campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      type: data.type || 'email',
      status: data.status || 'draft',
      content: {},
      settings: {},
      metrics: typeof data.metrics === 'object' && data.metrics !== null
        ? data.metrics as any
        : { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
      budget: data.budget,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as MarketingCampaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('marketing_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Launch campaign
  async launchCampaign(campaignId: string): Promise<void> {
    const campaign = await (supabase as any)
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign.data) throw new Error('Campaign not found');

    // Update campaign status
    await (supabase as any)
      .from('marketing_campaigns')
      .update({
        status: 'running',
        start_date: new Date().toISOString(),
      })
      .eq('id', campaignId);

    // Log campaign launch
    await (supabase as any).from('activity_logs').insert({
      user_id: campaign.data.user_id,
      action: 'campaign_launched',
      entity_type: 'campaign',
      entity_id: campaignId,
      description: `Campaign "${campaign.data.name}" launched`,
      details: {
        campaign_type: campaign.data.type,
        campaign_name: campaign.data.name,
      },
    });
  }

  // Marketing Intelligence
  async getMarketingIntelligence(filters?: {
    channel?: string;
    limit?: number;
  }): Promise<MarketingIntelligence[]> {
    let query = (supabase as any)
      .from('marketing_intelligence')
      .select('*');

    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 20);

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Map database fields to interface
    return (data || []).map((intel: any) => ({
      id: intel.id,
      user_id: intel.user_id,
      analysis_type: 'campaign_performance' as const,
      insights: typeof intel.audience_insights === 'object' && intel.audience_insights !== null
        ? intel.audience_insights as Record<string, any>
        : {},
      recommendations: Array.isArray(intel.optimization_suggestions) 
        ? intel.optimization_suggestions 
        : [],
      confidence_score: intel.performance_score || 0,
      generated_at: intel.created_at,
    } as MarketingIntelligence));
  }

  async generateMarketingIntelligence(analysisType: string): Promise<MarketingIntelligence> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Fetch relevant data for analysis
    const campaignsData = await this.getCampaigns();
    const { data: contacts } = await (supabase as any)
      .from('crm_contacts')
      .select('*')
      .limit(1000);

    // Generate insights based on analysis type
    let insights: Record<string, any> = {};
    let recommendations: any[] = [];
    let confidenceScore = 0;

    switch (analysisType) {
      case 'audience':
        insights = await this.generateAudienceInsights(contacts || []);
        recommendations = this.generateAudienceRecommendations(insights);
        confidenceScore = 85;
        break;
      
      case 'campaign_performance':
        insights = this.generateCampaignPerformanceInsights(campaignsData);
        recommendations = this.generateCampaignRecommendations(insights);
        confidenceScore = 92;
        break;
      
      case 'roi':
        insights = this.generateROIInsights(campaignsData);
        recommendations = this.generateROIRecommendations(insights);
        confidenceScore = 88;
        break;
      
      default:
        insights = { message: 'Analysis type not supported yet' };
        recommendations = [];
        confidenceScore = 0;
    }

    // Store intelligence in database using actual schema
    const { data, error } = await (supabase as any)
      .from('marketing_intelligence')
      .insert({
        user_id: user.user.id,
        channel: analysisType,
        attribution_model: 'last_click',
        performance_score: confidenceScore,
        roi_analysis: insights,
        audience_insights: insights,
        conversion_data: { insights, recommendations },
        optimization_suggestions: recommendations,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Return mapped to interface
    return {
      id: data.id,
      user_id: data.user_id,
      analysis_type: analysisType as any,
      insights: typeof data.audience_insights === 'object' && data.audience_insights !== null
        ? data.audience_insights as Record<string, any>
        : {},
      recommendations: Array.isArray(data.optimization_suggestions) 
        ? data.optimization_suggestions 
        : [],
      confidence_score: data.performance_score || 0,
      generated_at: data.created_at,
    } as MarketingIntelligence;
  }

  // Email Marketing
  async sendEmail(campaignId: string, recipients: string[]): Promise<{ sent: number; errors: string[] }> {
    // This would integrate with an email service provider (SendGrid, Mailchimp, etc.)
    // For now, simulate email sending
    
    const errors: string[] = [];
    let sent = 0;

    for (const email of recipients) {
      try {
        // Simulate email sending with 95% success rate
        if (Math.random() > 0.05) {
          sent++;
        } else {
          errors.push(`Failed to send to ${email}`);
        }
      } catch (error) {
        errors.push(`Error sending to ${email}: ${error}`);
      }
    }

    // Update campaign metrics
    await (supabase as any)
      .from('marketing_campaigns')
      .update({
        metrics: {
          sent,
          delivered: sent,
          opened: Math.floor(sent * 0.25), // 25% open rate
          clicked: Math.floor(sent * 0.05), // 5% click rate
          converted: Math.floor(sent * 0.01), // 1% conversion rate
        },
      })
      .eq('id', campaignId);

    return { sent, errors };
  }

  // Analytics helpers
  private async generateAudienceInsights(contacts: any[]): Promise<Record<string, any>> {
    const totalContacts = contacts.length;
    
    const byLifecycleStage = contacts.reduce((acc, contact) => {
      acc[contact.lifecycle_stage] = (acc[contact.lifecycle_stage] || 0) + 1;
      return acc;
    }, {});

    const bySource = contacts.reduce((acc, contact) => {
      const source = contact.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const averageLeadScore = totalContacts > 0 
      ? contacts.reduce((sum, c) => sum + c.lead_score, 0) / totalContacts 
      : 0;

    return {
      total_contacts: totalContacts,
      lifecycle_distribution: byLifecycleStage,
      source_distribution: bySource,
      average_lead_score: Math.round(averageLeadScore),
      growth_rate: 0, // No mock — calculate from real period comparison when data available
      engagement_score: Math.round(averageLeadScore), // Use real lead score as proxy
    };
  }

  private generateAudienceRecommendations(insights: Record<string, any>): any[] {
    const recommendations = [];

    if (insights.average_lead_score < 40) {
      recommendations.push({
        type: 'lead_nurturing',
        priority: 'high',
        description: 'Implement lead nurturing campaigns to increase average lead score',
        expected_impact: 'Increase conversion rate by 25-40%',
        implementation_effort: 'medium',
      });
    }

    if (insights.engagement_score < 70) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        description: 'Create more engaging content to improve audience interaction',
        expected_impact: 'Increase engagement by 15-25%',
        implementation_effort: 'easy',
      });
    }

    return recommendations;
  }

  private generateCampaignPerformanceInsights(campaigns: MarketingCampaign[]): Record<string, any> {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
    
    const avgOpenRate = campaigns.length > 0
      ? campaigns.reduce((sum, c) => {
          const rate = c.metrics.sent > 0 ? (c.metrics.opened / c.metrics.sent) * 100 : 0;
          return sum + rate;
        }, 0) / campaigns.length
      : 0;

    const avgClickRate = campaigns.length > 0
      ? campaigns.reduce((sum, c) => {
          const rate = c.metrics.sent > 0 ? (c.metrics.clicked / c.metrics.sent) * 100 : 0;
          return sum + rate;
        }, 0) / campaigns.length
      : 0;

    return {
      total_campaigns: totalCampaigns,
      active_campaigns: activeCampaigns,
      average_open_rate: Math.round(avgOpenRate * 100) / 100,
      average_click_rate: Math.round(avgClickRate * 100) / 100,
      performance_trend: avgOpenRate > 20 ? 'improving' : 'stable',
    };
  }

  private generateCampaignRecommendations(insights: Record<string, any>): any[] {
    const recommendations = [];

    if (insights.average_open_rate < 20) {
      recommendations.push({
        type: 'subject_line_optimization',
        priority: 'high',
        description: 'Optimize subject lines to improve open rates',
        expected_impact: 'Increase open rate by 30-50%',
        implementation_effort: 'easy',
      });
    }

    if (insights.average_click_rate < 3) {
      recommendations.push({
        type: 'content_optimization',
        priority: 'medium',
        description: 'Improve email content and call-to-action buttons',
        expected_impact: 'Increase click rate by 40-60%',
        implementation_effort: 'medium',
      });
    }

    return recommendations;
  }

  private generateROIInsights(campaigns: MarketingCampaign[]): Record<string, any> {
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalConverted = campaigns.reduce((sum, c) => sum + c.metrics.converted, 0);
    
    // Mock revenue per conversion
    const avgRevenuePerConversion = 50;
    const totalRevenue = totalConverted * avgRevenuePerConversion;
    const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

    return {
      total_spent: totalSpent,
      total_revenue: totalRevenue,
      roi_percentage: Math.round(roi * 100) / 100,
      cost_per_conversion: totalConverted > 0 ? Math.round((totalSpent / totalConverted) * 100) / 100 : 0,
      revenue_per_conversion: avgRevenuePerConversion,
    };
  }

  private generateROIRecommendations(insights: Record<string, any>): any[] {
    const recommendations = [];

    if (insights.roi_percentage < 100) {
      recommendations.push({
        type: 'budget_optimization',
        priority: 'high',
        description: 'Optimize budget allocation to improve ROI',
        expected_impact: 'Increase ROI by 50-100%',
        implementation_effort: 'medium',
      });
    }

    if (insights.cost_per_conversion > 25) {
      recommendations.push({
        type: 'conversion_optimization',
        priority: 'medium',
        description: 'Improve conversion funnel to reduce acquisition costs',
        expected_impact: 'Reduce cost per conversion by 20-30%',
        implementation_effort: 'complex',
      });
    }

    return recommendations;
  }

  // Marketing Analytics
  async getMarketingAnalytics(): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalSent: number;
    averageOpenRate: number;
    averageClickRate: number;
    averageConversionRate: number;
    totalBudget: number;
    roi: number;
    topPerformingCampaigns: MarketingCampaign[];
    recentIntelligence: MarketingIntelligence[];
  }> {
    const campaigns = await this.getCampaigns();
    const intelligence = await this.getMarketingIntelligence({ limit: 5 });
    
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
    const totalSent = campaigns.reduce((sum, c) => sum + c.metrics.sent, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.metrics.opened, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.metrics.clicked, 0);
    const totalConverted = campaigns.reduce((sum, c) => sum + c.metrics.converted, 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    
    const averageOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const averageClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const averageConversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;
    
    // Mock ROI calculation
    const totalRevenue = totalConverted * 50; // $50 average revenue per conversion
    const roi = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0;
    
    const topPerformingCampaigns = campaigns
      .sort((a, b) => {
        const aConversionRate = a.metrics.sent > 0 ? a.metrics.converted / a.metrics.sent : 0;
        const bConversionRate = b.metrics.sent > 0 ? b.metrics.converted / b.metrics.sent : 0;
        return bConversionRate - aConversionRate;
      })
      .slice(0, 5);

    return {
      totalCampaigns,
      activeCampaigns,
      totalSent,
      averageOpenRate: Math.round(averageOpenRate * 100) / 100,
      averageClickRate: Math.round(averageClickRate * 100) / 100,
      averageConversionRate: Math.round(averageConversionRate * 100) / 100,
      totalBudget,
      roi: Math.round(roi * 100) / 100,
      topPerformingCampaigns,
      recentIntelligence: intelligence,
    };
  }
}

export const realMarketingService = RealMarketingService.getInstance();