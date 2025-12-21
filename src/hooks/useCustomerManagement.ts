import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  total_spent?: number;
  total_orders?: number;
  created_at: string;
  updated_at: string;
}

interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  criteria: any;
  contact_count?: number;
  created_at: string;
  updated_at: string;
}

export function useCustomerManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch customers from the customers table directly
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (customersError) throw customersError;

        // Map customers data to interface
        const mappedCustomers: Customer[] = (customersData || []).map((c: any) => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
          email: c.email,
          phone: c.phone,
          status: 'active',
          total_spent: c.total_spent,
          total_orders: c.total_orders,
          created_at: c.created_at,
          updated_at: c.updated_at
        }));

        setCustomers(mappedCustomers);
        setSegments([]); // No marketing_segments table, use empty array
      } catch (err: any) {
        console.error('Error fetching customer data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setCustomers([]);
        setSegments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const nameParts = customerData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            email: customerData.email,
            first_name: firstName,
            last_name: lastName,
            phone: customerData.phone,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newCustomer: Customer = {
        id: data.id,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email,
        email: data.email,
        phone: data.phone,
        status: 'active',
        total_spent: data.total_spent,
        total_orders: data.total_orders,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setCustomers(prev => [newCustomer, ...prev]);
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
      
      return newCustomer;
    } catch (err) {
      console.error('Error creating customer:', err);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name) {
        const nameParts = updates.name.split(' ');
        dbUpdates.first_name = nameParts[0] || '';
        dbUpdates.last_name = nameParts.slice(1).join(' ') || '';
      }
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.phone) dbUpdates.phone = updates.phone;

      const { data, error } = await supabase
        .from('customers')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      const updatedCustomer: Customer = {
        id: data.id,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email,
        email: data.email,
        phone: data.phone,
        status: 'active',
        total_spent: data.total_spent,
        total_orders: data.total_orders,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setCustomers(prev => prev.map(customer => 
        customer.id === id ? updatedCustomer : customer
      ));
      
      toast({
        title: "Success",
        description: "Customer updated successfully"
      });
      
      return updatedCustomer;
    } catch (err) {
      console.error('Error updating customer:', err);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== id));
      toast({
        title: "Success",
        description: "Customer deleted successfully"
      });
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive"
      });
      throw err;
    }
  };

  const createSegment = async (segmentData: Omit<CustomerSegment, 'id' | 'created_at' | 'updated_at'>) => {
    // Segments not supported yet - return mock data
    toast({
      title: "Info",
      description: "Customer segments feature coming soon"
    });
    return null;
  };

  const updateSegment = async (id: string, updates: Partial<CustomerSegment>) => {
    toast({
      title: "Info",
      description: "Customer segments feature coming soon"
    });
    return null;
  };

  const deleteSegment = async (id: string) => {
    toast({
      title: "Info",
      description: "Customer segments feature coming soon"
    });
  };

  return {
    customers,
    segments,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createSegment,
    updateSegment,
    deleteSegment,
    refetch: () => {
      if (user) {
        setLoading(true);
      }
    }
  };
}
