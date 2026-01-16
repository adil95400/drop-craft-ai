import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface MarketingDashboardStats {
  activeCampaigns: number
  totalCampaigns: number
  openRate: number
  clickRate: number
  conversions: number
  conversionRate: number
  avgROI: number
  totalRevenue: number
  totalSpend: number
  emailsSent: number
  automationsActive: number
  segmentsCount: number
  isDemo: boolean
}

export function useMarketingDashboardStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['marketing-dashboard-stats', user?.id],
    queryFn: async (): Promise<MarketingDashboardStats> => {
      if (!user?.id) throw new Error('User not authenticated')

      // Fetch all marketing data in parallel
      const [campaignsRes, automationsRes, conversionsRes, emailCampaignsRes] = await Promise.all([
        supabase
          .from('marketing_campaigns')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('automated_campaigns')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('conversion_events')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('email_campaigns')
          .select('*')
          .eq('user_id', user.id)
      ])

      const campaigns = campaignsRes.data || []
      const automations = automationsRes.data || []
      const conversions = conversionsRes.data || []
      const emailCampaigns = emailCampaignsRes.data || []

      // Calculate metrics
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length
      const automationsActive = automations.filter(a => a.is_active).length
      
      // Email metrics
      const emailOpens = conversions.filter(e => e.event_type === 'email_open').length
      const emailClicks = conversions.filter(e => e.event_type === 'email_click').length
      const totalEmails = emailCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0) || Math.max(emailOpens * 3, 100)
      
      // Conversion metrics
      const purchaseEvents = conversions.filter(e => e.event_type === 'purchase' || e.event_type === 'conversion')
      const totalConversions = purchaseEvents.length
      const totalRevenue = purchaseEvents.reduce((sum, e) => sum + (Number(e.revenue) || 0), 0)
      
      // Spend and ROI
      const totalSpend = campaigns.reduce((sum, c) => sum + (Number(c.budget_spent) || 0), 0)
      const avgROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0

      // Check if we have real data or should show demo values
      const hasRealData = campaigns.length > 0 || conversions.length > 0 || emailCampaigns.length > 0

      if (!hasRealData) {
        // Return demo data when no real data exists
        return {
          activeCampaigns: 8,
          totalCampaigns: 12,
          openRate: 34.2,
          clickRate: 4.8,
          conversions: 142,
          conversionRate: 2.8,
          avgROI: 328,
          totalRevenue: 15840,
          totalSpend: 3670,
          emailsSent: 4560,
          automationsActive: 5,
          segmentsCount: 6,
          isDemo: true
        }
      }

      return {
        activeCampaigns,
        totalCampaigns: campaigns.length,
        openRate: totalEmails > 0 ? (emailOpens / totalEmails) * 100 : 0,
        clickRate: totalEmails > 0 ? (emailClicks / totalEmails) * 100 : 0,
        conversions: totalConversions,
        conversionRate: totalEmails > 0 ? (totalConversions / totalEmails) * 100 : 0,
        avgROI,
        totalRevenue,
        totalSpend,
        emailsSent: totalEmails,
        automationsActive,
        segmentsCount: 6, // Static for now
        isDemo: false
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
