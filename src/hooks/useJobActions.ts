/**
 * useJobActions — Mutations for retry, resume, and enrich operations on jobs.
 * Wired to the API V1 client (importJobsApi).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importJobsApi } from '@/services/api/client';
import { toast } from 'sonner';

export function useJobActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['import-jobs-real'] });
    queryClient.invalidateQueries({ queryKey: ['import-stats-real'] });
  };

  const retryJob = useMutation({
    mutationFn: (jobId: string) => importJobsApi.retry(jobId),
    onSuccess: (data) => {
      toast.success('Job relancé', {
        description: `Nouveau job créé: ${data?.job_id?.slice(0, 8) ?? ''}…`,
      });
      invalidate();
    },
    onError: () => toast.error('Impossible de relancer le job'),
  });

  const resumeJob = useMutation({
    mutationFn: (jobId: string) => importJobsApi.resume(jobId),
    onSuccess: (data) => {
      toast.success('Job repris', {
        description: `${data?.remaining ?? 0} élément(s) en attente`,
      });
      invalidate();
    },
    onError: () => toast.error('Impossible de reprendre le job'),
  });

  const enrichJob = useMutation({
    mutationFn: (jobId: string) => importJobsApi.enrich(jobId),
    onSuccess: (data) => {
      toast.success('Enrichissement IA lancé', {
        description: `${data?.products_count ?? 0} produit(s) en cours d'enrichissement`,
      });
      invalidate();
    },
    onError: () => toast.error('Impossible de lancer l\'enrichissement'),
  });

  return {
    retryJob: retryJob.mutate,
    isRetrying: retryJob.isPending,
    resumeJob: resumeJob.mutate,
    isResuming: resumeJob.isPending,
    enrichJob: enrichJob.mutate,
    isEnriching: enrichJob.isPending,
  };
}
