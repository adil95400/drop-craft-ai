import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TenantUser {
  role: string;
  permissions: string[];
}

export function useTenantContext() {
  const getCurrentTenantId = () => {
    return localStorage.getItem('current_tenant_id');
  };

  const currentTenantId = getCurrentTenantId();

  // Use profiles table as a proxy for tenant info
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['current-tenant', currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user profile as tenant info
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching tenant:', error);
        return null;
      }

      return {
        id: currentTenantId,
        name: (data as any)?.company_name || 'Default Tenant',
        ...data
      };
    },
    enabled: !!currentTenantId,
  });

  // Get user role from profile
  const { data: userRole } = useQuery({
    queryKey: ['tenant-user-role', currentTenantId],
    queryFn: async (): Promise<TenantUser | null> => {
      if (!currentTenantId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if user is admin using has_role function
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      return {
        role: isAdmin ? 'admin' : 'user',
        permissions: isAdmin ? ['read', 'write', 'delete', 'admin'] : ['read', 'write']
      };
    },
    enabled: !!currentTenantId,
  });

  // Helper to add tenant_id to queries
  const withTenant = (query: any) => {
    if (currentTenantId) {
      return query.eq('tenant_id', currentTenantId);
    }
    return query;
  };

  // Helper to add tenant_id to inserts
  const addTenantId = (data: any) => {
    if (currentTenantId) {
      return { ...data, tenant_id: currentTenantId };
    }
    return data;
  };

  return {
    currentTenantId,
    tenant,
    userRole: userRole?.role || 'user',
    permissions: userRole?.permissions || ['read'],
    isLoading,
    withTenant,
    addTenantId,
    hasTenant: !!currentTenantId,
  };
}
