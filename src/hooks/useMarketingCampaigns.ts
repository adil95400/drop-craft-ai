import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { marketingApi } from '@/services/api/client';

export const useMarketingCampaigns = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: ['marketing-campaigns', user?.id],
    queryFn: async () => {
      const resp = await marketingApi.listCampaigns({ per_page: 100 });
      return resp.items ?? [];
    },
    enabled: !!user?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: any) => {
      return await marketingApi.createCampaign(campaignData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne créée", description: "Votre campagne a été créée avec succès" });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return await marketingApi.updateCampaign(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne mise à jour" });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      await marketingApi.deleteCampaign(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne supprimée" });
    },
  });

  return {
    campaigns, isLoading, error,
    createCampaign: createCampaign.mutate, updateCampaign: updateCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,
    isCreating: createCampaign.isPending, isUpdating: updateCampaign.isPending, isDeleting: deleteCampaign.isPending,
  };
};
