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
  const { monitorCustomerAccess } = useCustomerSecurityMonitoring()

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['real-customers', filters],
    queryFn: async () => {
      // Log security access
      await monitorCustomerAccess('view')
      
      let query = supabase.from('customers').select('*')
      
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Transform DB schema to Customer interface
      return (data || []).map((c: any) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
        email: c.email,
        phone: c.phone,
        status: (c.total_orders > 0 ? 'active' : 'inactive') as 'active' | 'inactive',
        total_spent: c.total_spent || 0,
        total_orders: c.total_orders || 0,
        address: c.address || {
          line1: c.address_line1,
          line2: c.address_line2,
          city: c.city,
          state: c.state,
          postal_code: c.postal_code,
          country: c.country
        },
        user_id: c.user_id,
        created_at: c.created_at,
        updated_at: c.updated_at
      })) as Customer[]
    },
  })

  const addCustomer = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Log security access
      await monitorCustomerAccess('create')
      
      // Split name into first_name and last_name
      const nameParts = newCustomer.name.split(' ')
      const first_name = nameParts[0] || ''
      const last_name = nameParts.slice(1).join(' ') || ''
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{ 
          first_name,
          last_name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          total_spent: newCustomer.total_spent || 0,
          total_orders: newCustomer.total_orders || 0,
          user_id: user.id 
        }])
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
      // Log security access
      await monitorCustomerAccess('update', id)
      
      // Transform updates to DB schema
      const dbUpdates: any = {}
      if (updates.name) {
        const nameParts = updates.name.split(' ')
        dbUpdates.first_name = nameParts[0] || ''
        dbUpdates.last_name = nameParts.slice(1).join(' ') || ''
      }
      if (updates.email) dbUpdates.email = updates.email
      if (updates.phone) dbUpdates.phone = updates.phone
      if (updates.total_spent !== undefined) dbUpdates.total_spent = updates.total_spent
      if (updates.total_orders !== undefined) dbUpdates.total_orders = updates.total_orders
      
      const { data, error } = await supabase
        .from('customers')
        .update(dbUpdates)
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
