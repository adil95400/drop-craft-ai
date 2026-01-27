/**
 * useCategoryMappingAI - AI-driven category mapping insights
 * Phase 2: Smart suggestions and automated mapping recommendations
 */
import { useMemo } from 'react'
import { useProductsUnified } from '@/hooks/unified'
import { useCategoryMappings, useCategoryMappingStats } from '@/hooks/useCategoryMapping'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { toast } from 'sonner'

export interface CategoryMappingAIStats {
  automationScore: number
  unmappedCategories: number
  totalCategories: number
  aiSuggestionsCount: number
  potentialTimeSaved: number // hours
  coveragePercent: number
}

export interface CategorySuggestion {
  id: string
  sourceCategory: string
  suggestedMapping: string
  destination: 'google' | 'facebook' | 'amazon' | 'shopify'
  confidence: number
  productsAffected: number
  reason: string
}

export interface MappingRecommendation {
  id: string
  type: 'unmapped_category' | 'ai_suggestion' | 'bulk_mapping' | 'conflict_resolution'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  impactedProducts: number
  estimatedImpact: string
}

// Google Shopping category taxonomy (simplified)
const GOOGLE_CATEGORIES: Record<string, string> = {
  'électronique': 'Electronics',
  'téléphone': 'Electronics > Communications > Telephony > Mobile Phones',
  'smartphone': 'Electronics > Communications > Telephony > Mobile Phones',
  'ordinateur': 'Electronics > Computers',
  'laptop': 'Electronics > Computers > Laptops',
  'vêtements': 'Apparel & Accessories',
  'mode': 'Apparel & Accessories',
  't-shirt': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'chaussures': 'Apparel & Accessories > Shoes',
  'sneakers': 'Apparel & Accessories > Shoes > Sneakers',
  'maison': 'Home & Garden',
  'meuble': 'Home & Garden > Furniture',
  'cuisine': 'Home & Garden > Kitchen & Dining',
  'beauté': 'Health & Beauty',
  'cosmétique': 'Health & Beauty > Personal Care > Cosmetics',
  'sport': 'Sporting Goods',
  'fitness': 'Sporting Goods > Exercise & Fitness',
  'jouet': 'Toys & Games',
  'jeu': 'Toys & Games',
  'bébé': 'Baby & Toddler',
  'enfant': 'Baby & Toddler'
}

export function useCategoryMappingAIStats() {
  const { products, isLoading: productsLoading } = useProductsUnified()
  const { data: mappings = [], isLoading: mappingsLoading } = useCategoryMappings()
  const { data: stats } = useCategoryMappingStats()

  const aiStats = useMemo<CategoryMappingAIStats>(() => {
    if (!products || products.length === 0) {
      return {
        automationScore: 0,
        unmappedCategories: 0,
        totalCategories: 0,
        aiSuggestionsCount: 0,
        potentialTimeSaved: 0,
        coveragePercent: 0
      }
    }

    // Get unique categories from products
    const allCategories = new Set<string>()
    products.forEach(p => {
      if (p.category) allCategories.add(p.category.toLowerCase().trim())
    })

    const totalCategories = allCategories.size

    // Check which categories are already mapped
    const mappedCategories = new Set<string>()
    mappings.forEach(m => {
      if (m.mappings && Array.isArray(m.mappings)) {
        m.mappings.forEach((rule: any) => {
          if (rule.source_category) {
            mappedCategories.add(rule.source_category.toLowerCase().trim())
          }
        })
      }
    })

    const unmappedCategories = [...allCategories].filter(c => !mappedCategories.has(c)).length

    // Calculate automation score
    const coveragePercent = totalCategories > 0 
      ? Math.round((mappedCategories.size / totalCategories) * 100) 
      : 0

    // AI suggestions count (categories that can be auto-matched)
    const aiSuggestionsCount = [...allCategories]
      .filter(c => !mappedCategories.has(c))
      .filter(c => canAutoMap(c))
      .length

    // Potential time saved (10 min per category mapping)
    const potentialTimeSaved = Math.round((unmappedCategories * 10) / 60)

    // Automation score
    const automationScore = Math.min(100, Math.round(
      (coveragePercent * 0.5) + 
      (stats?.activeMappings || 0) * 5 + 
      (mappings.filter(m => m.auto_map_enabled).length * 10)
    ))

    return {
      automationScore,
      unmappedCategories,
      totalCategories,
      aiSuggestionsCount,
      potentialTimeSaved,
      coveragePercent
    }
  }, [products, mappings, stats])

  return { stats: aiStats, isLoading: productsLoading || mappingsLoading }
}

function canAutoMap(category: string): boolean {
  const lower = category.toLowerCase()
  return Object.keys(GOOGLE_CATEGORIES).some(key => lower.includes(key))
}

function suggestGoogleCategory(category: string): string | null {
  const lower = category.toLowerCase()
  for (const [keyword, googleCat] of Object.entries(GOOGLE_CATEGORIES)) {
    if (lower.includes(keyword)) {
      return googleCat
    }
  }
  return null
}

export function useCategorySuggestions() {
  const { products } = useProductsUnified()
  const { data: mappings = [] } = useCategoryMappings()

  const suggestions = useMemo<CategorySuggestion[]>(() => {
    if (!products || products.length === 0) return []

    // Get categories and their product counts
    const categoryProducts: Record<string, number> = {}
    products.forEach(p => {
      if (p.category) {
        const cat = p.category.toLowerCase().trim()
        categoryProducts[cat] = (categoryProducts[cat] || 0) + 1
      }
    })

    // Get already mapped categories
    const mappedCategories = new Set<string>()
    mappings.forEach(m => {
      if (m.mappings && Array.isArray(m.mappings)) {
        m.mappings.forEach((rule: any) => {
          if (rule.source_category) {
            mappedCategories.add(rule.source_category.toLowerCase().trim())
          }
        })
      }
    })

    // Generate suggestions for unmapped categories
    const suggestions: CategorySuggestion[] = []

    Object.entries(categoryProducts).forEach(([category, count]) => {
      if (mappedCategories.has(category)) return

      const googleSuggestion = suggestGoogleCategory(category)
      if (googleSuggestion) {
        suggestions.push({
          id: `google-${category}`,
          sourceCategory: category,
          suggestedMapping: googleSuggestion,
          destination: 'google',
          confidence: calculateConfidence(category, googleSuggestion),
          productsAffected: count,
          reason: `Correspondance par mots-clés détectée`
        })
      }
    })

    return suggestions.sort((a, b) => {
      // Sort by products affected first, then by confidence
      if (b.productsAffected !== a.productsAffected) {
        return b.productsAffected - a.productsAffected
      }
      return b.confidence - a.confidence
    }).slice(0, 10)
  }, [products, mappings])

  return { suggestions }
}

function calculateConfidence(source: string, target: string): number {
  const sourceLower = source.toLowerCase()
  // Higher confidence if exact keyword match
  for (const keyword of Object.keys(GOOGLE_CATEGORIES)) {
    if (sourceLower === keyword) return 0.95
    if (sourceLower.includes(keyword) && keyword.length > 5) return 0.85
    if (sourceLower.includes(keyword)) return 0.70
  }
  return 0.50
}

export function useMappingRecommendations() {
  const { stats } = useCategoryMappingAIStats()
  const { suggestions } = useCategorySuggestions()

  const recommendations = useMemo<MappingRecommendation[]>(() => {
    const recs: MappingRecommendation[] = []

    // 1. Unmapped categories
    if (stats.unmappedCategories > 0) {
      recs.push({
        id: 'unmapped_categories',
        type: 'unmapped_category',
        title: 'Catégories non mappées',
        description: `${stats.unmappedCategories} catégories n'ont pas de correspondance marketplace configurée.`,
        priority: 'high',
        impactedProducts: stats.unmappedCategories * 10, // Estimate
        estimatedImpact: `${stats.potentialTimeSaved}h économisées`
      })
    }

    // 2. AI suggestions available
    if (stats.aiSuggestionsCount > 0) {
      recs.push({
        id: 'ai_suggestions',
        type: 'ai_suggestion',
        title: 'Suggestions IA disponibles',
        description: `${stats.aiSuggestionsCount} catégories peuvent être mappées automatiquement par l'IA.`,
        priority: 'medium',
        impactedProducts: suggestions.reduce((sum, s) => sum + s.productsAffected, 0),
        estimatedImpact: '+40% couverture'
      })
    }

    // 3. Low coverage
    if (stats.coveragePercent < 50) {
      recs.push({
        id: 'low_coverage',
        type: 'bulk_mapping',
        title: 'Couverture insuffisante',
        description: `Seulement ${stats.coveragePercent}% de vos catégories sont mappées. Activez l'auto-mapping.`,
        priority: 'high',
        impactedProducts: stats.unmappedCategories * 15,
        estimatedImpact: 'Visibilité marketplaces'
      })
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [stats, suggestions])

  return { recommendations }
}

export function useApplyCategorySuggestion() {
  const { user } = useUnifiedAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (suggestion: CategorySuggestion) => {
      // Find or create a mapping for this destination
      const { data: existingMappings, error: fetchError } = await supabase
        .from('category_mappings')
        .select('*')
        .eq('user_id', user?.id)
        .eq('destination_type', suggestion.destination)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (existingMappings) {
        // Update existing mapping
        const currentMappings = Array.isArray(existingMappings.mappings) 
          ? existingMappings.mappings as any[]
          : []
        const newRule = {
          source_category: suggestion.sourceCategory,
          target_category: suggestion.suggestedMapping,
          confidence: suggestion.confidence,
          created_by: 'ai'
        }

        const { error: updateError } = await supabase
          .from('category_mappings')
          .update({
            mappings: [...currentMappings, newRule],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMappings.id)

        if (updateError) throw updateError
      } else {
        // Create new mapping
        const destinationLabels: Record<string, string> = {
          google: 'Google Shopping',
          facebook: 'Meta/Facebook',
          amazon: 'Amazon',
          shopify: 'Shopify'
        }

        const { error: insertError } = await supabase
          .from('category_mappings')
          .insert({
            user_id: user?.id,
            name: `Mapping ${destinationLabels[suggestion.destination]}`,
            source_type: 'import',
            destination_type: suggestion.destination,
            mappings: [{
              source_category: suggestion.sourceCategory,
              target_category: suggestion.suggestedMapping,
              confidence: suggestion.confidence,
              created_by: 'ai'
            }],
            is_active: true,
            auto_map_enabled: false
          })

        if (insertError) throw insertError
      }

      return { success: true, category: suggestion.sourceCategory }
    },
    onSuccess: (data) => {
      toast.success(`Mapping créé pour "${data.category}"`)
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] })
    },
    onError: () => {
      toast.error('Erreur lors de la création du mapping')
    }
  })
}

export function useApplyAllSuggestions() {
  const { user } = useUnifiedAuth()
  const { suggestions } = useCategorySuggestions()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (suggestions.length === 0) {
        throw new Error('Aucune suggestion à appliquer')
      }

      // Group suggestions by destination
      const byDestination: Record<string, CategorySuggestion[]> = {}
      suggestions.forEach(s => {
        if (!byDestination[s.destination]) byDestination[s.destination] = []
        byDestination[s.destination].push(s)
      })

      let appliedCount = 0

      for (const [destination, destSuggestions] of Object.entries(byDestination)) {
        const { data: existingMapping, error: fetchError } = await supabase
          .from('category_mappings')
          .select('*')
          .eq('user_id', user?.id)
          .eq('destination_type', destination)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') continue

        const newRules = destSuggestions.map(s => ({
          source_category: s.sourceCategory,
          target_category: s.suggestedMapping,
          confidence: s.confidence,
          created_by: 'ai'
        }))

        if (existingMapping) {
          const currentMappings = Array.isArray(existingMapping.mappings) 
            ? existingMapping.mappings as any[]
            : []
          await supabase
            .from('category_mappings')
            .update({
              mappings: [...currentMappings, ...newRules],
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMapping.id)
        } else {
          const destinationLabels: Record<string, string> = {
            google: 'Google Shopping',
            facebook: 'Meta/Facebook',
            amazon: 'Amazon',
            shopify: 'Shopify'
          }

          await supabase
            .from('category_mappings')
            .insert({
              user_id: user?.id,
              name: `Mapping ${destinationLabels[destination]} (IA)`,
              source_type: 'import',
              destination_type: destination,
              mappings: newRules,
              is_active: true,
              auto_map_enabled: true
            })
        }

        appliedCount += newRules.length
      }

      return { success: true, count: appliedCount }
    },
    onSuccess: (data) => {
      toast.success(`${data.count} mappings créés avec succès`)
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'application des suggestions')
    }
  })
}
