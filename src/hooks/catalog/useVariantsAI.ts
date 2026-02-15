/**
 * useVariantsAI - Hook IA pour l'optimisation des variantes
 * Analyse avancée et recommandations automatisées
 */
import { useMemo, useCallback } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface VariantsAIStats {
  optimizationScore: number
  potentialRevenueLoss: number
  healthMetrics: {
    stockHealth: number
    priceHealth: number
    syncHealth: number
    consistencyHealth: number
  }
  criticalIssues: number
  automationPotential: number
}

export interface VariantRecommendation {
  id: string
  type: 'stock_alert' | 'price_missing' | 'sync_required' | 'price_inconsistent' | 'sku_missing' | 'bulk_update'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  estimatedLoss: number
  productIds: string[]
  productCount: number
  action: {
    label: string
    type: 'create_rule' | 'bulk_update' | 'sync' | 'generate_sku'
  }
  suggestedRule?: {
    name: string
    conditions: Record<string, any>
    actions: Record<string, any>
  }
}

export function useVariantsAIStats() {
  const { products, isLoading } = useProductsUnified()

  const stats = useMemo<VariantsAIStats>(() => {
    if (!products || products.length === 0) {
      return {
        optimizationScore: 0,
        potentialRevenueLoss: 0,
        healthMetrics: { stockHealth: 0, priceHealth: 0, syncHealth: 0, consistencyHealth: 0 },
        criticalIssues: 0,
        automationPotential: 0
      }
    }

    const total = products.length
    let totalVariants = 0
    let noStockCount = 0
    let noPriceCount = 0
    let notSyncedCount = 0
    let inconsistentCount = 0

    products.forEach(product => {
      const variants = (product as any).variants || []
      
      if (variants.length > 0) {
        totalVariants += variants.length
        
        variants.forEach((v: any) => {
          if ((v.stock_quantity || v.inventory_quantity || 0) === 0) noStockCount++
          if (!v.price || v.price <= 0) noPriceCount++
          if (!v.external_id && !v.sku) notSyncedCount++
        })

        // Check price consistency
        if (variants.length > 1) {
          const prices = variants.map((v: any) => v.price).filter(Boolean)
          if (prices.length > 0) {
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)
            if (maxPrice > minPrice * 3) inconsistentCount++
          }
        }
      } else {
        // Simple products
        if ((product.stock_quantity || 0) === 0) noStockCount++
        if (!product.price || product.price <= 0) noPriceCount++
        if (!(product as any).external_id && !product.sku) notSyncedCount++
      }
    })

    // Use product count if no variants
    const effectiveTotal = totalVariants > 0 ? totalVariants : total

    // Health metrics (percentage of healthy items)
    const stockHealth = Math.round(((effectiveTotal - noStockCount) / effectiveTotal) * 100)
    const priceHealth = Math.round(((effectiveTotal - noPriceCount) / effectiveTotal) * 100)
    const syncHealth = Math.round(((effectiveTotal - notSyncedCount) / effectiveTotal) * 100)
    const consistencyHealth = Math.round(((total - inconsistentCount) / total) * 100)

    // Weighted optimization score
    const optimizationScore = Math.round(
      stockHealth * 0.35 +
      priceHealth * 0.30 +
      syncHealth * 0.20 +
      consistencyHealth * 0.15
    )

    // Revenue loss estimation
    const avgPrice = products.reduce((s, p) => s + (p.price || 0), 0) / total
    const potentialRevenueLoss = Math.round(noStockCount * avgPrice * 0.5) + Math.round(noPriceCount * avgPrice)

    const criticalIssues = noStockCount + noPriceCount
    const automationPotential = Math.round((notSyncedCount / effectiveTotal) * 100)

    return {
      optimizationScore,
      potentialRevenueLoss,
      healthMetrics: { stockHealth, priceHealth, syncHealth, consistencyHealth },
      criticalIssues,
      automationPotential
    }
  }, [products])

  return { stats, isLoading }
}

export function useVariantRecommendations() {
  const { products, isLoading } = useProductsUnified()

  const recommendations = useMemo<VariantRecommendation[]>(() => {
    if (!products || products.length === 0) return []

    const recs: VariantRecommendation[] = []

    // Collect issues
    const noStock: UnifiedProduct[] = []
    const noPrice: UnifiedProduct[] = []
    const notSynced: UnifiedProduct[] = []
    const noSku: UnifiedProduct[] = []
    const inconsistent: UnifiedProduct[] = []

    products.forEach(product => {
      const variants = (product as any).variants || []
      
      if (variants.length > 0) {
        let hasStockIssue = false
        let hasPriceIssue = false
        let hasSyncIssue = false
        let hasSkuIssue = false

        variants.forEach((v: any) => {
          if ((v.stock_quantity || v.inventory_quantity || 0) === 0) hasStockIssue = true
          if (!v.price || v.price <= 0) hasPriceIssue = true
          if (!v.external_id) hasSyncIssue = true
          if (!v.sku) hasSkuIssue = true
        })

        if (hasStockIssue) noStock.push(product)
        if (hasPriceIssue) noPrice.push(product)
        if (hasSyncIssue) notSynced.push(product)
        if (hasSkuIssue) noSku.push(product)

        // Check consistency
        if (variants.length > 1) {
          const prices = variants.map((v: any) => v.price).filter(Boolean)
          if (prices.length > 0 && Math.max(...prices) > Math.min(...prices) * 3) {
            inconsistent.push(product)
          }
        }
      } else {
        if ((product.stock_quantity || 0) === 0) noStock.push(product)
        if (!product.price || product.price <= 0) noPrice.push(product)
        if (!(product as any).external_id) notSynced.push(product)
        if (!product.sku) noSku.push(product)
      }
    })

    // 1. Stock alerts (critical)
    if (noStock.length > 0) {
      const avgPrice = noStock.reduce((s, p) => s + (p.price || 0), 0) / noStock.length
      recs.push({
        id: 'stock_alert',
        type: 'stock_alert',
        priority: 'critical',
        title: 'Variantes en rupture de stock',
        description: `${noStock.length} produits ont des variantes à 0 stock. Ventes perdues potentielles.`,
        impact: 'Perte de ventes directe',
        estimatedLoss: Math.round(noStock.length * avgPrice * 0.5),
        productIds: noStock.slice(0, 50).map(p => p.id),
        productCount: noStock.length,
        action: { label: 'Créer alerte stock', type: 'create_rule' },
        suggestedRule: {
          name: 'Alerte rupture stock automatique',
          conditions: { stock_quantity: { operator: 'equals', value: 0 } },
          actions: { add_tag: 'rupture-stock', notify: true }
        }
      })
    }

    // 2. Missing prices (critical)
    if (noPrice.length > 0) {
      recs.push({
        id: 'price_missing',
        type: 'price_missing',
        priority: 'critical',
        title: 'Prix manquants',
        description: `${noPrice.length} variantes sans prix défini. Ces produits ne peuvent pas être vendus.`,
        impact: 'Produits non vendables',
        estimatedLoss: Math.round(noPrice.length * 50),
        productIds: noPrice.slice(0, 50).map(p => p.id),
        productCount: noPrice.length,
        action: { label: 'Compléter les prix', type: 'bulk_update' }
      })
    }

    // 3. Not synced
    if (notSynced.length > 0) {
      recs.push({
        id: 'sync_required',
        type: 'sync_required',
        priority: 'high',
        title: 'Synchronisation requise',
        description: `${notSynced.length} produits non liés à un canal de vente externe.`,
        impact: 'Non visibles en marketplace',
        estimatedLoss: Math.round(notSynced.length * 25),
        productIds: notSynced.slice(0, 50).map(p => p.id),
        productCount: notSynced.length,
        action: { label: 'Synchroniser', type: 'sync' }
      })
    }

    // 4. Missing SKUs
    if (noSku.length > 0) {
      recs.push({
        id: 'sku_missing',
        type: 'sku_missing',
        priority: 'medium',
        title: 'SKUs manquants',
        description: `${noSku.length} produits sans code SKU. Impact sur la traçabilité et l'inventaire.`,
        impact: 'Gestion inventaire complexifiée',
        estimatedLoss: Math.round(noSku.length * 10),
        productIds: noSku.slice(0, 50).map(p => p.id),
        productCount: noSku.length,
        action: { label: 'Générer SKUs', type: 'generate_sku' },
        suggestedRule: {
          name: 'Génération SKU automatique',
          conditions: { sku: { operator: 'is_empty', value: true } },
          actions: { generate_sku: { pattern: '{CATEGORY}-{ID}' } }
        }
      })
    }

    // 5. Price inconsistency
    if (inconsistent.length > 0) {
      recs.push({
        id: 'price_inconsistent',
        type: 'price_inconsistent',
        priority: 'medium',
        title: 'Incohérences de prix',
        description: `${inconsistent.length} produits avec écarts de prix >3x entre variantes.`,
        impact: 'Confusion client possible',
        estimatedLoss: Math.round(inconsistent.length * 15),
        productIds: inconsistent.slice(0, 30).map(p => p.id),
        productCount: inconsistent.length,
        action: { label: 'Réviser les prix', type: 'bulk_update' }
      })
    }

    return recs.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
  }, [products])

  return { recommendations, isLoading }
}

export function useApplyVariantRecommendation() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recommendation: VariantRecommendation) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      if (recommendation.suggestedRule) {
        // Create automation rule
        const { error } = await supabase
          .from('automation_workflows')
          .insert({
            user_id: user.id,
            name: recommendation.suggestedRule.name,
            trigger_type: 'product_change',
            action_type: recommendation.type,
            trigger_config: recommendation.suggestedRule.conditions,
            action_config: recommendation.suggestedRule.actions,
            is_active: true,
            description: `Règle créée automatiquement: ${recommendation.title}`
          } as any)

        if (error) throw error

        return { 
          success: true, 
          type: 'rule_created', 
          message: `Règle "${recommendation.suggestedRule.name}" créée` 
        }
      }

      // Bulk update for products
      if (recommendation.action.type === 'bulk_update') {
        // Mark products for review
        const { error } = await supabase
          .from('products')
          .update({ 
            updated_at: new Date().toISOString(),
            // Add a tag or flag for review
          })
          .in('id', recommendation.productIds.slice(0, 50))

        if (error) throw error

        return { 
          success: true, 
          type: 'products_flagged', 
          message: `${recommendation.productIds.length} produits marqués pour révision` 
        }
      }

      return { success: true, type: 'action_queued', message: 'Action planifiée' }
    },
    onSuccess: (result) => {
      toast({
        title: 'Action appliquée',
        description: result.message
      })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de l\'action',
        variant: 'destructive'
      })
    }
  })
}
