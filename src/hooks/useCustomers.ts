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
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Customer[]
    }
  })

  const addCustomer = useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'total_orders' | 'total_spent'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customer, total_orders: 0, total_spent: 0 }])
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
        .from('customers')
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