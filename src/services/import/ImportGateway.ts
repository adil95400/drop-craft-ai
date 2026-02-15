/**
 * Import Gateway - Routes all imports through Edge Functions / Supabase
 * Uses `jobs` table as SoT, fallback to `background_jobs`
 */

import { supabase } from '@/integrations/supabase/client'
import { productionLogger } from '@/utils/productionLogger'
import { 
  ImportSource, 
  ImportRequest, 
  ImportResult, 
  ImportJob,
  NormalizedProduct 
} from './types'

function generateRequestId(): string {
  return crypto.randomUUID()
}

export class ImportGateway {
  async import(request: ImportRequest): Promise<ImportResult> {
    const requestId = generateRequestId()
    const startTime = Date.now()

    productionLogger.info('Import request received', { 
      requestId, source: request.source, hasUrl: !!request.url 
    }, 'ImportGateway')

    try {
      this.validateRequest(request)

      let res: any

      if (request.url) {
        const { data, error } = await supabase.functions.invoke('url-import', {
          body: {
            url: request.url,
            source: request.source,
            enrichWithAi: true,
          }
        })
        if (error) throw error
        res = data
      } else if (request.data) {
        const { data, error } = await supabase.functions.invoke('import-products', {
          body: {
            products: Array.isArray(request.data) ? request.data : [request.data],
            source: request.source,
          }
        })
        if (error) throw error
        res = data
      } else {
        throw new Error('URL ou données requis')
      }

      const duration = Date.now() - startTime

      if (res?.error) {
        return {
          success: false,
          error: { code: 'IMPORT_FAILED', message: res.error, details: { requestId, durationMs: duration } },
          products: [],
          metadata: { requestId, source: request.source, durationMs: duration, timestamp: new Date().toISOString() }
        }
      }

      const jobId = res?.job_id || res?.id || ''
      const imported = res?.imported || res?.succeeded || res?.products?.length || 0

      productionLogger.info('Import completed', { requestId, jobId, productsImported: imported, durationMs: duration }, 'ImportGateway')

      return {
        success: true,
        products: res?.products || [],
        metadata: {
          requestId, source: request.source, jobId,
          totalImported: imported, totalErrors: res?.failed || 0,
          timestamp: new Date().toISOString(), durationMs: duration,
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      productionLogger.error('Import failed', error as Error, 'ImportGateway')

      return {
        success: false,
        error: { code: 'IMPORT_FAILED', message: error instanceof Error ? error.message : 'Import failed', details: { requestId, durationMs: duration } },
        products: [],
        metadata: { requestId, source: request.source, durationMs: duration, timestamp: new Date().toISOString() }
      }
    }
  }

  private validateRequest(request: ImportRequest): void {
    if (!request.source) throw new Error('Source d\'import requise')
    if (!request.url && !request.data && !request.file) throw new Error('URL, données ou fichier requis')
  }

  async importFromUrl(url: string, source?: ImportSource): Promise<ImportResult> {
    const detectedSource = source || this.detectSource(url)
    return this.import({ source: detectedSource, url, options: { autoDetect: true } })
  }

  async importFromCsv(file: File, mapping?: Record<string, string>): Promise<ImportResult> {
    return this.import({ source: 'csv', file, options: { mapping } })
  }

  async importFromExtension(productData: any, source: ImportSource): Promise<ImportResult> {
    return this.import({ source, data: productData, options: { fromExtension: true } })
  }

  private detectSource(url: string): ImportSource {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('aliexpress')) return 'aliexpress'
    if (lowerUrl.includes('amazon')) return 'amazon'
    if (lowerUrl.includes('ebay')) return 'ebay'
    if (lowerUrl.includes('shopify') || lowerUrl.includes('myshopify')) return 'shopify'
    if (lowerUrl.includes('temu')) return 'temu'
    if (lowerUrl.endsWith('.csv')) return 'csv'
    if (lowerUrl.endsWith('.xml')) return 'xml'
    if (lowerUrl.endsWith('.json')) return 'json'
    return 'api'
  }

  async getImportHistory(limit = 50): Promise<ImportJob[]> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) return []

    // Try jobs table first (SoT)
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', session.user.id)
      .in('job_type', ['import', 'csv_import', 'url_import', 'feed_import'])
      .order('created_at', { ascending: false })
      .limit(limit)

    let rawJobs: any[] = (jobsData as any[]) || []

    // Fallback to background_jobs if jobs is empty
    if (rawJobs.length === 0) {
      const { data: bgData } = await supabase
        .from('background_jobs')
        .select('*')
        .eq('user_id', session.user.id)
        .in('job_type', ['import', 'csv_import', 'url_import', 'feed_import'])
        .order('created_at', { ascending: false })
        .limit(limit)
      rawJobs = (bgData as any[]) || []
    }

    return rawJobs.map((job: any) => ({
      id: job.id,
      userId: job.user_id,
      source: (job.job_subtype || job.job_type) as ImportSource,
      status: job.status === 'processing' ? 'running' : job.status,
      totalProducts: job.items_total ?? job.total_items,
      successfulImports: job.items_succeeded ?? (job.processed_items - (job.failed_items || 0)),
      failedImports: job.items_failed ?? job.failed_items,
      createdAt: new Date(job.created_at),
      completedAt: job.completed_at ? new Date(job.completed_at) : undefined
    }))
  }

  async cancelJob(jobId: string): Promise<boolean> {
    // Try jobs table first
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'cancelled' } as any)
      .eq('id', jobId)
    if (!error) return true

    // Fallback
    const { error: bgError } = await supabase
      .from('background_jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId)
    return !bgError
  }

  async retryJob(jobId: string): Promise<boolean> {
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'pending', retries: 0 } as any)
      .eq('id', jobId)
    if (!error) return true

    const { error: bgError } = await supabase
      .from('background_jobs')
      .update({ status: 'pending', retries: 0 })
      .eq('id', jobId)
    return !bgError
  }

  getSupportedSources(): ImportSource[] {
    return ['aliexpress', 'amazon', 'ebay', 'shopify', 'temu', 'csv', 'xml', 'json', 'api', 'extension']
  }
}

export const importGateway = new ImportGateway()
