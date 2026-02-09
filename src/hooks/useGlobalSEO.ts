/**
 * useGlobalSEO — Global SEO scan & optimize via API V1
 * Zero direct DB/Edge Function access. All through /v1/seo/*
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { seoApi, type SeoAuditSummary } from '@/services/api/seoApi';

export interface SEOIssue { type: string; severity: 'critical' | 'warning' | 'info'; message: string; recommendation?: string; }
export interface PageScanResult { url: string; title: string; metaDescription: string; h1: string; score: number; issues: SEOIssue[]; audit_id?: string; optimized?: { title?: string; metaDescription?: string; h1?: string; keywords?: string[]; }; }
export interface ScanProgress { current: number; total: number; message: string; }

const SITE_PAGES = ['/', '/features', '/pricing', '/blog', '/contact', '/about', '/documentation', '/faq', '/dashboard', '/products', '/suppliers', '/orders', '/customers', '/analytics', '/integrations'];

export function useGlobalSEO() {
  const [scanResults, setScanResults] = useState<PageScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({ current: 0, total: 0, message: '' });
  const [optimizeProgress, setOptimizeProgress] = useState<ScanProgress>({ current: 0, total: 0, message: '' });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const baseUrl = window.location.origin;
      const results: PageScanResult[] = [];
      setScanProgress({ current: 0, total: SITE_PAGES.length, message: 'Lancement des audits SEO...' });

      for (let i = 0; i < SITE_PAGES.length; i++) {
        const page = SITE_PAGES[i];
        setScanProgress({ current: i + 1, total: SITE_PAGES.length, message: `Audit ${page}...` });

        try {
          const resp = await seoApi.audit({
            url: `${baseUrl}${page}`,
            scope: 'url',
            language: 'fr',
          });

          results.push({
            url: page,
            title: `Page: ${page}`,
            metaDescription: '',
            h1: '',
            score: 0,
            issues: [],
            audit_id: resp.audit_id,
          });
        } catch {
          results.push({
            url: page,
            title: `Page: ${page}`,
            metaDescription: '',
            h1: '',
            score: 0,
            issues: [{ type: 'error', severity: 'critical', message: 'Erreur lors de l\'audit' }],
          });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      setScanResults(results);
      toast.success('Audits SEO lancés!', { description: `${results.length} pages soumises à l'analyse IA` });
      setScanProgress({ current: 0, total: 0, message: '' });
    },
    onError: (error) => {
      toast.error('Erreur lors du scan', { description: error instanceof Error ? error.message : 'Erreur' });
      setScanProgress({ current: 0, total: 0, message: '' });
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async (language: 'fr' | 'en' | 'es') => {
      if (scanResults.length === 0) throw new Error('Lancez un scan avant d\'optimiser');
      const results: PageScanResult[] = [];
      setOptimizeProgress({ current: 0, total: scanResults.length, message: 'Optimisation IA...' });

      for (let i = 0; i < scanResults.length; i++) {
        const page = scanResults[i];
        setOptimizeProgress({ current: i + 1, total: scanResults.length, message: `Optimisation ${page.url}...` });

        if (!page.audit_id) {
          results.push(page);
          continue;
        }

        try {
          // Fetch the completed audit to get the score and issues
          const audit = await seoApi.getAudit(page.audit_id);
          const mappedIssues: SEOIssue[] = (audit.issues ?? [])
            .filter((i) => i.status !== 'pass')
            .map((i) => ({
              type: i.check_type,
              severity: i.impact === 'critical' ? 'critical' : i.status === 'fail' ? 'warning' : 'info',
              message: i.recommendation ?? i.check_type,
              recommendation: i.recommendation,
            }));

          results.push({
            ...page,
            score: audit.score ?? 0,
            issues: mappedIssues,
          });
        } catch {
          results.push(page);
        }
      }
      return results;
    },
    onSuccess: (results) => {
      setScanResults(results);
      setOptimizeProgress({ current: 0, total: 0, message: '' });
      toast.success('Résultats récupérés!', { description: `${results.length} pages analysées par IA` });
    },
    onError: (error) => {
      setOptimizeProgress({ current: 0, total: 0, message: '' });
      toast.error('Erreur', { description: error instanceof Error ? error.message : 'Erreur' });
    },
  });

  const sitemapMutation = useMutation({
    mutationFn: async () => {
      const baseUrl = window.location.origin;
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SITE_PAGES.map(p => `  <url><loc>${baseUrl}${p}</loc></url>`).join('\n')}\n</urlset>`;
      const blob = new Blob([sitemap], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'sitemap.xml';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    },
    onSuccess: () => toast.success('Sitemap généré!'),
  });

  return {
    pages: SITE_PAGES, scanResults,
    isScanning: scanMutation.isPending, isOptimizing: optimizeMutation.isPending,
    isGeneratingSitemap: sitemapMutation.isPending, scanProgress, optimizeProgress,
    scanAllPages: scanMutation.mutate, optimizeAllPages: optimizeMutation.mutate,
    generateSitemap: sitemapMutation.mutate,
  };
}
