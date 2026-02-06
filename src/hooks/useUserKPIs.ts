import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      // Use analytics_insights with a specific metric_type as KPI store
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'kpi')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        user_id: d.user_id || '',
        name: d.metric_name,
        target: d.comparison_value || 0,
        current_value: d.metric_value || 0,
        unit: d.period || '',
        kpi_type: (d.category as any) || 'custom',
        period: (d.period as any) || 'monthly',
        created_at: d.created_at || '',
        updated_at: d.created_at || '',
      }));
    },
    enabled: !!user?.id,
  });

  const createKPI = useMutation({
    mutationFn: async (kpiData: CreateKPIData) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('analytics_insights')
        .insert({
          user_id: user.id,
          metric_name: kpiData.name,
          metric_type: 'kpi',
          metric_value: kpiData.current_value,
          comparison_value: kpiData.target,
          category: kpiData.kpi_type,
          period: kpiData.period,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-kpis'] });
      toast({ title: '✅ KPI créé', description: 'Le KPI a été ajouté avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateKPI = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserKPI> & { id: string }) => {
      const { error } = await supabase
        .from('analytics_insights')
        .update({
          metric_name: updates.name,
          metric_value: updates.current_value,
          comparison_value: updates.target,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-kpis'] });
      toast({ title: '✅ KPI modifié' });
    },
    onError: (error: Error) => {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteKPI = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('analytics_insights')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-kpis'] });
      toast({ title: '✅ KPI supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
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
