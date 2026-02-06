/**
 * Import Gateway - Routes all imports through FastAPI
 * Keeps idempotence/anti-replay logic but delegates actual work to backend
 */

import { supabase } from '@/integrations/supabase/client'
import { productionLogger } from '@/utils/productionLogger'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
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
  /**
   * Point d'entrée principal — delegates to FastAPI
   */
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
        // URL import → FastAPI scraping or import endpoint
        const source = request.source
        if (['csv', 'xml', 'json'].includes(source)) {
          res = await shopOptiApi.importFromFeed(
            request.url, 
            source as 'xml' | 'csv' | 'json',
            request.options?.mapping
          )
        } else {
          res = await shopOptiApi.importFromUrl(request.url, {
            enrichWithAi: true,
          })
        }
      } else if (request.data) {
        // Data array → FastAPI bulk import
        res = await shopOptiApi.request('/imports/bulk', {
          method: 'POST',
          body: {
            products: Array.isArray(request.data) ? request.data : [request.data],
            source: request.source,
          },
          timeout: 120000,
        })
      } else {
        throw new Error('URL ou données requis')
      }

      const duration = Date.now() - startTime

      if (!res.success) {
        return {
          success: false,
          error: {
            code: 'IMPORT_FAILED',
            message: res.error || 'Import failed',
            details: { requestId, durationMs: duration }
          },
          products: [],
          metadata: { requestId, source: request.source, durationMs: duration, timestamp: new Date().toISOString() }
        }
      }

      const jobId = res.job_id || res.data?.job_id
      const imported = res.data?.imported || res.data?.succeeded || 0

      productionLogger.info('Import completed', { 
        requestId, jobId, productsImported: imported, durationMs: duration
      }, 'ImportGateway')

      return {
        success: true,
        products: res.data?.products || [],
        metadata: {
          requestId,
          source: request.source,
          jobId,
          totalImported: imported,
          totalErrors: res.data?.failed || 0,
          timestamp: new Date().toISOString(),
          durationMs: duration,
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      productionLogger.error('Import failed', error as Error, 'ImportGateway')

      return {
        success: false,
        error: {
          code: 'IMPORT_FAILED',
          message: error instanceof Error ? error.message : 'Import failed',
          details: { requestId, durationMs: duration }
        },
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
    const res = await shopOptiApi.getImportHistory(limit)
    if (!res.success || !res.data) return []

    const jobs = Array.isArray(res.data) ? res.data : res.data?.jobs || []
    return jobs.map((job: any) => ({
      id: job.id,
      userId: job.user_id,
      source: job.source_platform || job.source as ImportSource,
      status: job.status,
      totalProducts: job.total_products || job.total_items,
      successfulImports: job.successful_imports || job.items_succeeded,
      failedImports: job.failed_imports || job.items_failed,
      createdAt: new Date(job.created_at),
      completedAt: job.completed_at ? new Date(job.completed_at) : undefined
    }))
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const res = await shopOptiApi.cancelJob(jobId)
    return res.success
  }

  async retryJob(jobId: string): Promise<boolean> {
    const res = await shopOptiApi.retryJob(jobId)
    return res.success
  }

  getSupportedSources(): ImportSource[] {
    return ['aliexpress', 'amazon', 'ebay', 'shopify', 'temu', 'csv', 'xml', 'json', 'api', 'extension']
  }
}

export const importGateway = new ImportGateway()
