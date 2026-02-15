import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { importRateLimiter } from './importRateLimiter'

type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed'
type ImportSourceType = 'url' | 'csv' | 'xml' | 'json' | 'api' | 'ftp'

export interface ImportJobStatus {
  id: string
  user_id: string
  status: ImportStatus
  source_type?: string
  source_url?: string | null
  progress: number
  total_rows: number
  processed_rows: number
  success_rows: number
  error_rows: number
  errors: string[] | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ImportConfig {
  source_type: ImportSourceType
  source_url?: string
  configuration?: Record<string, any>
  field_mapping?: Record<string, string>
  // Intégration module fournisseurs
  supplierId?: string
  supplierName?: string
}

class UnifiedImportService {
  private pollingIntervals: Map<string, number> = new Map()

  /**
   * Start an import job with rate limiting
   */
  async startImport(config: ImportConfig): Promise<string> {
    try {
      // Validation
      if (!config.source_url?.trim()) {
        throw new Error('URL source requise')
      }

      if (!config.source_type) {
        throw new Error('Type de source manquant')
      }

      // Check rate limit
      const isAllowed = await importRateLimiter.checkLimit('import_start', 10, 60)
      if (!isAllowed) {
        throw new Error('Limite d\'imports atteinte. Réessayez dans quelques minutes.')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      console.log('[UnifiedImport] Starting import', config)

      // Create job in database
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
          job_type: 'import',
          job_subtype: config.source_type,
          status: 'pending',
          total_items: 0,
          processed_items: 0,
          failed_items: 0,
          metadata: {
            supplier_id: config.supplierId || config.source_url || null,
            import_settings: {
              ...config.configuration || {},
              field_mapping: config.field_mapping || {},
              supplierName: config.supplierName || null
            }
          }
        })
        .select()
        .single()

      if (jobError) throw jobError

      console.log('[UnifiedImport] Job created', { job_id: job.id })

      // Trigger appropriate edge function
      let edgeFunction: string
      let payload: any = {
        job_id: job.id,
        user_id: user.id,
        config: config.configuration || {}
      }

      switch (config.source_type) {
        case 'url':
          edgeFunction = 'url-import'
          payload.url = config.source_url
          break
        case 'csv':
          edgeFunction = 'csv-import'
          payload.file_url = config.source_url
          payload.field_mapping = config.field_mapping || {}
          break
        case 'api':
          edgeFunction = 'api-import-execute'
          break
        case 'xml':
        case 'json':
          edgeFunction = 'xml-json-import'
          payload.sourceUrl = config.source_url
          payload.sourceType = config.source_type
          payload.mapping = config.field_mapping || {}
          break
        default:
          throw new Error(`Unsupported import type: ${config.source_type}`)
      }

      // Call edge function (non-blocking)
      supabase.functions.invoke(edgeFunction, { body: payload })
        .then(({ error }) => {
          if (error) {
            console.error('[UnifiedImport] Edge function error', error)
            toast.error(`Import failed: ${error.message}`)
          }
        })

      // Start monitoring
      this.startMonitoring(job.id)

      toast.success('Import started successfully')
      return job.id

    } catch (error) {
      console.error('[UnifiedImport] Start import error', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      toast.error(`Échec de l'import: ${errorMessage}`)
      throw error
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ImportJobStatus | null> {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) throw error

      const job = data as any;
      const progress = job.total_products > 0 
        ? Math.round((job.successful_imports / job.total_products) * 100)
        : 0

      return {
        id: job.id,
        user_id: job.user_id,
        status: job.status as ImportStatus,
        source_type: job.job_type,
        source_url: job.source_url,
        progress,
        total_rows: job.total_products,
        processed_rows: job.successful_imports,
        success_rows: job.successful_imports,
        error_rows: job.failed_imports,
        errors: (job.error_log as any) ? Object.keys(job.error_log as any) : null,
        started_at: job.started_at,
        completed_at: job.completed_at,
        created_at: job.created_at,
        updated_at: job.updated_at
      }
    } catch (error) {
      console.error('[UnifiedImport] Get status error', error)
      return null
    }
  }

  /**
   * Start intelligent polling for job status
   */
  private startMonitoring(jobId: string) {
    // Don't start if already monitoring
    if (this.pollingIntervals.has(jobId)) {
      return
    }

    let pollCount = 0
    const maxPolls = 120 // 10 minutes max (5s intervals)

    const pollInterval = setInterval(async () => {
      pollCount++

      const status = await this.getJobStatus(jobId)
      
      if (!status) {
        this.stopMonitoring(jobId)
        return
      }

      // Notify progress
      if (status.status === 'processing' && status.progress > 0) {
        console.log(`[UnifiedImport] Job ${jobId} progress: ${status.progress}%`)
      }

      // Stop if completed or failed
      if (status.status === 'completed' || status.status === 'failed') {
        this.stopMonitoring(jobId)
        
        if (status.status === 'completed') {
          toast.success(
            `Import completed: ${status.success_rows} products imported`,
            { duration: 5000 }
          )
        } else {
          toast.error(
            `Import failed: ${status.errors?.[0] || 'Unknown error'}`,
            { duration: 5000 }
          )
        }
        return
      }

      // Stop after max polls
      if (pollCount >= maxPolls) {
        this.stopMonitoring(jobId)
        toast.warning('Import monitoring stopped (timeout)', { duration: 5000 })
      }
    }, 5000) // Poll every 5 seconds

    this.pollingIntervals.set(jobId, pollInterval as unknown as number)
  }

  /**
   * Stop monitoring a job
   */
  private stopMonitoring(jobId: string) {
    const interval = this.pollingIntervals.get(jobId)
    if (interval) {
      clearInterval(interval)
      this.pollingIntervals.delete(jobId)
      console.log('[UnifiedImport] Stopped monitoring', { job_id: jobId })
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          errors: ['Cancelled by user'],
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'processing') // Only cancel if processing

      if (error) throw error

      this.stopMonitoring(jobId)
      toast.success('Import cancelled')
      return true
    } catch (error) {
      console.error('[UnifiedImport] Cancel error', error)
      toast.error('Failed to cancel import')
      return false
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<string> {
    try {
      // Get original job
      const { data: originalJob, error: fetchError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (fetchError) throw fetchError

      const job = originalJob as any;
      // Create new job with same config  
      return this.startImport({
        source_type: job.job_type as ImportSourceType,
        source_url: job.source_url || undefined,
        configuration: {},
        field_mapping: {}
      })
    } catch (error) {
      console.error('[UnifiedImport] Retry error', error)
      throw error
    }
  }

  /**
   * Get import history
   */
  async getHistory(limit: number = 50): Promise<ImportJobStatus[]> {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(d => {
        const job = d as any;
        return {
          id: job.id,
          user_id: job.user_id,
          status: job.status as ImportStatus,
          source_type: job.job_type,
          source_url: job.source_url,
          progress: job.total_products > 0 
            ? Math.round((job.successful_imports / job.total_products) * 100)
            : 0,
          total_rows: job.total_products,
          processed_rows: job.successful_imports,
          success_rows: job.successful_imports,
          error_rows: job.failed_imports,
          errors: (job.error_log as any) ? Object.keys(job.error_log as any) : null,
          started_at: job.started_at,
          completed_at: job.completed_at,
          created_at: job.created_at,
          updated_at: job.updated_at
        };
      })
    } catch (error) {
      console.error('[UnifiedImport] Get history error', error)
      return []
    }
  }

  /**
   * Cleanup - stop all monitoring
   */
  cleanup() {
    this.pollingIntervals.forEach((interval) => clearInterval(interval))
    this.pollingIntervals.clear()
  }
}

export const unifiedImportService = new UnifiedImportService()