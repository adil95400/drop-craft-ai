/**
 * Competitor Pricing Hooks
 * Hooks React Query pour le repricing concurrentiel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CompetitorPricingService, Competitor, RepricingRule } from '@/services/CompetitorPricingService';
import { toast } from 'sonner';

export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn: () => CompetitorPricingService.getCompetitors(),
  });
}

export function useAddCompetitor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (competitor: Omit<Competitor, 'id' | 'productsTracked' | 'avgPriceDiff'>) => 
      CompetitorPricingService.addCompetitor(competitor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      toast.success('Concurrent ajouté');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useRemoveCompetitor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => CompetitorPricingService.removeCompetitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      toast.success('Concurrent supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useToggleCompetitor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => CompetitorPricingService.toggleCompetitor(id),
    onSuccess: (competitor) => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      toast.success(competitor.isActive ? 'Surveillance activée' : 'Surveillance désactivée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useCompetitorPrices(filters?: { competitorId?: string; productId?: string }) {
  return useQuery({
    queryKey: ['competitor-prices', filters],
    queryFn: () => CompetitorPricingService.getCompetitorPrices(filters),
  });
}

export function useRefreshPrices() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (competitorId?: string) => CompetitorPricingService.refreshPrices(competitorId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['competitor-prices'] });
      toast.success(`${result.updated} prix mis à jour`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur de rafraîchissement: ${error.message}`);
    },
  });
}

export function useRepricingRules() {
  return useQuery({
    queryKey: ['repricing-rules'],
    queryFn: () => CompetitorPricingService.getRepricingRules(),
  });
}

export function useCreateRepricingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rule: Omit<RepricingRule, 'id' | 'createdAt' | 'updatedAt' | 'productsAffected'>) => 
      CompetitorPricingService.createRepricingRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      toast.success('Règle de repricing créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateRepricingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RepricingRule> }) => 
      CompetitorPricingService.updateRepricingRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteRepricingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => CompetitorPricingService.deleteRepricingRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      toast.success('Règle supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useToggleRepricingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => CompetitorPricingService.toggleRepricingRule(id),
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      toast.success(rule.isActive ? 'Règle activée' : 'Règle désactivée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useExecuteRepricingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => CompetitorPricingService.executeRepricingRule(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${result.priceChanges} prix modifiés`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'exécution: ${error.message}`);
    },
  });
}

export function useRepricingStats() {
  return useQuery({
    queryKey: ['repricing-stats'],
    queryFn: () => CompetitorPricingService.getStats(),
  });
}

export function useSimulatePriceChange() {
  return useMutation({
    mutationFn: ({ productId, newPrice }: { productId: string; newPrice: number }) => 
      CompetitorPricingService.simulatePriceChange(productId, newPrice),
  });
}
