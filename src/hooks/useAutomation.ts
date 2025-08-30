import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutomationJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  schedule_type: 'manual' | 'hourly' | 'daily' | 'weekly';
  schedule_config: any;
  input_data: any;
  output_data: any;
  progress: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export const useAutomation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch automation jobs - using activity_logs as fallback since automation_jobs table is new
  const { 
    data: jobs, 
    isLoading: isLoadingJobs, 
    error: jobsError 
  } = useQuery({
    queryKey: ['automation-jobs'],
    queryFn: async () => {
      // Try to fetch from activity_logs where action contains automation info
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .ilike('action', '%automation%')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.warn('Could not fetch automation jobs:', error);
        return [];
      }
      
      // Transform activity logs to automation job format
      return (data || []).map(log => ({
        id: log.id,
        job_type: log.action,
        status: 'completed' as const,
        schedule_type: 'manual' as const,
        schedule_config: {},
        input_data: log.metadata || {},
        output_data: {},
        progress: 100,
        created_at: log.created_at,
        updated_at: log.created_at
      })) as AutomationJob[];
    }
  });

  // Create automation job
  const createJobMutation = useMutation({
    mutationFn: async ({
      jobType,
      scheduleType = 'manual',
      inputData = {},
      immediate = false
    }: {
      jobType: string;
      scheduleType?: 'manual' | 'hourly' | 'daily' | 'weekly';
      inputData?: any;
      immediate?: boolean;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'create_job',
          jobType,
          userId: user.data.user.id,
          inputData: {
            ...inputData,
            immediate
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job créé avec succès",
        description: "Le job d'automatisation a été créé et ajouté à la file d'attente"
      });
      queryClient.invalidateQueries({ queryKey: ['automation-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création du job",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Process job manually
  const processJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'process_job',
          jobId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job démarré",
        description: "Le job d'automatisation a été démarré"
      });
      queryClient.invalidateQueries({ queryKey: ['automation-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors du démarrage",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get job status
  const getJobStatusMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'get_status',
          jobId
        }
      });

      if (error) throw error;
      return data;
    }
  });

  // Schedule jobs (admin function)
  const scheduleJobsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'schedule_jobs'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Jobs planifiés",
        description: `${data.scheduledJobs || 0} jobs ont été planifiés pour exécution`
      });
      queryClient.invalidateQueries({ queryKey: ['automation-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de planification",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const createInventorySyncJob = (immediate = false) => {
    return createJobMutation.mutate({
      jobType: 'sync_inventory',
      scheduleType: immediate ? 'manual' : 'daily',
      immediate
    });
  };

  const createPriceUpdateJob = (immediate = false) => {
    return createJobMutation.mutate({
      jobType: 'update_prices',
      scheduleType: immediate ? 'manual' : 'daily',
      immediate
    });
  };

  const createCatalogImportJob = (supplierId?: string, maxProducts = 1000, immediate = false) => {
    return createJobMutation.mutate({
      jobType: 'import_catalog',
      inputData: { supplierId, maxProducts },
      immediate
    });
  };

  const createOrderSyncJob = (immediate = false) => {
    return createJobMutation.mutate({
      jobType: 'sync_orders',
      scheduleType: immediate ? 'manual' : 'hourly',
      immediate
    });
  };

  const createCleanupJob = (immediate = false) => {
    return createJobMutation.mutate({
      jobType: 'cleanup_data',
      scheduleType: immediate ? 'manual' : 'weekly',
      immediate
    });
  };

  const processJob = (jobId: string) => {
    return processJobMutation.mutate(jobId);
  };

  const getJobStatus = (jobId: string) => {
    return getJobStatusMutation.mutate(jobId);
  };

  const scheduleJobs = () => {
    return scheduleJobsMutation.mutate();
  };

  // Computed values
  const runningJobs = jobs?.filter(j => j.status === 'running') || [];
  const completedJobs = jobs?.filter(j => j.status === 'completed') || [];
  const failedJobs = jobs?.filter(j => j.status === 'failed') || [];
  const pendingJobs = jobs?.filter(j => j.status === 'pending') || [];
  const scheduledJobs = jobs?.filter(j => j.schedule_type !== 'manual') || [];

  return {
    // Data
    jobs,
    runningJobs,
    completedJobs,
    failedJobs,
    pendingJobs,
    scheduledJobs,
    
    // Loading states
    isLoadingJobs,
    isCreatingJob: createJobMutation.isPending,
    isProcessingJob: processJobMutation.isPending,
    isSchedulingJobs: scheduleJobsMutation.isPending,
    
    // Errors
    jobsError,
    
    // Actions
    createInventorySyncJob,
    createPriceUpdateJob,
    createCatalogImportJob,
    createOrderSyncJob,
    createCleanupJob,
    processJob,
    getJobStatus,
    scheduleJobs,
    
    // Raw mutations for advanced usage
    createJobMutation,
    processJobMutation,
    getJobStatusMutation,
    scheduleJobsMutation
  };
};