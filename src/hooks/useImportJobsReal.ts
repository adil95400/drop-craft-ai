/**
 * useImportJobsReal — Import jobs hook using API V1 client
 * Migrated from direct Supabase queries to centralized REST API
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { importJobsApi } from '@/services/api/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ImportJob {
  id: string;
  user_id: string;
  job_type: string;
  supplier_id?: string;
  product_ids?: string[];
  import_settings?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_products: number;
  processed_products: number;
  successful_imports: number;
  failed_imports: number;
  progress_percentage?: number;
  error_log?: any[];
  result_data?: any;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  source_platform?: string;
  source_url?: string;
}

export function useImportJobsReal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['import-jobs-real', user?.id],
    queryFn: async () => {
      const resp = await importJobsApi.list({ per_page: 50 });
      return resp.items.map((item: any) => ({
        id: item.job_id || item.id,
        user_id: user?.id || '',
        job_type: item.job_type || item.source,
        status: item.status,
        total_products: item.progress?.total ?? item.items_total ?? 0,
        processed_products: item.progress?.processed ?? item.items_processed ?? 0,
        successful_imports: item.progress?.success ?? item.items_succeeded ?? 0,
        failed_imports: item.progress?.failed ?? item.items_failed ?? 0,
        progress_percentage: item.progress?.percent ?? 0,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
        started_at: item.started_at,
        completed_at: item.completed_at,
      })) as ImportJob[];
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  const createJob = useMutation({
    mutationFn: async (jobData: Partial<ImportJob>) => {
      return importJobsApi.create({
        source: jobData.job_type || 'single',
        supplier_id: jobData.supplier_id,
        settings: jobData.import_settings,
      });
    },
    onSuccess: () => {
      toast.success('Job d\'import créé');
      queryClient.invalidateQueries({ queryKey: ['import-jobs-real'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du job');
      console.error(error);
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      await importJobsApi.cancel(jobId);
    },
    onSuccess: () => {
      toast.success('Job supprimé');
      queryClient.invalidateQueries({ queryKey: ['import-jobs-real'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    totalProcessed: jobs.reduce((sum, j) => sum + (j.processed_products || 0), 0),
    totalSuccess: jobs.reduce((sum, j) => sum + (j.successful_imports || 0), 0),
    totalFailed: jobs.reduce((sum, j) => sum + (j.failed_imports || 0), 0),
    successRate: jobs.length > 0
      ? (jobs.reduce((sum, j) => sum + (j.successful_imports || 0), 0) /
         Math.max(1, jobs.reduce((sum, j) => sum + (j.processed_products || 0), 0)) * 100)
      : 0,
  };

  return {
    jobs,
    stats,
    isLoading,
    error,
    createJob: createJob.mutate,
    isCreating: createJob.isPending,
    deleteJob: deleteJob.mutate,
    isDeleting: deleteJob.isPending,
  };
}

// Hook for real-time import stats
export function useImportStatsReal() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['import-stats-real', user?.id],
    queryFn: async () => {
      // Fetch recent jobs via API V1
      const resp = await importJobsApi.list({ per_page: 100 });
      const allJobs = resp.items || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayJobs = allJobs.filter((j: any) => new Date(j.created_at) >= today);

      const totalImportsToday = todayJobs.reduce((sum: number, j: any) =>
        sum + (j.progress?.success ?? j.items_succeeded ?? 0), 0);
      const totalProcessed = allJobs.reduce((sum: number, j: any) =>
        sum + (j.progress?.success ?? j.items_succeeded ?? j.progress?.total ?? 0), 0);
      const totalSuccess = allJobs.reduce((sum: number, j: any) =>
        sum + (j.progress?.success ?? j.items_succeeded ?? 0), 0);
      const successRate = totalProcessed > 0 ? (totalSuccess / totalProcessed) * 100 : 0;

      const sourceDistribution: Record<string, number> = {};
      todayJobs.forEach((job: any) => {
        const source = job.job_type || job.source || 'unknown';
        sourceDistribution[source] = (sourceDistribution[source] || 0) +
          (job.progress?.success ?? job.items_succeeded ?? 0);
      });

      const topSources = Object.entries(sourceDistribution)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalImportsToday > 0 ? (count / totalImportsToday) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalImportsToday,
        successRate,
        activeJobs: todayJobs.filter((j: any) => j.status === 'processing').length,
        topSources,
        recentJobs: todayJobs.slice(0, 5),
      };
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  return { stats, isLoading };
}
