import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BulkJob {
  id: string;
  user_id: string;
  job_type: 'videos' | 'images' | 'social_posts';
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
  jobType: 'videos' | 'images' | 'social_posts';
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
        .from('bulk_content_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any;
    },
  });

  // Create a new bulk job
  const createBulkJob = useMutation({
    mutationFn: async (params: CreateBulkJobParams) => {
      const products = params.inputData.products || [];
      
      // Create job record
      const { data: jobData, error: jobError } = await supabase
        .from('bulk_content_jobs')
        .insert({
          job_type: params.jobType,
          status: 'pending',
          total_items: products.length,
          input_data: params.inputData
        } as any)
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
      toast({
        title: 'Job lancé avec succès!',
        description: `Génération de ${data.jobData.total_items} contenus en cours...`,
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
        .from('bulk_content_jobs')
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
