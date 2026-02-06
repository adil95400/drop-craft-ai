/**
 * Hook SEO Audits — uses new seo_audits / seo_audit_pages / seo_issues tables
 * All mutations go through Edge Functions (jobs-first pattern)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ───────────────────────────────────────────────────

export interface SEOAudit {
  id: string;
  mode: string;
  base_url: string;
  sitemap_url?: string | null;
  status: string;
  max_urls: number;
  summary: Record<string, any>;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
}

export interface SEOAuditPage {
  id: string;
  url: string;
  page_type?: string | null;
  http_status?: number | null;
  score: number;
  title?: string | null;
  meta_description?: string | null;
  h1?: string | null;
  issues_summary: Record<string, number>;
}

export interface SEOIssue {
  id: string;
  severity: string;
  code: string;
  message: string;
  evidence: Record<string, any>;
  recommendation?: string | null;
  is_fixable: boolean;
  fix_actions: string[];
}

// ── Audits ──────────────────────────────────────────────────

export function useSEOAudits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['seo-audits'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('seo_audits' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)) as any;
      if (error) throw error;
      return (data || []) as SEOAudit[];
    },
  });

  const createAudit = useMutation({
    mutationFn: async (params: {
      mode: string;
      base_url: string;
      sitemap_url?: string;
      max_urls?: number;
      max_depth?: number;
      page_type_filters?: string[];
      url_patterns_exclude?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('seo-audit', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seo-audits'] });
      toast({
        title: 'Audit SEO lancé',
        description: `L'audit est en file d'attente (ID: ${data.audit_id?.slice(0, 8)})`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: "Impossible de lancer l'audit SEO",
        variant: 'destructive',
      });
    },
  });

  return {
    audits,
    isLoading,
    createAudit: createAudit.mutate,
    isCreating: createAudit.isPending,
  };
}

// ── Audit Detail + Pages ────────────────────────────────────

export function useSEOAuditDetail(auditId: string | null) {
  const { data: audit, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['seo-audit', auditId],
    queryFn: async () => {
      if (!auditId) return null;
      const { data, error } = await (supabase
        .from('seo_audits' as any)
        .select('*')
        .eq('id', auditId)
        .single()) as any;
      if (error) throw error;
      return data as SEOAudit;
    },
    enabled: !!auditId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' || status === 'queued' ? 3000 : false;
    },
  });

  return { audit, isLoading: isLoadingAudit };
}

export function useSEOAuditPages(auditId: string | null, options?: {
  page?: number;
  limit?: number;
  pageType?: string;
  sort?: string;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 50;

  const { data, isLoading } = useQuery({
    queryKey: ['seo-audit-pages', auditId, page, limit, options?.pageType, options?.sort],
    queryFn: async () => {
      if (!auditId) return { items: [], total: 0 };
      
      let query = (supabase
        .from('seo_audit_pages' as any)
        .select('id, url, page_type, http_status, score, issues_summary, title, meta_description, h1', { count: 'exact' })
        .eq('audit_id', auditId)) as any;

      if (options?.pageType) query = query.eq('page_type', options.pageType);

      const ascending = options?.sort === 'score_asc';
      query = query.order('score', { ascending });

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: pages, count, error } = await query;
      if (error) throw error;

      return {
        items: (pages || []) as SEOAuditPage[],
        total: count || 0,
      };
    },
    enabled: !!auditId,
  });

  return {
    pages: data?.items || [],
    total: data?.total || 0,
    isLoading,
  };
}

// ── Issues ──────────────────────────────────────────────────

export function useSEOIssues(pageId: string | null, severity?: string) {
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['seo-issues', pageId, severity],
    queryFn: async () => {
      if (!pageId) return [];
      let query = (supabase
        .from('seo_issues' as any)
        .select('*')
        .eq('page_id', pageId)) as any;

      if (severity) query = query.eq('severity', severity);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SEOIssue[];
    },
    enabled: !!pageId,
  });

  return { issues, isLoading };
}

// ── AI Generate ─────────────────────────────────────────────

export function useSEOAIGenerate() {
  const { toast } = useToast();

  const generate = useMutation({
    mutationFn: async (params: {
      type: string;
      page_id?: string;
      url?: string;
      language?: string;
      tone?: string;
      keywords?: string[];
      variants?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('seo-ai-generate', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Génération IA lancée',
        description: `Job en file d'attente (ID: ${data.generation_id?.slice(0, 8)})`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de lancer la génération IA',
        variant: 'destructive',
      });
    },
  });

  return {
    generate: generate.mutate,
    isGenerating: generate.isPending,
  };
}

// ── Fix Apply ───────────────────────────────────────────────

export function useSEOFixApply() {
  const { toast } = useToast();

  const applyFix = useMutation({
    mutationFn: async (params: {
      action: string;
      page_id?: string;
      store_id?: string;
      product_id?: string;
      payload?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('seo-fix-apply', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Fix SEO appliqué',
        description: `Job en file d'attente (ID: ${data.fix_id?.slice(0, 8)})`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: "Impossible d'appliquer le fix",
        variant: 'destructive',
      });
    },
  });

  return {
    applyFix: applyFix.mutate,
    isApplying: applyFix.isPending,
  };
}

// ── Export ───────────────────────────────────────────────────

export function useSEOExport() {
  const { toast } = useToast();

  const exportAudit = useMutation({
    mutationFn: async (params: { auditId: string; format?: string }) => {
      const { data, error } = await supabase.functions.invoke('seo-audit', {
        body: null,
        // We need a GET-like call; use query params in the function URL
      });
      
      // Fallback: fetch pages directly for CSV export
      const { data: pages } = await (supabase
        .from('seo_audit_pages' as any)
        .select('url, page_type, http_status, score, title_length, meta_description_length, images_missing_alt_count, issues_summary')
        .eq('audit_id', params.auditId)
        .order('score', { ascending: false })
        .limit(1000)) as any;

      return pages || [];
    },
    onSuccess: (pages) => {
      // Generate CSV client-side
      const headers = ['url', 'page_type', 'http_status', 'score', 'title_length', 'meta_description_length', 'images_missing_alt_count'];
      const rows = pages.map((p: any) => headers.map(h => p[h] ?? '').join(','));
      const csv = [headers.join(','), ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-audit-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Export réussi', description: 'Le rapport SEO a été exporté en CSV' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Impossible d'exporter le rapport", variant: 'destructive' });
    },
  });

  return {
    exportAudit: exportAudit.mutate,
    isExporting: exportAudit.isPending,
  };
}
