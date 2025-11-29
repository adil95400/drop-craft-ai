/**
 * Service de monitoring des stocks et prix
 * Utilise catalog_products et marketplace_integrations
 */

import { supabase } from '@/integrations/supabase/client'

export interface MonitoringConfig {
  enabled: boolean
  checkInterval: number
  priceChangeThreshold: number
  stockThreshold: number
}

export interface ProductMonitoringStatus {
  productId: string
  productName: string
  currentStock: number
  currentPrice: number
  lastChecked: string
  needsSync: boolean
  alerts: string[]
}

export class StockPriceMonitor {
  /**
   * Vérifie les produits du catalogue
   */
  async checkProducts(userId: string): Promise<ProductMonitoringStatus[]> {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, updated_at')
      .eq('user_id', userId)
      .limit(100)

    const statuses: ProductMonitoringStatus[] = []

    for (const product of products || []) {
      const alerts: string[] = []
      let needsSync = false
      const stock = product.stock_quantity || 0

      // Check stock
      if (stock < 10) {
        alerts.push(`Stock faible: ${stock} unités`)
        needsSync = true
      }

      // Check last update
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceUpdate > 7) {
        alerts.push(`Pas mis à jour depuis ${daysSinceUpdate} jours`)
      }

      statuses.push({
        productId: product.id,
        productName: product.name,
        currentStock: stock,
        currentPrice: product.price || 0,
        lastChecked: new Date().toISOString(),
        needsSync,
        alerts
      })
    }

    return statuses
  }

  /**
   * Met à jour le prix d'un produit
   */
  async updateProductPrice(productId: string, newPrice: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ price: newPrice, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (error) throw error
  }

  /**
   * Met à jour le stock d'un produit
   */
  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (error) throw error
  }

  /**
   * Configuration monitoring
   */
  async getConfig(userId: string): Promise<MonitoringConfig> {
    return {
      enabled: true,
      checkInterval: 60,
      priceChangeThreshold: 10,
      stockThreshold: 10
    }
  }

  async updateConfig(userId: string, config: MonitoringConfig): Promise<void> {
    console.log('Config updated for user', userId, config)
  }
}

export const stockPriceMonitor = new StockPriceMonitor()
