import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface MarketingIntegration {
  id: string; platform: string; platform_name?: string; connection_status?: string;
  is_active?: boolean; last_sync_at?: string; created_at?: string; updated_at?: string;
}

export const useMarketingIntegrations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ['marketing-integrations', user?.id],
    queryFn: async (): Promise<MarketingIntegration[]> => {
      if (!user?.id) return [];
      // Use store_integrations or similar existing table
      const { data, error } = await (supabase.from('store_integrations') as any)
        .select('*').eq('user_id', user.id);
      if (error) {
        // Table may not exist - return empty
        console.warn('store_integrations not found:', error.message);
        return [];
      }
      return (data || []) as MarketingIntegration[];
    },
    enabled: !!user?.id,
  });

  const connectIntegration = useMutation({
    mutationFn: async (_data: any) => {
      toast({ title: "Info", description: "Les intégrations marketing seront disponibles prochainement" });
      return null;
    },
  });

  const disconnectIntegration = useMutation({
    mutationFn: async (_id: string) => {
      toast({ title: "Info", description: "Déconnexion non disponible pour le moment" });
    },
  });

  const syncIntegration = useMutation({
    mutationFn: async (_id: string) => {
      toast({ title: "Info", description: "Synchronisation non disponible pour le moment" });
    },
  });

  return {
    integrations, isLoading, error,
    connectIntegration: connectIntegration.mutate, disconnectIntegration: disconnectIntegration.mutate,
    syncIntegration: syncIntegration.mutate,
    isConnecting: connectIntegration.isPending, isDisconnecting: disconnectIntegration.isPending,
    isSyncing: syncIntegration.isPending,
  };
};
