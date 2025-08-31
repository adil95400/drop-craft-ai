import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SmartInventoryService, SmartInventory } from '@/services/SmartInventoryService';

export function useSmartInventory() {
  return useQuery({
    queryKey: ['smart-inventory'],
    queryFn: () => SmartInventoryService.getAllInventory(),
  });
}

export function useAnalyzeProduct() {
  return useMutation({
    mutationFn: ({ productId, analysisType }: { productId: string; analysisType?: string }) => 
      SmartInventoryService.analyzeProduct(productId, analysisType),
  });
}

export function useUpdateInventoryLevels() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ inventoryId, updates }: { inventoryId: string; updates: Partial<SmartInventory> }) => 
      SmartInventoryService.updateInventoryLevels(inventoryId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-inventory'] });
    },
  });
}

export function useToggleAutoReorder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ inventoryId, enabled }: { inventoryId: string; enabled: boolean }) => 
      SmartInventoryService.enableAutoReorder(inventoryId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-inventory'] });
    },
  });
}

export function useHighRiskItems() {
  return useQuery({
    queryKey: ['smart-inventory', 'high-risk'],
    queryFn: () => SmartInventoryService.getHighRiskItems(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useReorderRecommendations() {
  return useQuery({
    queryKey: ['smart-inventory', 'reorder-recommendations'],
    queryFn: () => SmartInventoryService.getReorderRecommendations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBulkAnalyzeInventory() {
  return useMutation({
    mutationFn: (productIds: string[]) => 
      SmartInventoryService.bulkAnalyzeInventory(productIds),
  });
}

export function useInventoryMetrics() {
  return useQuery({
    queryKey: ['inventory-metrics'],
    queryFn: () => SmartInventoryService.getInventoryMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSimulateReorder() {
  return useMutation({
    mutationFn: (inventoryId: string) => 
      SmartInventoryService.simulateReorder(inventoryId),
  });
}

export function useUpdateStockLevel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, newStock }: { productId: string; newStock: number }) => 
      SmartInventoryService.updateStockLevel(productId, newStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function usePredictiveInsights() {
  return useQuery({
    queryKey: ['inventory-predictive-insights'],
    queryFn: () => SmartInventoryService.getPredictiveInsights(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}