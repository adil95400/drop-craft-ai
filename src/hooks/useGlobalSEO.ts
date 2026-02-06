import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';
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

const SITE_PAGES = [
  '/', '/features', '/pricing', '/blog', '/contact', '/about',
  '/documentation', '/faq', '/dashboard', '/products',
  '/suppliers', '/orders', '/customers', '/analytics', '/integrations'
];

export function useGlobalSEO() {
  const [scanResults, setScanResults] = useState<PageScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({ current: 0, total: 0, message: '' });
  const [optimizeProgress, setOptimizeProgress] = useState<ScanProgress>({ current: 0, total: 0, message: '' });
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await shopOptiApi.request<PageScanResult[]>('/seo/scan', {
        method: 'POST',
        body: { pages: SITE_PAGES }
      });
      return res.data || [];
    },
    onSuccess: (results) => {
      setScanResults(results);
      const totalIssues = results.reduce((acc, page) => acc + page.issues.length, 0);
      toast.success('Scan terminé!', { description: `${results.length} pages scannées, ${totalIssues} problèmes détectés` });
      setScanProgress({ current: 0, total: 0, message: '' });
    },
    onError: (error) => {
      toast.error('Erreur lors du scan', { description: error instanceof Error ? error.message : 'Une erreur est survenue' });
      setScanProgress({ current: 0, total: 0, message: '' });
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: async (language: 'fr' | 'en' | 'es') => {
      const res = await shopOptiApi.request<PageScanResult[]>('/seo/optimize-all', {
        method: 'POST',
        body: { language, pages: scanResults }
      });
      return res.data || scanResults;
    },
    onSuccess: (results) => {
      setScanResults(results);
      toast.success('Optimisation terminée!', { description: 'Toutes les pages ont été optimisées avec l\'IA' });
      setOptimizeProgress({ current: 0, total: 0, message: '' });
      queryClient.invalidateQueries({ queryKey: ['site-health'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'optimisation', { description: error instanceof Error ? error.message : 'Une erreur est survenue' });
      setOptimizeProgress({ current: 0, total: 0, message: '' });
    }
  });

  const sitemapMutation = useMutation({
    mutationFn: async () => {
      const res = await shopOptiApi.request<{ sitemap: string }>('/seo/sitemap', {
        method: 'POST',
        body: { pages: SITE_PAGES }
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.sitemap) {
        const blob = new Blob([data.sitemap], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      toast.success('Sitemap généré!', { description: 'Le fichier sitemap.xml a été téléchargé' });
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération du sitemap', { description: error instanceof Error ? error.message : 'Une erreur est survenue' });
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
