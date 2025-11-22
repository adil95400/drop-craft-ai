// DEPRECATED: Use useUnifiedCustomers instead
// This file is kept for backward compatibility only
import { useUnifiedCustomers as useUnifiedCustomersBase } from './useUnifiedData'
import { useToast } from '@/hooks/use-toast'

export interface Customer {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  status: 'active' | 'inactive';
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  address?: any;
  platform_customer_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Backward compatibility wrapper
export function useCustomers(search?: string) {
  const result = useUnifiedCustomersBase({ search })
  
  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch
  }
}

export function useUpdateCustomer() {
  const { toast } = useToast()
  
  return {
    mutate: async () => {
      toast({
        title: "Info",
        description: "Utilisez useUnifiedCustomers pour les mises à jour",
      })
    },
    mutateAsync: async () => {},
    isPending: false
  }
}

export function useCustomerStats() {
  const result = useUnifiedCustomersBase()
  
  return {
    data: result.stats,
    isLoading: result.isLoading
  }
}
