import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface MarketingEvent {
  id: string
  title: string
  description: string
  type: 'campaign' | 'email' | 'social' | 'event' | 'deadline'
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  date: Date
  endDate?: Date
  campaign_id?: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
}

export function useMarketingEvents() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch events from marketing_campaigns and create synthetic events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['marketing-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Fetch campaigns to create events
      const { data: campaigns, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching marketing events:', error)
        return []
      }

      // Transform campaigns into events
      const campaignEvents: MarketingEvent[] = (campaigns || []).map((campaign: any) => ({
        id: campaign.id,
        title: campaign.name,
        description: `Campagne ${campaign.type}`,
        type: campaign.type === 'email' ? 'email' : 
              campaign.type === 'social' ? 'social' : 'campaign',
        status: campaign.status === 'active' ? 'active' : 
                campaign.status === 'completed' ? 'completed' : 'scheduled',
        date: new Date(campaign.start_date || campaign.created_at),
        endDate: campaign.end_date ? new Date(campaign.end_date) : undefined,
        campaign_id: campaign.id,
        priority: (campaign.budget || 0) > 1000 ? 'high' : 
                  (campaign.budget || 0) > 500 ? 'medium' : 'low',
        tags: []
      }))

      // Add some synthetic events from automation
      const { data: automations } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .limit(10)

      const automationEvents: MarketingEvent[] = (automations || []).map((auto: any) => ({
        id: `auto-${auto.id}`,
        title: auto.name,
        description: `Automation: ${auto.trigger_type}`,
        type: 'email' as const,
        status: auto.is_active ? 'active' : 'scheduled',
        date: new Date(auto.created_at),
        priority: 'medium' as const,
        tags: ['automation']
      }))

      return [...campaignEvents, ...automationEvents]
    },
    refetchInterval: 60000
  })

  // Create event (creates a campaign in the background)
  const createEvent = useMutation({
    mutationFn: async (event: Omit<MarketingEvent, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          user_id: user.id,
          name: event.title,
          type: event.type === 'email' ? 'email' : 
                event.type === 'social' ? 'social' : 'general',
          status: event.status === 'active' ? 'active' : 'draft',
          start_date: event.date.toISOString(),
          end_date: event.endDate?.toISOString(),
          metrics: { priority: event.priority, tags: event.tags }
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-events'] })
      toast({
        title: "Événement créé",
        description: "L'événement a été ajouté au calendrier"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement",
        variant: "destructive"
      })
    }
  })

  // Delete event
  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Check if it's an automation event
      if (eventId.startsWith('auto-')) {
        const realId = eventId.replace('auto-', '')
        const { error } = await supabase
          .from('automated_campaigns')
          .delete()
          .eq('id', realId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('marketing_campaigns')
          .delete()
          .eq('id', eventId)
          .eq('user_id', user.id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-events'] })
      toast({
        title: "Événement supprimé",
        description: "L'événement a été retiré du calendrier"
      })
    }
  })

  return {
    events,
    isLoading,
    createEvent,
    deleteEvent
  }
}
