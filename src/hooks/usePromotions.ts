import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { promotionService } from '@/services/marketplace/PromotionService'
import type { PromotionCampaign, PromotionAutomationRule } from '@/types/marketplace-promotions'

export function usePromotions(userId: string) {
  const queryClient = useQueryClient()

  // Campaigns
  const campaigns = useQuery({
    queryKey: ['promotion-campaigns', userId],
    queryFn: () => promotionService.listCampaigns(userId),
  })

  const createCampaign = useMutation({
    mutationFn: (campaign: Partial<PromotionCampaign>) => 
      promotionService.createCampaign({ ...campaign, user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-campaigns', userId] })
      toast.success('Campagne créée')
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`)
    },
  })

  const updateCampaign = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PromotionCampaign> }) =>
      promotionService.updateCampaign(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-campaigns', userId] })
      toast.success('Campagne mise à jour')
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => promotionService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-campaigns', userId] })
      toast.success('Campagne supprimée')
    },
  })

  // Automation rules
  const rules = useQuery({
    queryKey: ['promotion-rules', userId],
    queryFn: () => promotionService.listAutomationRules(userId),
  })

  const createRule = useMutation({
    mutationFn: (rule: Partial<PromotionAutomationRule>) =>
      promotionService.createAutomationRule({ ...rule, user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-rules', userId] })
      toast.success('Règle créée')
    },
  })

  const toggleRule = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      promotionService.toggleRule(ruleId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-rules', userId] })
      toast.success('Règle mise à jour')
    },
  })

  const deleteRule = useMutation({
    mutationFn: (ruleId: string) => promotionService.deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-rules', userId] })
      toast.success('Règle supprimée')
    },
  })

  // Stats
  const stats = useQuery({
    queryKey: ['promotion-stats', userId],
    queryFn: () => promotionService.getStats(userId),
  })

  return {
    campaigns: campaigns.data || [],
    isLoadingCampaigns: campaigns.isLoading,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,
    
    rules: rules.data || [],
    isLoadingRules: rules.isLoading,
    createRule: createRule.mutate,
    toggleRule: toggleRule.mutate,
    deleteRule: deleteRule.mutate,
    
    stats: stats.data,
    isLoadingStats: stats.isLoading,
  }
}
