import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Customer } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useCustomers = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: customers = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('customers' as any)
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return (data || []).map((item: any) => ({
          id: item.id || '',
          user_id: item.user_id || '',
          email: item.email || '',
          first_name: item.first_name,
          last_name: item.last_name,
          phone: item.phone,
          status: item.status || 'active',
          total_orders: item.total_orders || 0,
          total_spent: item.total_spent || 0,
          last_order_date: item.last_order_date,
          address: item.address,
          platform_customer_id: item.platform_customer_id,
          tags: item.tags,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        })) as Customer[]
      } catch (err) {
        console.warn('Customers table not found, returning empty array')
        return [] as Customer[]
      }
    }
  })

  const addCustomer = useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'total_orders' | 'total_spent'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('customers' as any)
        .insert([{ ...customer, user_id: user.id, total_orders: 0, total_spent: 0 }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: "Client ajouté",
        description: "Le client a été ajouté avec succès.",
      })
    }
  })

  const updateCustomer = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const { data, error } = await supabase
        .from('customers' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: "Client mis à jour",
        description: "Le client a été mis à jour avec succès.",
      })
    }
  })

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    totalRevenue: customers.reduce((sum, customer) => sum + customer.total_spent, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, customer) => sum + customer.total_spent, 0) / customers.reduce((sum, customer) => sum + customer.total_orders, 0) 
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