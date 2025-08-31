import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { EnterpriseIntegrationService } from '@/services/EnterpriseIntegrationService'

export const useEnterpriseIntegrationService = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['enterprise-integrations'],
    queryFn: () => EnterpriseIntegrationService.getEnterpriseIntegrations(),
  })

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['enterprise-settings'],
    queryFn: () => EnterpriseIntegrationService.getEnterpriseSettings(),
  })

  const createIntegrationMutation = useMutation({
    mutationFn: EnterpriseIntegrationService.createEnterpriseIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-integrations'] })
      toast({
        title: "Intégration créée",
        description: "L'intégration enterprise a été créée avec succès",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'intégration",
        variant: "destructive"
      })
    }
  })

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value, category }: { key: string; value: any; category: string }) => 
      EnterpriseIntegrationService.updateEnterpriseSetting(key, value, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-settings'] })
      toast({
        title: "Paramètre mis à jour",
        description: "Le paramètre enterprise a été modifié",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre",
        variant: "destructive"
      })
    }
  })

  const syncIntegrationMutation = useMutation({
    mutationFn: EnterpriseIntegrationService.syncEnterpriseIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-integrations'] })
      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation de l'intégration a été démarrée",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de synchroniser l'intégration",
        variant: "destructive"
      })
    }
  })

  return {
    integrations,
    settings,
    isLoading: isLoadingIntegrations || isLoadingSettings,
    createIntegration: createIntegrationMutation.mutate,
    updateSetting: updateSettingMutation.mutate,
    syncIntegration: syncIntegrationMutation.mutate,
    isCreatingIntegration: createIntegrationMutation.isPending,
    isUpdatingSetting: updateSettingMutation.isPending,
    isSyncingIntegration: syncIntegrationMutation.isPending,
  }
}