import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface EmailCampaign {
  id: string
  user_id: string
  name: string
  subject: string
  template_id?: string
  html_content?: string
  text_content?: string
  type: 'email' | 'sms'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  segment_id?: string
  recipient_count: number
  sent_count: number
  scheduled_at?: string
  sent_at?: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CampaignStats {
  id: string
  campaign_id: string
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_bounced: number
  total_unsubscribed: number
  total_complaints: number
  open_rate: number
  click_rate: number
  bounce_rate: number
  unsubscribe_rate: number
  revenue_generated: number
}

export function useEmailCampaigns() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as EmailCampaign[]
    },
    enabled: !!user?.id
  })

  const { data: campaignStats = {} } = useQuery({
    queryKey: ['campaign-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return {}
      const { data, error } = await supabase
        .from('campaign_stats')
        .select('*')
        .in('campaign_id', campaigns.map(c => c.id))

      if (error) throw error
      return (data as unknown as CampaignStats[]).reduce((acc, stat) => {
        acc[stat.campaign_id] = stat
        return acc
      }, {} as Record<string, CampaignStats>)
    },
    enabled: !!user?.id && campaigns.length > 0
  })

  const createCampaign = useMutation({
    mutationFn: async (campaign: Partial<EmailCampaign>) => {
      if (!user?.id) throw new Error('Not authenticated')
      if (!campaign.name || !campaign.subject) throw new Error('Name and subject required')
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([{ 
          name: campaign.name,
          subject: campaign.subject,
          html_content: campaign.html_content || '',
          type: campaign.type || 'email',
          status: campaign.status || 'draft',
          settings: campaign.settings || {},
          user_id: user.id 
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast({ title: 'Campagne créée', description: 'La campagne a été créée avec succès' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast({ title: 'Campagne mise à jour', description: 'Les modifications ont été enregistrées' })
    }
  })

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast({ title: 'Campagne supprimée', description: 'La campagne a été supprimée' })
    }
  })

  const duplicateCampaign = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated')
      const campaign = campaigns.find(c => c.id === id)
      if (!campaign) throw new Error('Campaign not found')

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([{
          user_id: user.id,
          name: `${campaign.name} (copie)`,
          subject: campaign.subject,
          template_id: campaign.template_id,
          html_content: campaign.html_content,
          type: campaign.type,
          status: 'draft',
          settings: campaign.settings
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast({ title: 'Campagne dupliquée', description: 'Une copie a été créée' })
    }
  })

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const campaign = campaigns.find(c => c.id === campaignId)
      if (!campaign) throw new Error('Campaign not found')

      // Update status to sending
      await supabase
        .from('email_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId)

      // Call edge function to send emails
      const { data, error } = await supabase.functions.invoke('send-email-campaign', {
        body: {
          campaignId,
          subject: campaign.subject,
          body: campaign.html_content || '',
          segment: campaign.segment_id
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast({ title: 'Campagne envoyée', description: 'Les emails sont en cours d\'envoi' })
    },
    onError: (error) => {
      toast({ title: 'Erreur d\'envoi', description: error.message, variant: 'destructive' })
    }
  })

  const scheduleCampaign = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: Date }) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update({ 
          status: 'scheduled', 
          scheduled_at: scheduledAt.toISOString() 
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast({ title: 'Campagne programmée', description: 'La campagne sera envoyée à la date prévue' })
    }
  })

  // Calculate global stats
  const stats = {
    totalCampaigns: campaigns.length,
    sentCampaigns: campaigns.filter(c => c.status === 'sent').length,
    scheduledCampaigns: campaigns.filter(c => c.status === 'scheduled').length,
    draftCampaigns: campaigns.filter(c => c.status === 'draft').length,
    totalSent: Object.values(campaignStats).reduce((acc, s) => acc + s.total_sent, 0),
    totalOpened: Object.values(campaignStats).reduce((acc, s) => acc + s.total_opened, 0),
    avgOpenRate: Object.values(campaignStats).length > 0
      ? Object.values(campaignStats).reduce((acc, s) => acc + Number(s.open_rate), 0) / Object.values(campaignStats).length
      : 0,
    avgClickRate: Object.values(campaignStats).length > 0
      ? Object.values(campaignStats).reduce((acc, s) => acc + Number(s.click_rate), 0) / Object.values(campaignStats).length
      : 0
  }

  return {
    campaigns,
    campaignStats,
    stats,
    isLoading,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,
    duplicateCampaign: duplicateCampaign.mutate,
    sendCampaign: sendCampaign.mutate,
    scheduleCampaign: scheduleCampaign.mutate,
    isCreating: createCampaign.isPending,
    isSending: sendCampaign.isPending
  }
}
