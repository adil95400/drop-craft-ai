/**
 * useUrlImport - Shared hook for real URL-based product imports
 * Used by all platform import pages (AliExpress, Amazon, Temu, eBay, etc.)
 */
import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export interface ImportResult {
  success: boolean
  product?: any
  saved_id?: string
  error?: string
}

export function useUrlImport(platformName: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')

  const importMutation = useMutation({
    mutationFn: async (url: string): Promise<ImportResult> => {
      setProgress(10)
      setProgressMessage('Connexion au serveur...')

      setProgress(25)
      setProgressMessage(`Extraction des données ${platformName}...`)

      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: {
          url,
          action: 'import',
          price_multiplier: 1.5,
        },
      })

      if (error) throw new Error(error.message || 'Erreur serveur')

      setProgress(80)
      setProgressMessage('Sauvegarde du produit...')

      if (!data?.success) {
        throw new Error(data?.error || `Import ${platformName} échoué`)
      }

      setProgress(100)
      setProgressMessage('Import terminé !')

      return data as ImportResult
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })
      queryClient.invalidateQueries({ queryKey: ['products-unified'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      const title = data.product?.title || 'Produit'
      toast.success(`${title} importé depuis ${platformName} !`, {
        action: {
          label: 'Voir le catalogue',
          onClick: () => navigate('/products'),
        },
      })
    },
    onError: (error: Error) => {
      setProgress(0)
      setProgressMessage('')
      toast.error(`Erreur ${platformName}: ${error.message}`)
    },
  })

  const handleImport = useCallback(
    (url: string) => {
      if (!url.trim()) {
        toast.error(`Veuillez entrer une URL ${platformName}`)
        return
      }
      importMutation.mutate(url.trim())
    },
    [importMutation, platformName]
  )

  const reset = useCallback(() => {
    setProgress(0)
    setProgressMessage('')
    importMutation.reset()
  }, [importMutation])

  return {
    handleImport,
    isImporting: importMutation.isPending,
    progress,
    progressMessage,
    importResult: importMutation.data,
    error: importMutation.error,
    isSuccess: importMutation.isSuccess,
    reset,
  }
}
