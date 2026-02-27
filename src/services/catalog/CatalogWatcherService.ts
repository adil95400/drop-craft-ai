/**
 * CATALOG WATCHER SERVICE
 * Service de surveillance et monitoring du catalogue produits
 * Détecte les changements et déclenche des audits/règles automatiques
 */

import { UnifiedProduct } from '@/services/ProductsUnifiedService'
import { auditProduct } from '@/lib/audit/auditProduct'
import { ProductRule } from '@/lib/rules/ruleTypes'
import { ProductRuleEngine } from '@/lib/rules/ProductRuleEngine'
import { supabase } from '@/integrations/supabase/client'

export type CatalogEventType =
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'product_audit_failed'
  | 'product_rule_applied'
  | 'product_auto_fixed'
  | 'inventory_low'
  | 'price_changed'
  | 'score_degraded'

export interface CatalogEvent {
  id?: string
  user_id: string
  product_id: string
  product_name: string
  event_type: CatalogEventType
  severity: 'info' | 'warning' | 'critical'
  details: Record<string, any>
  created_at?: string
}

export interface WatcherConfig {
  autoAudit: boolean
  autoApplyRules: boolean
  autoFixCritical: boolean
  notifyOnCritical: boolean
  lowStockThreshold: number
  scoreThreshold: number
  aiService?: any
}

export class CatalogWatcherService {
  private static config: WatcherConfig = {
    autoAudit: true,
    autoApplyRules: false,
    autoFixCritical: false,
    notifyOnCritical: true,
    lowStockThreshold: 10,
    scoreThreshold: 40
  }

  /**
   * Configuration du watcher
   */
  static configure(config: Partial<WatcherConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Surveiller un changement de produit
   */
  static async watchProductChange(
    userId: string,
    product: UnifiedProduct,
    eventType: CatalogEventType,
    before?: UnifiedProduct,
    rules?: ProductRule[]
  ): Promise<void> {
    const events: CatalogEvent[] = []

    try {
      // 1. Audit automatique si activé
      if (this.config.autoAudit) {
        const auditResult = auditProduct(product)
        
        // Détecter dégradation du score
        if (before && auditResult.score.global < this.config.scoreThreshold) {
          const beforeAudit = auditProduct(before)
          if (auditResult.score.global < beforeAudit.score.global - 10) {
            events.push({
              user_id: userId,
              product_id: product.id,
              product_name: product.name,
              event_type: 'score_degraded',
              severity: 'warning',
              details: {
                before_score: beforeAudit.score.global,
                after_score: auditResult.score.global,
                issues: auditResult.issues
              }
            })
          }
        }

        // Détecter audit critique
        const hasCritical = auditResult.issues.some(i => i.severity === 'critical')
        if (hasCritical) {
          events.push({
            user_id: userId,
            product_id: product.id,
            product_name: product.name,
            event_type: 'product_audit_failed',
            severity: 'critical',
            details: {
              score: auditResult.score.global,
              critical_issues: auditResult.issues.filter(i => i.severity === 'critical')
            }
          })
        }
      }

      // 2. Vérifier stock faible
      if (product.stock_quantity !== undefined && product.stock_quantity < this.config.lowStockThreshold) {
        events.push({
          user_id: userId,
          product_id: product.id,
          product_name: product.name,
          event_type: 'inventory_low',
          severity: product.stock_quantity === 0 ? 'critical' : 'warning',
          details: {
            stock_quantity: product.stock_quantity,
            threshold: this.config.lowStockThreshold
          }
        })
      }

      // 3. Détecter changement de prix
      if (before && product.price !== before.price) {
        const priceChange = ((product.price - before.price) / before.price) * 100
        events.push({
          user_id: userId,
          product_id: product.id,
          product_name: product.name,
          event_type: 'price_changed',
          severity: Math.abs(priceChange) > 20 ? 'warning' : 'info',
          details: {
            before_price: before.price,
            after_price: product.price,
            change_percent: priceChange.toFixed(2)
          }
        })
      }

      // 4. Appliquer les règles automatiques si activé
      if (this.config.autoApplyRules && rules && rules.length > 0) {
        const { results } = await ProductRuleEngine.applyRules(product, rules, {
          aiService: this.config.aiService
        })

        for (const result of results) {
          if (result.success && result.appliedActions.some(a => a.success)) {
            events.push({
              user_id: userId,
              product_id: product.id,
              product_name: product.name,
              event_type: 'product_rule_applied',
              severity: 'info',
              details: {
                rule_id: result.ruleId,
                rule_name: result.ruleName,
                actions: result.appliedActions.filter(a => a.success).map(a => ({
                  field: a.action.field,
                  type: a.action.type,
                  before: a.before,
                  after: a.after
                }))
              }
            })
          }
        }
      }

      // 5. Enregistrer les événements
      if (events.length > 0) {
        await this.logEvents(events)
      }

      // 6. Notifier si critique
      if (this.config.notifyOnCritical && events.some(e => e.severity === 'critical')) {
        await this.sendCriticalNotification(userId, events.filter(e => e.severity === 'critical'))
      }

    } catch (error) {
      console.error('[CatalogWatcher] Error watching product change:', error)
    }
  }

  /**
   * Surveiller un lot de produits (batch)
   */
  static async watchBatch(
    userId: string,
    products: UnifiedProduct[],
    rules?: ProductRule[]
  ): Promise<{
    totalProcessed: number
    criticalCount: number
    warningCount: number
    events: CatalogEvent[]
  }> {
    const allEvents: CatalogEvent[] = []

    for (const product of products) {
      await this.watchProductChange(userId, product, 'product_updated', undefined, rules)
    }

    // Récupérer les événements récents depuis activity_logs
    const { data: logs } = await (supabase
      .from('activity_logs') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', 'catalog_event')
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .order('created_at', { ascending: false })

    const events: CatalogEvent[] = (logs || []).map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      product_id: log.entity_id,
      product_name: log.description || '',
      event_type: log.action as CatalogEventType,
      severity: log.severity as 'info' | 'warning' | 'critical',
      details: log.details || {},
      created_at: log.created_at
    }))

    return {
      totalProcessed: products.length,
      criticalCount: events.filter(e => e.severity === 'critical').length,
      warningCount: events.filter(e => e.severity === 'warning').length,
      events
    }
  }

  /**
   * Obtenir les événements récents
   */
  static async getRecentEvents(
    userId: string,
    options: {
      limit?: number
      severity?: CatalogEvent['severity']
      eventType?: CatalogEventType
      productId?: string
    } = {}
  ): Promise<CatalogEvent[]> {
    const { limit = 100, severity, eventType, productId } = options

    let query = (supabase
      .from('activity_logs') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', 'catalog_event')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (eventType) {
      query = query.eq('action', eventType)
    }

    if (productId) {
      query = query.eq('entity_id', productId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[CatalogWatcher] Error fetching events:', error)
      return []
    }

    return (data || []).map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      product_id: log.entity_id,
      product_name: log.description || '',
      event_type: log.action as CatalogEventType,
      severity: log.severity as 'info' | 'warning' | 'critical',
      details: log.details || {},
      created_at: log.created_at
    }))
  }

  /**
   * Statistiques des événements
   */
  static async getEventStats(userId: string, days: number = 7): Promise<{
    total: number
    bySeverity: Record<string, number>
    byType: Record<string, number>
    recentCritical: number
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await (supabase
      .from('activity_logs') as any)
      .select('severity, action')
      .eq('user_id', userId)
      .eq('entity_type', 'catalog_event')
      .gte('created_at', since)

    if (error || !data) {
      return {
        total: 0,
        bySeverity: {},
        byType: {},
        recentCritical: 0
      }
    }

    const bySeverity: Record<string, number> = {}
    const byType: Record<string, number> = {}

    for (const event of data) {
      const sev = event.severity || 'info'
      const typ = event.action || 'unknown'
      bySeverity[sev] = (bySeverity[sev] || 0) + 1
      byType[typ] = (byType[typ] || 0) + 1
    }

    return {
      total: data.length,
      bySeverity,
      byType,
      recentCritical: bySeverity['critical'] || 0
    }
  }

  /**
   * Méthodes privées
   */
  private static async logEvents(events: CatalogEvent[]): Promise<void> {
    // Store catalog events in activity_logs table
    const logsToInsert = events.map(event => ({
      user_id: event.user_id,
      action: event.event_type,
      entity_type: 'catalog_event',
      entity_id: event.product_id,
      description: event.product_name,
      severity: event.severity,
      details: event.details
    }))

    const { error } = await supabase
      .from('activity_logs')
      .insert(logsToInsert)

    if (error) {
      console.error('[CatalogWatcher] Error logging events:', error)
    }
  }

  private static async sendCriticalNotification(userId: string, events: CatalogEvent[]): Promise<void> {
    try {
      // 1. In-app notification via active_alerts table
      const alertsToInsert = events.map(event => ({
        user_id: userId,
        alert_type: event.event_type,
        title: `⚠️ ${event.product_name}`,
        message: this.formatAlertMessage(event),
        severity: event.severity,
        status: 'active',
        metadata: event.details,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }))

      const { error: alertError } = await supabase
        .from('active_alerts')
        .insert(alertsToInsert)

      if (alertError) {
        console.error('[CatalogWatcher] Error creating in-app alerts:', alertError)
      }

      // 2. Check for webhook configuration
      const { data: webhookConfigs } = await supabase
        .from('alert_configurations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .contains('channels', ['webhook'])

      if (webhookConfigs && webhookConfigs.length > 0) {
        // Trigger webhook via edge function
        await supabase.functions.invoke('catalog-alert-webhook', {
          body: {
            userId,
            events: events.map(e => ({
              type: e.event_type,
              product: e.product_name,
              productId: e.product_id,
              severity: e.severity,
              details: e.details,
              timestamp: new Date().toISOString()
            }))
          }
        })
      }

      // Notification sent successfully
    } catch (error) {
      // Critical notification failure — Sentry will capture via console interceptor
      console.error('[CatalogWatcher] Error sending critical notification:', error)
    }
  }

  private static formatAlertMessage(event: CatalogEvent): string {
    switch (event.event_type) {
      case 'inventory_low':
        return `Stock critique: ${event.details.stock_quantity} unité(s) restante(s) (seuil: ${event.details.threshold})`
      case 'price_changed':
        return `Variation de prix significative: ${event.details.change_percent}% (${event.details.before_price}€ → ${event.details.after_price}€)`
      case 'score_degraded':
        return `Score qualité dégradé: ${event.details.before_score} → ${event.details.after_score}`
      case 'product_audit_failed':
        return `Audit critique: ${event.details.critical_issues?.length || 0} problème(s) détecté(s)`
      default:
        return `Événement critique détecté sur le produit`
    }
  }
}
