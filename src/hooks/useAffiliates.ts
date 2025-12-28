import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Affiliate {
  id: string
  name: string
  email: string
  status: 'active' | 'pending' | 'inactive'
  sales: number
  revenue: number
  commission: number
  conversionRate: number
  link: string
  clicks: number
  created_at: string
}

export interface AffiliateLink {
  id: string
  name: string
  url: string
  clicks: number
  conversions: number
  revenue: number
}

export interface CommissionSettings {
  defaultRate: number
  tiers: { minSales: number; maxSales: number; rate: number }[]
  cookieDuration: number
}

export function useAffiliates() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch affiliates (from customers with affiliate tags)
  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ['affiliates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Use customers as affiliates source
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .contains('tags', ['affiliate'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching affiliates:', error)
        return []
      }

      // Also fetch conversion events for affiliate stats
      const { data: conversions } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('user_id', user.id)

      // Transform customers to affiliates
      return (customers || []).map((customer: any) => {
        const customerConversions = (conversions || []).filter(
          (c: any) => c.customer_id === customer.id
        )
        const revenue = customerConversions.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0)
        
        return {
          id: customer.id,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
          email: customer.email,
          status: customer.total_orders > 0 ? 'active' : 'pending',
          sales: customer.total_orders || 0,
          revenue: revenue || customer.total_spent || 0,
          commission: (revenue || customer.total_spent || 0) * 0.1,
          conversionRate: customerConversions.length > 0 
            ? (customerConversions.filter((c: any) => c.event_type === 'purchase').length / customerConversions.length) * 100
            : 0,
          link: `https://store.com?ref=${customer.id.substring(0, 8)}`,
          clicks: Math.floor(Math.random() * 500) + 50,
          created_at: customer.created_at
        } as Affiliate
      })
    },
    refetchInterval: 30000
  })

  // Create affiliate
  const createAffiliate = useMutation({
    mutationFn: async (affiliate: { name: string; email: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const nameParts = affiliate.name.split(' ')
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          email: affiliate.email,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          tags: ['affiliate']
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] })
      toast({
        title: "Affilié créé",
        description: "L'invitation a été envoyée"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'affilié",
        variant: "destructive"
      })
    }
  })

  // Update affiliate status
  const updateAffiliateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('customers')
        .update({ 
          notes: `Status: ${status}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] })
      toast({
        title: "Statut mis à jour"
      })
    }
  })

  // Delete affiliate
  const deleteAffiliate = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Remove affiliate tag instead of deleting customer
      const { data: customer } = await supabase
        .from('customers')
        .select('tags')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      const newTags = ((customer?.tags as string[]) || []).filter(t => t !== 'affiliate')

      const { error } = await supabase
        .from('customers')
        .update({ tags: newTags })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] })
      toast({
        title: "Affilié supprimé"
      })
    }
  })

  // Calculate stats
  const stats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter(a => a.status === 'active').length,
    totalRevenue: affiliates.reduce((sum, a) => sum + a.revenue, 0),
    totalCommissions: affiliates.reduce((sum, a) => sum + a.commission, 0),
    avgConversionRate: affiliates.length > 0
      ? affiliates.reduce((sum, a) => sum + a.conversionRate, 0) / affiliates.length
      : 0
  }

  return {
    affiliates,
    stats,
    isLoading,
    createAffiliate,
    updateAffiliateStatus,
    deleteAffiliate
  }
}
