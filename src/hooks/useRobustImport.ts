/**
 * useRobustImport — Hook for the robust import pipeline (P5)
 * Provides real-time job tracking, per-item status, and granular retry
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase-env';

const PIPELINE_URL = `${SUPABASE_URL}/functions/v1/robust-import-pipeline`;

async function pipelineRequest(action: string, body: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Non authentifié');

  const resp = await fetch(PIPELINE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, ...body }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.success) throw new Error(data.error || 'Pipeline error');
  return data;
}

export interface PipelineJobStatus {
  job_id: string;
  status: string;
  created_at: string;
  started_at: string;
  completed_at: string | null;
  progress_percent: number;
  stats: {
    total: number;
    pending: number;
    success: number;
    failed: number;
    retrying: number;
  };
  metadata: any;
}

export interface PipelineJobItem {
  id: string;
  line_number: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  product_id: string | null;
  error_message: string | null;
  error_code: string | null;
  retry_count: number;
  raw_data: any;
  processed_at: string | null;
}

// Start a new import
export function useStartImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, source }: { items: any[]; source: string }) => {
      return pipelineRequest('start', { items, source });
    },
    onSuccess: (data) => {
      toast.success(`Import démarré: ${data.total} produits en traitement`);
      queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] });
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });
}

// Track job status with polling
export function usePipelineJobStatus(jobId: string | null) {
  return useQuery<PipelineJobStatus | null>({
    queryKey: ['pipeline-job-status', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const data = await pipelineRequest('get_status', { job_id: jobId });
      return data as PipelineJobStatus;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 2000; // Poll every 2s while processing
    },
  });
}

// Get job items with pagination and filtering
export function usePipelineJobItems(jobId: string | null, page = 1, perPage = 50, statusFilter = 'all') {
  return useQuery({
    queryKey: ['pipeline-job-items', jobId, page, perPage, statusFilter],
    queryFn: async () => {
      if (!jobId) return { items: [], meta: { page: 1, per_page: 50, total: 0 } };
      return pipelineRequest('get_items', {
        job_id: jobId,
        page,
        per_page: perPage,
        status_filter: statusFilter,
      });
    },
    enabled: !!jobId,
    refetchInterval: 5000,
  });
}

// Retry failed items
export function useRetryItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, itemIds, retryAllFailed }: {
      jobId: string;
      itemIds?: string[];
      retryAllFailed?: boolean;
    }) => {
      return pipelineRequest('retry_items', {
        job_id: jobId,
        item_ids: itemIds,
        retry_all_failed: retryAllFailed,
      });
    },
    onSuccess: (data) => {
      toast.success(`${data.retried} élément(s) relancé(s)`);
      queryClient.invalidateQueries({ queryKey: ['pipeline-job-status'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-job-items'] });
    },
    onError: (err: Error) => toast.error(`Erreur retry: ${err.message}`),
  });
}
