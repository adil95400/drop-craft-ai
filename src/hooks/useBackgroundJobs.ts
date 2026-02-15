/**
 * Hook for managing and monitoring jobs (unified system)
 * Uses `jobs` table as source of truth, with `background_jobs` as read-only fallback
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

/** Normalize background_jobs row to BackgroundJob interface */
function normalizeBgJob(j: any): BackgroundJob {
  return {
    ...j,
    total_items: j.items_total ?? j.total_items ?? 0,
    processed_items: j.items_processed ?? j.processed_items ?? 0,
    failed_items: j.items_failed ?? j.failed_items ?? 0,
    status: j.status === 'processing' ? 'running' : j.status,
  };
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
      // Try jobs table first
      let query = supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) query = query.eq('status', status === 'processing' ? 'running' : status);
      if (jobType) query = query.eq('job_type', jobType);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as unknown as BackgroundJob[];
      }

      // Fallback to background_jobs
      let bgQuery = supabase
        .from('background_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) bgQuery = bgQuery.eq('status', status);
      if (jobType) bgQuery = bgQuery.eq('job_type', jobType);

      const { data: bgData, error: bgError } = await bgQuery;
      if (bgError) throw bgError;
      return (bgData || []).map(normalizeBgJob);
    },
    refetchInterval: 5000,
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: async () => {
      // Try jobs first
      const { data } = await supabase.from('jobs').select('status');
      let jobs: any[] = data || [];

      if (jobs.length === 0) {
        const { data: bgData } = await supabase.from('background_jobs').select('status');
        jobs = bgData || [];
      }

      const stats: JobStats = {
        total: jobs.length,
        pending: jobs.filter((j) => j.status === 'pending').length,
        running: jobs.filter((j) => j.status === 'running' || j.status === 'processing').length,
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
        .maybeSingle();

      if (!error && data) return data as unknown as BackgroundJob;

      // Fallback
      const { data: fallback, error: fbErr } = await supabase
        .from('background_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fbErr) throw fbErr;
      return normalizeBgJob(fallback);
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

      if (error) {
        const { error: bgErr } = await supabase
          .from('background_jobs')
          .update({ status: 'failed', error_message: 'Cancelled by user' })
          .eq('id', jobId)
          .eq('status', 'pending');
        if (bgErr) throw bgErr;
      }
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
      const { data } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
      const job = data as any;

      if (job) {
        await supabase.from('jobs').insert({
          user_id: job.user_id,
          job_type: job.job_type,
          job_subtype: job.job_subtype,
          name: job.name,
          input_data: job.input_data,
          status: 'pending',
        } as any);
      } else {
        const { data: bg, error: fbErr } = await supabase
          .from('background_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
        if (fbErr) throw fbErr;

        await supabase.from('jobs').insert({
          user_id: bg.user_id,
          job_type: bg.job_type,
          job_subtype: bg.job_subtype,
          name: bg.name,
          input_data: bg.input_data,
          status: 'pending',
        } as any);
      }
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
