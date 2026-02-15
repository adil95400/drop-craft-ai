import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Extension {
  id: string
  name: string
  code: string
  description?: string
  version?: string
  status?: string
  is_premium?: boolean
  config?: any
  created_at: string
  updated_at: string
}

export interface ExtensionJob {
  id: string
  extension_id?: string
  job_type: string
  status?: string
  input_data?: any
  output_data?: any
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
  user_id: string
}

export interface ExtensionInstallConfig {
  name: string
  description?: string
  version?: string
  code?: string
  is_premium?: boolean
  config?: any
}

export const useExtensions = (category?: string) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch installed extensions
  const {
    data: extensions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['extensions', category],
    queryFn: async (): Promise<Extension[]> => {
      const { data, error } = await supabase
        .from('extensions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return (data || []) as Extension[]
    }
  })

  // Fetch extension jobs
  const {
    data: jobs = [],
    isLoading: isLoadingJobs
  } = useQuery({
    queryKey: ['extension-jobs'],
    queryFn: async (): Promise<ExtensionJob[]> => {
      const { data, error } = await supabase
        .from('extension_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return (data || []) as ExtensionJob[]
    }
  })

  // Install extension
  const installExtension = useMutation({
    mutationFn: async (extensionConfig: ExtensionInstallConfig) => {
      const { data, error } = await supabase
        .from('extensions')
        .insert({
          name: extensionConfig.name,
          code: extensionConfig.code || '',
          description: extensionConfig.description,
          version: extensionConfig.version,
          is_premium: extensionConfig.is_premium,
          config: extensionConfig.config,
          status: 'active'
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] })
      toast({
        title: "Extension installée",
        description: "L'extension a été installée avec succès"
      })
    },
    onError: (error) => {
      console.error('Extension install error:', error)
      toast({
        title: "Erreur d'installation",
        description: "Impossible d'installer l'extension",
        variant: "destructive"
      })
    }
  })

  // Update extension configuration
  const updateExtension = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Extension> }) => {
      const { data, error } = await supabase
        .from('extensions')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] })
      toast({
        title: "Extension mise à jour",
        description: "La configuration a été sauvegardée"
      })
    }
  })

  // Activate/Deactivate extension
  const toggleExtension = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const { data, error } = await supabase
        .from('extensions')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] })
      toast({
        title: data.status === 'active' ? "Extension activée" : "Extension désactivée",
        description: `${data.name} est maintenant ${data.status === 'active' ? 'activée' : 'désactivée'}`
      })
    }
  })

  // Uninstall extension
  const uninstallExtension = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('extensions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] })
      toast({
        title: "Extension désinstallée",
        description: "L'extension a été supprimée avec succès"
      })
    }
  })

  // Start import/sync job
  const startJob = useMutation({
    mutationFn: async (jobConfig: {
      extensionId: string
      jobType: 'import' | 'sync' | 'export'
      inputData: Record<string, any>
    }) => {
      const user = await supabase.auth.getUser()
      if (!user.data.user?.id) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          job_type: `extension_${jobConfig.jobType}`,
          input_data: jobConfig.inputData,
          user_id: user.data.user.id,
          status: 'pending',
          metadata: { extension_id: jobConfig.extensionId, source: 'extension' }
        })
        .select()
        .single()
      
      if (error) throw error

      // Call edge function to process the job
      const { error: funcError } = await supabase.functions.invoke('extension-processor', {
        body: { jobId: data.id }
      })
      
      if (funcError) {
        console.error('Job processing error:', funcError)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extension-jobs'] })
      toast({
        title: "Tâche lancée",
        description: "Le traitement a commencé en arrière-plan"
      })
    }
  })

  return {
    extensions,
    jobs,
    isLoading,
    isLoadingJobs,
    error,
    installExtension: installExtension.mutate,
    updateExtension: updateExtension.mutate,
    toggleExtension: toggleExtension.mutate,
    uninstallExtension: uninstallExtension.mutate,
    startJob: startJob.mutate,
    isInstallingExtension: installExtension.isPending,
    isUpdatingExtension: updateExtension.isPending,
    isTogglingExtension: toggleExtension.isPending,
    isUninstallingExtension: uninstallExtension.isPending,
    isStartingJob: startJob.isPending
  }
}
