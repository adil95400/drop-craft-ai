/**
 * useUnifiedImport - Orchestrateur unique pour tous les imports
 * Délègue entièrement à FastAPI — zero edge functions directes
 * Supabase Realtime conservé uniquement pour le suivi de progression
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { FileParserService } from '@/services/fileParserService'

// Types
export type ImportSource = 'csv' | 'json' | 'excel' | 'url' | 'api' | 'extension' | 'feed'
export type ImportStatus = 'idle' | 'detecting' | 'validating' | 'processing' | 'enriching' | 'completed' | 'failed' | 'partial'

export interface ImportItem {
  id: string
  data: any
  status: 'pending' | 'processing' | 'success' | 'failed'
  error?: string
  enriched?: boolean
}

export interface ImportProgress {
  total: number
  processed: number
  successful: number
  failed: number
  enriched: number
  currentBatch: number
  totalBatches: number
  estimatedTimeRemaining?: number
}

export interface ImportOptions {
  source: ImportSource
  file?: File
  data?: any[]
  url?: string
  apiKey?: string
  mapping?: Record<string, string>
  batchSize?: number
  concurrency?: number
  autoEnrich?: boolean
  enrichFields?: ('title' | 'description' | 'tags' | 'seo')[]
  onProgress?: (progress: ImportProgress) => void
  onItemComplete?: (item: ImportItem) => void
}

export interface ImportResult {
  jobId: string
  imported: number
  failed: number
  enriched: number
  errors: Array<{ row: number; error: string }>
  duration: number
}

export function useUnifiedImport() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<ImportStatus>('idle')
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0, processed: 0, successful: 0, failed: 0,
    enriched: 0, currentBatch: 0, totalBatches: 0
  })
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [items, setItems] = useState<ImportItem[]>([])

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  // Realtime progress via Supabase channel (read-only, acceptable)
  const subscribeToProgress = useCallback((jobId: string) => {
    channelRef.current?.unsubscribe()

    channelRef.current = supabase
      .channel(`import-job-${jobId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'import_jobs',
        filter: `id=eq.${jobId}`
      }, (payload) => {
        const job = payload.new as any
        const processed = (job.successful_imports || 0) + (job.failed_imports || 0)
        const total = job.total_products || 1

        setProgress(prev => ({
          ...prev, processed, total,
          successful: job.successful_imports || 0,
          failed: job.failed_imports || 0,
        }))

        if (job.status === 'completed') {
          setStatus('completed')
          toast({ title: t('import.success', 'Import réussi'), description: `${job.successful_imports} produits importés` })
        } else if (job.status === 'failed') {
          setStatus('failed')
          toast({ title: t('import.failed', 'Import échoué'), variant: 'destructive' })
        } else if (job.status === 'partial') {
          setStatus('partial')
          toast({ title: t('import.partial', 'Import partiel'), description: `${job.successful_imports} réussis, ${job.failed_imports} échecs` })
        }
      })
      .subscribe()
  }, [toast, t])

  const detectSource = useCallback((file: File): ImportSource => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') return 'csv'
    if (ext === 'json') return 'json'
    if (ext === 'xlsx' || ext === 'xls') return 'excel'
    if (ext === 'xml') return 'feed'
    return 'csv'
  }, [])

  // Main import — delegates to FastAPI
  const importProducts = useCallback(async (options: ImportOptions): Promise<ImportResult> => {
    const startTime = Date.now()
    startTimeRef.current = startTime

    setStatus('detecting')
    setProgress({ total: 0, processed: 0, successful: 0, failed: 0, enriched: 0, currentBatch: 0, totalBatches: 0 })

    try {
      let res: any

      // URL-based import → FastAPI
      if (options.url) {
        setStatus('processing')
        res = await shopOptiApi.importFromUrl(options.url, {
          enrichWithAi: options.autoEnrich,
        })
      }
      // Feed import → FastAPI
      else if (options.source === 'feed' && options.url) {
        setStatus('processing')
        res = await shopOptiApi.importFromFeed(options.url, 'xml', options.mapping)
      }
      // File import → parse locally, then send to FastAPI
      else if (options.file) {
        setStatus('validating')
        let products: any[] = []
        
        if (options.source === 'excel') {
          const ab = await options.file.arrayBuffer()
          const parsed = await FileParserService.parseExcel(ab)
          products = parsed.data
        } else if (options.source === 'json') {
          const text = await options.file.text()
          const parsed = await FileParserService.parseJSON(text)
          products = parsed.data
        } else {
          const text = await options.file.text()
          const parsed = await FileParserService.parseCSV(text)
          products = parsed.data
        }

        if (!products.length) {
          throw new Error(t('import.noProducts', 'Aucun produit à importer'))
        }

        setStatus('processing')
        setProgress(prev => ({ ...prev, total: products.length }))

        // Send parsed data to FastAPI bulk import endpoint
        res = await shopOptiApi.request('/imports/bulk', {
          method: 'POST',
          body: {
            products,
            source: options.source,
            auto_enrich: options.autoEnrich ?? false,
          },
          timeout: 120000,
        })
      }
      // Data array import → FastAPI
      else if (options.data?.length) {
        setStatus('processing')
        res = await shopOptiApi.request('/imports/bulk', {
          method: 'POST',
          body: {
            products: options.data,
            source: options.source,
            auto_enrich: options.autoEnrich ?? false,
          },
          timeout: 120000,
        })
      } else {
        throw new Error('No import source provided')
      }

      if (!res.success) {
        throw new Error(res.error || 'Import failed')
      }

      const jobId = res.job_id || res.data?.job_id || ''
      if (jobId) {
        setCurrentJobId(jobId)
        subscribeToProgress(jobId)
      }

      const imported = res.data?.imported || res.data?.succeeded || 0
      const failed = res.data?.failed || 0

      setStatus(failed === 0 ? 'completed' : imported === 0 ? 'failed' : 'partial')
      setProgress(prev => ({ ...prev, processed: imported + failed, successful: imported, failed }))

      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['products-unified'] })

      return {
        jobId,
        imported,
        failed,
        enriched: 0,
        errors: res.data?.errors || [],
        duration: Date.now() - startTime
      }
    } catch (error: any) {
      setStatus('failed')
      toast({ title: t('import.failed', 'Import échoué'), description: error.message, variant: 'destructive' })
      throw error
    }
  }, [subscribeToProgress, queryClient, toast, t])

  const cancelImport = useCallback(async () => {
    if (currentJobId) {
      await shopOptiApi.cancelJob(currentJobId)
      toast({ title: t('import.cancelled', 'Import annulé') })
    }
    setStatus('idle')
    setCurrentJobId(null)
    channelRef.current?.unsubscribe()
  }, [currentJobId, toast, t])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress({ total: 0, processed: 0, successful: 0, failed: 0, enriched: 0, currentBatch: 0, totalBatches: 0 })
    setCurrentJobId(null)
    setItems([])
    channelRef.current?.unsubscribe()
  }, [])

  return {
    importProducts, cancelImport, reset, detectSource,
    status, progress, currentJobId, items,
    isIdle: status === 'idle',
    isProcessing: ['detecting', 'validating', 'processing', 'enriching'].includes(status),
    isComplete: status === 'completed',
    isFailed: status === 'failed',
    progressPercent: progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0
  }
}
