import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

export interface UserKPI {
  id: string;
  user_id: string;
  name: string;
  target: number;
  current_value: number;
  unit: string;
  kpi_type: 'revenue' | 'orders' | 'customers' | 'products' | 'conversion' | 'custom';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  created_at: string;
  updated_at: string;
}

export interface CreateKPIData {
  name: string;
  target: number;
  current_value: number;
  unit: string;
  kpi_type: UserKPI['kpi_type'];
  period: UserKPI['period'];
}

export function useUserKPIs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kpis = [], isLoading } = useQuery({
    queryKey: ['user-kpis', user?.id],
    queryFn: async (): Promise<UserKPI[]> => {
      if (!user?.id) return [];
      const res = await shopOptiApi.request<UserKPI[]>('/analytics/kpis/user');
      if (!res.success) return [];
      return res.data || [];
    },
    enabled: !!user?.id,
  });

  const createKPI = useMutation({
    mutationFn: async (kpiData: CreateKPIData) => {
      if (!user?.id) throw new Error('User not authenticated');
      const res = await shopOptiApi.request('/analytics/kpis/user', {
        method: 'POST',
        body: kpiData,
      });
      if (!res.success) throw new Error(res.error || 'Failed to create KPI');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-kpis'] });
      toast({
        title: '✅ KPI créé',
        description: 'Le KPI a été ajouté avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateKPI = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserKPI> & { id: string }) => {
      const res = await shopOptiApi.request(`/analytics/kpis/user/${id}`, {
        method: 'PATCH',
        body: updates,
      });
      if (!res.success) throw new Error(res.error || 'Failed to update KPI');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-kpis'] });
      toast({
        title: '✅ KPI modifié',
        description: 'Le KPI a été mis à jour avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteKPI = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/analytics/kpis/user/${id}`, {
        method: 'DELETE',
      });
      if (!res.success) throw new Error(res.error || 'Failed to delete KPI');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-kpis'] });
      toast({
        title: '✅ KPI supprimé',
        description: 'Le KPI a été supprimé avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    kpis,
    isLoading,
    createKPI: createKPI.mutate,
    updateKPI: updateKPI.mutate,
    deleteKPI: deleteKPI.mutate,
    isCreating: createKPI.isPending,
    isUpdating: updateKPI.isPending,
    isDeleting: deleteKPI.isPending,
  };
}
