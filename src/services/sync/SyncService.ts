import { supabase } from '@/integrations/supabase/client'
import { BigBuyConnector } from '@/services/connectors/BigBuyConnector'
import { DeduplicationService } from './DeduplicationService'
import { QueueService } from './QueueService'

export interface SyncJob {
  id: string
  type: 'products' | 'stock' | 'orders'
  supplier_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
  auto_enabled: boolean
}

export class SyncService {
  private static instance: SyncService
  private queueService: QueueService
  private deduplicationService: DeduplicationService

  private constructor() {
    this.queueService = QueueService.getInstance()
    this.deduplicationService = DeduplicationService.getInstance()
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  // Synchronisation manuelle
  async triggerSync(integrationId: string, type: 'products' | 'stock' = 'products'): Promise<void> {
    await this.queueService.addJob('sync', {
      integrationId,
      type,
      manual: true
    })
  }

  // Sync BigBuy products using real API
  async syncBigBuyProducts(integration: any): Promise<void> {
    console.log(`Syncing BigBuy products for integration ${integration.id}`)

    try {
      // Use supplier-sync-products edge function for real sync
      const { data, error } = await supabase.functions.invoke('supplier-sync-products', {
        body: {
          supplierId: integration.id,
          limit: 1000
        }
      })

      if (error) throw error

      console.log(`Sync completed: ${data?.syncStats?.imported || 0} products imported`)
    } catch (error) {
      console.error('BigBuy sync error:', error)
      throw error
    }
  }

  // Sync any supplier using unified edge function
  async syncSupplier(supplierId: string, limit: number = 1000): Promise<any> {
    const { data, error } = await supabase.functions.invoke('supplier-sync-products', {
      body: { supplierId, limit }
    })

    if (error) throw error
    return data
  }
}

export const syncService = SyncService.getInstance()