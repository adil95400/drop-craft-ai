/**
 * Hook pour gérer les mots-clés SEO
 * Suivi, recherche et analyse
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seoAnalyticsService, TrackedKeyword, KeywordResearchResult } from '@/services/seo/SEOAnalyticsService';
import { useToast } from '@/hooks/use-toast';

export function useSEOKeywords() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer les mots-clés suivis
  const { data: trackedKeywords = [], isLoading: isLoadingKeywords, refetch } = useQuery({
    queryKey: ['seo-tracked-keywords'],
    queryFn: () => seoAnalyticsService.getTrackedKeywords(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Ajouter un mot-clé
  const addKeywordMutation = useMutation({
    mutationFn: ({ keyword, url }: { keyword: string; url: string }) =>
      seoAnalyticsService.addTrackedKeyword(keyword, url),
    onSuccess: (newKeyword) => {
      queryClient.setQueryData<TrackedKeyword[]>(['seo-tracked-keywords'], (old = []) => [
        ...old,
        newKeyword
      ]);
      toast({
        title: "Mot-clé ajouté",
        description: `"${newKeyword.keyword}" est maintenant suivi`
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le mot-clé",
        variant: "destructive"
      });
    }
  });

  // Supprimer un mot-clé
  const removeKeywordMutation = useMutation({
    mutationFn: (keywordId: string) => seoAnalyticsService.removeTrackedKeyword(keywordId),
    onSuccess: (_, keywordId) => {
      queryClient.setQueryData<TrackedKeyword[]>(['seo-tracked-keywords'], (old = []) =>
        old.filter(k => k.id !== keywordId)
      );
      toast({
        title: "Mot-clé supprimé",
        description: "Le mot-clé n'est plus suivi"
      });
    }
  });

  // Actualiser les positions
  const refreshMutation = useMutation({
    mutationFn: () => seoAnalyticsService.refreshPositions(),
    onSuccess: (updatedKeywords) => {
      queryClient.setQueryData(['seo-tracked-keywords'], updatedKeywords);
      toast({
        title: "Positions mises à jour",
        description: `${updatedKeywords.length} mots-clés actualisés`
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les positions",
        variant: "destructive"
      });
    }
  });

  // Statistiques
  const stats = {
    total: trackedKeywords.length,
    avgPosition: trackedKeywords.length > 0
      ? Math.round(trackedKeywords.reduce((sum, k) => sum + (k.currentPosition || 0), 0) / trackedKeywords.length)
      : 0,
    top10: trackedKeywords.filter(k => (k.currentPosition || 100) <= 10).length,
    improving: trackedKeywords.filter(k => k.change && k.change > 0).length
  };

  return {
    trackedKeywords,
    isLoading: isLoadingKeywords,
    stats,
    addKeyword: addKeywordMutation.mutate,
    isAdding: addKeywordMutation.isPending,
    removeKeyword: removeKeywordMutation.mutate,
    refreshPositions: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
    refetch
  };
}

export function useKeywordResearch() {
  const [results, setResults] = useState<KeywordResearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchKeywords = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      toast({
        title: "Mot-clé requis",
        description: "Veuillez saisir un mot-clé à analyser",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const data = await seoAnalyticsService.searchKeywords(keyword);
      setResults(data);
      toast({
        title: "Recherche terminée",
        description: `${data.length} mots-clés trouvés`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les mots-clés",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    isSearching,
    searchKeywords,
    clearResults
  };
}

export function useSEOContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    metaDescription: string;
    h1: string;
    keywords: string[];
    content: string;
  } | null>(null);
  const { toast } = useToast();

  const generateContent = useCallback(async (keyword: string, contentType: string = 'product') => {
    if (!keyword.trim()) {
      toast({
        title: "Mot-clé requis",
        description: "Veuillez saisir un mot-clé",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const content = await seoAnalyticsService.generateSEOContent(keyword, contentType);
      setGeneratedContent(content);
      toast({
        title: "Contenu généré",
        description: "Votre contenu SEO optimisé est prêt"
      });
      return content;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le contenu",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const clearContent = useCallback(() => {
    setGeneratedContent(null);
  }, []);

  return {
    generatedContent,
    isGenerating,
    generateContent,
    clearContent
  };
}
