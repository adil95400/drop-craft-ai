/**
 * AI Priority Engine V3 - Optimized
 * Cerveau IA du Command Center - détermine l'ordre, les priorités et les badges
 * Logique explicable avec calculs centralisés
 */

import { useMemo, useCallback } from 'react'
import { ProductAuditResult } from '@/types/audit'
import { PriorityCardType, PriorityLevel } from './labels'
import { calculateMargin, isStale } from './utils/calculations'

// Pondération explicable du score de risque
export const AI_PRIORITY_WEIGHTS = {
  stock_risk: 0.35,      // 35% - Rupture = perte directe
  margin_health: 0.25,   // 25% - Rentabilité
  quality_score: 0.20,   // 20% - Conversion
  sync_status: 0.10,     // 10% - Visibilité
  price_rules: 0.10      // 10% - Contrôle pricing
} as const

// Seuils de configuration
export const AI_THRESHOLDS = {
  stockCritical: 10,
  qualityLow: 40,
  marginLow: 15,
  syncStaleHours: 24,
  marginHigh: 30
} as const

// Interface produit générique
interface GenericProduct {
  id: string
  name?: string
  stock_quantity?: number
  profit_margin?: number
  price?: number
  cost_price?: number
  updated_at?: string
}

// Facteurs de risque calculés
interface RiskFactors {
  stock: number
  quality: number
  margin: number
  sync: number
  priceRule: number
}

// Score produit calculé
interface ProductScore {
  product: GenericProduct
  riskScore: number
  opportunityScore: number
  factors: RiskFactors
  margin: number
}

// Carte de priorité avec données calculées
export interface PriorityCard {
  type: PriorityCardType
  count: number
  productIds: string[]
  priority: PriorityLevel
  priorityScore: number
  estimatedImpact: number
  impactLabel: string
}

// Badge produit
export interface ProductAIBadge {
  productId: string
  type: 'risk' | 'opportunity' | 'optimized' | 'neutral'
  priority: PriorityLevel
  score: number
  mainIssue?: string
}

// Résultat du Priority Engine
export interface AIPriorityEngineResult {
  priorityCards: PriorityCard[]
  productBadges: Map<string, ProductAIBadge>
  sortedProductIds: string[]
  metrics: {
    totalRiskProducts: number
    totalOpportunityProducts: number
    estimatedPotentialGain: number
    healthScore: number
  }
}

interface UseAIPriorityEngineProps {
  products: GenericProduct[]
  auditResults: ProductAuditResult[]
  priceRulesActive: boolean
}

/**
 * Hook principal du Priority Engine IA - Optimized
 */
export function useAIPriorityEngine({
  products,
  auditResults,
  priceRulesActive
}: UseAIPriorityEngineProps): AIPriorityEngineResult {
  // Memoize audit map separately for better caching
  const auditMap = useMemo(() => 
    new Map(auditResults.map(r => [r.productId, r])),
    [auditResults]
  )
  
  // Memoize factor calculations
  const calculateFactors = useCallback((
    product: GenericProduct,
    audit: ProductAuditResult | undefined
  ): RiskFactors => {
    const stock = product.stock_quantity ?? 0
    const stockFactor = stock < AI_THRESHOLDS.stockCritical
      ? Math.min(35, ((AI_THRESHOLDS.stockCritical - stock) / AI_THRESHOLDS.stockCritical) * 35)
      : 0
    
    const qualityScore = audit?.score.global ?? 100
    const qualityFactor = qualityScore < AI_THRESHOLDS.qualityLow
      ? Math.min(25, ((AI_THRESHOLDS.qualityLow - qualityScore) / AI_THRESHOLDS.qualityLow) * 25)
      : 0
    
    const margin = product.profit_margin ?? calculateMargin(product.price, product.cost_price)
    const marginFactor = margin < AI_THRESHOLDS.marginLow && margin > 0
      ? Math.min(20, ((AI_THRESHOLDS.marginLow - margin) / AI_THRESHOLDS.marginLow) * 20)
      : 0
    
    const syncFactor = isStale(product.updated_at, AI_THRESHOLDS.syncStaleHours) ? 10 : 0
    const priceRuleFactor = priceRulesActive ? 0 : 10
    
    return { stock: stockFactor, quality: qualityFactor, margin: marginFactor, sync: syncFactor, priceRule: priceRuleFactor }
  }, [priceRulesActive])

  return useMemo(() => {
    // STEP 1: Calculate product scores in single pass
    const productScores: ProductScore[] = products.map(product => {
      const audit = auditMap.get(product.id)
      const factors = calculateFactors(product, audit)
      const riskScore = factors.stock + factors.quality + factors.margin + factors.sync + factors.priceRule
      const margin = product.profit_margin ?? calculateMargin(product.price, product.cost_price)
      
      // Opportunity score calculation
      let opportunityScore = 0
      if (margin >= AI_THRESHOLDS.marginHigh) opportunityScore += 30
      else if (margin >= 20) opportunityScore += 15
      if ((product.stock_quantity ?? 0) > 50) opportunityScore += 20
      else if ((product.stock_quantity ?? 0) > 20) opportunityScore += 10
      const qualityScore = audit?.score.global ?? 100
      if (qualityScore >= 40 && qualityScore < 70) opportunityScore += 25
      
      return { product, riskScore, opportunityScore, factors, margin }
    })
    
    // STEP 2: Group products by card type in single pass
    const stockCritical: ProductScore[] = []
    const qualityLow: ProductScore[] = []
    const notSynced: ProductScore[] = []
    const marginLoss: ProductScore[] = []
    const aiOpportunities: ProductScore[] = []
    
    for (const ps of productScores) {
      if (ps.factors.stock > 0) stockCritical.push(ps)
      if (ps.factors.quality > 0) qualityLow.push(ps)
      if (ps.factors.sync > 0) notSynced.push(ps)
      if (ps.factors.margin > 0) marginLoss.push(ps)
      if (ps.opportunityScore > 30) aiOpportunities.push(ps)
    }
    
    // STEP 3: Generate priority cards
    const createCard = (type: PriorityCardType, items: ProductScore[]): PriorityCard => {
      const count = items.length
      const productIds = items.map(i => i.product.id)
      const avgRisk = items.reduce((sum, i) => sum + i.riskScore, 0) / Math.max(count, 1)
      const priorityScore = count > 0 ? (count / products.length) * 50 + avgRisk : 0
      
      const priority: PriorityLevel = priorityScore > 60 ? 'critical' 
        : priorityScore > 40 ? 'high' 
        : priorityScore > 20 ? 'medium' 
        : 'low'
      
      const estimatedImpact = items.reduce((sum, i) => {
        const price = i.product.price ?? 0
        return sum + (price * i.margin / 100)
      }, 0)
      
      let impactLabel = `${count} produits`
      if (type === 'ai_opportunities' && estimatedImpact > 0) {
        impactLabel = `+${Math.round(estimatedImpact)}€ potentiel`
      } else if (type === 'margin_loss' && estimatedImpact > 0) {
        impactLabel = `${Math.round(estimatedImpact)}€ à risque`
      }
      
      return { type, count, productIds, priority, priorityScore, estimatedImpact: Math.round(estimatedImpact), impactLabel }
    }
    
    const noPriceRuleItems = priceRulesActive ? [] : products.map(p => ({
      product: p,
      riskScore: 50,
      opportunityScore: 0,
      factors: { stock: 0, quality: 0, margin: 0, sync: 0, priceRule: 10 },
      margin: 0
    }))
    
    const priorityCards: PriorityCard[] = [
      createCard('stock_critical', stockCritical),
      createCard('no_price_rule', noPriceRuleItems),
      createCard('ai_opportunities', aiOpportunities),
      createCard('not_synced', notSynced),
      createCard('quality_low', qualityLow),
      createCard('margin_loss', marginLoss)
    ].sort((a, b) => b.priorityScore - a.priorityScore)
    
    // STEP 4: Generate product badges
    const productBadges = new Map<string, ProductAIBadge>()
    for (const ps of productScores) {
      let type: ProductAIBadge['type'] = 'neutral'
      let mainIssue: string | undefined
      
      if (ps.riskScore > 50) {
        type = 'risk'
        const { stock, quality, margin, sync } = ps.factors
        if (stock >= quality && stock >= margin && stock >= sync) mainIssue = 'Stock critique'
        else if (quality >= margin && quality >= sync) mainIssue = 'Qualité faible'
        else if (margin >= sync) mainIssue = 'Marge faible'
        else mainIssue = 'Non synchronisé'
      } else if (ps.opportunityScore > 40) {
        type = 'opportunity'
      } else if (ps.riskScore < 10 && ps.opportunityScore < 20) {
        type = 'optimized'
      }
      
      const priority: PriorityLevel = ps.riskScore > 60 ? 'critical'
        : ps.riskScore > 40 ? 'high'
        : ps.riskScore > 20 ? 'medium'
        : 'low'
      
      productBadges.set(ps.product.id, {
        productId: ps.product.id,
        type,
        priority,
        score: ps.riskScore,
        mainIssue
      })
    }
    
    // STEP 5: Sort products and calculate metrics
    const sortedProductIds = [...productScores]
      .sort((a, b) => b.riskScore !== a.riskScore ? b.riskScore - a.riskScore : b.opportunityScore - a.opportunityScore)
      .map(ps => ps.product.id)
    
    const totalRiskProducts = productScores.filter(p => p.riskScore > 40).length
    const totalOpportunityProducts = aiOpportunities.length
    const estimatedPotentialGain = aiOpportunities.reduce((sum, ps) => {
      const price = ps.product.price ?? 0
      return sum + (price * ps.margin / 100 * 0.15)
    }, 0)
    
    const avgRiskScore = productScores.reduce((sum, p) => sum + p.riskScore, 0) / Math.max(productScores.length, 1)
    const healthScore = Math.max(0, Math.min(100, 100 - avgRiskScore))
    
    return {
      priorityCards,
      productBadges,
      sortedProductIds,
      metrics: {
        totalRiskProducts,
        totalOpportunityProducts,
        estimatedPotentialGain: Math.round(estimatedPotentialGain),
        healthScore: Math.round(healthScore)
      }
    }
  }, [products, auditMap, calculateFactors, priceRulesActive])
}

/**
 * Hook pour obtenir le badge d'un produit spécifique
 */
export function useProductAIBadge(
  productId: string,
  productBadges: Map<string, ProductAIBadge>
): ProductAIBadge | undefined {
  return productBadges.get(productId)
}
