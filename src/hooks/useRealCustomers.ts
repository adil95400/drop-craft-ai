import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ApiService } from '@/services/api'
import type { Customer } from '@/lib/supabase'

export const useRealCustomers = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['real-customers', filters],
    queryFn: () => ApiService.getCustomers(filters),
  })

  const addCustomer = useMutation({
    mutationFn: (newCustomer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => 
      ApiService.createCustomer(newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-customers'] })
    }
  })

  const updateCustomer = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Customer> }) => 
      ApiService.updateCustomer(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-customers'] })
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