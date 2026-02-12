import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { marketingApi } from '@/services/api/client';

export const useMarketingAutomations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: automations = [], isLoading, error } = useQuery({
    queryKey: ['marketing-automations', user?.id],
    queryFn: async () => {
      const resp = await marketingApi.listAutomations();
      return resp.items ?? [];
    },
    enabled: !!user?.id,
  });

  const createAutomation = useMutation({
    mutationFn: async (automationData: any) => {
      return await marketingApi.createAutomation(automationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-automations'] });
      toast({ title: "Automation créée" });
    },
  });

  const updateAutomation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return await marketingApi.updateAutomation(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-automations'] });
      toast({ title: "Automation mise à jour" });
    },
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await marketingApi.toggleAutomation(id, is_active);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-automations'] }),
  });

  return {
    automations, isLoading, error,
    createAutomation: createAutomation.mutate, updateAutomation: updateAutomation.mutate,
    toggleAutomation: toggleAutomation.mutate,
    isCreating: createAutomation.isPending, isUpdating: updateAutomation.isPending, isToggling: toggleAutomation.isPending,
  };
};
