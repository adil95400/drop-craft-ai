import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  status: 'active' | 'inactive' | 'suspended'
  total_orders: number
  total_spent: number
  created_at: string
  updated_at: string
  address?: any
  last_order_date?: string
}

export const useCustomersDemo = (filters: any = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-real', filters],
    queryFn: async () => {
      let query = supabase.from('customers').select('*').order('created_at', { ascending: false })
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Apply search filter in memory if needed
      if (filters.search && data) {
        return data.filter(customer => 
          customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          customer.email?.toLowerCase().includes(filters.search.toLowerCase())
        )
      }
      
      return data || []
    }
  })

  const updateCustomerStatus = useMutation({
    mutationFn: async ({ customerId, status }: { customerId: string; status: string }) => {
      const { error } = await supabase
        .from('customers')
        .update({ status: status as Customer['status'], updated_at: new Date().toISOString() })
        .eq('id', customerId)
      
      if (error) throw error
      return { customerId, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-real'] })
      toast({ title: "Statut mis à jour", description: "Le statut du client a été modifié." })
    }
  })

  const addCustomer = useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone,
          status: 'active',
          total_orders: 0,
          total_spent: 0,
          address: customerData.address
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-real'] })
      toast({ title: "Client ajouté", description: "Le nouveau client a été créé avec succès." })
    }
  })

  // Calculer les statistiques
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    suspended: customers.filter(c => c.status === 'suspended').length,
    totalRevenue: customers.reduce((sum, customer) => sum + customer.total_spent, 0),
    averageOrderValue: customers.length > 0 ? customers.reduce((sum, customer) => sum + customer.total_spent, 0) / customers.reduce((sum, customer) => sum + customer.total_orders, 0) : 0,
    newThisMonth: customers.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
  }

  return {
    customers,
    stats,
    isLoading,
    updateCustomerStatus: updateCustomerStatus.mutate,
    addCustomer: addCustomer.mutate,
    isUpdating: updateCustomerStatus.isPending,
    isAdding: addCustomer.isPending
  }
}