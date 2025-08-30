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

  // Synchronisation des produits BigBuy
  async syncBigBuyProducts(integration: any): Promise<void> {
    console.log(`Syncing BigBuy products for integration ${integration.id}`)

    const connector = new BigBuyConnector({
      apiKey: integration.api_key || ''
    })

    const products = await connector.fetchProducts({ limit: 100 })
    const uniqueProducts = await this.deduplicationService.deduplicateProducts(products)

    console.log(`${uniqueProducts.length} unique products to import`)

    // Sauvegarder les produits
    for (const product of uniqueProducts) {
      await supabase
        .from('imported_products')
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
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'sku' })
    }
  }
}

export const syncService = SyncService.getInstance()