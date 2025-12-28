import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface EmailUnsubscribe {
  id: string
  user_id: string
  email: string
  reason?: string
  campaign_id?: string
  unsubscribed_at: string
}

export interface EmailSendingLog {
  id: string
  user_id: string
  campaign_id?: string
  recipient_email: string
  message_id?: string
  provider: string
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed'
  event_data: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface DeliverabilityStats {
  id: string
  user_id: string
  date: string
  domain?: string
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
  complained_count: number
  reputation_score: number
}

export function useEmailDeliverability() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Unsubscribes
  const { data: unsubscribes = [], isLoading: loadingUnsubscribes } = useQuery({
    queryKey: ['email-unsubscribes', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('email_unsubscribes')
        .select('*')
        .eq('user_id', user.id)
        .order('unsubscribed_at', { ascending: false })

      if (error) throw error
      return data as unknown as EmailUnsubscribe[]
    },
    enabled: !!user?.id
  })

  // Sending logs
  const { data: sendingLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['email-sending-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('email_sending_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      return data as unknown as EmailSendingLog[]
    },
    enabled: !!user?.id
  })

  // Deliverability stats
  const { data: deliverabilityStats = [], isLoading: loadingStats } = useQuery({
    queryKey: ['deliverability-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('deliverability_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) throw error
      return data as unknown as DeliverabilityStats[]
    },
    enabled: !!user?.id
  })

  // Add unsubscribe
  const addUnsubscribe = useMutation({
    mutationFn: async (data: { email: string; reason?: string; campaign_id?: string }) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { data: result, error } = await supabase
        .from('email_unsubscribes')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-unsubscribes'] })
      toast({ title: 'Désabonnement enregistré', description: 'L\'email a été ajouté à la liste de désabonnement' })
    }
  })

  // Remove unsubscribe
  const removeUnsubscribe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_unsubscribes')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-unsubscribes'] })
      toast({ title: 'Désabonnement retiré', description: 'L\'email peut à nouveau recevoir des emails' })
    }
  })

  // Check if email is unsubscribed
  const isUnsubscribed = (email: string) => {
    return unsubscribes.some(u => u.email.toLowerCase() === email.toLowerCase())
  }

  // Calculate overall stats
  const overallStats = {
    totalSent: deliverabilityStats.reduce((acc, s) => acc + s.sent_count, 0),
    totalDelivered: deliverabilityStats.reduce((acc, s) => acc + s.delivered_count, 0),
    totalOpened: deliverabilityStats.reduce((acc, s) => acc + s.opened_count, 0),
    totalClicked: deliverabilityStats.reduce((acc, s) => acc + s.clicked_count, 0),
    totalBounced: deliverabilityStats.reduce((acc, s) => acc + s.bounced_count, 0),
    totalComplaints: deliverabilityStats.reduce((acc, s) => acc + s.complained_count, 0),
    totalUnsubscribes: unsubscribes.length,
    avgReputationScore: deliverabilityStats.length > 0
      ? deliverabilityStats.reduce((acc, s) => acc + Number(s.reputation_score), 0) / deliverabilityStats.length
      : 100,
    deliveryRate: deliverabilityStats.reduce((acc, s) => acc + s.sent_count, 0) > 0
      ? (deliverabilityStats.reduce((acc, s) => acc + s.delivered_count, 0) / deliverabilityStats.reduce((acc, s) => acc + s.sent_count, 0)) * 100
      : 0,
    openRate: deliverabilityStats.reduce((acc, s) => acc + s.delivered_count, 0) > 0
      ? (deliverabilityStats.reduce((acc, s) => acc + s.opened_count, 0) / deliverabilityStats.reduce((acc, s) => acc + s.delivered_count, 0)) * 100
      : 0,
    clickRate: deliverabilityStats.reduce((acc, s) => acc + s.opened_count, 0) > 0
      ? (deliverabilityStats.reduce((acc, s) => acc + s.clicked_count, 0) / deliverabilityStats.reduce((acc, s) => acc + s.opened_count, 0)) * 100
      : 0,
    bounceRate: deliverabilityStats.reduce((acc, s) => acc + s.sent_count, 0) > 0
      ? (deliverabilityStats.reduce((acc, s) => acc + s.bounced_count, 0) / deliverabilityStats.reduce((acc, s) => acc + s.sent_count, 0)) * 100
      : 0
  }

  // Log status for charts
  const logsByStatus = sendingLogs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    unsubscribes,
    sendingLogs,
    deliverabilityStats,
    overallStats,
    logsByStatus,
    isLoading: loadingUnsubscribes || loadingLogs || loadingStats,
    addUnsubscribe: addUnsubscribe.mutate,
    removeUnsubscribe: removeUnsubscribe.mutate,
    isUnsubscribed
  }
}
