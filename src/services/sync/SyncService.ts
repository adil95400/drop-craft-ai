import { supabase } from '@/integrations/supabase/client'
import { BigBuyConnector } from '@/services/connectors/BigBuyConnector'
import { DeduplicationService } from './DeduplicationService'
import { QueueService } from './QueueService'

export interface SyncJob {
  id: string
  type: 'products' | 'stock' | 'orders'
  supplier_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  last_sync: Date | null
  next_sync: Date
  frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
  auto_enabled: boolean
  config: Record<string, any>
  error_count: number
  last_error?: string
}

export class SyncService {
  private static instance: SyncService
  private queueService: QueueService
  private deduplicationService: DeduplicationService
  private syncJobs: Map<string, SyncJob> = new Map()

  private constructor() {
    this.queueService = QueueService.getInstance()
    this.deduplicationService = DeduplicationService.getInstance()
    this.initializeFromDatabase()
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  async initializeFromDatabase() {
    try {
      const { data: jobs } = await supabase
        .from('sync_jobs')
        .select('*')
        .eq('auto_enabled', true)

      jobs?.forEach(job => {
        this.syncJobs.set(job.id, {
          ...job,
          last_sync: job.last_sync ? new Date(job.last_sync) : null,
          next_sync: new Date(job.next_sync)
        })
      })

      console.log(`Initialized ${this.syncJobs.size} sync jobs`)
    } catch (error) {
      console.error('Failed to initialize sync jobs:', error)
    }
  }

  // Création d'un job de synchronisation
  async createSyncJob(params: {
    type: SyncJob['type']
    supplier_id: string
    frequency: SyncJob['frequency']
    auto_enabled: boolean
    config?: Record<string, any>
  }): Promise<SyncJob> {
    const nextSync = this.calculateNextSync(params.frequency)
    
    const jobData = {
      type: params.type,
      supplier_id: params.supplier_id,
      status: 'pending' as const,
      last_sync: null,
      next_sync: nextSync.toISOString(),
      frequency: params.frequency,
      auto_enabled: params.auto_enabled,
      config: params.config || {},
      error_count: 0
    }

    const { data: job, error } = await supabase
      .from('sync_jobs')
      .insert(jobData)
      .select()
      .single()

    if (error) throw error

    const syncJob: SyncJob = {
      ...job,
      last_sync: null,
      next_sync: nextSync
    }

    this.syncJobs.set(job.id, syncJob)
    return syncJob
  }

  // Synchronisation manuelle
  async triggerSync(jobId: string): Promise<void> {
    const job = this.syncJobs.get(jobId)
    if (!job) {
      throw new Error(`Sync job ${jobId} not found`)
    }

    await this.queueService.addJob('sync', {
      jobId,
      type: job.type,
      supplierId: job.supplier_id,
      config: job.config
    })
  }

  // Synchronisation automatique (appelée par cron)
  async runScheduledSyncs(): Promise<void> {
    const now = new Date()
    const jobsToRun = Array.from(this.syncJobs.values()).filter(
      job => job.auto_enabled && job.next_sync <= now && job.status !== 'running'
    )

    console.log(`Running ${jobsToRun.length} scheduled sync jobs`)

    for (const job of jobsToRun) {
      try {
        await this.executeSyncJob(job)
      } catch (error) {
        console.error(`Failed to execute sync job ${job.id}:`, error)
        await this.handleSyncError(job.id, error as Error)
      }
    }
  }

  // Exécution d'un job de sync
  private async executeSyncJob(job: SyncJob): Promise<void> {
    await this.updateJobStatus(job.id, 'running')

    try {
      switch (job.type) {
        case 'products':
          await this.syncProducts(job)
          break
        case 'stock':
          await this.syncStock(job)
          break
        case 'orders':
          await this.syncOrders(job)
          break
      }

      await this.updateJobStatus(job.id, 'completed')
      await this.scheduleNextSync(job.id)
    } catch (error) {
      await this.updateJobStatus(job.id, 'failed')
      throw error
    }
  }

  // Synchronisation des produits
  private async syncProducts(job: SyncJob): Promise<void> {
    const connector = await this.getConnector(job.supplier_id)
    if (!connector) return

    const lastSync = job.last_sync
    const products = await connector.fetchProducts({
      lastSync,
      limit: job.config.batchSize || 100
    })

    console.log(`Fetched ${products.length} products from ${job.supplier_id}`)

    // Déduplication
    const uniqueProducts = await this.deduplicationService.deduplicateProducts(products)
    console.log(`${uniqueProducts.length} unique products after deduplication`)

    // Sauvegarde en base
    for (const product of uniqueProducts) {
      await supabase
        .from('products')
        .upsert({
          sku: product.sku,
          name: product.title,
          description: product.description,
          price: product.price,
          cost_price: product.costPrice,
          currency: product.currency,
          stock_quantity: product.stock,
          image_urls: product.images,
          supplier_sku: product.supplier.sku,
          supplier_name: product.supplier.name,
          category: product.category,
          brand: product.brand,
          weight: product.weight,
          updated_at: new Date().toISOString()
        }, { onConflict: 'sku' })
    }
  }

  // Synchronisation du stock
  private async syncStock(job: SyncJob): Promise<void> {
    const connector = await this.getConnector(job.supplier_id)
    if (!connector?.fetchInventory) return

    // Récupérer les SKUs des produits du fournisseur
    const { data: products } = await supabase
      .from('products')
      .select('sku, supplier_sku')
      .eq('supplier_name', job.supplier_id)

    if (!products?.length) return

    const skus = products.map(p => p.supplier_sku).filter(Boolean)
    const inventory = await connector.fetchInventory(skus)

    console.log(`Updated stock for ${inventory.length} products`)

    // Mise à jour du stock
    for (const item of inventory) {
      const product = products.find(p => p.supplier_sku === item.sku)
      if (product) {
        await supabase
          .from('products')
          .update({ 
            stock_quantity: item.stock,
            updated_at: new Date().toISOString()
          })
          .eq('sku', product.sku)
      }
    }
  }

  // Synchronisation des commandes
  private async syncOrders(job: SyncJob): Promise<void> {
    // Récupérer les commandes en attente
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('supplier_id', job.supplier_id)
      .in('status', ['pending', 'processing'])

    if (!pendingOrders?.length) return

    const connector = await this.getConnector(job.supplier_id)
    if (!connector?.getOrderStatus) return

    for (const order of pendingOrders) {
      try {
        const status = await connector.getOrderStatus(order.supplier_order_id)
        if (status !== order.status) {
          await supabase
            .from('orders')
            .update({ 
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)
        }
      } catch (error) {
        console.error(`Failed to sync order ${order.id}:`, error)
      }
    }
  }

  // Récupération du connecteur
  private async getConnector(supplierId: string) {
    const { data: supplier } = await supabase
      .from('integrations')
      .select('*')
      .eq('platform_name', supplierId)
      .single()

    if (!supplier) return null

    // Pour BigBuy
    if (supplier.platform_name === 'BigBuy') {
      return new BigBuyConnector({
        apiKey: supplier.api_key || ''
      })
    }

    return null
  }

  // Utilitaires
  private calculateNextSync(frequency: SyncJob['frequency']): Date {
    const now = new Date()
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  private async updateJobStatus(jobId: string, status: SyncJob['status']): Promise<void> {
    await supabase
      .from('sync_jobs')
      .update({ 
        status,
        last_sync: status === 'completed' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    const job = this.syncJobs.get(jobId)
    if (job) {
      job.status = status
      if (status === 'completed') {
        job.last_sync = new Date()
      }
    }
  }

  private async scheduleNextSync(jobId: string): Promise<void> {
    const job = this.syncJobs.get(jobId)
    if (!job) return

    const nextSync = this.calculateNextSync(job.frequency)
    
    await supabase
      .from('sync_jobs')
      .update({ 
        next_sync: nextSync.toISOString(),
        error_count: 0
      })
      .eq('id', jobId)

    job.next_sync = nextSync
    job.error_count = 0
  }

  private async handleSyncError(jobId: string, error: Error): Promise<void> {
    const job = this.syncJobs.get(jobId)
    if (!job) return

    job.error_count = (job.error_count || 0) + 1
    
    await supabase
      .from('sync_jobs')
      .update({ 
        error_count: job.error_count,
        last_error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Désactiver si trop d'erreurs
    if (job.error_count >= 5) {
      await supabase
        .from('sync_jobs')
        .update({ auto_enabled: false })
        .eq('id', jobId)
      
      job.auto_enabled = false
      console.warn(`Disabled sync job ${jobId} after 5 consecutive errors`)
    }
  }
}

export const syncService = SyncService.getInstance()