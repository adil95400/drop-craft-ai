/**
 * useRealImportMethods - Import jobs list & actions via Supabase direct
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface ImportMethod {
  id: string
  user_id: string
  source_type: string
  method_name?: string
  configuration?: any
  status: string
  total_rows: number
  processed_rows: number
  success_rows: number
  error_rows: number
  mapping_config?: any
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

export const useRealImportMethods = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: importMethods = [], isLoading, error } = useQuery({
    queryKey: ['import-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('background_jobs')
        .select('*')
        .eq('user_id', user.id)
        .in('job_type', ['import', 'csv_import', 'url_import', 'feed_import'])
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data || []).map((job: any) => ({
        id: job.id,
        user_id: job.user_id,
        source_type: job.job_subtype || job.job_type,
        method_name: job.name || job.job_type,
        configuration: job.input_data,
        status: job.status,
        total_rows: job.items_total || 0,
        processed_rows: job.items_processed || 0,
        success_rows: job.items_succeeded || 0,
        error_rows: job.items_failed || 0,
        mapping_config: job.metadata,
        created_at: job.created_at,
        updated_at: job.updated_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
      })) as ImportMethod[]
    },
    enabled: !!user?.id,
    refetchInterval: (query) => {
      const jobs = query.state.data || []
      const hasActiveJobs = jobs.some(job =>
        job.status === 'pending' || job.status === 'processing'
      )
      return hasActiveJobs ? 3000 : false
    },
  })

  const executeImport = useMutation({
    mutationFn: async (jobData: {
      method_id?: string
      source_type: string
      source_url?: string
      mapping_config?: any
    }) => {
      if (!user?.id) throw new Error('Non authentifié')
      // Use url-import edge function
      if (jobData.source_url) {
        const { data, error } = await supabase.functions.invoke('url-import', {
          body: { url: jobData.source_url, enrichWithAi: true }
        })
        if (error) throw error
        return data
      }
      throw new Error('URL source requise')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['products-unified'] })
      toast({ title: 'Import démarré', description: 'Le traitement est en cours...' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    }
  })

  const createMethod = useMutation({
    mutationFn: async (methodData: {
      method_type: string
      method_name: string
      configuration: any
      source_type: string
    }) => {
      if (!user?.id) throw new Error('Non authentifié')
      const url = methodData.configuration?.url || methodData.configuration?.feed_url
      if (url) {
        const { data, error } = await supabase.functions.invoke('url-import', {
          body: { url, enrichWithAi: true }
        })
        if (error) throw error
        return data
      }
      throw new Error('URL requise')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({ title: 'Import configuré', description: 'Job créé avec succès' })
    }
  })

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('background_jobs')
        .update({ status: 'cancelled' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({ title: 'Job supprimé', description: 'Le job a été annulé' })
    }
  })

  const stats = {
    totalMethods: importMethods.length,
    activeMethods: importMethods.filter(m => m.status === 'completed').length,
    recentJobs: importMethods.length,
    successfulJobs: importMethods.filter(j => j.status === 'completed').length,
    pendingJobs: importMethods.filter(j => j.status === 'pending').length,
    failedJobs: importMethods.filter(j => j.status === 'failed').length
  }

  return {
    importMethods,
    stats,
    isLoading,
    error,
    createMethod: createMethod.mutate,
    executeImport: executeImport.mutate,
    updateMethod: () => {},
    deleteMethod: deleteMethod.mutate,
    isCreating: createMethod.isPending,
    isExecuting: executeImport.isPending,
    isUpdating: false,
    isDeleting: deleteMethod.isPending
  }
}
