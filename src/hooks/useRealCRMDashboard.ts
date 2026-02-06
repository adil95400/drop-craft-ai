import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

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
      const res = await shopOptiApi.request<{
        customers: CRMCustomer[]
        metrics: CRMMetrics
        segments: CustomerSegment[]
      }>('/crm/dashboard')
      return res.data || { customers: [], metrics: null, segments: [] }
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
