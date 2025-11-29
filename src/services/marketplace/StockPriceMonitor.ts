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
      .from('catalog_products')
      .select('id, name, price, quantity_available, updated_at')
      .eq('user_id', userId)

    const statuses: ProductMonitoringStatus[] = []

    for (const product of products || []) {
      const alerts: string[] = []
      let needsSync = false

      // Vérifier stock
      if ((product.quantity_available || 0) < 10) {
        alerts.push(`Stock faible: ${product.quantity_available || 0} unités`)
        needsSync = true
      }

      // Vérifier ancienneté mise à jour
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceUpdate > 7) {
        alerts.push(`Pas mis à jour depuis ${daysSinceUpdate} jours`)
      }

      statuses.push({
        productId: product.id,
        productName: product.name,
        currentStock: product.quantity_available || 0,
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
      .from('catalog_products')
      .update({ price: newPrice, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (error) throw error
  }

  /**
   * Met à jour le stock d'un produit
   */
  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('catalog_products')
      .update({ quantity_available: newStock, updated_at: new Date().toISOString() })
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
