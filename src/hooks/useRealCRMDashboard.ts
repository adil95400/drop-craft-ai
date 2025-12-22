import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface CRMCustomer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name: string
  phone?: string
  status: 'active' | 'inactive'
  total_orders: number
  total_spent: number
  last_order_date?: string
  segment: 'vip' | 'loyal' | 'new' | 'at_risk' | 'inactive'
  lifetime_value: number
  avg_order_value: number
  days_since_last_order?: number
}

export interface CRMMetrics {
  total_customers: number
  active_customers: number
  vip_customers: number
  at_risk_customers: number
  new_this_month: number
  churn_rate: number
  avg_lifetime_value: number
  avg_customer_value: number
}

export interface CustomerSegment {
  id: string
  name: string
  count: number
  percentage: number
  avg_value: number
  color: string
}

export const useRealCRMDashboard = () => {
  const { toast } = useToast()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('total_spent', { ascending: false })

      if (!customers) return { customers: [], metrics: null, segments: [] }

      // Calculate segments and enrich customer data
      const enrichedCustomers: CRMCustomer[] = customers.map(c => {
        const daysSinceLastOrder = c.updated_at 
          ? Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          : null

        let segment: CRMCustomer['segment'] = 'new'
        const totalOrders = c.total_orders || 0
        const totalSpent = c.total_spent || 0
        
        if (totalOrders === 0) segment = 'inactive'
        else if (totalOrders >= 5 && totalSpent > 500) segment = 'vip'
        else if (totalOrders >= 3) segment = 'loyal'
        else if (daysSinceLastOrder && daysSinceLastOrder > 60) segment = 'at_risk'

        const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email

        return {
          id: c.id,
          email: c.email,
          first_name: c.first_name || undefined,
          last_name: c.last_name || undefined,
          full_name: fullName,
          phone: c.phone || undefined,
          status: totalOrders > 0 ? 'active' : 'inactive',
          total_orders: totalOrders,
          total_spent: totalSpent,
          last_order_date: c.updated_at || undefined,
          segment,
          lifetime_value: totalSpent,
          avg_order_value: totalOrders > 0 ? totalSpent / totalOrders : 0,
          days_since_last_order: daysSinceLastOrder || undefined
        }
      })

      // Calculate metrics
      const activeCustomers = enrichedCustomers.filter(c => c.status === 'active')
      const vipCustomers = enrichedCustomers.filter(c => c.segment === 'vip')
      const atRiskCustomers = enrichedCustomers.filter(c => c.segment === 'at_risk')
      
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: newThisMonth } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const totalRevenue = enrichedCustomers.reduce((sum, c) => sum + c.total_spent, 0)
      const avgLifetimeValue = enrichedCustomers.length > 0 
        ? totalRevenue / enrichedCustomers.length 
        : 0

      const metrics: CRMMetrics = {
        total_customers: enrichedCustomers.length,
        active_customers: activeCustomers.length,
        vip_customers: vipCustomers.length,
        at_risk_customers: atRiskCustomers.length,
        new_this_month: newThisMonth || 0,
        churn_rate: enrichedCustomers.length > 0 
          ? (enrichedCustomers.filter(c => c.segment === 'inactive').length / enrichedCustomers.length) * 100
          : 0,
        avg_lifetime_value: avgLifetimeValue,
        avg_customer_value: avgLifetimeValue
      }

      // Calculate segments distribution
      const segmentData: Record<string, { count: number, total_value: number, color: string, label: string }> = {
        vip: { count: 0, total_value: 0, color: 'bg-purple-500', label: 'VIP' },
        loyal: { count: 0, total_value: 0, color: 'bg-blue-500', label: 'Fidèles' },
        new: { count: 0, total_value: 0, color: 'bg-green-500', label: 'Nouveaux' },
        at_risk: { count: 0, total_value: 0, color: 'bg-orange-500', label: 'À risque' },
        inactive: { count: 0, total_value: 0, color: 'bg-gray-500', label: 'Inactifs' }
      }

      enrichedCustomers.forEach(c => {
        segmentData[c.segment].count++
        segmentData[c.segment].total_value += c.lifetime_value
      })

      const segments: CustomerSegment[] = Object.entries(segmentData).map(([id, data]) => ({
        id,
        name: data.label,
        count: data.count,
        percentage: enrichedCustomers.length > 0 ? (data.count / enrichedCustomers.length) * 100 : 0,
        avg_value: data.count > 0 ? data.total_value / data.count : 0,
        color: data.color
      }))

      return {
        customers: enrichedCustomers,
        metrics,
        segments
      }
    },
    staleTime: 3 * 60 * 1000,
    meta: {
      onError: () => {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données CRM",
          variant: "destructive"
        })
      }
    }
  })

  return {
    customers: data?.customers || [],
    metrics: data?.metrics || null,
    segments: data?.segments || [],
    isLoading,
    error,
    refetch
  }
}
