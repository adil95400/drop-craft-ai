import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { importJobsApi } from '@/services/api/client'

interface BulkImportOptions {
  auto_optimize?: boolean
  auto_publish?: boolean
  target_store?: string
}

export function useBulkImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  const startBulkImport = async (
    products: any[],
    source: 'supplier' | 'csv' | 'url' | 'shopify',
    options?: BulkImportOptions
  ) => {
    if (products.length === 0) {
      toast.error('Aucun produit à importer')
      return null
    }

    setIsImporting(true)
    setProgress(0)

    try {
      toast.loading(`Import de ${products.length} produits en cours...`)

      const { data, error } = await supabase.functions.invoke('bulk-import-products', {
        body: { products, source, options }
      })

      if (error) throw error

      const jobId = data.job_id
      setCurrentJobId(jobId)

      // Poll for progress via API V1
      const pollInterval = setInterval(async () => {
        try {
          const job = await importJobsApi.get(jobId)

          if (job) {
            const processed = (job.progress?.processed ?? 0)
            const total = (job.progress?.total ?? 1)
            const calculatedProgress = total > 0 ? Math.round((processed / total) * 100) : 0
            setProgress(calculatedProgress)

            const status = job.status
            if (status === 'completed' || status === 'failed' || status === 'partial') {
              clearInterval(pollInterval)
              setIsImporting(false)
              setProgress(100)

              const successCount = job.progress?.success ?? 0
              const failedCount = job.progress?.failed ?? 0
              if (status === 'completed') {
                toast.success(`${successCount} produits importés avec succès!`)
              } else if (status === 'partial') {
                toast.warning(`${successCount} produits importés, ${failedCount} erreurs`)
              } else {
                toast.error(`Import échoué`)
              }
            }
          }
        } catch (err) {
          console.error('Error polling job:', err)
          clearInterval(pollInterval)
          setIsImporting(false)
        }
      }, 2000)

      return jobId
    } catch (error: any) {
      console.error('Bulk import error:', error)
      toast.error(`Erreur d'import: ${error.message}`)
      setIsImporting(false)
      return null
    }
  }

  const cancelImport = async () => {
    if (currentJobId) {
      try {
        await importJobsApi.cancel(currentJobId)
        toast.info('Import annulé')
        setIsImporting(false)
        setCurrentJobId(null)
      } catch (error) {
        console.error('Error cancelling import:', error)
      }
    }
  }

  return {
    isImporting,
    progress,
    currentJobId,
    startBulkImport,
    cancelImport
  }
}
