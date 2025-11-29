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

    // Récupérer les événements récents pour ce batch
    const { data: events } = await supabase
      .from('catalog_events')
      .select('*')
      .eq('user_id', userId)
      .in('product_id', products.map(p => p.id))
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // dernière minute
      .order('created_at', { ascending: false })

    return {
      totalProcessed: products.length,
      criticalCount: (events || []).filter(e => e.severity === 'critical').length,
      warningCount: (events || []).filter(e => e.severity === 'warning').length,
      events: (events || []) as CatalogEvent[]
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

    let query = supabase
      .from('catalog_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[CatalogWatcher] Error fetching events:', error)
      return []
    }

    return (data || []) as CatalogEvent[]
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

    const { data, error } = await supabase
      .from('catalog_events')
      .select('severity, event_type')
      .eq('user_id', userId)
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
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1
      byType[event.event_type] = (byType[event.event_type] || 0) + 1
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
    const { error } = await supabase
      .from('catalog_events')
      .insert(events)

    if (error) {
      console.error('[CatalogWatcher] Error logging events:', error)
    }
  }

  private static async sendCriticalNotification(userId: string, events: CatalogEvent[]): Promise<void> {
    // TODO: Implémenter notification (email, push, webhook...)
    console.log(`[CatalogWatcher] Critical notification for user ${userId}:`, events)
  }
}