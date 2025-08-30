import { supabase } from '@/integrations/supabase/client'

export interface QueueJob {
  id: string
  type: 'sync' | 'import' | 'export' | 'webhook' | 'email'
  payload: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retry'
  priority: number
  created_at: Date
  started_at?: Date
  completed_at?: Date
  error_message?: string
  retry_count: number
  max_retries: number
}

export class QueueService {
  private static instance: QueueService
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startProcessing()
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService()
    }
    return QueueService.instance
  }

  // Ajouter un job à la queue
  async addJob(
    type: QueueJob['type'], 
    payload: Record<string, any>, 
    options: {
      priority?: number
      maxRetries?: number
      delay?: number
    } = {}
  ): Promise<string> {
    const job = {
      type,
      payload,
      status: 'pending' as const,
      priority: options.priority || 0,
      retry_count: 0,
      max_retries: options.maxRetries || 3,
      scheduled_for: options.delay 
        ? new Date(Date.now() + options.delay).toISOString()
        : new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('queue_jobs')
      .insert(job)
      .select()
      .single()

    if (error) {
      console.error('Failed to add job to queue:', error)
      throw error
    }

    console.log(`Added job ${data.id} to queue: ${type}`)
    return data.id
  }

  // Traitement des jobs en continu
  private startProcessing(): void {
    if (this.processingInterval) return

    this.processingInterval = setInterval(async () => {
      if (this.isProcessing) return
      
      await this.processNextJob()
    }, 5000) // Traiter toutes les 5 secondes

    console.log('Queue processor started')
  }

  // Arrêter le traitement
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    console.log('Queue processor stopped')
  }

  // Traiter le prochain job
  private async processNextJob(): Promise<void> {
    this.isProcessing = true

    try {
      // Récupérer le prochain job à traiter
      const { data: jobs, error } = await supabase
        .from('queue_jobs')
        .select('*')
        .in('status', ['pending', 'retry'])
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)

      if (error || !jobs || jobs.length === 0) {
        return
      }

      const job = jobs[0]
      await this.executeJob(job)

    } catch (error) {
      console.error('Error processing queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  // Exécuter un job spécifique
  private async executeJob(job: any): Promise<void> {
    console.log(`Executing job ${job.id}: ${job.type}`)

    // Marquer comme en cours
    await supabase
      .from('queue_jobs')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', job.id)

    try {
      await this.processJobByType(job)

      // Marquer comme terminé
      await supabase
        .from('queue_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      console.log(`Job ${job.id} completed successfully`)

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)
      await this.handleJobFailure(job, error as Error)
    }
  }

  // Traitement selon le type de job
  private async processJobByType(job: any): Promise<void> {
    switch (job.type) {
      case 'sync':
        await this.processSyncJob(job)
        break
      
      case 'import':
        await this.processImportJob(job)
        break
      
      case 'export':
        await this.processExportJob(job)
        break
        
      case 'webhook':
        await this.processWebhookJob(job)
        break
        
      case 'email':
        await this.processEmailJob(job)
        break
        
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  }

  // Traitement des jobs de sync
  private async processSyncJob(job: any): Promise<void> {
    const { jobId, type: syncType, supplierId, config } = job.payload

    // Importer le service de sync dynamiquement pour éviter les dépendances circulaires
    const { syncService } = await import('./SyncService')
    
    // Ici on pourrait appeler directement la méthode appropriée du SyncService
    // Pour l'exemple, on simule le traitement
    console.log(`Processing sync job for ${supplierId}: ${syncType}`)
    
    // Simuler le traitement
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Traitement des jobs d'import
  private async processImportJob(job: any): Promise<void> {
    const { source, config } = job.payload
    console.log(`Processing import from ${source}`)
    
    // Ici on intégrerait avec les services d'import
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  // Traitement des jobs d'export
  private async processExportJob(job: any): Promise<void> {
    const { destination, format, filters } = job.payload
    console.log(`Processing export to ${destination} in ${format} format`)
    
    // Ici on intégrerait avec les services d'export (Shopify, WooCommerce, etc.)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Traitement des webhooks
  private async processWebhookJob(job: any): Promise<void> {
    const { url, method, payload: webhookPayload } = job.payload
    
    const response = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }

    console.log(`Webhook sent to ${url}: ${response.status}`)
  }

  // Traitement des emails
  private async processEmailJob(job: any): Promise<void> {
    const { to, subject, template, data } = job.payload
    console.log(`Sending email to ${to}: ${subject}`)
    
    // Ici on intégrerait avec un service d'email (SendGrid, etc.)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Gestion des échecs
  private async handleJobFailure(job: any, error: Error): Promise<void> {
    const retryCount = (job.retry_count || 0) + 1
    
    if (retryCount <= job.max_retries) {
      // Retry avec backoff exponentiel
      const delay = Math.pow(2, retryCount) * 60000 // 2^n minutes
      const scheduledFor = new Date(Date.now() + delay).toISOString()
      
      await supabase
        .from('queue_jobs')
        .update({ 
          status: 'retry',
          retry_count: retryCount,
          error_message: error.message,
          scheduled_for: scheduledFor
        })
        .eq('id', job.id)

      console.log(`Job ${job.id} scheduled for retry ${retryCount}/${job.max_retries} in ${delay/60000} minutes`)
    } else {
      // Échec définitif
      await supabase
        .from('queue_jobs')
        .update({ 
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      console.error(`Job ${job.id} permanently failed after ${job.max_retries} retries`)
    }
  }

  // Statistiques de la queue
  async getQueueStats(): Promise<any> {
    const { data, error } = await supabase
      .from('queue_jobs')
      .select('status, type')

    if (error) return null

    const stats = {
      total: data?.length || 0,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>
    }

    data?.forEach(job => {
      stats.by_status[job.status] = (stats.by_status[job.status] || 0) + 1
      stats.by_type[job.type] = (stats.by_type[job.type] || 0) + 1
    })

    return stats
  }

  // Nettoyer les anciens jobs
  async cleanupOldJobs(days: number = 7): Promise<void> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const { error } = await supabase
      .from('queue_jobs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Failed to cleanup old jobs:', error)
    } else {
      console.log(`Cleaned up jobs older than ${days} days`)
    }
  }
}

export const queueService = QueueService.getInstance()