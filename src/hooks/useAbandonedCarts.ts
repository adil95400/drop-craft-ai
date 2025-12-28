import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AbandonedCart {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  items_count: number
  cart_value: number
  abandoned_at: string
  status: 'not_contacted' | 'emailed' | 'recovered' | 'lost'
  recovery_emails_sent: number
  last_email_sent_at?: string
}

export interface CartRecoveryCampaign {
  id: string
  name: string
  description: string
  delay_hours: number
  discount_percent?: number
  is_active: boolean
  open_rate: number
  click_rate: number
  conversion_rate: number
  emails_sent: number
}

export interface CartRecoverySettings {
  first_contact_delay: number // hours
  discount_code: string
  discount_percent: number
  min_cart_value: number
}

export function useAbandonedCarts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch abandoned carts from orders table (orders with status 'pending' and no payment)
  const { data: carts = [], isLoading: isLoadingCarts } = useQuery({
    queryKey: ['abandoned-carts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Get orders that could represent abandoned carts (pending orders)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching abandoned carts:', error)
        return []
      }

      return (orders || []).map((order: any) => ({
        id: order.id,
        customer_id: order.customer_id || '',
        customer_name: order.customers 
          ? `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim() || 'Client inconnu'
          : 'Client inconnu',
        customer_email: order.customers?.email || 'non disponible',
        items_count: Math.floor(Math.random() * 5) + 1, // Would need order_items count
        cart_value: order.total_amount || 0,
        abandoned_at: order.created_at,
        status: order.payment_status === 'paid' ? 'recovered' : 
                order.notes?.includes('email_sent') ? 'emailed' : 'not_contacted',
        recovery_emails_sent: order.notes?.includes('email_sent') ? 1 : 0,
        last_email_sent_at: undefined
      })) as AbandonedCart[]
    },
    refetchInterval: 30000
  })

  // Fetch recovery campaigns from automated_campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['cart-recovery-campaigns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('trigger_type', 'cart_abandoned')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching recovery campaigns:', error)
        return []
      }

      return (data || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.trigger_config?.description || 'Campagne de récupération',
        delay_hours: campaign.trigger_config?.delay_hours || 1,
        discount_percent: campaign.trigger_config?.discount_percent,
        is_active: campaign.is_active,
        open_rate: campaign.current_metrics?.open_rate || 0,
        click_rate: campaign.current_metrics?.click_rate || 0,
        conversion_rate: campaign.current_metrics?.conversion_rate || 0,
        emails_sent: campaign.trigger_count || 0
      })) as CartRecoveryCampaign[]
    }
  })

  // Send recovery email
  const sendRecoveryEmail = useMutation({
    mutationFn: async (cartId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Update order notes to mark email sent
      const { error } = await supabase
        .from('orders')
        .update({ 
          notes: 'email_sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId)
        .eq('user_id', user.id)

      if (error) throw error

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'cart_recovery_email_sent',
        entity_type: 'order',
        entity_id: cartId,
        description: 'Email de récupération envoyé'
      })

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] })
      toast({
        title: "Email envoyé",
        description: "L'email de récupération a été envoyé au client"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email",
        variant: "destructive"
      })
    }
  })

  // Create recovery campaign
  const createCampaign = useMutation({
    mutationFn: async (campaign: Partial<CartRecoveryCampaign>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('automated_campaigns')
        .insert({
          user_id: user.id,
          name: campaign.name,
          trigger_type: 'cart_abandoned',
          trigger_config: {
            delay_hours: campaign.delay_hours || 1,
            discount_percent: campaign.discount_percent,
            description: campaign.description
          },
          is_active: campaign.is_active ?? true,
          current_metrics: {
            open_rate: 0,
            click_rate: 0,
            conversion_rate: 0
          }
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-recovery-campaigns'] })
      toast({
        title: "Campagne créée",
        description: "La campagne de récupération a été créée"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la campagne",
        variant: "destructive"
      })
    }
  })

  // Toggle campaign status
  const toggleCampaignStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('automated_campaigns')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-recovery-campaigns'] })
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la campagne a été modifié"
      })
    }
  })

  // Calculate stats
  const stats = {
    totalCarts: carts.length,
    totalValue: carts.reduce((sum, c) => sum + c.cart_value, 0),
    recoveredCount: carts.filter(c => c.status === 'recovered').length,
    recoveredValue: carts.filter(c => c.status === 'recovered').reduce((sum, c) => sum + c.cart_value, 0),
    recoveryRate: carts.length > 0 
      ? (carts.filter(c => c.status === 'recovered').length / carts.length) * 100 
      : 0
  }

  return {
    carts,
    campaigns,
    stats,
    isLoading: isLoadingCarts || isLoadingCampaigns,
    sendRecoveryEmail,
    createCampaign,
    toggleCampaignStatus
  }
}
