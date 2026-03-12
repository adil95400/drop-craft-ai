import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FakeDetectionResult {
  id: string;
  fake_score: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  flags: string[];
  confidence: number;
  summary: string;
}

export interface SentimentResult {
  id: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  emotion: string;
  key_themes: string[];
  actionable_insight: string;
}

export interface AnalysisSummary {
  total_analyzed?: number;
  suspicious_count?: number;
  average_fake_score?: number;
  recommendation?: string;
  positive_pct?: number;
  neutral_pct?: number;
  negative_pct?: number;
  top_themes?: Array<{ theme: string; count: number; sentiment: string }>;
  overall_mood?: string;
  recommendations?: string[];
}

export interface TranslationResult {
  id: string;
  original_text: string;
  translated_text: string;
}

function handleError(error: unknown) {
  const msg = error instanceof Error ? error.message : 'Erreur inconnue';
  if (msg.includes('429')) toast.error('Limite IA atteinte. Réessayez dans quelques minutes.');
  else if (msg.includes('402')) toast.error('Crédits IA épuisés.');
  else toast.error(msg);
}

export function useFakeDetection() {
  return useMutation({
    mutationFn: async (reviewIds?: string[]) => {
      const { data, error } = await supabase.functions.invoke('ai-review-analysis', {
        body: { action: 'fake_detection', review_ids: reviewIds },
      });
      if (error) throw error;
      return data as { reviews: FakeDetectionResult[]; summary: AnalysisSummary };
    },
    onSuccess: () => toast.success('Analyse de détection terminée'),
    onError: handleError,
  });
}

export function useSentimentAnalysis() {
  return useMutation({
    mutationFn: async (reviewIds?: string[]) => {
      const { data, error } = await supabase.functions.invoke('ai-review-analysis', {
        body: { action: 'sentiment_analysis', review_ids: reviewIds },
      });
      if (error) throw error;
      return data as { reviews: SentimentResult[]; summary: AnalysisSummary };
    },
    onSuccess: () => toast.success('Analyse de sentiment terminée'),
    onError: handleError,
  });
}

export function useReviewTranslation() {
  return useMutation({
    mutationFn: async (params: { reviewIds?: string[]; targetLanguage: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-review-analysis', {
        body: { action: 'translate', review_ids: params.reviewIds, target_language: params.targetLanguage },
      });
      if (error) throw error;
      return data as { reviews: TranslationResult[] };
    },
    onSuccess: () => toast.success('Traduction terminée'),
    onError: handleError,
  });
}
