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

      // Fetch segments - simulating with local storage for now as table doesn't exist in types
      const storedSegments = localStorage.getItem(`segments_${user.id}`);
      if (storedSegments) {
        try {
          setSegments(JSON.parse(storedSegments));
        } catch {
          setSegments([]);
        }
      } else {
        setSegments([]);
      }
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
      const newSegment: CustomerSegment = {
        id: crypto.randomUUID(),
        name: segmentData.name,
        description: segmentData.description,
        criteria: segmentData.criteria || {},
        contact_count: segmentData.contact_count || 0,
        is_active: segmentData.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newSegments = [newSegment, ...segments];
      setSegments(newSegments);
      localStorage.setItem(`segments_${user.id}`, JSON.stringify(newSegments));
      
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
    if (!user) throw new Error('User not authenticated');
    
    try {
      const updatedSegment: CustomerSegment = {
        ...segments.find(s => s.id === id)!,
        ...updates,
        updated_at: new Date().toISOString()
      };

      const newSegments = segments.map(segment => 
        segment.id === id ? updatedSegment : segment
      );
      setSegments(newSegments);
      localStorage.setItem(`segments_${user.id}`, JSON.stringify(newSegments));
      
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
    if (!user) throw new Error('User not authenticated');
    
    try {
      const newSegments = segments.filter(segment => segment.id !== id);
      setSegments(newSegments);
      localStorage.setItem(`segments_${user.id}`, JSON.stringify(newSegments));
      
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
