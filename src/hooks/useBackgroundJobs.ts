/**
 * Hook for managing and monitoring jobs (unified system)
 * Uses `jobs` table as the single source of truth
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface BackgroundJob {
  id: string;
  job_type: string;
  job_subtype?: string;
  name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress_percent?: number;
  progress_message?: string;
  processed_items?: number;
  total_items?: number;
  failed_items?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  metadata?: Record<string, any>;
  celery_task_id?: string;
  priority?: number;
  duration_ms?: number;
  max_retries?: number;
  retries?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface JobStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export function useBackgroundJobs(options?: {
  status?: string;
  jobType?: string;
  limit?: number;
}) {
  const { status, jobType, limit = 50 } = options || {};

  return useQuery({
    queryKey: ['background-jobs', status, jobType, limit],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) query = query.eq('status', status === 'processing' ? 'running' : status);
      if (jobType) query = query.eq('job_type', jobType);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as BackgroundJob[];
    },
    refetchInterval: 5000,
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('status');
      const jobs: any[] = data || [];

      const stats: JobStats = {
        total: jobs.length,
        pending: jobs.filter((j) => j.status === 'pending').length,
        running: jobs.filter((j) => j.status === 'running').length,
        completed: jobs.filter((j) => j.status === 'completed').length,
        failed: jobs.filter((j) => j.status === 'failed').length,
      };

      return stats;
    },
    refetchInterval: 10000,
  });
}

export function useJobDetails(jobId: string) {
  return useQuery({
    queryKey: ['job-details', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as unknown as BackgroundJob;
    },
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job?.status === 'completed' || job?.status === 'failed' || job?.status === 'cancelled') {
        return false;
      }
      return 2000;
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' } as any)
        .eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      toast.success('Job cancelled');
    },
    onError: () => toast.error('Failed to cancel job'),
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single();
      if (!data) throw new Error('Job not found');

      const job = data as any;
      await supabase.from('jobs').insert({
        user_id: job.user_id,
        job_type: job.job_type,
        job_subtype: job.job_subtype,
        name: job.name,
        input_data: job.input_data,
        status: 'pending',
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      toast.success('Job requeued');
    },
    onError: () => toast.error('Failed to retry job'),
  });
}

export function useRealtimeJobs() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('jobs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['background-jobs'] });
          queryClient.invalidateQueries({ queryKey: ['job-stats'] });

          if (payload.eventType === 'UPDATE') {
            const job = payload.new as any;
            if (job.status === 'completed') {
              toast.success(`Job "${job.name || job.job_type}" completed`);
            } else if (job.status === 'failed') {
              toast.error(`Job "${job.name || job.job_type}" failed: ${job.error_message}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job: {
      job_type: string;
      job_subtype?: string;
      name?: string;
      input_data?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
          job_type: job.job_type,
          job_subtype: job.job_subtype,
          name: job.name,
          input_data: job.input_data,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as BackgroundJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      toast.success('Job created');
    },
    onError: () => toast.error('Failed to create job'),
  });
}
