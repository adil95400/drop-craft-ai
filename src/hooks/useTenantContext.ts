import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTenantContext() {
  const getCurrentTenantId = () => {
    return localStorage.getItem('current_tenant_id');
  };

  const currentTenantId = getCurrentTenantId();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['current-tenant', currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', currentTenantId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenantId,
  });

  const { data: userRole } = useQuery({
    queryKey: ['tenant-user-role', currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return null;

      const { data, error } = await supabase
        .from('tenant_users')
        .select('role, permissions')
        .eq('tenant_id', currentTenantId)
        .single();

      if (error) throw error;
      return data;
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
    userRole: userRole?.role,
    permissions: userRole?.permissions,
    isLoading,
    withTenant,
    addTenantId,
    hasTenant: !!currentTenantId,
  };
}
