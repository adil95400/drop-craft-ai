/**
 * useUnifiedImport - Hub orchestrateur unique pour tous les imports
 * Fusionne: useBulkImport, useOptimizedImport, useExtensionImport
 * 
 * Features:
 * - Routing intelligent par source
 * - Workers parallèles avec throttling
 * - Realtime progress via Supabase channels
 * - AI auto-enrichissement inline
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import { FileParserService, ProductImport } from '@/services/fileParserService'

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
  // Performance options
  batchSize?: number
  concurrency?: number
  // AI options
  autoEnrich?: boolean
  enrichFields?: ('title' | 'description' | 'tags' | 'seo')[]
  // Callbacks
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

const DEFAULT_BATCH_SIZE = 10
const DEFAULT_CONCURRENCY = 3
const MAX_CONCURRENCY = 5

export function useUnifiedImport() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  // State
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    enriched: 0,
    currentBatch: 0,
    totalBatches: 0
  })
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [items, setItems] = useState<ImportItem[]>([])
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const startTimeRef = useRef<number>(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      channelRef.current?.unsubscribe()
    }
  }, [])

  // Subscribe to realtime updates
  const subscribeToProgress = useCallback((jobId: string) => {
    channelRef.current?.unsubscribe()
    
    channelRef.current = supabase
      .channel(`import-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const job = payload.new as any
          const processed = (job.successful_imports || 0) + (job.failed_imports || 0)
          const total = job.total_products || 1
          
          setProgress(prev => ({
            ...prev,
            processed,
            successful: job.successful_imports || 0,
            failed: job.failed_imports || 0,
            total
          }))

          if (job.status === 'completed') {
            setStatus('completed')
            toast({
              title: t('import.success', 'Import réussi'),
              description: t('import.productsImported', '{{count}} produits importés', { count: job.successful_imports })
            })
          } else if (job.status === 'failed') {
            setStatus('failed')
            toast({
              title: t('import.failed', 'Import échoué'),
              description: job.error_log?.[0] || t('errors.generic'),
              variant: 'destructive'
            })
          } else if (job.status === 'partial') {
            setStatus('partial')
            toast({
              title: t('import.partial', 'Import partiel'),
              description: t('import.partialDesc', '{{success}} réussis, {{failed}} échecs', {
                success: job.successful_imports,
                failed: job.failed_imports
              }),
              variant: 'default'
            })
          }
        }
      )
      .subscribe()
  }, [toast, t])

  // Detect source type from file
  const detectSource = useCallback((file: File): ImportSource => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') return 'csv'
    if (ext === 'json') return 'json'
    if (ext === 'xlsx' || ext === 'xls') return 'excel'
    if (ext === 'xml') return 'feed'
    return 'csv'
  }, [])

  // Parse file based on source
  const parseFile = useCallback(async (file: File, source: ImportSource): Promise<any[]> => {
    if (source === 'excel') {
      const arrayBuffer = await file.arrayBuffer()
      const result = await FileParserService.parseExcel(arrayBuffer)
      return result.data
    } else if (source === 'json') {
      const text = await file.text()
      const result = await FileParserService.parseJSON(text)
      return result.data
    } else {
      const text = await file.text()
      const result = await FileParserService.parseCSV(text)
      return result.data
    }
  }, [])

  // Process batch with concurrency control
  const processBatch = useCallback(async (
    batch: any[],
    batchIndex: number,
    options: ImportOptions
  ): Promise<{ succeeded: number; failed: number; errors: any[] }> => {
    const { data, error } = await supabase.functions.invoke('bulk-import-products', {
      body: {
        products: batch,
        source: options.source,
        options: {
          auto_optimize: options.autoEnrich ?? false,
          auto_publish: false,
          batch_index: batchIndex
        }
      }
    })

    if (error) throw error

    return {
      succeeded: data.succeeded || 0,
      failed: data.failed || 0,
      errors: data.errors || []
    }
  }, [])

  // AI Enrichment
  const enrichProducts = useCallback(async (
    products: any[],
    fields: string[]
  ): Promise<any[]> => {
    if (!fields.length) return products

    try {
      const { data, error } = await supabase.functions.invoke('catalog-ai-hub', {
        body: {
          action: 'batch_optimize',
          products: products.map(p => p.id || p),
          fields,
          language: 'fr'
        }
      })

      if (error) {
        console.warn('AI enrichment failed:', error)
        return products
      }

      return data.optimized || products
    } catch (e) {
      console.warn('AI enrichment error:', e)
      return products
    }
  }, [])

  // Main import function
  const importProducts = useCallback(async (options: ImportOptions): Promise<ImportResult> => {
    const startTime = Date.now()
    startTimeRef.current = startTime
    abortControllerRef.current = new AbortController()

    setStatus('detecting')
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      enriched: 0,
      currentBatch: 0,
      totalBatches: 0
    })

    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('errors.unauthorized'))

      // Parse data based on source
      let products: any[] = []
      const source = options.source

      if (options.file) {
        setStatus('validating')
        products = await parseFile(options.file, source)
      } else if (options.data) {
        products = options.data
      } else if (options.url) {
        // Fetch from URL
        const { data, error } = await supabase.functions.invoke('feed-url-import', {
          body: { url: options.url, mapping: options.mapping }
        })
        if (error) throw error
        products = data.products || []
      }

      if (!products.length) {
        throw new Error(t('import.noProducts', 'Aucun produit à importer'))
      }

      // Create import job
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          job_type: source,
          source_platform: source,
          source_url: options.url || '',
          status: 'processing',
          total_products: products.length,
          successful_imports: 0,
          failed_imports: 0,
          error_log: []
        })
        .select()
        .single()

      if (jobError) throw jobError

      const jobId = jobData.id
      setCurrentJobId(jobId)
      subscribeToProgress(jobId)

      // Setup batching
      const batchSize = Math.min(options.batchSize || DEFAULT_BATCH_SIZE, 50)
      const concurrency = Math.min(options.concurrency || DEFAULT_CONCURRENCY, MAX_CONCURRENCY)
      const batches: any[][] = []
      
      for (let i = 0; i < products.length; i += batchSize) {
        batches.push(products.slice(i, i + batchSize))
      }

      setProgress(prev => ({
        ...prev,
        total: products.length,
        totalBatches: batches.length
      }))
      setStatus('processing')

      // Process batches with concurrency
      let totalSucceeded = 0
      let totalFailed = 0
      const allErrors: any[] = []

      // Process in waves of concurrent batches
      for (let wave = 0; wave < batches.length; wave += concurrency) {
        if (abortControllerRef.current?.signal.aborted) break

        const waveBatches = batches.slice(wave, wave + concurrency)
        const wavePromises = waveBatches.map((batch, idx) => 
          processBatch(batch, wave + idx, options)
        )

        const waveResults = await Promise.allSettled(wavePromises)

        for (const result of waveResults) {
          if (result.status === 'fulfilled') {
            totalSucceeded += result.value.succeeded
            totalFailed += result.value.failed
            allErrors.push(...result.value.errors)
          } else {
            totalFailed += batchSize
            allErrors.push({ error: result.reason?.message || 'Batch failed' })
          }
        }

        // Update progress
        const processed = Math.min((wave + concurrency) * batchSize, products.length)
        setProgress(prev => ({
          ...prev,
          processed,
          successful: totalSucceeded,
          failed: totalFailed,
          currentBatch: wave + concurrency,
          estimatedTimeRemaining: calculateETA(processed, products.length, startTime)
        }))

        options.onProgress?.({
          ...progress,
          processed,
          successful: totalSucceeded,
          failed: totalFailed
        })
      }

      // AI Enrichment phase
      let enrichedCount = 0
      if (options.autoEnrich && options.enrichFields?.length) {
        setStatus('enriching')
        
        // Get imported product IDs
        const { data: importedProducts } = await supabase
          .from('imported_products')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(totalSucceeded)

        if (importedProducts?.length) {
          await enrichProducts(importedProducts, options.enrichFields)
          enrichedCount = importedProducts.length
          setProgress(prev => ({ ...prev, enriched: enrichedCount }))
        }
      }

      // Update job status
      const finalStatus = totalFailed === 0 ? 'completed' : 
                         totalSucceeded === 0 ? 'failed' : 'partial'
      
      await supabase
        .from('import_jobs')
        .update({
          status: finalStatus,
          successful_imports: totalSucceeded,
          failed_imports: totalFailed,
          completed_at: new Date().toISOString(),
          error_log: allErrors.slice(0, 50) // Keep first 50 errors
        })
        .eq('id', jobId)

      setStatus(finalStatus as ImportStatus)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })

      const duration = Date.now() - startTime

      return {
        jobId,
        imported: totalSucceeded,
        failed: totalFailed,
        enriched: enrichedCount,
        errors: allErrors,
        duration
      }
    } catch (error: any) {
      setStatus('failed')
      toast({
        title: t('import.failed', 'Import échoué'),
        description: error.message,
        variant: 'destructive'
      })
      throw error
    }
  }, [parseFile, processBatch, enrichProducts, subscribeToProgress, queryClient, toast, t, progress])

  // Cancel import
  const cancelImport = useCallback(async () => {
    abortControllerRef.current?.abort()
    
    if (currentJobId) {
      await supabase
        .from('import_jobs')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', currentJobId)
      
      toast({
        title: t('import.cancelled', 'Import annulé'),
        description: t('import.cancelledDesc', 'L\'import a été annulé')
      })
    }
    
    setStatus('idle')
    setCurrentJobId(null)
    channelRef.current?.unsubscribe()
  }, [currentJobId, toast, t])

  // Reset state
  const reset = useCallback(() => {
    setStatus('idle')
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      enriched: 0,
      currentBatch: 0,
      totalBatches: 0
    })
    setCurrentJobId(null)
    setItems([])
    channelRef.current?.unsubscribe()
  }, [])

  return {
    // Actions
    importProducts,
    cancelImport,
    reset,
    detectSource,
    
    // State
    status,
    progress,
    currentJobId,
    items,
    
    // Computed
    isIdle: status === 'idle',
    isProcessing: ['detecting', 'validating', 'processing', 'enriching'].includes(status),
    isComplete: status === 'completed',
    isFailed: status === 'failed',
    progressPercent: progress.total > 0 
      ? Math.round((progress.processed / progress.total) * 100) 
      : 0
  }
}

// Helper: Calculate ETA
function calculateETA(processed: number, total: number, startTime: number): number {
  if (processed === 0) return 0
  const elapsed = Date.now() - startTime
  const rate = processed / elapsed
  const remaining = total - processed
  return Math.round(remaining / rate)
}

// Types are already exported inline with their declarations
