import { supabase } from '@/integrations/supabase/client'

export interface QueueJob {
  id: string
  type: 'sync' | 'import' | 'export' | 'webhook' | 'email'
  payload: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: number
  retry_count: number
  max_retries: number
}

export class QueueService {
  private static instance: QueueService

  private constructor() {}

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService()
    }
    return QueueService.instance
  }

  /**
   * Add a job to the unified `jobs` table (replaces activity_logs usage)
   */
  async addJob(
    type: QueueJob['type'], 
    payload: Record<string, any>, 
    options: {
      priority?: number
      maxRetries?: number
      name?: string
      idempotencyKey?: string
    } = {}
  ): Promise<string> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) throw new Error('Non authentifié')

    const insertData: Record<string, any> = {
      user_id: userId,
      job_type: type,
      job_subtype: payload.type || type,
      name: options.name || `Queue job: ${type}`,
      status: 'pending',
      priority: options.priority || 0,
      max_retries: options.maxRetries || 3,
      retries: 0,
      input_data: payload,
      metadata: { source: 'queue_service' }
    }

    if (options.idempotencyKey) {
      insertData.idempotency_key = options.idempotencyKey
    }

    const { data, error } = await (supabase
      .from('jobs') as any)
      .insert(insertData)
      .select('id')
      .single()

    if (error) throw error

    const jobId = data.id
    console.log(`Added job ${jobId} to queue: ${type}`)
    return jobId
  }

  /**
   * Get queue statistics from the unified `jobs` table
   */
  async getQueueStats(): Promise<any> {
    const { data, error } = await (supabase
      .from('jobs') as any)
      .select('status, job_type, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) return null

    const stats = {
      total: data?.length || 0,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>
    }

    data?.forEach((job: any) => {
      if (job.status) {
        stats.by_status[job.status] = (stats.by_status[job.status] || 0) + 1
      }
      if (job.job_type) {
        stats.by_type[job.job_type] = (stats.by_type[job.job_type] || 0) + 1
      }
    })

    return stats
  }

  async cleanupOldJobs(days: number = 7): Promise<void> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    await (supabase
      .from('jobs') as any)
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('created_at', cutoffDate.toISOString())
  }
}

export const queueService = QueueService.getInstance()
