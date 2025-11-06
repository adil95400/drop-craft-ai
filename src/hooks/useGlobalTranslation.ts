import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentTypeStats {
  total: number;
  translated: number;
  untranslated: number;
}

interface AuditResults {
  products: ContentTypeStats;
  pages: ContentTypeStats;
  blog: ContentTypeStats;
  categories: ContentTypeStats;
  targetLocales: string[];
}

export const useGlobalTranslation = () => {
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const { toast } = useToast();

  const auditTranslations = async (targetLocales: string[]) => {
    setIsAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke('global-translation-optimizer', {
        body: { action: 'audit', targetLocales }
      });

      if (error) throw error;

      setAuditResults(data.results);
      toast({
        title: "Audit terminé",
        description: `${data.results.products.untranslated + data.results.pages.untranslated + data.results.blog.untranslated + data.results.categories.untranslated} contenus nécessitent une traduction`,
      });
    } catch (error: any) {
      console.error('Audit error:', error);
      toast({
        title: "Erreur d'audit",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const optimizeTranslations = async (targetLocales: string[]) => {
    setIsOptimizing(true);
    setOptimizationProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOptimizationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 1000);

      const { data, error } = await supabase.functions.invoke('global-translation-optimizer', {
        body: { action: 'optimize', targetLocales }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      setOptimizationProgress(100);
      
      toast({
        title: "Traductions terminées",
        description: `${data.stats.totalTranslated} contenus traduits avec succès en ${targetLocales.length} langue(s)`,
      });

      // Refresh audit
      setTimeout(() => {
        auditTranslations(targetLocales);
        setOptimizationProgress(0);
      }, 1500);

    } catch (error: any) {
      console.error('Optimization error:', error);
      toast({
        title: "Erreur d'optimisation",
        description: error.message,
        variant: "destructive",
      });
      setOptimizationProgress(0);
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    auditResults,
    isAuditing,
    isOptimizing,
    optimizationProgress,
    auditTranslations,
    optimizeTranslations,
  };
};
