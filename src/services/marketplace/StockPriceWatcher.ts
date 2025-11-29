import { supabase } from '@/integrations/supabase/client'
import type {
  StockPriceMonitoring,
  StockPriceChange,
  MonitoringAlert,
  MonitoringDashboardStats
} from '@/types/marketplace-monitoring'

/**
 * Service de surveillance automatique des stocks et prix
 * Synchronise avec les fournisseurs et met à jour automatiquement les marketplaces
 */
export class StockPriceWatcher {
  /**
   * Vérifie les changements de stock/prix pour un produit
   */
  async checkProduct(monitoringId: string): Promise<{
    hasChanges: boolean
    changes: StockPriceChange[]
    alerts: MonitoringAlert[]
  }> {
    // Récupère la configuration de monitoring
    const { data: monitoring, error } = await supabase
      .from('stock_price_monitoring')
      .select('*')
      .eq('id', monitoringId)
      .single()

    if (error || !monitoring) {
      throw new Error('Monitoring configuration not found')
    }

    // Récupère les données actuelles du fournisseur
    const supplierData = await this.fetchSupplierData(monitoring)

    const changes: StockPriceChange[] = []
    const alerts: MonitoringAlert[] = []

    // Vérifie le stock
    if (monitoring.monitor_stock && supplierData.stock !== undefined) {
      const stockChanged = supplierData.stock !== monitoring.supplier_stock
      
      if (stockChanged) {
        const change = this.createStockChange(monitoring, supplierData.stock)
        changes.push(change)

        // Vérifie les seuils d'alerte
        if (monitoring.min_stock_threshold && supplierData.stock < monitoring.min_stock_threshold) {
          alerts.push(this.createAlert(monitoring, 'stock_low', 
            `Stock faible: ${supplierData.stock} unités (seuil: ${monitoring.min_stock_threshold})`
          ))
        }

        if (supplierData.stock === 0) {
          alerts.push(this.createAlert(monitoring, 'stock_out', 'Produit en rupture de stock'))
        }

        // Synchronise automatiquement si activé
        if (monitoring.stock_sync_enabled) {
          await this.syncStockToMarketplace(monitoring, supplierData.stock)
        }
      }
    }

    // Vérifie le prix
    if (monitoring.monitor_price && supplierData.price !== undefined) {
      const priceChanged = supplierData.price !== monitoring.supplier_price
      
      if (priceChanged) {
        const change = this.createPriceChange(monitoring, supplierData.price)
        changes.push(change)

        // Vérifie la variation de prix
        const variationPercent = Math.abs(
          ((supplierData.price - (monitoring.supplier_price || 0)) / (monitoring.supplier_price || 1)) * 100
        )

        if (monitoring.max_price_variation_percent && 
            variationPercent > monitoring.max_price_variation_percent) {
          alerts.push(this.createAlert(monitoring, 'price_change',
            `Variation de prix importante: ${variationPercent.toFixed(1)}% (seuil: ${monitoring.max_price_variation_percent}%)`
          ))
        }

        // Calcule et synchronise le nouveau prix si activé
        if (monitoring.price_sync_enabled) {
          const newMarketplacePrice = this.calculateMarketplacePrice(monitoring, supplierData.price)
          await this.syncPriceToMarketplace(monitoring, newMarketplacePrice)
        }
      }
    }

    // Met à jour l'état du monitoring
    await supabase
      .from('stock_price_monitoring')
      .update({
        supplier_stock: supplierData.stock,
        supplier_price: supplierData.price,
        last_checked_at: new Date().toISOString(),
        ...(changes.length > 0 ? { last_synced_at: new Date().toISOString() } : {})
      })
      .eq('id', monitoringId)

    // Sauvegarde les changements et alertes
    if (changes.length > 0) {
      await supabase.from('stock_price_changes').insert(changes)
    }

    if (alerts.length > 0) {
      await supabase.from('monitoring_alerts').insert(alerts)
    }

    return {
      hasChanges: changes.length > 0,
      changes,
      alerts
    }
  }

  /**
   * Récupère les données du fournisseur (stock + prix)
   */
  private async fetchSupplierData(monitoring: StockPriceMonitoring): Promise<{
    stock?: number
    price?: number
  }> {
    // TODO: Implémenter l'appel aux APIs fournisseurs
    // Pour l'instant, simule des données
    
    // Cette méthode devra:
    // 1. Identifier le fournisseur du produit
    // 2. Utiliser le connecteur approprié (API, scraper, etc.)
    // 3. Récupérer stock et prix actuels
    
    return {
      stock: Math.floor(Math.random() * 100),
      price: 10 + Math.random() * 50
    }
  }

  /**
   * Calcule le prix marketplace en appliquant la marge
   */
  private calculateMarketplacePrice(
    monitoring: StockPriceMonitoring,
    supplierPrice: number
  ): number {
    const { margin_type, margin_value, price_formula } = monitoring

    switch (margin_type) {
      case 'fixed':
        return supplierPrice + (margin_value || 0)

      case 'percentage':
        return supplierPrice * (1 + (margin_value || 0) / 100)

      case 'formula':
        if (price_formula) {
          try {
            // Évalue la formule (attention: utiliser une lib sécurisée en prod)
            const formula = price_formula.replace(/{{supplier_price}}/g, String(supplierPrice))
            return eval(formula) // WARNING: Utiliser mathjs ou similar en production!
          } catch {
            return supplierPrice * 1.2 // Fallback 20%
          }
        }
        return supplierPrice * 1.2

      default:
        return supplierPrice * 1.2 // Défaut 20%
    }
  }

  /**
   * Synchronise le stock vers la marketplace
   */
  private async syncStockToMarketplace(
    monitoring: StockPriceMonitoring,
    newStock: number
  ): Promise<void> {
    // TODO: Appeler l'API de la marketplace pour mettre à jour le stock
    const { data: integration } = await supabase
      .from('marketplace_integrations')
      .select('platform, api_key')
      .eq('id', monitoring.marketplace_integration_id)
      .single()

    if (!integration) return

    // Appel API marketplace (à implémenter par plateforme)
    console.log(`Sync stock to ${integration.platform}: product ${monitoring.product_id} -> ${newStock}`)
  }

  /**
   * Synchronise le prix vers la marketplace
   */
  private async syncPriceToMarketplace(
    monitoring: StockPriceMonitoring,
    newPrice: number
  ): Promise<void> {
    // TODO: Appeler l'API de la marketplace pour mettre à jour le prix
    const { data: integration } = await supabase
      .from('marketplace_integrations')
      .select('platform, api_key')
      .eq('id', monitoring.marketplace_integration_id)
      .single()

    if (!integration) return

    // Appel API marketplace (à implémenter par plateforme)
    console.log(`Sync price to ${integration.platform}: product ${monitoring.product_id} -> ${newPrice}`)
  }

  /**
   * Crée un changement de stock
   */
  private createStockChange(
    monitoring: StockPriceMonitoring,
    newStock: number
  ): StockPriceChange {
    const oldStock = monitoring.current_stock || 0
    return {
      id: crypto.randomUUID(),
      monitoring_id: monitoring.id,
      product_id: monitoring.product_id,
      change_type: 'stock',
      old_value: oldStock,
      new_value: newStock,
      change_percent: ((newStock - oldStock) / Math.max(oldStock, 1)) * 100,
      auto_sync_applied: monitoring.stock_sync_enabled,
      sync_result: 'success',
      alert_triggered: false,
      detected_at: new Date().toISOString(),
      synced_at: monitoring.stock_sync_enabled ? new Date().toISOString() : undefined
    }
  }

  /**
   * Crée un changement de prix
   */
  private createPriceChange(
    monitoring: StockPriceMonitoring,
    newPrice: number
  ): StockPriceChange {
    const oldPrice = monitoring.current_price || 0
    return {
      id: crypto.randomUUID(),
      monitoring_id: monitoring.id,
      product_id: monitoring.product_id,
      change_type: 'price',
      old_value: oldPrice,
      new_value: newPrice,
      change_percent: ((newPrice - oldPrice) / Math.max(oldPrice, 1)) * 100,
      auto_sync_applied: monitoring.price_sync_enabled,
      sync_result: 'success',
      alert_triggered: false,
      detected_at: new Date().toISOString(),
      synced_at: monitoring.price_sync_enabled ? new Date().toISOString() : undefined
    }
  }

  /**
   * Crée une alerte
   */
  private createAlert(
    monitoring: StockPriceMonitoring,
    type: MonitoringAlert['alert_type'],
    message: string
  ): MonitoringAlert {
    return {
      id: crypto.randomUUID(),
      user_id: monitoring.user_id,
      monitoring_id: monitoring.id,
      product_id: monitoring.product_id,
      marketplace: '', // À récupérer depuis l'intégration
      alert_type: type,
      severity: type === 'stock_out' ? 'critical' : type === 'stock_low' ? 'warning' : 'info',
      title: this.getAlertTitle(type),
      message,
      data: {},
      read: false,
      resolved: false,
      created_at: new Date().toISOString()
    }
  }

  private getAlertTitle(type: MonitoringAlert['alert_type']): string {
    const titles = {
      stock_low: 'Stock faible',
      stock_out: 'Rupture de stock',
      price_change: 'Variation de prix',
      sync_error: 'Erreur de synchronisation',
      supplier_unavailable: 'Fournisseur indisponible'
    }
    return titles[type] || 'Alerte'
  }

  /**
   * Vérifie tous les produits d'un utilisateur
   */
  async checkAllProducts(userId: string): Promise<{
    total: number
    withChanges: number
    totalChanges: number
    totalAlerts: number
  }> {
    const { data: monitorings } = await supabase
      .from('stock_price_monitoring')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (!monitorings) return { total: 0, withChanges: 0, totalChanges: 0, totalAlerts: 0 }

    let withChanges = 0
    let totalChanges = 0
    let totalAlerts = 0

    for (const monitoring of monitorings) {
      try {
        const result = await this.checkProduct(monitoring.id)
        if (result.hasChanges) {
          withChanges++
          totalChanges += result.changes.length
          totalAlerts += result.alerts.length
        }
      } catch (error) {
        console.error(`Error checking product ${monitoring.id}:`, error)
      }
    }

    return {
      total: monitorings.length,
      withChanges,
      totalChanges,
      totalAlerts
    }
  }

  /**
   * Récupère les statistiques du dashboard
   */
  async getDashboardStats(userId: string): Promise<MonitoringDashboardStats> {
    // Compte total de produits surveillés
    const { count: total } = await supabase
      .from('stock_price_monitoring')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Par statut
    const { count: active } = await supabase
      .from('stock_price_monitoring')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')

    const { count: paused } = await supabase
      .from('stock_price_monitoring')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'paused')

    const { count: error } = await supabase
      .from('stock_price_monitoring')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'error')

    // Alertes
    const { count: stockAlerts } = await supabase
      .from('monitoring_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('alert_type', ['stock_low', 'stock_out'])
      .eq('resolved', false)

    const { count: priceAlerts } = await supabase
      .from('monitoring_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('alert_type', 'price_change')
      .eq('resolved', false)

    const { count: unresolved } = await supabase
      .from('monitoring_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('resolved', false)

    // Syncs aujourd'hui
    const today = new Date().toISOString().split('T')[0]
    const { data: todayChanges } = await supabase
      .from('stock_price_changes')
      .select('sync_result')
      .gte('detected_at', today)

    const todaySyncs = todayChanges?.length || 0
    const successSyncs = todayChanges?.filter(c => c.sync_result === 'success').length || 0

    return {
      total_monitored_products: total || 0,
      active_monitors: active || 0,
      paused_monitors: paused || 0,
      error_monitors: error || 0,
      stock_alerts: stockAlerts || 0,
      price_alerts: priceAlerts || 0,
      unresolved_alerts: unresolved || 0,
      today_syncs: todaySyncs,
      today_sync_success_rate: todaySyncs > 0 ? (successSyncs / todaySyncs) * 100 : 100,
      avg_price_change_percent: 0, // TODO: calculer depuis les changes
      products_out_of_stock: 0, // TODO: compter depuis monitoring
      products_low_stock: 0 // TODO: compter depuis monitoring
    }
  }
}

export const stockPriceWatcher = new StockPriceWatcher()
