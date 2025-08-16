import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface SecureCustomer {
  id: string
  name: string
  email: string  // Will be masked: "hidden@protected.com"
  phone: string  // Will be masked: "+33****protected"
  status: 'active' | 'inactive'
  total_spent: number
  total_orders: number
  address: any  // Will be masked: {"protected": true}
  user_id: string
  created_at: string
  updated_at: string
}

export const useSecureCustomers = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['secure-customers'],
    queryFn: async () => {
      // Use the secure function instead of direct table access
      const { data, error } = await supabase.rpc('get_customers_secure')
      
      if (error) throw error
      return (data || []) as SecureCustomer[]
    },
  })

  const addCustomer = useMutation({
    mutationFn: async (newCustomer: Omit<SecureCustomer, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'email' | 'phone' | 'address'> & {
      real_email?: string
      real_phone?: string 
      real_address?: any
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Only allow creation with real data - the database will handle masking for reads
      const customerData = {
        name: newCustomer.name,
        email: newCustomer.real_email,
        phone: newCustomer.real_phone,
        address: newCustomer.real_address,
        status: newCustomer.status,
        total_spent: newCustomer.total_spent || 0,
        total_orders: newCustomer.total_orders || 0,
        user_id: user.id
      }
      
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-customers'] })
      toast({
        title: "Client ajouté",
        description: "Le client a été créé avec succès",
      })
    }
  })

  const updateCustomer = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SecureCustomer> }) => {
      // Only allow updates to non-sensitive fields for regular users
      const allowedUpdates = {
        name: updates.name,
        status: updates.status,
        total_spent: updates.total_spent,
        total_orders: updates.total_orders
      }
      
      const { data, error } = await supabase
        .from('customers')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-customers'] })
      toast({
        title: "Client mis à jour",
        description: "Le client a été modifié avec succès",
      })
    }
  })

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-customers'] })
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès",
      })
    }
  })

  // Admin function to get real customer data (will only work for admins)
  const getCustomerSensitiveInfo = async (customerId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_customer_sensitive_info', {
        customer_id: customerId
      })
      
      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Access denied or error getting sensitive info:', error)
      return null
    }
  }

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    totalSpent: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    totalOrders: customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)
  }

  return {
    customers,
    stats,
    isLoading,
    error,
    addCustomer: addCustomer.mutate,
    updateCustomer: updateCustomer.mutate,
    deleteCustomer: deleteCustomer.mutate,
    getCustomerSensitiveInfo,
    isAdding: addCustomer.isPending,
    isUpdating: updateCustomer.isPending,
    isDeleting: deleteCustomer.isPending
  }
}