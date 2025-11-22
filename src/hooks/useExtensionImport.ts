import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ExtensionImportOptions {
  source: 'csv' | 'json' | 'api'
  data?: any[]
  apiUrl?: string
  apiKey?: string
  mapping?: Record<string, string>
}

export const useExtensionImport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)

  const extensionImportMutation = useMutation({
    mutationFn: async (options: ExtensionImportOptions) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      setProgress(10)

      // Call extension product importer
      const { data, error } = await supabase.functions.invoke('extension-product-importer', {
        body: {
          source: options.source,
          data: options.data,
          apiUrl: options.apiUrl,
          apiKey: options.apiKey,
          mapping: options.mapping
        }
      })

      if (error) throw error

      setProgress(100)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
      
      toast({
        title: "Import extension réussi",
        description: `${data.imported || 0} produits importés via l'extension`
      })
      
      setTimeout(() => setProgress(0), 2000)
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'import extension",
        description: error.message,
        variant: "destructive"
      })
      setProgress(0)
    }
  })

  return {
    importFromExtension: extensionImportMutation.mutate,
    isImporting: extensionImportMutation.isPending,
    progress
  }
}
