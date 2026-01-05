/**
 * Variant Mapping Hooks
 * React Query hooks pour la gestion des mappings de variantes
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  VariantMappingService, 
  CreateMappingInput, 
  CreateRuleInput,
  VariantMapping,
  VariantMappingRule,
  VariantMappingTemplate
} from '@/services/VariantMappingService';

// ========== MAPPINGS ==========

export function useVariantMappings(filters?: { 
  supplier_id?: string; 
  product_id?: string;
  option_type?: string;
}) {
  return useQuery({
    queryKey: ['variant-mappings', filters],
    queryFn: () => VariantMappingService.getMappings(filters),
    staleTime: 30 * 1000,
  });
}

export function useCreateVariantMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMappingInput) => 
      VariantMappingService.createMapping(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-stats'] });
      toast.success('Mapping créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useCreateBulkMappings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mappings: CreateMappingInput[]) => 
      VariantMappingService.createBulkMappings(mappings),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variant-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-stats'] });
      toast.success(`${data.length} mappings créés`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateVariantMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateMappingInput> }) => 
      VariantMappingService.updateMapping(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-mappings'] });
      toast.success('Mapping mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteVariantMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VariantMappingService.deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-stats'] });
      toast.success('Mapping supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteBulkMappings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => VariantMappingService.deleteBulkMappings(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['variant-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-stats'] });
      toast.success(`${ids.length} mappings supprimés`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== RULES ==========

export function useVariantMappingRules(supplier_id?: string) {
  return useQuery({
    queryKey: ['variant-mapping-rules', supplier_id],
    queryFn: () => VariantMappingService.getRules(supplier_id),
    staleTime: 30 * 1000,
  });
}

export function useCreateMappingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRuleInput) => 
      VariantMappingService.createRule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-rules'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-stats'] });
      toast.success('Règle créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateMappingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateRuleInput> }) => 
      VariantMappingService.updateRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteMappingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VariantMappingService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-rules'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-stats'] });
      toast.success('Règle supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== TEMPLATES ==========

export function useVariantMappingTemplates() {
  return useQuery({
    queryKey: ['variant-mapping-templates'],
    queryFn: () => VariantMappingService.getTemplates(),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });
}

export function useApplyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      templateId, 
      supplier_id, 
      product_id 
    }: { 
      templateId: string; 
      supplier_id?: string; 
      product_id?: string;
    }) => VariantMappingService.applyTemplate(templateId, supplier_id, product_id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variant-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-stats'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-templates'] });
      toast.success(`Template appliqué: ${data.length} mappings créés`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      option_type: string;
      mappings: { source: string; target: string }[];
    }) => VariantMappingService.createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-templates'] });
      toast.success('Template créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== STATS ==========

export function useVariantMappingStats() {
  return useQuery({
    queryKey: ['variant-mapping-stats'],
    queryFn: () => VariantMappingService.getStats(),
    staleTime: 60 * 1000,
  });
}

// ========== AUTO-MAP ==========

export function useAutoMapVariant() {
  return useMutation({
    mutationFn: ({ 
      sourceOptionName, 
      sourceOptionValue, 
      supplier_id 
    }: { 
      sourceOptionName: string; 
      sourceOptionValue: string; 
      supplier_id?: string;
    }) => VariantMappingService.autoMapVariant(sourceOptionName, sourceOptionValue, supplier_id),
  });
}
