import { useState, useEffect } from 'react';
import { useOptimizedQuery, useOptimizedMutation } from '@/hooks/useOptimizedQuery';

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

  // Simulating API call with mock data
  const { data: customers, isLoading, error, refetch } = useOptimizedQuery<Customer[]>(
    ['customers'],
    async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { data: mockCustomers, error: null };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Create customer mutation
  const createCustomerMutation = useOptimizedMutation<Customer, Partial<Customer>>(
    async (customerData) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone,
        status: customerData.status || 'active',
        total_orders: 0,
        total_spent: 0,
        user_id: 'mock-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...customerData
      };
      return { data: newCustomer, error: null };
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedCustomer = { ...data, id, updated_at: new Date().toISOString() } as Customer;
      return { data: updatedCustomer, error: null };
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
      await new Promise(resolve => setTimeout(resolve, 1000));
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