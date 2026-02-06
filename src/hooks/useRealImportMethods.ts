/**
 * useRealImportMethods - Import jobs list & actions via FastAPI
 * Zero direct Supabase — all reads/writes through shopOptiApi
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

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

  // READ: Import history via FastAPI
  const { data: importMethods = [], isLoading, error } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: async () => {
      const res = await shopOptiApi.getImportHistory(100)
      if (!res.success || !res.data) return []

      const jobs = Array.isArray(res.data) ? res.data : res.data?.jobs || []
      return jobs.map((job: any) => ({
        id: job.id,
        user_id: job.user_id,
        source_type: job.job_type || job.source,
        method_name: job.job_type || job.source,
        configuration: job.import_settings || job.metadata,
        status: job.status,
        total_rows: job.total_products || job.total_items || 0,
        processed_rows: job.processed_products || job.processed_items || 0,
        success_rows: job.successful_imports || job.items_succeeded || 0,
        error_rows: job.failed_imports || job.items_failed || 0,
        mapping_config: job.import_settings || job.metadata,
        created_at: job.created_at,
        updated_at: job.updated_at,
        started_at: job.started_at,
        completed_at: job.completed_at
      })) as ImportMethod[]
    },
    refetchInterval: (query) => {
      const jobs = query.state.data || []
      const hasActiveJobs = jobs.some(job =>
        job.status === 'pending' || job.status === 'processing'
      )
      return hasActiveJobs ? 3000 : false
    },
  })

  // WRITE: Execute import via FastAPI
  const executeImport = useMutation({
    mutationFn: async (jobData: {
      method_id?: string
      source_type: string
      source_url?: string
      mapping_config?: any
    }) => {
      if (jobData.source_url) {
        return shopOptiApi.importFromUrl(jobData.source_url, {
          enrichWithAi: true,
          autoMapping: true,
        })
      }
      // Fallback: use scrape endpoint
      return shopOptiApi.scrapeUrl(jobData.source_url || '', {
        enrichWithAi: true,
      })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['products-unified'] })
      if (res.success) {
        toast({
          title: 'Import démarré',
          description: `Job ID: ${res.job_id || res.data?.job_id || 'en cours'}`
        })
      } else {
        toast({
          title: 'Erreur import',
          description: res.error || 'Erreur inconnue',
          variant: 'destructive'
        })
      }
    },
    onError: (err: Error) => {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive'
      })
    }
  })

  // WRITE: Create import method (starts a new job via FastAPI)
  const createMethod = useMutation({
    mutationFn: async (methodData: {
      method_type: string
      method_name: string
      configuration: any
      source_type: string
    }) => {
      // Create via the appropriate FastAPI endpoint based on source
      const url = methodData.configuration?.url || methodData.configuration?.feed_url
      if (url) {
        return shopOptiApi.importFromUrl(url, { enrichWithAi: true })
      }
      // For feed-type imports
      if (methodData.source_type === 'xml' || methodData.source_type === 'csv' || methodData.source_type === 'json') {
        return shopOptiApi.importFromFeed(
          methodData.configuration?.feed_url || '',
          methodData.source_type as 'xml' | 'csv' | 'json',
          methodData.configuration?.mapping
        )
      }
      return shopOptiApi.importFromUrl(url || '', { enrichWithAi: true })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
      toast({
        title: "Import configuré",
        description: res.success ? `Job: ${res.job_id || 'créé'}` : (res.error || 'Erreur')
      })
    }
  })

  // DELETE: Cancel/delete job via FastAPI
  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      return shopOptiApi.cancelJob(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
      toast({
        title: 'Job supprimé',
        description: 'Le job a été annulé avec succès'
      })
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
    updateMethod: () => {}, // Deprecated: updates go through FastAPI job system
    deleteMethod: deleteMethod.mutate,
    isCreating: createMethod.isPending,
    isExecuting: executeImport.isPending,
    isUpdating: false,
    isDeleting: deleteMethod.isPending
  }
}
