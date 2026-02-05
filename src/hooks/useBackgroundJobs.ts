/**
 * Hook for managing and monitoring background jobs
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent?: number;
  progress_message?: string;
  items_processed?: number;
  items_total?: number;
  items_succeeded?: number;
  items_failed?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  error_details?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface JobStats {
  total: number;
  pending: number;
  processing: number;
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
        .from('background_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }
      if (jobType) {
        query = query.eq('job_type', jobType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BackgroundJob[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('background_jobs')
        .select('status');

      if (error) throw error;

      const stats: JobStats = {
        total: data.length,
        pending: data.filter((j) => j.status === 'pending').length,
        processing: data.filter((j) => j.status === 'processing').length,
        completed: data.filter((j) => j.status === 'completed').length,
        failed: data.filter((j) => j.status === 'failed').length,
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
        .from('background_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as BackgroundJob;
    },
    refetchInterval: (query) => {
      // Stop refetching if job is completed or failed
      const job = query.state.data;
      if (job?.status === 'completed' || job?.status === 'failed') {
        return false;
      }
      return 2000; // Refetch every 2 seconds while running
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('background_jobs')
        .update({ status: 'failed', error_message: 'Cancelled by user' })
        .eq('id', jobId)
        .eq('status', 'pending'); // Can only cancel pending jobs

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      toast.success('Job cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel job');
      console.error(error);
    },
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      // Get original job
      const { data: job, error: fetchError } = await supabase
        .from('background_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) throw fetchError;

      // Create new job with same parameters
      const { error: createError } = await supabase
        .from('background_jobs')
        .insert({
          user_id: job.user_id,
          job_type: job.job_type,
          job_subtype: job.job_subtype,
          name: job.name,
          input_data: job.input_data,
          status: 'pending',
        });

      if (createError) throw createError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      toast.success('Job requeued');
    },
    onError: (error) => {
      toast.error('Failed to retry job');
      console.error(error);
    },
  });
}

export function useRealtimeJobs() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('background-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'background_jobs',
        },
        (payload) => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['background-jobs'] });
          queryClient.invalidateQueries({ queryKey: ['job-stats'] });

          // Show toast for completed/failed jobs
          if (payload.eventType === 'UPDATE') {
            const job = payload.new as BackgroundJob;
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
        .from('background_jobs')
        .insert({
          user_id: user.id,
          job_type: job.job_type,
          job_subtype: job.job_subtype,
          name: job.name,
          input_data: job.input_data,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as BackgroundJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      toast.success('Job created');
    },
    onError: (error) => {
      toast.error('Failed to create job');
      console.error(error);
    },
  });
}
