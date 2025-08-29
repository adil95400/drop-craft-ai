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
        
        // Fetch customers using the secure view function
        const { data: customersData, error: customersError } = await supabase
          .rpc('get_masked_customers');

        if (customersError) throw customersError;

        // Fetch marketing segments
        const { data: segmentsData, error: segmentsError } = await supabase
          .from('marketing_segments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // If marketing segments table doesn't exist, just set empty array
        const segments = segmentsError ? [] : (segmentsData || []);

        setCustomers(customersData || []);
        setSegments(segments);
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Don't show toast for expected table missing errors
        if (!err?.message?.includes('does not exist')) {
          toast({
            title: "Error",
            description: "Failed to load customer data",
            variant: "destructive"
          });
        }
        // Set empty arrays to prevent UI issues
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
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            ...customerData,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
      
      return data;
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
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => prev.map(customer => 
        customer.id === id ? data : customer
      ));
      
      toast({
        title: "Success",
        description: "Customer updated successfully"
      });
      
      return data;
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
        .from('marketing_segments')
        .insert([
          {
            ...segmentData,
            user_id: user.id,
            contact_count: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setSegments(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Customer segment created successfully"
      });
      
      return data;
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
        .from('marketing_segments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      setSegments(prev => prev.map(segment => 
        segment.id === id ? data : segment
      ));
      
      toast({
        title: "Success",
        description: "Segment updated successfully"
      });
      
      return data;
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
        .from('marketing_segments')
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
    refetch: () => {
      if (user) {
        setLoading(true);
        // Re-fetch logic would trigger the useEffect
      }
    }
  };
}