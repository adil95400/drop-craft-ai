/**
 * Import Manager Service - Uses existing import_jobs table schema
 */
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

class ImportManagerService {
  async createImportJob(type: ImportJob['type'], data: any): Promise<ImportJob> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Non authentifié')

    const totalItems = Array.isArray(data) ? data.length : 
                       data?.products?.length || data?.items?.length || 0

    const { data: jobData, error } = await supabase
      .from('import_jobs')
      .insert({
        user_id: userData.user.id,
        job_type: type,
        source_platform: type,
        source_url: data?.url || '',
        status: 'pending',
        total_products: totalItems,
        successful_imports: 0,
        failed_imports: 0,
        error_log: []
      })
      .select()
      .single()

    if (error) throw new Error(`Échec de création: ${error.message}`)

    return {
      id: jobData.id,
      type,
      status: 'pending',
      progress: 0,
      totalItems,
      processedItems: 0,
      successItems: 0,
      errorItems: 0,
      createdAt: new Date(jobData.created_at),
      errors: [],
      total_rows: totalItems,
      success_rows: 0
    }
  }

  async getJob(id: string): Promise<ImportJob | undefined> {
    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return undefined

    const processed = (data.successful_imports || 0) + (data.failed_imports || 0)
    const total = data.total_products || 1
    
    return {
      id: data.id,
      type: data.job_type as ImportJob['type'],
      status: data.status as ImportJob['status'],
      progress: Math.round((processed / total) * 100),
      totalItems: data.total_products || 0,
      processedItems: processed,
      successItems: data.successful_imports || 0,
      errorItems: data.failed_imports || 0,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      errors: (data.error_log as string[]) || [],
      total_rows: data.total_products,
      success_rows: data.successful_imports
    }
  }

  async getAllJobs(): Promise<ImportJob[]> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return []

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !data) return []

    return data.map(job => {
      const processed = (job.successful_imports || 0) + (job.failed_imports || 0)
      const total = job.total_products || 1
      return {
        id: job.id,
        type: job.job_type as ImportJob['type'],
        status: job.status as ImportJob['status'],
        progress: Math.round((processed / total) * 100),
        totalItems: job.total_products || 0,
        processedItems: processed,
        successItems: job.successful_imports || 0,
        errorItems: job.failed_imports || 0,
        createdAt: new Date(job.created_at),
        completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
        errors: (job.error_log as string[]) || [],
        total_rows: job.total_products,
        success_rows: job.successful_imports
      }
    })
  }

  async cancelJob(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('import_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', id)
    return !error
  }

  getTemplates(): ImportTemplate[] { return [] }
  async createTemplate(t: Omit<ImportTemplate, 'id'>): Promise<ImportTemplate> { return { ...t, id: crypto.randomUUID() } }
  async updateTemplate(): Promise<ImportTemplate | null> { return null }
  async deleteTemplate(): Promise<boolean> { return true }

  async importFromUrl(url: string, templateId?: string, options?: any): Promise<ImportJob> {
    return this.createImportJob('url', { url, ...options })
  }

  async importFromXml(xmlContent: string): Promise<ImportJob> {
    return this.createImportJob('xml', { source: 'xml' })
  }

  async importFromCsv(csvContent: string): Promise<ImportJob> {
    const lines = csvContent.split('\n').filter(l => l.trim())
    return this.createImportJob('csv', { products: lines.slice(1), source: 'csv' })
  }

  async importFromFtp(): Promise<ImportJob> {
    return this.createImportJob('api', { source: 'ftp' })
  }

  autoDetectFields(data: any): any { return {} }
}

export const importManager = new ImportManagerService()
