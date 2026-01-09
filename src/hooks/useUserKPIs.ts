import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
      
      const { data, error } = await supabase
        .from('user_kpis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as UserKPI[];
    },
    enabled: !!user?.id,
  });

  const createKPI = useMutation({
    mutationFn: async (kpiData: CreateKPIData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_kpis')
        .insert({
          ...kpiData,
          user_id: user.id,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('user_kpis')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('user_kpis')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
