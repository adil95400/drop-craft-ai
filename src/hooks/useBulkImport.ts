import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

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
        body: {
          products,
          source,
          options
        }
      })

      if (error) throw error

      const jobId = data.job_id
      setCurrentJobId(jobId)

      // Poll for progress
      const pollInterval = setInterval(async () => {
        const { data: job, error: jobError } = await supabase
          .from('import_jobs')
          .select('*')
          .eq('id', jobId)
          .single()

        if (jobError) {
          console.error('Error fetching job:', jobError)
          clearInterval(pollInterval)
          setIsImporting(false)
          return
        }

        if (job) {
          const calculatedProgress = job.total_products > 0 
            ? Math.round((job.processed_products / job.total_products) * 100)
            : 0
          
          setProgress(calculatedProgress)

          if (job.status === 'completed' || job.status === 'failed' || job.status === 'partial') {
            clearInterval(pollInterval)
            setIsImporting(false)
            setProgress(100)

            const successCount = job.total_products - job.failed_imports
            if (job.status === 'completed') {
              toast.success(`${successCount} produits importés avec succès!`)
            } else if (job.status === 'partial') {
              toast.warning(
                `${successCount} produits importés, ${job.failed_imports} erreurs`
              )
            } else {
              const errorMsg = Array.isArray(job.error_log) && job.error_log.length > 0
                ? String(job.error_log[0])
                : 'Erreur inconnue'
              toast.error(`Import échoué: ${errorMsg}`)
            }
          }
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
        await supabase
          .from('import_jobs')
          .update({ status: 'cancelled' })
          .eq('id', currentJobId)

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
