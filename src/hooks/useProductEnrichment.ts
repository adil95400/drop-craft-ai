import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctionUrl } from '@/lib/supabase-env';
import { useToast } from '@/hooks/use-toast';

interface EnrichmentData {
  id: string;
  product_id: string;
  source: string;
  source_url?: string;
  matched_via: string;
  raw_title?: string;
  raw_description?: string;
  raw_images?: string[];
  raw_price?: number;
  raw_currency?: string;
  raw_rating?: number;
  raw_reviews_count?: number;
  raw_attributes?: Record<string, any>;
  ai_output?: Record<string, any>;
  enrichment_status: string;
  last_fetch_at?: string;
  created_at: string;
}

export function useProductEnrichment(productId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch enrichments for a product
  const { data: enrichments, isLoading, refetch } = useQuery({
    queryKey: ['product-enrichment', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_enrichment')
        .select('*')
        .eq('product_id', productId)
        .order('last_fetch_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as EnrichmentData[];
    },
    enabled: !!productId,
  });

  // Enrich product mutation
  const enrichMutation = useMutation({
    mutationFn: async ({ 
      productIds, 
      sources = ['amazon', 'aliexpress'] 
    }: { 
      productIds: string[]; 
      sources?: string[] 
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        edgeFunctionUrl('enrich-product'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product_ids: productIds, sources }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Enrichment failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-enrichment'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Enrichissement réussi',
        description: 'Les données ont été récupérées',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // AI enrichment mutation
  const aiEnrichMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        edgeFunctionUrl('enrich-product-ai'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product_id: productId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI enrichment failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-enrichment'] });
      toast({
        title: 'Optimisation IA terminée',
        description: 'Le contenu a été généré',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur IA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Apply enrichment mutation
  const applyEnrichmentMutation = useMutation({
    mutationFn: async ({ 
      enrichmentId, 
      productId 
    }: { 
      enrichmentId: string; 
      productId: string 
    }) => {
      // Get the enrichment data
      const { data: enrichment, error: fetchError } = await supabase
        .from('product_enrichment')
        .select('*')
        .eq('id', enrichmentId)
        .single();

      if (fetchError || !enrichment) throw new Error('Enrichment not found');

      const aiOutput = (enrichment as any).ai_output;
      if (!aiOutput) throw new Error('No AI output available');

      // Update product
      const updateData: Record<string, any> = {
        enrichment_status: 'success',
        last_enriched_at: new Date().toISOString(),
      };

      if (aiOutput.optimized_title) updateData.name = aiOutput.optimized_title;
      if (aiOutput.optimized_description) updateData.description = aiOutput.optimized_description;
      if (aiOutput.meta_title) updateData.seo_title = aiOutput.meta_title;
      if (aiOutput.meta_description) updateData.seo_description = aiOutput.meta_description;
      if (aiOutput.seo_tags) updateData.tags = aiOutput.seo_tags;

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (updateError) throw updateError;

      // Mark enrichment as applied
      await supabase
        .from('product_enrichment')
        .update({
          enrichment_status: 'applied',
          applied_at: new Date().toISOString(),
        })
        .eq('id', enrichmentId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-enrichment'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Améliorations appliquées',
        description: 'Le produit a été mis à jour',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    enrichments,
    isLoading,
    refetch,
    enrich: enrichMutation.mutate,
    isEnriching: enrichMutation.isPending,
    enrichAI: aiEnrichMutation.mutate,
    isEnrichingAI: aiEnrichMutation.isPending,
    applyEnrichment: applyEnrichmentMutation.mutate,
    isApplying: applyEnrichmentMutation.isPending,
  };
}
