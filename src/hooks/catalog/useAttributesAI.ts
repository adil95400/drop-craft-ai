/**
 * useAttributesAI - AI-driven attribute analysis and recommendations
 * Phase 2: Real-time insights and automated enrichment suggestions
 */
import { useMemo } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { toast } from 'sonner'

export interface AttributeAIStats {
  optimizationScore: number
  productsWithIssues: number
  estimatedTimeSaved: number // hours/month with automation
  potentialVisibilityGain: number // percentage
  priorityActions: number
}

export interface AttributeRecommendation {
  id: string
  type: 'missing_gtin' | 'missing_brand' | 'short_description' | 'missing_category' | 'bulk_enrichment'
  title: string
  description: string
  impactedProducts: number
  estimatedImpact: string
  priority: 'high' | 'medium' | 'low'
  action: () => void
}

export interface MarketplaceReadiness {
  marketplace: string
  readyCount: number
  totalCount: number
  score: number
  topIssues: string[]
  color: string
}

export function useAttributesAIStats() {
  const { products, isLoading } = useProductsUnified()

  const stats = useMemo<AttributeAIStats>(() => {
    if (!products || products.length === 0) {
      return {
        optimizationScore: 0,
        productsWithIssues: 0,
        estimatedTimeSaved: 0,
        potentialVisibilityGain: 0,
        priorityActions: 0
      }
    }

    const total = products.length

    // Count issues
    const missingGTIN = products.filter(p => {
      const prod = p as any
      return !prod.gtin && !prod.ean && !prod.barcode
    }).length

    const missingBrand = products.filter(p => {
      const prod = p as any
      return !prod.brand && !p.supplier_name && !p.supplier
    }).length

    const missingCategory = products.filter(p => !p.category).length
    const shortDescription = products.filter(p => !p.description || p.description.length < 100).length
    const missingImage = products.filter(p => !p.image_url).length

    // Products with at least one issue
    const productsWithIssues = products.filter(p => {
      const prod = p as any
      const hasGTIN = prod.gtin || prod.ean || prod.barcode
      const hasBrand = prod.brand || p.supplier_name || p.supplier
      const hasCategory = !!p.category
      const hasDescription = p.description && p.description.length >= 100
      const hasImage = !!p.image_url
      return !hasGTIN || !hasBrand || !hasCategory || !hasDescription || !hasImage
    }).length

    // Calculate optimization score (weighted)
    const gtinScore = ((total - missingGTIN) / total) * 25
    const brandScore = ((total - missingBrand) / total) * 20
    const categoryScore = ((total - missingCategory) / total) * 25
    const descriptionScore = ((total - shortDescription) / total) * 20
    const imageScore = ((total - missingImage) / total) * 10
    const optimizationScore = Math.round(gtinScore + brandScore + categoryScore + descriptionScore + imageScore)

    // Estimate time saved (5 min per product enrichment manually)
    const enrichableProducts = products.filter(p => {
      const prod = p as any
      const needsEnrichment = !p.category || !prod.brand || (p.description && p.description.length < 100)
      return needsEnrichment
    }).length
    const estimatedTimeSaved = Math.round((enrichableProducts * 5) / 60) // Convert to hours

    // Potential visibility gain (missing category = -30% visibility, missing GTIN = -20%)
    const categoryImpact = (missingCategory / total) * 30
    const gtinImpact = (missingGTIN / total) * 20
    const potentialVisibilityGain = Math.round(categoryImpact + gtinImpact)

    // Priority actions count
    const priorityActions = (missingCategory > 0 ? 1 : 0) + 
                           (missingGTIN > 0 ? 1 : 0) + 
                           (missingBrand > 0 ? 1 : 0) + 
                           (shortDescription > 0 ? 1 : 0)

    return {
      optimizationScore,
      productsWithIssues,
      estimatedTimeSaved,
      potentialVisibilityGain,
      priorityActions
    }
  }, [products])

  return { stats, isLoading }
}

export function useAttributeRecommendations() {
  const { products } = useProductsUnified()
  const { user } = useUnifiedAuth()
  const queryClient = useQueryClient()

  const recommendations = useMemo<AttributeRecommendation[]>(() => {
    if (!products || products.length === 0) return []

    const recs: AttributeRecommendation[] = []

    // 1. Missing Categories
    const missingCategory = products.filter(p => !p.category)
    if (missingCategory.length > 0) {
      recs.push({
        id: 'missing_category',
        type: 'missing_category',
        title: 'Catégorisation automatique',
        description: `${missingCategory.length} produits sans catégorie. L'IA peut les classifier automatiquement pour Google Shopping.`,
        impactedProducts: missingCategory.length,
        estimatedImpact: '+30% visibilité',
        priority: 'high',
        action: () => {}
      })
    }

    // 2. Missing GTIN/EAN
    const missingGTIN = products.filter(p => {
      const prod = p as any
      return !prod.gtin && !prod.ean && !prod.barcode && p.sku
    })
    if (missingGTIN.length > 0) {
      recs.push({
        id: 'missing_gtin',
        type: 'missing_gtin',
        title: 'Enrichissement GTIN/EAN',
        description: `${missingGTIN.length} produits avec SKU mais sans GTIN. Recherche automatique dans les bases de données produits.`,
        impactedProducts: missingGTIN.length,
        estimatedImpact: '+20% éligibilité Shopping',
        priority: 'high',
        action: () => {}
      })
    }

    // 3. Missing Brand
    const missingBrand = products.filter(p => {
      const prod = p as any
      return !prod.brand && !p.supplier_name && !p.supplier
    })
    if (missingBrand.length > 0) {
      recs.push({
        id: 'missing_brand',
        type: 'missing_brand',
        title: 'Détection de marques',
        description: `${missingBrand.length} produits sans marque. L'IA peut extraire la marque du titre ou de la description.`,
        impactedProducts: missingBrand.length,
        estimatedImpact: '+15% conversion',
        priority: 'medium',
        action: () => {}
      })
    }

    // 4. Short Descriptions
    const shortDescriptions = products.filter(p => 
      p.description && p.description.length > 0 && p.description.length < 100
    )
    if (shortDescriptions.length > 0) {
      recs.push({
        id: 'short_description',
        type: 'short_description',
        title: 'Enrichissement descriptions',
        description: `${shortDescriptions.length} produits avec descriptions courtes (<100 car.). Génération IA de descriptions SEO-optimisées.`,
        impactedProducts: shortDescriptions.length,
        estimatedImpact: '+25% SEO score',
        priority: 'medium',
        action: () => {}
      })
    }

    // 5. Bulk enrichment suggestion
    const enrichableCount = products.filter(p => {
      const prod = p as any
      const issues = (!p.category ? 1 : 0) + 
                     (!prod.brand && !p.supplier_name ? 1 : 0) + 
                     (!p.description || p.description.length < 100 ? 1 : 0)
      return issues >= 2
    }).length

    if (enrichableCount > 10) {
      recs.push({
        id: 'bulk_enrichment',
        type: 'bulk_enrichment',
        title: 'Enrichissement en masse',
        description: `${enrichableCount} produits avec 2+ attributs manquants. Lancer un enrichissement IA complet.`,
        impactedProducts: enrichableCount,
        estimatedImpact: `${Math.round(enrichableCount * 5 / 60)}h économisées`,
        priority: 'low',
        action: () => {}
      })
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [products])

  return { recommendations }
}

export function useMarketplaceReadiness() {
  const { products } = useProductsUnified()

  const marketplaces = useMemo<MarketplaceReadiness[]>(() => {
    if (!products || products.length === 0) return []

    const total = products.length

    const marketplaceConfigs = [
      {
        name: 'Google Shopping',
        required: ['category', 'gtin', 'brand', 'description', 'image'],
        color: 'bg-red-500'
      },
      {
        name: 'Amazon',
        required: ['sku', 'brand', 'category', 'description'],
        color: 'bg-orange-500'
      },
      {
        name: 'Meta/Facebook',
        required: ['brand', 'category', 'price', 'image'],
        color: 'bg-blue-500'
      },
      {
        name: 'eBay',
        required: ['sku', 'brand', 'category', 'description'],
        color: 'bg-yellow-500'
      }
    ]

    return marketplaceConfigs.map(mp => {
      let readyCount = 0
      const issuesCounts: Record<string, number> = {}

      products.forEach(p => {
        const prod = p as any
        let isReady = true

        mp.required.forEach(attr => {
          let hasAttr = false
          switch (attr) {
            case 'category': hasAttr = !!p.category; break
            case 'gtin': hasAttr = !!(prod.gtin || prod.ean || prod.barcode); break
            case 'brand': hasAttr = !!(prod.brand || p.supplier_name || p.supplier); break
            case 'description': hasAttr = !!(p.description && p.description.length >= 50); break
            case 'image': hasAttr = !!p.image_url; break
            case 'sku': hasAttr = !!p.sku; break
            case 'price': hasAttr = !!(p.price && p.price > 0); break
            default: hasAttr = true
          }

          if (!hasAttr) {
            isReady = false
            issuesCounts[attr] = (issuesCounts[attr] || 0) + 1
          }
        })

        if (isReady) readyCount++
      })

      const topIssues = Object.entries(issuesCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([attr, count]) => `${attr}: ${count}`)

      return {
        marketplace: mp.name,
        readyCount,
        totalCount: total,
        score: Math.round((readyCount / total) * 100),
        topIssues,
        color: mp.color
      }
    }).sort((a, b) => b.score - a.score)
  }, [products])

  return { marketplaces }
}

export function useApplyAttributeRecommendation() {
  const { user } = useUnifiedAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recommendationType: string) => {
      // Create a catalog rule based on recommendation type
      const ruleConfigs: Record<string, any> = {
        missing_category: {
          name: 'Auto-catégorisation IA',
          rule_type: 'category_mapping',
          conditions: { missing_field: 'category' },
          actions: { ai_categorize: true }
        },
        missing_gtin: {
          name: 'Recherche GTIN automatique',
          rule_type: 'attribute_enrichment',
          conditions: { missing_field: 'gtin', has_field: 'sku' },
          actions: { lookup_gtin: true }
        },
        missing_brand: {
          name: 'Extraction marque IA',
          rule_type: 'attribute_enrichment',
          conditions: { missing_field: 'brand' },
          actions: { extract_brand: true }
        },
        short_description: {
          name: 'Génération descriptions SEO',
          rule_type: 'content_generation',
          conditions: { field: 'description', condition: 'length_less_than', value: 100 },
          actions: { ai_generate_description: true }
        },
        bulk_enrichment: {
          name: 'Enrichissement complet IA',
          rule_type: 'bulk_enrichment',
          conditions: { multiple_missing: true, threshold: 2 },
          actions: { ai_full_enrichment: true }
        }
      }

      const config = ruleConfigs[recommendationType]
      if (!config) throw new Error('Unknown recommendation type')

      const { error } = await supabase
        .from('feed_rules')
        .insert({
          user_id: user?.id,
          name: config.name,
          rule_type: config.rule_type,
          conditions: config.conditions,
          actions: config.actions,
          is_active: true,
          priority: 10
        })

      if (error) throw error
      return { success: true, ruleName: config.name }
    },
    onSuccess: (data) => {
      toast.success(`Règle "${data.ruleName}" créée avec succès`)
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] })
    },
    onError: () => {
      toast.error('Erreur lors de la création de la règle')
    }
  })
}
