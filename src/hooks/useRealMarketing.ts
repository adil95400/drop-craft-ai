import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface MarketingCampaign {
  id: string
  name: string
  platform: string
  type: 'email' | 'google_ads' | 'facebook_ads'
  status: 'active' | 'paused' | 'completed'
  budget?: number
  impressions?: number
  clicks?: number
  conversions?: number
  cost?: number
  created_at: string
}

interface EmailList {
  id: string
  name: string
  subscriber_count: number
  platform: string
  list_id: string
}

interface AdAccount {
  id: string
  platform: string
  account_id: string
  account_name: string
  currency: string
  balance?: number
  status: string
}

export const useRealMarketing = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch marketing campaigns
  const {
    data: campaigns = [],
    isLoading: isLoadingCampaigns
  } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      // Mock data until real marketing table is created
      return [] as MarketingCampaign[]
    }
  })

  // Connect to Mailchimp
  const connectMailchimp = useMutation({
    mutationFn: async ({ apiKey }: { apiKey: string }) => {
      const { data, error } = await supabase.functions.invoke('marketing-integration', {
        body: {
          action: 'connect_mailchimp',
          api_key: apiKey
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Mailchimp connecté",
        description: "Votre compte Mailchimp a été connecté avec succès",
      })
    }
  })

  // Connect to Klaviyo
  const connectKlaviyo = useMutation({
    mutationFn: async ({ apiKey }: { apiKey: string }) => {
      const { data, error } = await supabase.functions.invoke('marketing-integration', {
        body: {
          action: 'connect_klaviyo',
          api_key: apiKey
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Klaviyo connecté",
        description: "Votre compte Klaviyo a été connecté avec succès",
      })
    }
  })

  // Connect to Google Ads
  const connectGoogleAds = useMutation({
    mutationFn: async ({ clientId, clientSecret }: { clientId: string; clientSecret: string }) => {
      const { data, error } = await supabase.functions.invoke('marketing-integration', {
        body: {
          action: 'connect_google_ads',
          client_id: clientId,
          client_secret: clientSecret
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Google Ads connecté",
        description: "Votre compte Google Ads a été connecté avec succès",
      })
    }
  })

  // Connect to Facebook Ads
  const connectFacebookAds = useMutation({
    mutationFn: async ({ accessToken }: { accessToken: string }) => {
      const { data, error } = await supabase.functions.invoke('marketing-integration', {
        body: {
          action: 'connect_facebook_ads',
          access_token: accessToken
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Facebook Ads connecté",
        description: "Votre compte Facebook Ads a été connecté avec succès",
      })
    }
  })

  // Create email campaign
  const createEmailCampaign = useMutation({
    mutationFn: async ({
      platform,
      campaignName,
      subject,
      content,
      listId,
      scheduleDate
    }: {
      platform: string
      campaignName: string
      subject: string
      content: string
      listId: string
      scheduleDate?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('marketing-integration', {
        body: {
          action: 'create_email_campaign',
          platform,
          campaign_name: campaignName,
          subject,
          content,
          list_id: listId,
          schedule_date: scheduleDate
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Campagne créée",
        description: "Votre campagne email a été créée avec succès",
      })
    }
  })

  // Create Google Ads campaign
  const createGoogleAdsCampaign = useMutation({
    mutationFn: async ({
      campaignName,
      budget,
      keywords,
      adGroups
    }: {
      campaignName: string
      budget: number
      keywords: string[]
      adGroups: any[]
    }) => {
      const { data, error } = await supabase.functions.invoke('marketing-integration', {
        body: {
          action: 'create_google_ads_campaign',
          campaign_name: campaignName,
          budget,
          keywords,
          ad_groups: adGroups
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Campagne Google Ads créée",
        description: "Votre campagne Google Ads a été créée avec succès",
      })
    }
  })

  // Create Facebook Ads campaign
  const createFacebookAdsCampaign = useMutation({
    mutationFn: async ({
      campaignName,
      objective,
      budget,
      audience,
      creatives
    }: {
      campaignName: string
      objective: string
      budget: number
      audience: any
      creatives: any[]
    }) => {
      const { data, error } = await supabase.functions.invoke('marketing-integration', {
        body: {
          action: 'create_facebook_ads_campaign',
          campaign_name: campaignName,
          objective,
          budget,
          audience,
          creatives
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Campagne Facebook Ads créée",
        description: "Votre campagne Facebook Ads a été créée avec succès",
      })
    }
  })

  // Sync campaign performance
  const syncCampaignPerformance = useMutation({
    mutationFn: async (platform: string) => {
      const { data, error } = await supabase.functions.invoke('marketing-integration', {
        body: {
          action: 'sync_performance',
          platform
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Performance synchronisée",
        description: "Les données de performance ont été mises à jour",
      })
    }
  })

  return {
    campaigns,
    isLoadingCampaigns,
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
    isCreatingGoogleAds: createGoogleAdsCampaign.isPending,
    isCreatingFacebookAds: createFacebookAdsCampaign.isPending,
    isSyncingPerformance: syncCampaignPerformance.isPending
  }
}