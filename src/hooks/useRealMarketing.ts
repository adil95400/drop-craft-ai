import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { useToast } from '@/hooks/use-toast'

export interface MarketingCampaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'social' | 'ads' | 'retargeting'
  status: 'active' | 'paused' | 'completed' | 'draft'
  budget?: number
  spent?: number
  impressions?: number
  clicks?: number
  conversions?: number
  ctr?: number
  cpa?: number
  roas?: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface EmailList { id: string; name: string; subscribers: number; engagement_rate: number }
export interface AdAccount { id: string; platform: string; account_id: string; status: 'active' | 'inactive'; spend_limit: number }

export const useRealMarketing = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: campaigns = [], isLoading: isLoadingCampaigns, error } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async (): Promise<MarketingCampaign[]> => {
      const res = await shopOptiApi.request<MarketingCampaign[]>('/marketing/campaigns')
      return res.data || []
    },
  })

  const connectMailchimp = useMutation({
    mutationFn: async (apiKey: string) => {
      const res = await shopOptiApi.request('/marketing/integrations/mailchimp', { method: 'POST', body: { api_key: apiKey } })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Mailchimp connecté", description: "Votre compte Mailchimp a été connecté avec succès" })
    }
  })

  const connectKlaviyo = useMutation({
    mutationFn: async (apiKey: string) => {
      const res = await shopOptiApi.request('/marketing/integrations/klaviyo', { method: 'POST', body: { api_key: apiKey } })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Klaviyo connecté", description: "Votre compte Klaviyo a été connecté avec succès" })
    }
  })

  const connectGoogleAds = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await shopOptiApi.request('/marketing/integrations/google-ads', { method: 'POST', body: credentials })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Google Ads connecté", description: "Votre compte Google Ads a été connecté avec succès" })
    }
  })

  const connectFacebookAds = useMutation({
    mutationFn: async (accessToken: string) => {
      const res = await shopOptiApi.request('/marketing/integrations/facebook-ads', { method: 'POST', body: { access_token: accessToken } })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Facebook Ads connecté", description: "Votre compte Facebook Ads a été connecté avec succès" })
    }
  })

  const createEmailCampaign = useMutation({
    mutationFn: async (campaignData: { name: string; subject: string; content: string; audience: string; schedule?: string }) => {
      const res = await shopOptiApi.request('/marketing/campaigns/email', { method: 'POST', body: campaignData })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Campagne email créée", description: "Votre campagne email a été créée avec succès" })
    }
  })

  const createGoogleAdsCampaign = useMutation({
    mutationFn: async (campaignData: { name: string; budget: number; keywords: string[]; adText: string }) => {
      const res = await shopOptiApi.request('/marketing/campaigns/google-ads', { method: 'POST', body: campaignData })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Campagne Google Ads créée", description: "Votre campagne Google Ads a été créée avec succès" })
    }
  })

  const createFacebookAdsCampaign = useMutation({
    mutationFn: async (campaignData: { name: string; budget: number; audience: any; creative: any }) => {
      const res = await shopOptiApi.request('/marketing/campaigns/facebook-ads', { method: 'POST', body: campaignData })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Campagne Facebook Ads créée", description: "Votre campagne Facebook Ads a été créée avec succès" })
    }
  })

  const syncCampaignPerformance = useMutation({
    mutationFn: async () => {
      const res = await shopOptiApi.request('/marketing/campaigns/sync', { method: 'POST' })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Synchronisation terminée", description: "Les performances des campagnes ont été mises à jour" })
    }
  })

  return {
    campaigns, isLoadingCampaigns, error,
    connectMailchimp: connectMailchimp.mutate,
    connectKlaviyo: connectKlaviyo.mutate,
    connectGoogleAds: connectGoogleAds.mutate,
    connectFacebookAds: connectFacebookAds.mutate,
    createEmailCampaign: createEmailCampaign.mutate,
    createGoogleAdsCampaign: createGoogleAdsCampaign.mutate,
    createFacebookAdsCampaign: createFacebookAdsCampaign.mutate,
    syncCampaignPerformance: syncCampaignPerformance.mutate,
    isConnectingMailchimp: connectMailchimp.isPending,
    isConnectingKlaviyo: connectKlaviyo.isPending,
    isConnectingGoogleAds: connectGoogleAds.isPending,
    isConnectingFacebookAds: connectFacebookAds.isPending,
    isCreatingEmailCampaign: createEmailCampaign.isPending,
    isCreatingGoogleAdsCampaign: createGoogleAdsCampaign.isPending,
    isCreatingFacebookAdsCampaign: createFacebookAdsCampaign.isPending,
    isSyncingPerformance: syncCampaignPerformance.isPending
  }
}
