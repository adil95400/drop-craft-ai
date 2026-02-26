import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface AdCampaign {
  id: string
  name: string
  platform: 'google' | 'facebook' | 'instagram' | 'tiktok'
  status: 'active' | 'paused' | 'completed' | 'draft'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
  start_date: string
  end_date?: string
}

export interface AdsMetrics {
  total_campaigns: number
  active_campaigns: number
  total_budget: number
  total_spent: number
  total_impressions: number
  total_clicks: number
  total_conversions: number
  avg_ctr: number
  avg_cpc: number
  avg_roas: number
}

export interface PlatformPerformance {
  platform: string
  campaigns: number
  spent: number
  revenue: number
  roas: number
  conversions: number
}

export const useRealAdsManager = () => {
  const { toast } = useToast()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ads-manager'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Fetch real ad campaigns from database
      const { data: dbCampaigns, error: campError } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (campError) throw campError

      const campaigns: AdCampaign[] = (dbCampaigns || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        platform: (c.platform || 'google') as AdCampaign['platform'],
        status: (c.status || 'draft') as AdCampaign['status'],
        budget: c.budget || 0,
        spent: c.spend || 0,
        impressions: c.impressions || 0,
        clicks: c.clicks || 0,
        conversions: c.conversions || 0,
        ctr: c.ctr || ((c.clicks || 0) > 0 && (c.impressions || 0) > 0 ? ((c.clicks / c.impressions) * 100) : 0),
        cpc: c.cpc || ((c.clicks || 0) > 0 ? (c.spend || 0) / c.clicks : 0),
        roas: c.roas || 0,
        start_date: c.start_date || c.created_at,
        end_date: c.end_date || undefined
      }))

      // Calculate overall metrics from real data
      const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
      const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
      const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
      const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
      const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)

      const metrics: AdsMetrics = {
        total_campaigns: campaigns.length,
        active_campaigns: campaigns.filter(c => c.status === 'active').length,
        total_budget: totalBudget,
        total_spent: totalSpent,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        avg_cpc: totalClicks > 0 ? totalSpent / totalClicks : 0,
        avg_roas: totalSpent > 0 ? campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length : 0
      }

      // Calculate platform performance from real data
      const platformData: Record<string, { campaigns: number; spent: number; conversions: number; roas: number }> = {}

      campaigns.forEach(c => {
        if (!platformData[c.platform]) {
          platformData[c.platform] = { campaigns: 0, spent: 0, conversions: 0, roas: 0 }
        }
        platformData[c.platform].campaigns++
        platformData[c.platform].spent += c.spent
        platformData[c.platform].conversions += c.conversions
        platformData[c.platform].roas += c.roas
      })

      const platformPerformance: PlatformPerformance[] = Object.entries(platformData).map(([platform, data]) => ({
        platform,
        campaigns: data.campaigns,
        spent: data.spent,
        revenue: data.conversions > 0 ? data.spent * (data.roas / data.campaigns) : 0,
        roas: data.campaigns > 0 ? data.roas / data.campaigns : 0,
        conversions: data.conversions
      }))

      return { campaigns, metrics, platformPerformance }
    },
    staleTime: 5 * 60 * 1000,
    meta: {
      onError: () => {
        toast({ title: "Erreur de chargement", description: "Impossible de charger les données publicitaires", variant: "destructive" })
      }
    }
  })

  return {
    campaigns: data?.campaigns || [],
    metrics: data?.metrics || null,
    platformPerformance: data?.platformPerformance || [],
    isLoading,
    error,
    refetch
  }
}
