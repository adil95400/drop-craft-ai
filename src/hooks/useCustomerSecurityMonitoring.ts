import { useEffect } from 'react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { supabase } from '@/integrations/supabase/client';

export const useCustomerSecurityMonitoring = () => {
  const { logSecurityEvent, checkDataAccessPattern } = useSecurityMonitoring();

  // Monitor customer data access
  const monitorCustomerAccess = async (action: 'view' | 'create' | 'update' | 'delete', customerId?: string) => {
    await logSecurityEvent(
      'customer_data_access',
      'info',
      `Customer data ${action} operation performed`,
      { 
        action, 
        customer_id: customerId,
        timestamp: new Date().toISOString()
      }
    );

    // Check for suspicious patterns
    await checkDataAccessPattern('customers', action);
  };

  // Enhanced customer query with security logging
  const secureCustomerQuery = {
    // Secure select with monitoring
    select: async (columns: string = '*') => {
      await monitorCustomerAccess('view');
      return supabase
        .from('customers')
        .select(columns);
    },

    // Secure insert with monitoring
    insert: async (data: any) => {
      await monitorCustomerAccess('create');
      return supabase
        .from('customers')
        .insert(data);
    },

    // Secure update with monitoring
    update: async (data: any, customerId: string) => {
      await monitorCustomerAccess('update', customerId);
      return supabase
        .from('customers')
        .update(data)
        .eq('id', customerId);
    },

    // Secure delete with monitoring
    delete: async (customerId: string) => {
      await monitorCustomerAccess('delete', customerId);
      return supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
    }
  };

  // Remove auto-log on mount - only log when explicitly called
  // This prevents unnecessary API calls on public pages

  return {
    monitorCustomerAccess,
    secureCustomerQuery
  };
};