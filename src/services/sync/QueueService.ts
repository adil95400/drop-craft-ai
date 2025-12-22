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

  // Ajouter un job à la queue (utilise activity_logs)
  async addJob(
    type: QueueJob['type'], 
    payload: Record<string, any>, 
    options: {
      priority?: number
      maxRetries?: number
    } = {}
  ): Promise<string> {
    const jobId = crypto.randomUUID()
    
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        action: `queue_${type}`,
        description: `Queue job: ${type}`,
        details: {
          job_id: jobId,
          type,
          payload,
          status: 'pending',
          priority: options.priority || 0,
          retry_count: 0,
          max_retries: options.maxRetries || 3
        }
      })

    if (error) throw error

    console.log(`Added job ${jobId} to queue: ${type}`)
    return jobId
  }

  // Statistiques de la queue
  async getQueueStats(): Promise<any> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('details')
      .like('action', 'queue_%')

    if (error) return null

    const stats = {
      total: data?.length || 0,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>
    }

    data?.forEach(log => {
      const details = (log.details || {}) as any
      if (details?.status) {
        stats.by_status[details.status] = (stats.by_status[details.status] || 0) + 1
      }
      if (details?.type) {
        stats.by_type[details.type] = (stats.by_type[details.type] || 0) + 1
      }
    })

    return stats
  }

  async cleanupOldJobs(days: number = 7): Promise<void> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    await supabase
      .from('activity_logs')
      .delete()
      .like('action', 'queue_%')
      .lt('created_at', cutoffDate.toISOString())
  }
}

export const queueService = QueueService.getInstance()
