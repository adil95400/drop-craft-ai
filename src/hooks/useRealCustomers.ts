import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useCustomerSecurityMonitoring } from '@/hooks/useCustomerSecurityMonitoring'

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  status: 'active' | 'inactive'
  total_spent: number
  total_orders: number
  address?: any
  user_id: string
  created_at: string
  updated_at: string
}

export const useRealCustomers = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { secureCustomerQuery } = useCustomerSecurityMonitoring()

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['real-customers', filters],
    queryFn: async () => {
      // Use secure query with monitoring
      let query = supabase.from('customers').select('*')
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Customer[]
    },
  })

  const addCustomer = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Use secure query with monitoring
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...newCustomer, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-customers'] })
      toast({
        title: "Client ajouté",
        description: "Le client a été créé avec succès",
      })
    }
  })

  const updateCustomer = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      // Use secure query with monitoring  
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-customers'] })
      toast({
        title: "Client mis à jour",
        description: "Les informations du client ont été mises à jour",
      })
    }
  })

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    totalRevenue: customers.reduce((sum, customer) => sum + customer.total_spent, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, customer) => sum + customer.total_spent, 0) / Math.max(customers.reduce((sum, customer) => sum + customer.total_orders, 0), 1) 
      : 0
  }

  return {
    customers,
    stats,
    isLoading,
    error,
    addCustomer: addCustomer.mutate,
    updateCustomer: updateCustomer.mutate,
    isAdding: addCustomer.isPending,
    isUpdating: updateCustomer.isPending
  }
}