/**
 * Service simplifié de monitoring des stocks et prix
 * Utilise les tables existantes sans nécessiter de nouvelles tables
 */

import { supabase } from '@/integrations/supabase/client'

export interface MonitoringConfig {
  enabled: boolean
  checkInterval: number // minutes
  priceChangeThreshold: number // pourcentage
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
   * Vérifie les stocks et prix pour un utilisateur
   */
  async checkProducts(userId: string): Promise<ProductMonitoringStatus[]> {
    // Récupérer tous les produits avec leurs infos de stock
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, stock, updated_at')
      .eq('user_id', userId)

    if (error) throw error

    const statuses: ProductMonitoringStatus[] = []

    for (const product of products || []) {
      const alerts: string[] = []
      let needsSync = false

      // Vérifier le stock
      if (product.stock < 10) {
        alerts.push(`Stock faible: ${product.stock} unités`)
        needsSync = true
      }

      // Vérifier si le produit n'a pas été mis à jour récemment
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceUpdate > 7) {
        alerts.push(`Pas mis à jour depuis ${daysSinceUpdate} jours`)
      }

      statuses.push({
        productId: product.id,
        productName: product.name,
        currentStock: product.stock || 0,
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
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (error) throw error
  }

  /**
   * Récupère la configuration de monitoring pour un utilisateur
   */
  async getConfig(userId: string): Promise<MonitoringConfig> {
    // Configuration par défaut (peut être stockée en DB plus tard)
    return {
      enabled: true,
      checkInterval: 60, // 1 heure
      priceChangeThreshold: 10, // 10%
      stockThreshold: 10
    }
  }

  /**
   * Met à jour la configuration de monitoring
   */
  async updateConfig(userId: string, config: MonitoringConfig): Promise<void> {
    // Pour l'instant, stocké en local
    // TODO: Stocker dans une table user_settings
    console.log('Config updated for user', userId, config)
  }
}

export const stockPriceMonitor = new StockPriceMonitor()
