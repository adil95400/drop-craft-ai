import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BulkJob {
  id: string;
  user_id: string;
  job_type: 'videos' | 'images' | 'social_posts' | 'descriptions';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  completed_items: number;
  failed_items: number;
  input_data: any;
  results: any[];
  error_log: any[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBulkJobParams {
  jobType: 'videos' | 'images' | 'social_posts' | 'descriptions';
  inputData: any;
}

export function useBulkContentGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all jobs for the current user
  const { data: jobs, isLoading: isLoadingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['bulk-content-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .eq('job_type', 'bulk_content')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((j: any) => ({
        id: j.id,
        user_id: j.user_id,
        job_type: j.target_type || 'videos',
        status: j.status,
        total_items: (j.input_data as any)?.total_items || 0,
        completed_items: (j.metrics as any)?.completed || 0,
        failed_items: (j.metrics as any)?.failed || 0,
        input_data: j.input_data,
        results: (j.output_data as any)?.results || [],
        error_log: [],
        started_at: j.started_at,
        completed_at: j.completed_at,
        created_at: j.created_at,
        updated_at: j.updated_at
      })) as BulkJob[];
    },
  });

  // Create a new bulk job
  const createBulkJob = useMutation({
    mutationFn: async (params: CreateBulkJobParams) => {
      const products = params.inputData.products || [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      // Create job record using ai_optimization_jobs table
      const { data: jobData, error: jobError } = await supabase
        .from('ai_optimization_jobs')
        .insert({
          job_type: 'bulk_content',
          target_type: params.jobType,
          status: 'pending',
          input_data: { ...params.inputData, total_items: products.length },
          user_id: user.id
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Trigger edge function to process the job
      const { data, error } = await supabase.functions.invoke('bulk-content-generator', {
        body: {
          jobId: jobData.id,
          jobType: params.jobType,
          inputData: params.inputData
        }
      });

      if (error) throw error;
      return { jobData, processingData: data };
    },
    onSuccess: (data) => {
      const totalItems = (data.jobData.input_data as any)?.total_items || 0;
      toast({
        title: 'Job lancé avec succès!',
        description: `Génération de ${totalItems} contenus en cours...`,
      });
      queryClient.invalidateQueries({ queryKey: ['bulk-content-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur lors du lancement',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Cancel a job
  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Job annulé' });
      queryClient.invalidateQueries({ queryKey: ['bulk-content-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur lors de l\'annulation',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  return {
    // Jobs
    jobs,
    isLoadingJobs,
    refetchJobs,

    // Create job
    createBulkJob: createBulkJob.mutate,
    createBulkJobAsync: createBulkJob.mutateAsync,
    isCreatingJob: createBulkJob.isPending,

    // Cancel job
    cancelJob: cancelJob.mutate,
    isCancellingJob: cancelJob.isPending,
  };
}
