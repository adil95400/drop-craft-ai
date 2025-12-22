import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

export interface ImportJob {
  id: string;
  user_id: string;
  job_type: string;
  supplier_id?: string;
  product_ids?: string[];
  import_settings?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_products: number;
  processed_products?: number;
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

const PAGE_SIZE = 25;

export function useImportJobsPaginated() {
  const queryClient = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);

  // Paginated fetch with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['import-jobs-paginated'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('import_jobs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        jobs: (data || []).map((item: any) => ({ 
          ...item, 
          processed_products: item.processed_products || 0 
        })) as ImportJob[],
        nextPage: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: count || 0
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Flatten all pages into single jobs array
  const jobs = data?.pages.flatMap(page => page.jobs) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Create import job with retry logic
  const createJob = useMutation({
    mutationFn: async (jobData: Partial<ImportJob>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          job_type: jobData.job_type || 'single',
          supplier_id: jobData.supplier_id,
          source_platform: jobData.source_platform,
          source_url: jobData.source_url,
          import_settings: jobData.import_settings,
          total_products: jobData.total_products || 0,
          processed_products: 0,
          successful_imports: 0,
          failed_imports: 0,
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Job d\'import créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['import-jobs-paginated'] });
    },
    onError: (error) => {
      console.error('Create job error:', error);
      toast.error('Erreur lors de la création du job d\'import');
    },
    retry: 2,
  });

  // Start import job (trigger edge function)
  const startJob = useMutation({
    mutationFn: async (jobId: string) => {
      // Update status to processing
      const { error: updateError } = await supabase
        .from('import_jobs')
        .update({ 
          status: 'processing', 
          started_at: new Date().toISOString() 
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Trigger the import edge function
      const { data, error } = await supabase.functions.invoke('process-import-job', {
        body: { job_id: jobId }
      });

      if (error) {
        // Revert status on error
        await supabase
          .from('import_jobs')
          .update({ status: 'failed', error_log: [{ error: error.message }] })
          .eq('id', jobId);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Import démarré');
      queryClient.invalidateQueries({ queryKey: ['import-jobs-paginated'] });
    },
    onError: (error) => {
      console.error('Start job error:', error);
      toast.error('Erreur lors du démarrage de l\'import');
    },
  });

  // Cancel import job
  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('import_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Import annulé');
      queryClient.invalidateQueries({ queryKey: ['import-jobs-paginated'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'annulation');
    },
  });

  // Retry failed job
  const retryJob = useMutation({
    mutationFn: async (jobId: string) => {
      // Reset job status
      const { error: updateError } = await supabase
        .from('import_jobs')
        .update({ 
          status: 'pending',
          error_log: null,
          started_at: null,
          completed_at: null
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      setRetryCount(prev => prev + 1);
      return jobId;
    },
    onSuccess: (jobId) => {
      toast.success('Job prêt à être relancé');
      queryClient.invalidateQueries({ queryKey: ['import-jobs-paginated'] });
      // Auto-start the job
      startJob.mutate(jobId);
    },
    onError: () => {
      toast.error('Erreur lors de la relance');
    },
  });

  // Delete import job
  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('import_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Job supprimé');
      queryClient.invalidateQueries({ queryKey: ['import-jobs-paginated'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  // Calculate statistics
  const stats = {
    total: totalCount,
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    cancelled: jobs.filter(j => j.status === 'cancelled').length,
    totalProcessed: jobs.reduce((sum, j) => sum + (j.processed_products || 0), 0),
    totalSuccess: jobs.reduce((sum, j) => sum + (j.successful_imports || 0), 0),
    totalFailed: jobs.reduce((sum, j) => sum + (j.failed_imports || 0), 0),
    successRate: jobs.length > 0 
      ? (jobs.reduce((sum, j) => sum + (j.successful_imports || 0), 0) / 
         Math.max(1, jobs.reduce((sum, j) => sum + (j.total_products || 0), 0)) * 100)
      : 0,
  };

  // Manual refresh
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    jobs,
    stats,
    totalCount,
    isLoading,
    error,
    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // Actions
    createJob: createJob.mutate,
    isCreating: createJob.isPending,
    startJob: startJob.mutate,
    isStarting: startJob.isPending,
    cancelJob: cancelJob.mutate,
    isCancelling: cancelJob.isPending,
    retryJob: retryJob.mutate,
    isRetrying: retryJob.isPending,
    deleteJob: deleteJob.mutate,
    isDeleting: deleteJob.isPending,
    // Utilities
    refresh,
    retryCount,
  };
}

// Hook for bulk import (50k+ products)
export function useBulkImportJob() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

  const startBulkImport = useMutation({
    mutationFn: async ({ 
      sourceUrl, 
      sourcePlatform,
      settings = {}
    }: { 
      sourceUrl: string; 
      sourcePlatform: string;
      settings?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Create the master job
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          job_type: 'bulk',
          source_platform: sourcePlatform,
          source_url: sourceUrl,
          import_settings: settings,
          status: 'processing',
          total_products: 0,
          processed_products: 0,
          successful_imports: 0,
          failed_imports: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Trigger bulk import edge function
      const { data, error } = await supabase.functions.invoke('bulk-import', {
        body: { 
          job_id: job.id,
          source_url: sourceUrl,
          source_platform: sourcePlatform,
          settings
        }
      });

      if (error) throw error;

      return { job, result: data };
    },
    onSuccess: () => {
      toast.success('Import en masse démarré');
      queryClient.invalidateQueries({ queryKey: ['import-jobs-paginated'] });
    },
    onError: (error) => {
      console.error('Bulk import error:', error);
      toast.error('Erreur lors du démarrage de l\'import en masse');
    },
  });

  // Subscribe to progress updates
  const subscribeToProgress = useCallback((jobId: string) => {
    const channel = supabase
      .channel(`import-progress-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const job = payload.new as ImportJob;
          setProgress({
            current: job.processed_products || 0,
            total: job.total_products || 0,
            percentage: job.total_products > 0 
              ? Math.round(((job.processed_products || 0) / job.total_products) * 100)
              : 0
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    startBulkImport: startBulkImport.mutate,
    isStarting: startBulkImport.isPending,
    progress,
    subscribeToProgress,
  };
}
