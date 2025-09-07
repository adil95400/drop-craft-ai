import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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

  const { data: importMethods = [], isLoading, error } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ImportMethod[]
    },
  })

  const createMethod = useMutation({
    mutationFn: async (methodData: {
      method_type: string
      method_name: string
      configuration: any
      source_type: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('import_jobs')
        .insert([{
          user_id: user.id,
          source_type: methodData.source_type || methodData.method_type,
          mapping_config: methodData.configuration,
          status: 'pending',
          total_rows: 0,
          processed_rows: 0,
          success_rows: 0,
          error_rows: 0
        }])
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Méthode d'import créée",
        description: "La méthode d'import a été configurée avec succès"
      })
    }
  })

  const executeImport = useMutation({
    mutationFn: async (jobData: {
      method_id?: string
      source_type: string
      source_url?: string
      mapping_config?: any
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('import_jobs')
        .insert([{
          user_id: user.id,
          source_type: jobData.source_type,
          source_url: jobData.source_url,
          mapping_config: jobData.mapping_config,
          status: 'pending',
          total_rows: 0,
          processed_rows: 0,
          success_rows: 0,
          error_rows: 0
        }])
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Import démarré",
        description: "Le processus d'import a été lancé avec succès"
      })
    }
  })

  const updateMethod = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ImportMethod> }) => {
      const { data, error } = await supabase
        .from('import_jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Méthode mise à jour",
        description: "La méthode d'import a été modifiée avec succès"
      })
    }
  })

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('import_jobs')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Méthode supprimée",
        description: "La méthode d'import a été supprimée avec succès"
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
    updateMethod: updateMethod.mutate,
    deleteMethod: deleteMethod.mutate,
    isCreating: createMethod.isPending,
    isExecuting: executeImport.isPending,
    isUpdating: updateMethod.isPending,
    isDeleting: deleteMethod.isPending
  }
}