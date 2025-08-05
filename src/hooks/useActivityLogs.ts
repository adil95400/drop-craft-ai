import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useActivityLogs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's activity logs
  const {
    data: logs = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['activity-logs', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Temporarily commented until migration is approved
      // const { data, error } = await supabase
      //   .from('activity_logs')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('created_at', { ascending: false })
      //   .limit(100);
      const data: any[] = [];
      const error = null;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get admin logs (all users)
  const {
    data: adminLogs = [],
    isLoading: isLoadingAdminLogs,
  } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      // Temporarily commented until migration is approved
      // const { data, error } = await supabase
      //   .from('activity_logs')
      //   .select(`
      //     *,
      //     profiles (
      //       id,
      //       full_name,
      //       email
      //     )
      //   `)
      //   .order('created_at', { ascending: false })
      //   .limit(500);
      const data: any[] = [];
      const error = null;

      if (error) throw error;
      return data || [];
    },
    // Only enable for admin users
    enabled: false, // Temporarily disabled until migration
  });

  // Log activity
  const logActivity = useMutation({
    mutationFn: async ({ 
      action, 
      resource, 
      resource_id, 
      metadata, 
      ip_address 
    }: {
      action: string;
      resource: string;
      resource_id?: string;
      metadata?: any;
      ip_address?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Temporarily commented until migration is approved
      // const { data, error } = await supabase
      //   .from('activity_logs')
      //   .insert([{
      //     user_id: user.id,
      //     action,
      //     resource,
      //     resource_id,
      //     metadata: metadata || {},
      //     ip_address: ip_address || 'unknown',
      //   }])
      //   .select()
      //   .single();
      const data = null;
      const error = null;

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
    },
  });

  // Helper function to log common actions
  const logAction = {
    login: () => logActivity.mutate({
      action: 'user.login',
      resource: 'auth',
    }),
    logout: () => logActivity.mutate({
      action: 'user.logout',
      resource: 'auth',
    }),
    profileUpdate: () => logActivity.mutate({
      action: 'user.profile.update',
      resource: 'profile',
    }),
    passwordChange: () => logActivity.mutate({
      action: 'user.password.change',
      resource: 'auth',
    }),
    productImport: (count: number) => logActivity.mutate({
      action: 'product.import',
      resource: 'product',
      metadata: { count },
    }),
    orderCreate: (orderId: string) => logActivity.mutate({
      action: 'order.create',
      resource: 'order',
      resource_id: orderId,
    }),
    adminAction: (action: string, resource: string, resourceId?: string) => logActivity.mutate({
      action: `admin.${action}`,
      resource,
      resource_id: resourceId,
    }),
  };

  return {
    logs,
    adminLogs,
    isLoading,
    isLoadingAdminLogs,
    error,
    logActivity: logActivity.mutate,
    logAction,
    isLogging: logActivity.isPending,
  };
};