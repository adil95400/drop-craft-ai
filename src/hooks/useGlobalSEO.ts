import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SEOIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation?: string;
}

export interface PageScanResult {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  score: number;
  issues: SEOIssue[];
  optimized?: {
    title?: string;
    metaDescription?: string;
    h1?: string;
    keywords?: string[];
  };
}

export interface ScanProgress {
  current: number;
  total: number;
  message: string;
}

// Liste des pages principales à scanner
const SITE_PAGES = [
  '/',
  '/features',
  '/pricing',
  '/blog',
  '/contact',
  '/about',
  '/documentation',
  '/faq',
  '/dashboard',
  '/products',
  '/suppliers',
  '/orders',
  '/customers',
  '/analytics',
  '/integrations'
];

export function useGlobalSEO() {
  const [scanResults, setScanResults] = useState<PageScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    current: 0,
    total: 0,
    message: ''
  });
  const [optimizeProgress, setOptimizeProgress] = useState<ScanProgress>({
    current: 0,
    total: 0,
    message: ''
  });
  const queryClient = useQueryClient();

  // Scan all pages
  const scanMutation = useMutation({
    mutationFn: async () => {
      const results: PageScanResult[] = [];
      
      setScanProgress({
        current: 0,
        total: SITE_PAGES.length,
        message: 'Démarrage du scan...'
      });

      for (let i = 0; i < SITE_PAGES.length; i++) {
        const page = SITE_PAGES[i];
        setScanProgress({
          current: i + 1,
          total: SITE_PAGES.length,
          message: `Scan de ${page}...`
        });

        try {
          const { data, error } = await supabase.functions.invoke('global-seo-scanner', {
            body: { url: page, action: 'scan' }
          });

          if (error) throw error;
          results.push(data);
        } catch (error) {
          console.error(`Error scanning ${page}:`, error);
          // Add a basic result even if scan fails
          results.push({
            url: page,
            title: '',
            metaDescription: '',
            h1: '',
            score: 0,
            issues: [
              {
                type: 'Erreur de scan',
                severity: 'critical',
                message: 'Impossible de scanner cette page'
              }
            ]
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return results;
    },
    onSuccess: (results) => {
      setScanResults(results);
      const totalIssues = results.reduce((acc, page) => acc + page.issues.length, 0);
      toast.success(
        `Scan terminé!`,
        { description: `${results.length} pages scannées, ${totalIssues} problèmes détectés` }
      );
      setScanProgress({ current: 0, total: 0, message: '' });
    },
    onError: (error) => {
      toast.error('Erreur lors du scan', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
      setScanProgress({ current: 0, total: 0, message: '' });
    }
  });

  // Optimize all pages with AI
  const optimizeMutation = useMutation({
    mutationFn: async (language: 'fr' | 'en' | 'es') => {
      const optimizedResults = [...scanResults];
      
      setOptimizeProgress({
        current: 0,
        total: scanResults.length,
        message: 'Démarrage de l\'optimisation IA...'
      });

      for (let i = 0; i < scanResults.length; i++) {
        const page = scanResults[i];
        setOptimizeProgress({
          current: i + 1,
          total: scanResults.length,
          message: `Optimisation de ${page.url}...`
        });

        try {
          const { data, error } = await supabase.functions.invoke('global-seo-scanner', {
            body: { 
              url: page.url,
              action: 'optimize',
              language,
              currentTitle: page.title,
              currentDescription: page.metaDescription,
              currentH1: page.h1,
              issues: page.issues
            }
          });

          if (error) throw error;
          
          optimizedResults[i] = {
            ...optimizedResults[i],
            optimized: data.optimized
          };
        } catch (error) {
          console.error(`Error optimizing ${page.url}:`, error);
        }

        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return optimizedResults;
    },
    onSuccess: (results) => {
      setScanResults(results);
      toast.success(
        'Optimisation terminée!',
        { description: 'Toutes les pages ont été optimisées avec l\'IA' }
      );
      setOptimizeProgress({ current: 0, total: 0, message: '' });
      queryClient.invalidateQueries({ queryKey: ['site-health'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'optimisation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
      setOptimizeProgress({ current: 0, total: 0, message: '' });
    }
  });

  // Generate sitemap
  const sitemapMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('global-seo-scanner', {
        body: { 
          action: 'generate_sitemap',
          pages: SITE_PAGES
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Download sitemap
      const blob = new Blob([data.sitemap], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Sitemap généré!', {
        description: 'Le fichier sitemap.xml a été téléchargé'
      });
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération du sitemap', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    }
  });

  return {
    pages: SITE_PAGES,
    scanResults,
    isScanning: scanMutation.isPending,
    isOptimizing: optimizeMutation.isPending,
    isGeneratingSitemap: sitemapMutation.isPending,
    scanProgress,
    optimizeProgress,
    scanAllPages: scanMutation.mutate,
    optimizeAllPages: optimizeMutation.mutate,
    generateSitemap: sitemapMutation.mutate
  };
}
