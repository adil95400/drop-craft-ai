import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnrichmentOptions {
  language?: string;
  tone?: string;
}

export function useAIEnrichment() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const enrichProducts = async (productIds: string[], options?: EnrichmentOptions) => {
    if (productIds.length === 0) {
      toast.error('Aucun produit sélectionné');
      return null;
    }

    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-enrich-import', {
        body: {
          product_ids: productIds,
          language: options?.language || 'fr',
          tone: options?.tone || 'professionnel',
        },
      });

      if (error) throw error;

      if (data?.job_id) {
        setJobId(data.job_id);
        toast.success('Enrichissement IA démarré', {
          description: `${productIds.length} produit(s) en cours de traitement`,
        });
        return data.job_id;
      }

      throw new Error(data?.error || 'Erreur inconnue');
    } catch (err: any) {
      console.error('[useAIEnrichment] error:', err);
      toast.error("Erreur d'enrichissement IA", {
        description: err.message || 'Impossible de démarrer l\'enrichissement',
      });
      return null;
    } finally {
      setIsEnriching(false);
    }
  };

  return { enrichProducts, isEnriching, jobId };
}
