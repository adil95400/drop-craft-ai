/**
 * useUnifiedImport - Orchestrateur unique pour tous les imports
 * Utilise les Edge Functions et Supabase directement
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import { FileParserService } from '@/services/fileParserService'

export type ImportSource = 'csv' | 'json' | 'excel' | 'url' | 'api' | 'extension' | 'feed'
export type ImportStatus = 'idle' | 'detecting' | 'validating' | 'processing' | 'enriching' | 'completed' | 'failed' | 'partial'

export interface ImportItem {
  id: string; data: any; status: 'pending' | 'processing' | 'success' | 'failed'; error?: string; enriched?: boolean;
}

export interface ImportProgress {
  total: number; processed: number; successful: number; failed: number;
  enriched: number; currentBatch: number; totalBatches: number; estimatedTimeRemaining?: number;
}

export interface ImportOptions {
  source: ImportSource; file?: File; data?: any[]; url?: string; apiKey?: string;
  mapping?: Record<string, string>; batchSize?: number; concurrency?: number;
  autoEnrich?: boolean; enrichFields?: ('title' | 'description' | 'tags' | 'seo')[];
  onProgress?: (progress: ImportProgress) => void; onItemComplete?: (item: ImportItem) => void;
}

export interface ImportResult {
  jobId: string; imported: number; failed: number; enriched: number;
  errors: Array<{ row: number; error: string }>; duration: number;
}

export function useUnifiedImport() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<ImportStatus>('idle')
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0, processed: 0, successful: 0, failed: 0, enriched: 0, currentBatch: 0, totalBatches: 0
  })
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [items, setItems] = useState<ImportItem[]>([])

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  const subscribeToProgress = useCallback((jobId: string) => {
    channelRef.current?.unsubscribe()
    channelRef.current = supabase
      .channel(`import-job-${jobId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'jobs',
        filter: `id=eq.${jobId}`
      }, (payload) => {
        const job = payload.new as any
        const processed = job.processed_items || 0
        const failed = job.failed_items || 0
        setProgress(prev => ({
          ...prev, processed, total: job.total_items || prev.total,
          successful: processed - failed, failed,
        }))
        if (job.status === 'completed') {
          setStatus('completed')
          toast({ title: t('import.success', 'Import réussi'), description: `${job.items_succeeded} produits importés` })
        } else if (job.status === 'failed') {
          setStatus('failed')
          toast({ title: t('import.failed', 'Import échoué'), variant: 'destructive' })
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

  const importProducts = useCallback(async (options: ImportOptions): Promise<ImportResult> => {
    const startTime = Date.now()
    startTimeRef.current = startTime
    setStatus('detecting')
    setProgress({ total: 0, processed: 0, successful: 0, failed: 0, enriched: 0, currentBatch: 0, totalBatches: 0 })

    try {
      let res: any

      if (options.url) {
        setStatus('processing')
        const { data, error } = await supabase.functions.invoke('url-import', {
          body: { url: options.url, enrichWithAi: options.autoEnrich }
        })
        if (error) throw error
        res = data
      } else if (options.file) {
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
        if (!products.length) throw new Error(t('import.noProducts', 'Aucun produit à importer'))

        setStatus('processing')
        setProgress(prev => ({ ...prev, total: products.length }))

        const { data, error } = await supabase.functions.invoke('import-products', {
          body: { products, source: options.source, auto_enrich: options.autoEnrich ?? false }
        })
        if (error) throw error
        res = data
      } else if (options.data?.length) {
        setStatus('processing')
        const { data, error } = await supabase.functions.invoke('import-products', {
          body: { products: options.data, source: options.source, auto_enrich: options.autoEnrich ?? false }
        })
        if (error) throw error
        res = data
      } else {
        throw new Error('No import source provided')
      }

      const jobId = res?.job_id || res?.id || ''
      if (jobId) {
        setCurrentJobId(jobId)
        subscribeToProgress(jobId)
      }

      const imported = res?.imported || res?.succeeded || 0
      const failed = res?.failed || 0
      setStatus(failed === 0 ? 'completed' : imported === 0 ? 'failed' : 'partial')
      setProgress(prev => ({ ...prev, processed: imported + failed, successful: imported, failed }))

      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['products-unified'] })

      return { jobId, imported, failed, enriched: 0, errors: res?.errors || [], duration: Date.now() - startTime }
    } catch (error: any) {
      setStatus('failed')
      toast({ title: t('import.failed', 'Import échoué'), description: error.message, variant: 'destructive' })
      throw error
    }
  }, [subscribeToProgress, queryClient, toast, t])

  const cancelImport = useCallback(async () => {
    if (currentJobId) {
      await supabase.from('jobs').update({ status: 'cancelled' } as any).eq('id', currentJobId)
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
