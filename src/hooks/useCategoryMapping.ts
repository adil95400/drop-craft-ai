/**
 * Category Mapping Hooks
 * React Query hooks pour le mapping de catégories
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  CategoryMappingService, 
  CreateMappingInput,
  CategoryMapping,
} from '@/services/CategoryMappingService';

// ========== MAPPINGS ==========

export function useCategoryMappings(destinationType?: string) {
  return useQuery({
    queryKey: ['category-mappings', destinationType],
    queryFn: () => CategoryMappingService.getMappings(destinationType),
    staleTime: 30 * 1000,
  });
}

export function useCategoryMapping(mappingId: string) {
  return useQuery({
    queryKey: ['category-mapping', mappingId],
    queryFn: () => CategoryMappingService.getMapping(mappingId),
    enabled: !!mappingId,
    staleTime: 10 * 1000,
  });
}

export function useCreateCategoryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMappingInput) => CategoryMappingService.createMapping(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['category-mapping-stats'] });
      toast.success('Mapping créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateCategoryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mappingId, updates }: { mappingId: string; updates: Partial<CategoryMapping> }) => 
      CategoryMappingService.updateMapping(mappingId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['category-mapping', data.id] });
      toast.success('Mapping mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteCategoryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mappingId: string) => CategoryMappingService.deleteMapping(mappingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['category-mapping-stats'] });
      toast.success('Mapping supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useAddMappingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      mappingId, 
      sourceCategory, 
      destinationCategory,
      destinationCategoryId 
    }: { 
      mappingId: string; 
      sourceCategory: string; 
      destinationCategory: string;
      destinationCategoryId?: string;
    }) => CategoryMappingService.addMappingRule(mappingId, sourceCategory, destinationCategory, destinationCategoryId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['category-mapping', data.id] });
      toast.success('Règle ajoutée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useRemoveMappingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mappingId, sourceCategory }: { mappingId: string; sourceCategory: string }) => 
      CategoryMappingService.removeMappingRule(mappingId, sourceCategory),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['category-mapping', data.id] });
      toast.success('Règle supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useApplyCategoryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mappingId: string) => CategoryMappingService.applyMapping(mappingId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['category-mapping-stats'] });
      toast.success(`Mapping appliqué: ${data.productsUpdated} produits mis à jour`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== TAXONOMIES ==========

export function useCategoryTaxonomies(taxonomyType?: string) {
  return useQuery({
    queryKey: ['category-taxonomies', taxonomyType],
    queryFn: () => CategoryMappingService.getTaxonomies(taxonomyType),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });
}

export function useSearchTaxonomies(taxonomyType: string, search: string) {
  return useQuery({
    queryKey: ['category-taxonomies-search', taxonomyType, search],
    queryFn: () => CategoryMappingService.searchTaxonomies(taxonomyType, search),
    enabled: search.length >= 2,
    staleTime: 30 * 1000,
  });
}

// ========== SUGGESTIONS ==========

export function useCategorySuggestions(mappingId: string, status?: string) {
  return useQuery({
    queryKey: ['category-suggestions', mappingId, status],
    queryFn: () => CategoryMappingService.getSuggestions(mappingId, status),
    enabled: !!mappingId,
    staleTime: 30 * 1000,
  });
}

export function useResolveSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      suggestionId, 
      status, 
      userChoice 
    }: { 
      suggestionId: string; 
      status: 'accepted' | 'rejected' | 'modified';
      userChoice?: string;
    }) => CategoryMappingService.resolveSuggestion(suggestionId, status, userChoice),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-suggestions', data.mapping_id] });
      queryClient.invalidateQueries({ queryKey: ['category-mapping-stats'] });
      toast.success('Suggestion résolue');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== STATS ==========

export function useCategoryMappingStats() {
  return useQuery({
    queryKey: ['category-mapping-stats'],
    queryFn: () => CategoryMappingService.getStats(),
    staleTime: 60 * 1000,
  });
}

// ========== OPTIONS ==========

export function useSourceTypeOptions() {
  return CategoryMappingService.getSourceTypeOptions();
}

export function useDestinationTypeOptions() {
  return CategoryMappingService.getDestinationTypeOptions();
}
