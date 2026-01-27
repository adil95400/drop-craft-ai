/**
 * AI Priority Engine V3
 * Cerveau IA du Command Center - détermine l'ordre, les priorités et les badges
 * Logique explicable (non black-box)
 */

import { useMemo } from 'react'
import { ProductAuditResult } from '@/types/audit'
import { PriorityCardType, PriorityLevel } from './labels'

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
}

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

// Carte de priorité avec données calculées
export interface PriorityCard {
  type: PriorityCardType
  count: number
  productIds: string[]
  priority: PriorityLevel
  priorityScore: number
  estimatedImpact: number // Impact € estimé
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
  // Cartes triées par priorité IA
  priorityCards: PriorityCard[]
  
  // Badges par produit
  productBadges: Map<string, ProductAIBadge>
  
  // Produits triés par priorité (pour la liste)
  sortedProductIds: string[]
  
  // Métriques globales
  metrics: {
    totalRiskProducts: number
    totalOpportunityProducts: number
    estimatedPotentialGain: number
    healthScore: number // 0-100
  }
}

interface UseAIPriorityEngineProps {
  products: GenericProduct[]
  auditResults: ProductAuditResult[]
  priceRulesActive: boolean
}

/**
 * Hook principal du Priority Engine IA
 * Calcule les priorités, les badges et le tri des produits
 */
export function useAIPriorityEngine({
  products,
  auditResults,
  priceRulesActive
}: UseAIPriorityEngineProps): AIPriorityEngineResult {
  return useMemo(() => {
    // Map audit results for quick lookup
    const auditMap = new Map(auditResults.map(r => [r.productId, r]))
    
    // === ÉTAPE 1: Calculer le score de risque de chaque produit ===
    const productScores: Array<{
      product: GenericProduct
      riskScore: number
      opportunityScore: number
      factors: {
        stock: number
        quality: number
        margin: number
        sync: number
        priceRule: number
      }
    }> = []
    
    for (const product of products) {
      const audit = auditMap.get(product.id)
      const factors = calculateFactors(product, audit, priceRulesActive)
      const riskScore = calculateRiskScore(factors)
      const opportunityScore = calculateOpportunityScore(product, audit)
      
      productScores.push({
        product,
        riskScore,
        opportunityScore,
        factors
      })
    }
    
    // === ÉTAPE 2: Générer les cartes de priorité ===
    const stockCritical = productScores.filter(p => p.factors.stock > 0)
    const qualityLow = productScores.filter(p => p.factors.quality > 0)
    const noPriceRule = priceRulesActive ? [] : products
    const notSynced = productScores.filter(p => p.factors.sync > 0)
    const marginLoss = productScores.filter(p => p.factors.margin > 0)
    const aiOpportunities = productScores.filter(p => p.opportunityScore > 30)
    
    const priorityCards: PriorityCard[] = [
      createPriorityCard('stock_critical', stockCritical, products),
      createPriorityCard('no_price_rule', noPriceRule.map(p => ({ product: p, riskScore: 50, opportunityScore: 0, factors: { stock: 0, quality: 0, margin: 0, sync: 0, priceRule: 10 } })), products),
      createPriorityCard('ai_opportunities', aiOpportunities, products),
      createPriorityCard('not_synced', notSynced, products),
      createPriorityCard('quality_low', qualityLow, products),
      createPriorityCard('margin_loss', marginLoss, products)
    ]
    
    // Trier les cartes par score de priorité (priorité IA)
    priorityCards.sort((a, b) => b.priorityScore - a.priorityScore)
    
    // === ÉTAPE 3: Générer les badges produits ===
    const productBadges = new Map<string, ProductAIBadge>()
    
    for (const ps of productScores) {
      const badge = createProductBadge(ps)
      productBadges.set(ps.product.id, badge)
    }
    
    // === ÉTAPE 4: Trier les produits par priorité ===
    const sortedProductIds = [...productScores]
      .sort((a, b) => {
        // D'abord par risque (décroissant)
        if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore
        // Puis par opportunité (décroissant)
        return b.opportunityScore - a.opportunityScore
      })
      .map(ps => ps.product.id)
    
    // === ÉTAPE 5: Calculer les métriques globales ===
    const totalRiskProducts = productScores.filter(p => p.riskScore > 40).length
    const totalOpportunityProducts = productScores.filter(p => p.opportunityScore > 30).length
    const estimatedPotentialGain = aiOpportunities.reduce((sum, ps) => {
      const margin = ps.product.profit_margin ?? calculateMargin(ps.product.price, ps.product.cost_price)
      const price = ps.product.price ?? 0
      return sum + (price * margin / 100 * 0.15) // +15% amélioration estimée
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
  }, [products, auditResults, priceRulesActive])
}

// === FONCTIONS HELPERS ===

function calculateFactors(
  product: GenericProduct,
  audit: ProductAuditResult | undefined,
  priceRulesActive: boolean
): { stock: number; quality: number; margin: number; sync: number; priceRule: number } {
  // Stock (0-35)
  const stock = product.stock_quantity ?? 0
  const stockFactor = stock < AI_THRESHOLDS.stockCritical
    ? Math.min(35, ((AI_THRESHOLDS.stockCritical - stock) / AI_THRESHOLDS.stockCritical) * 35)
    : 0
  
  // Qualité (0-25)
  const qualityScore = audit?.score.global ?? 100
  const qualityFactor = qualityScore < AI_THRESHOLDS.qualityLow
    ? Math.min(25, ((AI_THRESHOLDS.qualityLow - qualityScore) / AI_THRESHOLDS.qualityLow) * 25)
    : 0
  
  // Marge (0-20)
  const margin = product.profit_margin ?? calculateMargin(product.price, product.cost_price)
  const marginFactor = margin < AI_THRESHOLDS.marginLow && margin > 0
    ? Math.min(20, ((AI_THRESHOLDS.marginLow - margin) / AI_THRESHOLDS.marginLow) * 20)
    : 0
  
  // Sync (0-10)
  const now = Date.now()
  const lastUpdate = product.updated_at ? new Date(product.updated_at).getTime() : 0
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60)
  const syncFactor = hoursSinceUpdate > AI_THRESHOLDS.syncStaleHours ? 10 : 0
  
  // Price Rule (0-10)
  const priceRuleFactor = priceRulesActive ? 0 : 10
  
  return {
    stock: stockFactor,
    quality: qualityFactor,
    margin: marginFactor,
    sync: syncFactor,
    priceRule: priceRuleFactor
  }
}

function calculateRiskScore(factors: { stock: number; quality: number; margin: number; sync: number; priceRule: number }): number {
  return factors.stock + factors.quality + factors.margin + factors.sync + factors.priceRule
}

function calculateOpportunityScore(product: GenericProduct, audit: ProductAuditResult | undefined): number {
  let score = 0
  
  // Marge élevée = opportunité
  const margin = product.profit_margin ?? calculateMargin(product.price, product.cost_price)
  if (margin >= AI_THRESHOLDS.marginHigh) score += 30
  else if (margin >= 20) score += 15
  
  // Stock disponible = opportunité
  if ((product.stock_quantity ?? 0) > 50) score += 20
  else if ((product.stock_quantity ?? 0) > 20) score += 10
  
  // Qualité améliorable = opportunité
  const qualityScore = audit?.score.global ?? 100
  if (qualityScore >= 40 && qualityScore < 70) score += 25 // Améliorable
  
  return score
}

function calculateMargin(price?: number, costPrice?: number): number {
  if (!price || !costPrice || price === 0) return 0
  return ((price - costPrice) / price) * 100
}

function createPriorityCard(
  type: PriorityCardType,
  items: Array<{ product: GenericProduct; riskScore: number; opportunityScore: number; factors: any }>,
  allProducts: GenericProduct[]
): PriorityCard {
  const count = items.length
  const productIds = items.map(i => i.product.id)
  
  // Score de priorité basé sur le nombre et la gravité
  const avgRisk = items.reduce((sum, i) => sum + i.riskScore, 0) / Math.max(count, 1)
  const priorityScore = count > 0 ? (count / allProducts.length) * 50 + avgRisk : 0
  
  // Déterminer le niveau de priorité
  let priority: PriorityLevel = 'low'
  if (priorityScore > 60) priority = 'critical'
  else if (priorityScore > 40) priority = 'high'
  else if (priorityScore > 20) priority = 'medium'
  
  // Estimer l'impact €
  const estimatedImpact = items.reduce((sum, i) => {
    const price = i.product.price ?? 0
    const margin = i.product.profit_margin ?? calculateMargin(i.product.price, i.product.cost_price)
    return sum + (price * margin / 100)
  }, 0)
  
  // Label d'impact personnalisé
  let impactLabel = `${count} produits`
  if (type === 'ai_opportunities' && estimatedImpact > 0) {
    impactLabel = `+${Math.round(estimatedImpact)}€ potentiel`
  } else if (type === 'margin_loss' && estimatedImpact > 0) {
    impactLabel = `${Math.round(estimatedImpact)}€ à risque`
  }
  
  return {
    type,
    count,
    productIds,
    priority,
    priorityScore,
    estimatedImpact: Math.round(estimatedImpact),
    impactLabel
  }
}

function createProductBadge(
  ps: { product: GenericProduct; riskScore: number; opportunityScore: number; factors: any }
): ProductAIBadge {
  let type: ProductAIBadge['type'] = 'neutral'
  let mainIssue: string | undefined
  
  if (ps.riskScore > 50) {
    type = 'risk'
    // Identifier le problème principal
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
  
  let priority: PriorityLevel = 'low'
  if (ps.riskScore > 60) priority = 'critical'
  else if (ps.riskScore > 40) priority = 'high'
  else if (ps.riskScore > 20) priority = 'medium'
  
  return {
    productId: ps.product.id,
    type,
    priority,
    score: ps.riskScore,
    mainIssue
  }
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
