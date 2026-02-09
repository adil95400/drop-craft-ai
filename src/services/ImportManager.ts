/**
 * Import Manager Service - Uses API V1 client
 */
import { importJobsApi } from '@/services/api/client'
import { supabase } from '@/integrations/supabase/client'

export interface ImportJob {
  id: string;
  type: 'csv' | 'api' | 'xml' | 'json' | 'url';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  successItems: number;
  errorItems: number;
  createdAt: Date;
  completedAt?: Date;
  errors: string[];
  total_rows?: number;
  success_rows?: number;
}

export interface ImportTemplate {
  id: string;
  name: string;
  type: 'csv' | 'xml' | 'json';
  config: any;
  mapping: any;
}

export interface SyncSchedule {
  id: string;
  connectorId: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  active: boolean;
  nextRun: Date;
}

function mapJobResponse(job: any): ImportJob {
  const processed = (job.progress?.processed ?? 0)
  const total = (job.progress?.total ?? 1)
  return {
    id: job.job_id || job.id,
    type: (job.job_type || job.source || 'url') as ImportJob['type'],
    status: job.status as ImportJob['status'],
    progress: total > 0 ? Math.round((processed / total) * 100) : 0,
    totalItems: job.progress?.total ?? 0,
    processedItems: processed,
    successItems: job.progress?.success ?? 0,
    errorItems: job.progress?.failed ?? 0,
    createdAt: new Date(job.created_at),
    completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
    errors: [],
    total_rows: job.progress?.total,
    success_rows: job.progress?.success,
  }
}

class ImportManagerService {
  async createImportJob(type: ImportJob['type'], data: any): Promise<ImportJob> {
    const resp = await importJobsApi.create({
      source: type,
      url: data?.url,
      settings: data,
    })

    return {
      id: resp.job_id,
      type,
      status: 'pending',
      progress: 0,
      totalItems: Array.isArray(data) ? data.length : data?.products?.length || 0,
      processedItems: 0,
      successItems: 0,
      errorItems: 0,
      createdAt: new Date(),
      errors: [],
      total_rows: 0,
      success_rows: 0,
    }
  }

  async getJob(id: string): Promise<ImportJob | undefined> {
    try {
      const job = await importJobsApi.get(id)
      if (!job) return undefined
      return mapJobResponse(job)
    } catch {
      return undefined
    }
  }

  async getAllJobs(): Promise<ImportJob[]> {
    try {
      const resp = await importJobsApi.list({ per_page: 50 })
      return (resp.items || []).map(mapJobResponse)
    } catch {
      return []
    }
  }

  async cancelJob(id: string): Promise<boolean> {
    try {
      await importJobsApi.cancel(id)
      return true
    } catch {
      return false
    }
  }

  getTemplates(): ImportTemplate[] { return [] }
  
  async createTemplate(t: Omit<ImportTemplate, 'id'>): Promise<ImportTemplate> { 
    return { ...t, id: crypto.randomUUID() } 
  }
  
  async updateTemplate(id: string, updates: Partial<ImportTemplate>): Promise<ImportTemplate | null> { 
    return null 
  }
  
  async deleteTemplate(id: string): Promise<boolean> { 
    return true 
  }

  async importFromUrl(url: string, templateId?: string, config?: any): Promise<ImportJob> {
    return this.createImportJob('url', { url, templateId, ...config })
  }

  async importFromXml(xmlUrl: string, templateId?: string, config?: any): Promise<ImportJob> {
    return this.createImportJob('xml', { url: xmlUrl, templateId, ...config })
  }

  async importFromCsv(csvContent: string, templateId?: string, config?: any): Promise<ImportJob> {
    const lines = csvContent.split('\n').filter(l => l.trim())
    return this.createImportJob('csv', { products: lines.slice(1), templateId, ...config })
  }

  async importFromFtp(
    ftpUrl: string, username: string, password: string, filePath: string,
    templateId?: string, config?: any
  ): Promise<ImportJob> {
    return this.createImportJob('api', { source: 'ftp', ftpUrl, username, filePath, templateId, ...config })
  }

  autoDetectFields(sampleData: any[], fileType: string): any { return {} }
}

export const importManager = new ImportManagerService()
