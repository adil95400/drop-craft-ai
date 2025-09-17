import { useState, useEffect } from 'react';
import { useOptimizedQuery, useOptimizedMutation } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  total_orders: number;
  total_spent: number;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Mock data for demo
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    phone: '+33 1 23 45 67 89',
    status: 'active',
    total_orders: 25,
    total_spent: 3450,
    user_id: 'mock-user-id',
    created_at: '2023-06-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Marie Martin',
    email: 'marie.martin@email.com',
    phone: '+33 1 98 76 54 32',
    status: 'active',
    total_orders: 12,
    total_spent: 1890,
    user_id: 'mock-user-id',
    created_at: '2023-08-20T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z'
  },
  {
    id: '3',
    name: 'Pierre Durand',
    email: 'pierre.durand@email.com',
    status: 'active',
    total_orders: 8,
    total_spent: 1250,
    user_id: 'mock-user-id',
    created_at: '2023-09-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  {
    id: '4',
    name: 'Sophie Bernard',
    email: 'sophie.bernard@email.com',
    phone: '+33 1 45 67 89 12',
    status: 'inactive',
    total_orders: 3,
    total_spent: 450,
    user_id: 'mock-user-id',
    created_at: '2023-05-12T00:00:00Z',
    updated_at: '2023-11-20T00:00:00Z'
  },
  {
    id: '5',
    name: 'Antoine Moreau',
    email: 'antoine.moreau@email.com',
    status: 'active',
    total_orders: 35,
    total_spent: 5670,
    user_id: 'mock-user-id',
    created_at: '2023-03-08T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z'
  },
  {
    id: '6',
    name: 'Claire Rousseau',
    email: 'claire.rousseau@email.com',
    phone: '+33 1 67 89 12 34',
    status: 'active',
    total_orders: 15,
    total_spent: 2340,
    user_id: 'mock-user-id',
    created_at: '2023-07-25T00:00:00Z',
    updated_at: '2024-01-11T00:00:00Z'
  }
];

export function useCustomers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Real Supabase data fetch
  const { data: customers, isLoading, error, refetch } = useOptimizedQuery<Customer[]>(
    ['customers'],
    async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { data: (data || []).map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || undefined,
          status: (customer.status === 'active' || customer.status === 'inactive') ? customer.status : 'active',
          total_orders: customer.total_orders || 0,
          total_spent: customer.total_spent || 0,
          address: customer.address as Customer['address'],
          user_id: customer.user_id,
          created_at: customer.created_at || new Date().toISOString(),
          updated_at: customer.updated_at || new Date().toISOString(),
          country: customer.country || undefined
        })), error: null };
      } catch (err) {
        console.warn('Error fetching customers:', err);
        return { data: [], error: err };
      }
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const { user } = useAuth();

  // Create customer mutation
  const createCustomerMutation = useOptimizedMutation<Customer, Partial<Customer>>(
    async (customerData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          user_id: user.id,
          total_orders: 0,
          total_spent: 0,
          name: customerData.name || '',
          email: customerData.email || ''
        })
        .select()
        .single();
      
      if (error) throw error;
      return { 
        data: {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          status: (data.status === 'active' || data.status === 'inactive') ? data.status : 'active',
          total_orders: data.total_orders || 0,
          total_spent: data.total_spent || 0,
          address: data.address as Customer['address'],
          user_id: data.user_id,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          country: data.country || undefined
        }, 
        error: null 
      };
    },
    {
      onSuccess: () => {
        refetch();
      },
      invalidateQueries: ['customers'],
      showToast: true
    }
  );

  // Update customer mutation
  const updateCustomerMutation = useOptimizedMutation<Customer, { id: string; data: Partial<Customer> }>(
    async ({ id, data }) => {
      const { data: updatedData, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { 
        data: {
          id: updatedData.id,
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone || undefined,
          status: (updatedData.status === 'active' || updatedData.status === 'inactive') ? updatedData.status : 'active',
          total_orders: updatedData.total_orders || 0,
          total_spent: updatedData.total_spent || 0,
          address: updatedData.address as Customer['address'],
          user_id: updatedData.user_id,
          created_at: updatedData.created_at || new Date().toISOString(),
          updated_at: updatedData.updated_at || new Date().toISOString(),
          country: updatedData.country || undefined
        }, 
        error: null 
      };
    },
    {
      onSuccess: () => {
        refetch();
      },
      invalidateQueries: ['customers'],
      showToast: true
    }
  );

  // Delete customer mutation
  const deleteCustomerMutation = useOptimizedMutation<void, string>(
    async (customerId) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      
      if (error) throw error;
      return { data: undefined, error: null };
    },
    {
      onSuccess: () => {
        refetch();
      },
      invalidateQueries: ['customers'],
      showToast: true
    }
  );

  // Filter customers based on search and status
  const filteredCustomers = customers?.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Customer statistics
  const customerStats = {
    total: customers?.length || 0,
    active: customers?.filter(c => c.status === 'active').length || 0,
    inactive: customers?.filter(c => c.status === 'inactive').length || 0,
    totalRevenue: customers?.reduce((sum, customer) => sum + customer.total_spent, 0) || 0,
    avgOrderValue: customers?.length ? 
      (customers.reduce((sum, customer) => sum + customer.total_spent, 0) / 
       customers.reduce((sum, customer) => sum + customer.total_orders, 0)) || 0 : 0
  };

  return {
    customers: filteredCustomers || [],
    allCustomers: customers || [],
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    customerStats,
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: (id: string, data: Partial<Customer>) => 
      updateCustomerMutation.mutate({ id, data }),
    deleteCustomer: deleteCustomerMutation.mutate,
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    isDeleting: deleteCustomerMutation.isPending,
    refetch
  };
}