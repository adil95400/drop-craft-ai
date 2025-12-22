import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface SecureCustomer {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  total_spent: number
  total_orders: number
  address: any
  user_id: string
  created_at: string
  updated_at: string
}

export const useSecureCustomers = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Use the existing customers table directly instead of non-existent RPC
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['secure-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Transform to match SecureCustomer interface with masked data
      return (data || []).map(customer => ({
        id: customer.id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email.split('@')[0],
        email: `${customer.email.substring(0, 3)}***@protected.com`,
        phone: customer.phone ? '+***protected' : '',
        status: (customer.total_orders || 0) > 0 ? 'active' : 'inactive' as 'active' | 'inactive',
        total_spent: customer.total_spent || 0,
        total_orders: customer.total_orders || 0,
        address: customer.address ? { protected: true } : null,
        user_id: customer.user_id,
        created_at: customer.created_at || new Date().toISOString(),
        updated_at: customer.updated_at || new Date().toISOString()
      })) as SecureCustomer[]
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
      
      const nameParts = newCustomer.name.split(' ')
      const customerData = {
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: newCustomer.real_email || `customer-${Date.now()}@example.com`,
        phone: newCustomer.real_phone,
        address: newCustomer.real_address,
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
      const allowedUpdates: any = {}
      
      if (updates.name) {
        const nameParts = updates.name.split(' ')
        allowedUpdates.first_name = nameParts[0]
        allowedUpdates.last_name = nameParts.slice(1).join(' ')
      }
      if (updates.total_spent !== undefined) allowedUpdates.total_spent = updates.total_spent
      if (updates.total_orders !== undefined) allowedUpdates.total_orders = updates.total_orders
      
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

  // Get real customer data (returns null for non-admins)
  const getCustomerSensitiveInfo = async (customerId: string) => {
    try {
      // Check if user is admin
      const { data: isAdmin } = await supabase.rpc('is_admin_secure')
      
      if (!isAdmin) {
        console.warn('Access denied: Admin privileges required')
        return null
      }
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting sensitive info:', error)
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
