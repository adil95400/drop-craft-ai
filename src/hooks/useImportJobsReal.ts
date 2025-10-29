import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImportJob {
  id: string;
  user_id: string;
  source_type: string;
  source_url?: string;
  file_data?: any;
  mapping_config?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  error_rows: number;
  errors?: any[];
  result_data?: any;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  configuration?: any;
  import_type?: string;
}

export function useImportJobsReal() {
  const queryClient = useQueryClient();

  // Fetch import jobs
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['import-jobs-real'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ImportJob[];
    },
    refetchInterval: 5000,
  });

  // Create import job
  const createJob = useMutation({
    mutationFn: async (jobData: Partial<ImportJob>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          source_type: jobData.source_type || 'manual',
          source_url: jobData.source_url,
          file_data: jobData.file_data,
          mapping_config: jobData.mapping_config,
          total_rows: 0,
          processed_rows: 0,
          success_rows: 0,
          error_rows: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      queryClient.invalidateQueries({ queryKey: ['import-jobs-real'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  // Calculate statistics
  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    totalProcessed: jobs.reduce((sum, j) => sum + (j.processed_rows || 0), 0),
    totalSuccess: jobs.reduce((sum, j) => sum + (j.success_rows || 0), 0),
    totalFailed: jobs.reduce((sum, j) => sum + (j.error_rows || 0), 0),
    successRate: jobs.length > 0 
      ? (jobs.reduce((sum, j) => sum + (j.success_rows || 0), 0) / 
         Math.max(1, jobs.reduce((sum, j) => sum + (j.processed_rows || 0), 0)) * 100)
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
  const { data: stats, isLoading } = useQuery({
    queryKey: ['import-stats-real'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get today's jobs
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayJobs, error: jobsError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (jobsError) throw jobsError;

      // Get all jobs for general stats
      const { data: allJobs, error: allError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id);

      if (allError) throw allError;

      const totalImportsToday = todayJobs?.reduce((sum, j) => sum + (j.success_rows || 0), 0) || 0;
      const totalProcessed = allJobs?.reduce((sum, j) => sum + (j.processed_rows || 0), 0) || 0;
      const totalSuccess = allJobs?.reduce((sum, j) => sum + (j.success_rows || 0), 0) || 0;
      const successRate = totalProcessed > 0 ? (totalSuccess / totalProcessed) * 100 : 0;

      // Calculate source distribution
      const sourceDistribution: Record<string, number> = {};
      todayJobs?.forEach(job => {
        const source = job.source_type || 'unknown';
        sourceDistribution[source] = (sourceDistribution[source] || 0) + (job.success_rows || 0);
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
        activeJobs: todayJobs?.filter(j => j.status === 'processing').length || 0,
        topSources,
        recentJobs: todayJobs?.slice(0, 5) || []
      };
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return { stats, isLoading };
}
