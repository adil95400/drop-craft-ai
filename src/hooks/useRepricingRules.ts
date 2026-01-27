/**
 * Hook pour la gestion des règles de repricing dynamique
 * Connecté au backend Supabase réel
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dynamicRepricingService } from '@/services/marketplace/DynamicRepricingService'
import { useAuthOptimized } from '@/shared'
import type { RepricingRule } from '@/types/marketplace-repricing'

export function useRepricingRules() {
  const queryClient = useQueryClient()
  const { user } = useAuthOptimized()
  const userId = user?.id || ''

  // Récupérer toutes les règles
  const {
    data: rules = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['repricing-rules', userId],
    queryFn: () => dynamicRepricingService.getRepricingRules(userId),
    enabled: !!userId,
    staleTime: 30 * 1000
  })

  // Créer une règle
  const createRule = useMutation({
    mutationFn: (rule: Partial<RepricingRule>) => 
      dynamicRepricingService.createRepricingRule(userId, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules', userId] })
      queryClient.invalidateQueries({ queryKey: ['repricing-dashboard', userId] })
      toast.success('Règle de repricing créée')
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`)
    }
  })

  // Mettre à jour une règle
  const updateRule = useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<RepricingRule> }) =>
      dynamicRepricingService.updateRepricingRule(ruleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules', userId] })
      queryClient.invalidateQueries({ queryKey: ['repricing-dashboard', userId] })
      toast.success('Règle mise à jour')
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`)
    }
  })

  // Supprimer une règle
  const deleteRule = useMutation({
    mutationFn: (ruleId: string) => dynamicRepricingService.deleteRepricingRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules', userId] })
      queryClient.invalidateQueries({ queryKey: ['repricing-dashboard', userId] })
      toast.success('Règle supprimée')
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`)
    }
  })

  // Activer/désactiver une règle
  const toggleRule = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      dynamicRepricingService.updateRepricingRule(ruleId, { is_active: isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules', userId] })
      toast.success(variables.isActive ? 'Règle activée' : 'Règle mise en pause')
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`)
    }
  })

  // Exécuter une règle
  const executeRule = useMutation({
    mutationFn: (ruleId: string) => dynamicRepricingService.executeRepricingRule(ruleId),
    onSuccess: (executions) => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules', userId] })
      queryClient.invalidateQueries({ queryKey: ['repricing-dashboard', userId] })
      queryClient.invalidateQueries({ queryKey: ['repricing-history', userId] })
      toast.success(`${executions.length} produits repricés avec succès`)
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'exécution: ${error.message}`)
    }
  })

  return {
    rules,
    isLoading,
    error,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    toggleRule: toggleRule.mutate,
    executeRule: executeRule.mutate,
    isCreating: createRule.isPending,
    isUpdating: updateRule.isPending,
    isDeleting: deleteRule.isPending,
    isExecuting: executeRule.isPending
  }
}

export function useRepricingHistory(limit: number = 50) {
  const { user } = useAuthOptimized()
  const userId = user?.id || ''

  return useQuery({
    queryKey: ['repricing-history', userId, limit],
    queryFn: () => dynamicRepricingService.getPriceHistory(userId, limit),
    enabled: !!userId,
    staleTime: 30 * 1000
  })
}

export function useRepricingDashboard() {
  const { user } = useAuthOptimized()
  const userId = user?.id || ''

  return useQuery({
    queryKey: ['repricing-dashboard', userId],
    queryFn: () => dynamicRepricingService.getDashboard(userId),
    enabled: !!userId,
    staleTime: 60 * 1000
  })
}
