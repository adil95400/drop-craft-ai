import { useState, useCallback } from 'react';
import { LibreTranslateService } from '@/services/LibreTranslateService';
import { toast } from 'sonner';

interface TranslationState {
  isTranslating: boolean;
  progress: number;
  error: string | null;
}

interface TranslationStats {
  total: number;
  cached: number;
  translated: number;
  processingTimeMs: number;
}

export function useLibreTranslate() {
  const [state, setState] = useState<TranslationState>({
    isTranslating: false,
    progress: 0,
    error: null
  });

  const translateText = useCallback(async (
    text: string,
    targetLang: string,
    sourceLang = 'auto'
  ): Promise<string> => {
    setState({ isTranslating: true, progress: 0, error: null });
    
    try {
      const result = await LibreTranslateService.translateText(text, targetLang, sourceLang);
      setState({ isTranslating: false, progress: 100, error: null });
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Translation failed';
      setState({ isTranslating: false, progress: 0, error: errorMsg });
      toast.error('Erreur de traduction', { description: errorMsg });
      return text;
    }
  }, []);

  const translateBatch = useCallback(async (
    texts: string[],
    targetLang: string,
    sourceLang = 'auto',
    onProgress?: (progress: number) => void
  ): Promise<{ translations: string[]; stats: TranslationStats }> => {
    setState({ isTranslating: true, progress: 0, error: null });
    
    try {
      const result = await LibreTranslateService.translateBatch(texts, targetLang, sourceLang);
      
      const progress = 100;
      setState({ isTranslating: false, progress, error: null });
      onProgress?.(progress);
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Translation failed';
      setState({ isTranslating: false, progress: 0, error: errorMsg });
      toast.error('Erreur de traduction batch', { description: errorMsg });
      return {
        translations: texts,
        stats: { total: texts.length, cached: 0, translated: 0, processingTimeMs: 0 }
      };
    }
  }, []);

  const translateProduct = useCallback(async (
    product: {
      title?: string;
      description?: string;
      shortDescription?: string;
      tags?: string[];
    },
    targetLang: string,
    sourceLang = 'auto'
  ) => {
    setState({ isTranslating: true, progress: 0, error: null });
    
    try {
      const result = await LibreTranslateService.translateProduct(product, targetLang, sourceLang);
      setState({ isTranslating: false, progress: 100, error: null });
      toast.success('Produit traduit', { description: `Traduit vers ${targetLang.toUpperCase()}` });
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Translation failed';
      setState({ isTranslating: false, progress: 0, error: errorMsg });
      toast.error('Erreur de traduction produit', { description: errorMsg });
      return product;
    }
  }, []);

  const translateReviews = useCallback(async (
    reviews: Array<{ content: string; author?: string }>,
    targetLang: string,
    sourceLang = 'auto'
  ) => {
    setState({ isTranslating: true, progress: 0, error: null });
    
    try {
      const result = await LibreTranslateService.translateReviews(reviews, targetLang, sourceLang);
      setState({ isTranslating: false, progress: 100, error: null });
      toast.success('Avis traduits', { description: `${result.filter(r => r.isTranslated).length} avis traduits` });
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Translation failed';
      setState({ isTranslating: false, progress: 0, error: errorMsg });
      toast.error('Erreur de traduction avis', { description: errorMsg });
      return reviews.map(r => ({ ...r, isTranslated: false }));
    }
  }, []);

  const clearCache = useCallback(() => {
    LibreTranslateService.clearCache();
    toast.success('Cache de traduction vidé');
  }, []);

  const getSupportedLanguages = useCallback(() => {
    return LibreTranslateService.getSupportedLanguages();
  }, []);

  return {
    ...state,
    translateText,
    translateBatch,
    translateProduct,
    translateReviews,
    clearCache,
    getSupportedLanguages
  };
}
