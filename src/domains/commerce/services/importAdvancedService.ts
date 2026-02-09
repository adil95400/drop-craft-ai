/**
 * importAdvancedService — Pure API V1 client wrapper
 * No business logic. All calls go through the centralized /v1 router.
 */
import { importJobsApi, api } from '@/services/api/client'

export interface ImportFromUrlOptions {
  url: string
  config?: {
    auto_optimize?: boolean
    extract_images?: boolean
    generate_seo?: boolean
    market_analysis?: boolean
    price_optimization?: boolean
  }
}

export interface ImportFromXmlOptions {
  xmlUrl: string
  mapping?: Record<string, string>
  config?: {
    validate_schema?: boolean
    auto_detect_fields?: boolean
    batch_size?: number
  }
}

export interface ImportFromFtpOptions {
  ftpUrl: string
  username: string
  password: string
  filePath: string
  fileType: 'csv' | 'xml' | 'json'
  config?: {
    schedule?: string
    auto_sync?: boolean
    backup_enabled?: boolean
  }
}

export const importAdvancedService = {
  async importFromUrl(options: ImportFromUrlOptions) {
    return importJobsApi.create({
      source: 'url_list',
      urls: [options.url],
      settings: options.config ?? {},
    })
  },

  async importFromXml(options: ImportFromXmlOptions) {
    return importJobsApi.create({
      source: 'xml',
      urls: [options.xmlUrl],
      settings: {
        mapping: options.mapping ?? {},
        ...options.config,
      },
    })
  },

  async importFromFtp(options: ImportFromFtpOptions) {
    return importJobsApi.create({
      source: 'ftp',
      settings: {
        ftp_url: options.ftpUrl,
        username: options.username,
        password: options.password,
        file_path: options.filePath,
        file_type: options.fileType,
        ...options.config,
      },
    })
  },

  async getImportHistory(params?: { page?: number; per_page?: number }) {
    return importJobsApi.list(params)
  },

  async getImportJob(jobId: string) {
    return importJobsApi.get(jobId)
  },

  async getImportJobItems(jobId: string, params?: { page?: number; per_page?: number; status?: string }) {
    return importJobsApi.getItems(jobId, params)
  },

  async retryJob(jobId: string, onlyFailed = true) {
    return importJobsApi.retry(jobId, onlyFailed)
  },

  async cancelJob(jobId: string) {
    return importJobsApi.cancel(jobId)
  },
}
