import { useState, useEffect, useCallback } from 'react';
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
  criteria: Record<string, unknown>;
  contact_count?: number;
  is_active?: boolean;
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

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      const mappedCustomers: Customer[] = (customersData || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || (c.email as string),
        email: c.email as string,
        phone: c.phone as string | undefined,
        status: 'active',
        total_spent: c.total_spent as number | undefined,
        total_orders: c.total_orders as number | undefined,
        created_at: c.created_at as string,
        updated_at: c.updated_at as string
      }));

      setCustomers(mappedCustomers);

      // Fetch segments - use customer_analytics_segments table
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('customer_analytics_segments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (segmentsError) throw segmentsError;

      const mappedSegments: CustomerSegment[] = (segmentsData || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        name: s.name as string,
        description: s.description as string | undefined,
        criteria: (s.rules as Record<string, unknown>) || {},
        contact_count: s.customer_count as number | undefined,
        is_active: s.is_active as boolean | undefined,
        created_at: s.created_at as string,
        updated_at: s.updated_at as string
      }));

      setSegments(mappedSegments);
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCustomers([]);
      setSegments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      const dbUpdates: Record<string, unknown> = {};
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
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('customer_analytics_segments')
        .insert([
          {
            name: segmentData.name,
            description: segmentData.description,
            rules: segmentData.criteria,
            customer_count: segmentData.contact_count || 0,
            is_active: segmentData.is_active ?? true,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newSegment: CustomerSegment = {
        id: data.id,
        name: data.name,
        description: data.description,
        criteria: (data.rules as Record<string, unknown>) || {},
        contact_count: data.customer_count,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setSegments(prev => [newSegment, ...prev]);
      toast({
        title: "Success",
        description: "Segment created successfully"
      });
      
      return newSegment;
    } catch (err) {
      console.error('Error creating segment:', err);
      toast({
        title: "Error",
        description: "Failed to create segment",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateSegment = async (id: string, updates: Partial<CustomerSegment>) => {
    try {
      const { data, error } = await supabase
        .from('customer_analytics_segments')
        .update({
          name: updates.name,
          description: updates.description,
          rules: updates.criteria,
          customer_count: updates.contact_count,
          is_active: updates.is_active
        })
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSegment: CustomerSegment = {
        id: data.id,
        name: data.name,
        description: data.description,
        criteria: (data.rules as Record<string, unknown>) || {},
        contact_count: data.customer_count,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setSegments(prev => prev.map(segment => 
        segment.id === id ? updatedSegment : segment
      ));
      
      toast({
        title: "Success",
        description: "Segment updated successfully"
      });
      
      return updatedSegment;
    } catch (err) {
      console.error('Error updating segment:', err);
      toast({
        title: "Error",
        description: "Failed to update segment",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteSegment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_analytics_segments')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSegments(prev => prev.filter(segment => segment.id !== id));
      toast({
        title: "Success",
        description: "Segment deleted successfully"
      });
    } catch (err) {
      console.error('Error deleting segment:', err);
      toast({
        title: "Error",
        description: "Failed to delete segment",
        variant: "destructive"
      });
      throw err;
    }
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
    refetch: fetchData
  };
}
