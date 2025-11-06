import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  status: string;
  category: string;
  seoScore: number;
  issues: Array<{
    severity: string;
    message: string;
  }>;
}

interface AuditResults {
  totalPosts: number;
  optimizedPosts: number;
  averageSeoScore: number;
  posts: BlogPost[];
  issues: Array<{
    severity: string;
    type: string;
    message: string;
  }>;
}

interface GenerationConfig {
  topic: string;
  keywords: string;
  category: string;
  tone: string;
  length: string;
  targetLanguages: string[];
}

interface ScheduleConfig {
  frequency: string;
  startDate: string;
  timeSlot: string;
}

export const useGlobalBlogOptimization = () => {
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const auditBlogContent = async () => {
    setIsAuditing(true);
    toast({
      title: "Audit en cours",
      description: "Analyse de tous les articles de blog...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('global-blog-optimizer', {
        body: { action: 'audit' }
      });

      if (error) throw error;

      setAuditResults(data);
      
      toast({
        title: "Audit terminé",
        description: `${data.totalPosts} articles analysés avec un score SEO moyen de ${data.averageSeoScore}%`,
      });
    } catch (error) {
      console.error('Audit error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'audit",
        variant: "destructive"
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const generateBlogPost = async (config: GenerationConfig) => {
    setIsGenerating(true);
    toast({
      title: "Génération IA",
      description: "Création de votre article de blog...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('global-blog-optimizer', {
        body: { 
          action: 'generate',
          config 
        }
      });

      if (error) throw error;

      toast({
        title: "Article généré !",
        description: `"${data.title}" a été créé et sauvegardé en brouillon`,
      });

      // Refresh audit results
      if (auditResults) {
        await auditBlogContent();
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'article",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const schedulePosts = async (config: ScheduleConfig) => {
    toast({
      title: "Planification configurée",
      description: `Publications ${config.frequency} à partir du ${config.startDate}`,
    });

    try {
      const { data, error } = await supabase.functions.invoke('global-blog-optimizer', {
        body: { 
          action: 'schedule',
          config 
        }
      });

      if (error) throw error;

      toast({
        title: "Planification activée",
        description: `${data.scheduledCount} articles planifiés`,
      });
    } catch (error) {
      console.error('Schedule error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de configurer la planification",
        variant: "destructive"
      });
    }
  };

  return {
    auditResults,
    isAuditing,
    isGenerating,
    auditBlogContent,
    generateBlogPost,
    schedulePosts
  };
};
