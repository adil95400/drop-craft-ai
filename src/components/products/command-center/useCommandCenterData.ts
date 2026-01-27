/**
 * Hook pour calculer les données du Command Center
 * Agrège les informations de stock, qualité, règles de prix et IA
 */

import { useMemo } from 'react'
import { usePriceRules } from '@/hooks/usePriceRules'
import { ProductAuditResult } from '@/types/audit'
import { 
  CommandCenterData, 
  AIRecommendation,
  ProductRiskScore,
  RecommendationPriority,
  DEFAULT_COMMAND_CENTER_CONFIG,
  CommandCenterConfig
} from './types'

// Generic product interface to support multiple product formats
interface GenericProduct {
  id: string
  name?: string
  stock_quantity?: number
  profit_margin?: number
  price?: number
  cost_price?: number
  updated_at?: string
}

interface UseCommandCenterDataProps {
  products: GenericProduct[]
  auditResults: ProductAuditResult[]
  config?: CommandCenterConfig
}

export function useCommandCenterData({
  products,
  auditResults,
  config = DEFAULT_COMMAND_CENTER_CONFIG
}: UseCommandCenterDataProps): CommandCenterData {
  const { data: priceRules = [] } = usePriceRules()
  
  return useMemo(() => {
    // Map audit results by product ID for quick lookup
    const auditMap = new Map(auditResults.map(r => [r.productId, r]))
    
    // 1. Stock critique (< seuil)
    const stockCritical = products.filter(p => 
      (p.stock_quantity ?? 0) < config.stockCriticalThreshold
    )
    
    // 2. Qualité faible (score < seuil)
    const lowQuality = products.filter(p => {
      const audit = auditMap.get(p.id)
      return audit && audit.score.global < config.qualityLowThreshold
    })
    
    // 3. Sans règle de prix (basé sur apply_to = 'all' ou conditions spécifiques)
    // Pour simplifier, on considère qu'un produit a une règle si une règle active s'applique à "all"
    // ou si le produit matche les conditions de la règle
    const hasActiveRule = priceRules.some(r => r.is_active && r.apply_to === 'all')
    const noPriceRule = hasActiveRule ? [] : products
    
    // 4. Non synchronisés (basé sur updated_at > 24h ou pas de sync)
    const now = Date.now()
    const staleThreshold = config.syncStaleHours * 60 * 60 * 1000
    const notSynced = products.filter(p => {
      if (!p.updated_at) return true
      const lastUpdate = new Date(p.updated_at).getTime()
      return (now - lastUpdate) > staleThreshold
    })
    
    // 5. Produits recommandés par l'IA (basé sur audit + risque)
    const aiRecommended = products.filter(p => {
      const audit = auditMap.get(p.id)
      if (!audit) return false
      // Recommandé si a des issues critiques ou score faible
      return audit.needsCorrection || audit.score.global < 60
    })
    
    // 6. Produits à risque (stock OU qualité)
    const atRiskIds = new Set([
      ...stockCritical.map(p => p.id),
      ...lowQuality.map(p => p.id)
    ])
    
    // 7. Produits rentables (marge > 30% et stock disponible)
    const profitable = products.filter(p => {
      const margin = p.profit_margin ?? calculateMargin(p.price, p.cost_price)
      return margin > 30 && (p.stock_quantity ?? 0) > 0
    })
    
    // 8. Perte de marge (marge < 15%)
    const losingMargin = products.filter(p => {
      const margin = p.profit_margin ?? calculateMargin(p.price, p.cost_price)
      return margin < config.marginLowThreshold && margin > 0
    })
    
    // Générer les recommandations IA
    const noPriceRuleIds = new Set(noPriceRule.map(p => p.id))
    const recommendations = generateRecommendations(
      products, 
      auditMap, 
      noPriceRuleIds,
      config
    )
    
    return {
      cards: [
        { type: 'stock', count: stockCritical.length, productIds: stockCritical.map(p => p.id) },
        { type: 'quality', count: lowQuality.length, productIds: lowQuality.map(p => p.id) },
        { type: 'price_rule', count: noPriceRule.length, productIds: noPriceRule.map(p => p.id) },
        { type: 'ai', count: aiRecommended.length, productIds: aiRecommended.map(p => p.id) },
        { type: 'sync', count: notSynced.length, productIds: notSynced.map(p => p.id) }
      ],
      smartFilters: {
        atRisk: Array.from(atRiskIds),
        profitable: profitable.map(p => p.id),
        noPriceRule: noPriceRule.map(p => p.id),
        notSynced: notSynced.map(p => p.id),
        aiRecommended: aiRecommended.map(p => p.id),
        losingMargin: losingMargin.map(p => p.id)
      },
      recommendations
    }
  }, [products, auditResults, priceRules, config])
}

/**
 * Calcule la marge en pourcentage
 */
function calculateMargin(price?: number, costPrice?: number): number {
  if (!price || !costPrice || price === 0) return 0
  return ((price - costPrice) / price) * 100
}

/**
 * Génère les recommandations IA basées sur l'analyse des produits
 */
function generateRecommendations(
  products: GenericProduct[],
  auditMap: Map<string, ProductAuditResult>,
  noPriceRuleIds: Set<string>,
  config: CommandCenterConfig
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = []
  
  for (const product of products) {
    const audit = auditMap.get(product.id)
    const riskScore = calculateRiskScore(product, audit, noPriceRuleIds, config)
    
    // Ne recommander que les produits à risque élevé
    if (riskScore.priority === 'low') continue
    
    // Identifier la recommandation principale basée sur les facteurs
    const topFactor = riskScore.factors.reduce((a, b) => 
      a.contribution > b.contribution ? a : b
    )
    
    const recommendation = createRecommendation(
      product,
      topFactor.type,
      riskScore.priority
    )
    
    if (recommendation) {
      recommendations.push(recommendation)
    }
  }
  
  // Trier par priorité et limiter
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 50) // Top 50 recommandations
}

/**
 * Calcule le score de risque d'un produit
 */
function calculateRiskScore(
  product: GenericProduct,
  audit: ProductAuditResult | undefined,
  noPriceRuleIds: Set<string>,
  config: CommandCenterConfig
): ProductRiskScore {
  const factors: ProductRiskScore['factors'] = []
  
  // Stock (poids: 35%)
  const stock = product.stock_quantity ?? 0
  const stockContribution = stock < config.stockCriticalThreshold
    ? Math.min(35, ((config.stockCriticalThreshold - stock) / config.stockCriticalThreshold) * 35)
    : 0
  factors.push({
    type: 'stock',
    weight: 35,
    value: stock,
    threshold: config.stockCriticalThreshold,
    contribution: stockContribution
  })
  
  // Qualité (poids: 25%)
  const qualityScore = audit?.score.global ?? 100
  const qualityContribution = qualityScore < config.qualityLowThreshold
    ? Math.min(25, ((config.qualityLowThreshold - qualityScore) / config.qualityLowThreshold) * 25)
    : 0
  factors.push({
    type: 'quality',
    weight: 25,
    value: qualityScore,
    threshold: config.qualityLowThreshold,
    contribution: qualityContribution
  })
  
  // Marge (poids: 20%)
  const margin = product.profit_margin ?? calculateMargin(product.price, product.cost_price)
  const marginContribution = margin < config.marginLowThreshold
    ? Math.min(20, ((config.marginLowThreshold - margin) / config.marginLowThreshold) * 20)
    : 0
  factors.push({
    type: 'margin',
    weight: 20,
    value: margin,
    threshold: config.marginLowThreshold,
    contribution: marginContribution
  })
  
  // Règle de prix (poids: 10%)
  const hasPriceRule = !noPriceRuleIds.has(product.id)
  factors.push({
    type: 'price_rule',
    weight: 10,
    value: hasPriceRule ? 1 : 0,
    threshold: 1,
    contribution: hasPriceRule ? 0 : 10
  })
  
  // Sync (poids: 10%)
  const now = Date.now()
  const lastUpdate = product.updated_at ? new Date(product.updated_at).getTime() : 0
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60)
  const syncContribution = hoursSinceUpdate > config.syncStaleHours ? 10 : 0
  factors.push({
    type: 'sync',
    weight: 10,
    value: hoursSinceUpdate,
    threshold: config.syncStaleHours,
    contribution: syncContribution
  })
  
  // Score total
  const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0)
  
  // Déterminer la priorité
  let priority: RecommendationPriority = 'low'
  if (totalScore > 60) priority = 'critical'
  else if (totalScore > 40) priority = 'high'
  else if (totalScore > 20) priority = 'medium'
  
  return {
    productId: product.id,
    score: totalScore,
    priority,
    factors
  }
}

/**
 * Crée une recommandation basée sur le type de facteur
 */
function createRecommendation(
  product: GenericProduct,
  factorType: 'stock' | 'quality' | 'margin' | 'sync' | 'price_rule',
  priority: RecommendationPriority
): AIRecommendation | null {
  const typeMap: Record<typeof factorType, AIRecommendation['type']> = {
    stock: 'restock',
    quality: 'optimize_content',
    margin: 'review_margin',
    sync: 'sync_stores',
    price_rule: 'apply_pricing'
  }
  
  const messageMap: Record<AIRecommendation['type'], string> = {
    restock: `Stock critique (${product.stock_quantity ?? 0} unités)`,
    optimize_content: 'Qualité du contenu insuffisante',
    review_margin: 'Marge faible à revoir',
    sync_stores: 'Synchronisation nécessaire',
    apply_pricing: 'Appliquer une règle de prix'
  }
  
  const actionMap: Record<AIRecommendation['type'], string> = {
    restock: 'Réapprovisionner',
    optimize_content: 'Améliorer le contenu',
    review_margin: 'Revoir la tarification',
    sync_stores: 'Synchroniser',
    apply_pricing: 'Appliquer une règle'
  }
  
  const type = typeMap[factorType]
  
  return {
    productId: product.id,
    productName: product.name || 'Produit sans nom',
    type,
    priority,
    message: messageMap[type],
    action: actionMap[type],
    impact: priority === 'critical' ? 'high' : priority === 'high' ? 'medium' : 'low'
  }
}

/**
 * Hook pour filtrer les produits par filtre intelligent
 */
export function useSmartFilteredProducts<T extends GenericProduct>(
  products: T[],
  commandCenterData: CommandCenterData,
  activeFilter: string
): T[] {
  return useMemo(() => {
    if (activeFilter === 'all') return products
    
    // Map filter names with underscores to camelCase for object access
    const filterKeyMap: Record<string, keyof CommandCenterData['smartFilters']> = {
      'at_risk': 'atRisk',
      'profitable': 'profitable',
      'no_price_rule': 'noPriceRule',
      'not_synced': 'notSynced',
      'ai_recommended': 'aiRecommended',
      'losing_margin': 'losingMargin'
    }
    
    const filterKey = filterKeyMap[activeFilter]
    if (!filterKey) return products
    
    const filterIds = commandCenterData.smartFilters[filterKey] || []
    const filterSet = new Set(filterIds)
    return products.filter(p => filterSet.has(p.id))
  }, [products, commandCenterData, activeFilter])
}
