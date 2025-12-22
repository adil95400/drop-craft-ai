/**
 * Category Mapper - Gère le mapping automatique des catégories entre votre système et les plateformes
 * NOTE: Uses field_mappings table as category_mappings doesn't exist
 */

import { supabase } from '@/integrations/supabase/client'

export interface CategoryMapping {
  id?: string
  user_id?: string
  source_category: string
  platform: string
  target_category: string
  confidence_score: number
  is_verified: boolean
}

// Catégories suggérées par plateforme (exemples)
export const PLATFORM_CATEGORIES: Record<string, string[]> = {
  amazon: [
    'Electronics',
    'Clothing & Accessories',
    'Home & Kitchen',
    'Sports & Outdoors',
    'Books',
    'Toys & Games',
    'Health & Personal Care',
    'Beauty',
    'Automotive',
    'Office Products'
  ],
  ebay: [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Collectibles',
    'Motors',
    'Toys & Hobbies',
    'Health & Beauty',
    'Business & Industrial',
    'Music'
  ],
  shopify: [
    'Apparel',
    'Electronics',
    'Home & Garden',
    'Sports & Recreation',
    'Toys & Games',
    'Health & Beauty',
    'Books & Media',
    'Food & Beverages',
    'Jewelry & Accessories',
    'Art & Collectibles'
  ],
  woocommerce: [
    'Clothing',
    'Electronics',
    'Home Decor',
    'Sports Equipment',
    'Toys',
    'Beauty Products',
    'Books',
    'Food',
    'Jewelry',
    'Art'
  ],
  facebook: [
    'Apparel & Accessories',
    'Electronics & Media',
    'Home & Garden',
    'Sporting Goods',
    'Toys & Games',
    'Health & Beauty',
    'Books & Entertainment',
    'Food & Beverage',
    'Jewelry',
    'Art & Crafts'
  ],
  google: [
    'Apparel & Accessories',
    'Electronics',
    'Home & Garden',
    'Sporting Goods',
    'Toys & Games',
    'Health & Beauty',
    'Media',
    'Food, Beverages & Tobacco',
    'Jewelry',
    'Arts & Entertainment'
  ]
}

// Local cache for category mappings (since table doesn't exist)
const categoryMappingsCache: Map<string, CategoryMapping> = new Map()

/**
 * Trouve automatiquement la meilleure catégorie cible basée sur la catégorie source
 */
export function findBestCategoryMatch(
  sourceCategory: string,
  platform: string
): { category: string; confidence: number } {
  const platformCategories = PLATFORM_CATEGORIES[platform.toLowerCase()] || []
  
  if (platformCategories.length === 0) {
    return { category: sourceCategory, confidence: 0.5 }
  }
  
  const sourceLower = sourceCategory.toLowerCase()
  
  // Recherche de correspondance exacte
  const exactMatch = platformCategories.find(
    cat => cat.toLowerCase() === sourceLower
  )
  if (exactMatch) {
    return { category: exactMatch, confidence: 1.0 }
  }
  
  // Recherche de correspondance partielle
  const partialMatch = platformCategories.find(cat =>
    cat.toLowerCase().includes(sourceLower) ||
    sourceLower.includes(cat.toLowerCase())
  )
  if (partialMatch) {
    return { category: partialMatch, confidence: 0.8 }
  }
  
  // Recherche par mots-clés
  const keywords = sourceLower.split(/[\s-_&]+/)
  let bestMatch = platformCategories[0]
  let bestScore = 0
  
  platformCategories.forEach(cat => {
    const catLower = cat.toLowerCase()
    let score = 0
    
    keywords.forEach(keyword => {
      if (catLower.includes(keyword)) {
        score += keyword.length
      }
    })
    
    if (score > bestScore) {
      bestScore = score
      bestMatch = cat
    }
  })
  
  return {
    category: bestMatch,
    confidence: bestScore > 0 ? Math.min(0.7, bestScore / sourceLower.length) : 0.3
  }
}

/**
 * Récupère le mapping de catégorie depuis le cache local ou field_mappings
 */
export async function getCategoryMapping(
  sourceCategory: string,
  platform: string
): Promise<CategoryMapping | null> {
  const cacheKey = `${sourceCategory}:${platform}`
  
  // Check local cache first
  if (categoryMappingsCache.has(cacheKey)) {
    return categoryMappingsCache.get(cacheKey) || null
  }
  
  try {
    // Try to find in field_mappings table
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return null
    
    const { data, error } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('source_entity', 'category')
      .eq('source_field', sourceCategory)
      .eq('target_entity', platform)
      .maybeSingle()
    
    if (error || !data) return null
    
    const mapping: CategoryMapping = {
      id: data.id,
      user_id: data.user_id,
      source_category: data.source_field,
      platform: data.target_entity,
      target_category: data.target_field,
      confidence_score: 1.0,
      is_verified: true
    }
    
    categoryMappingsCache.set(cacheKey, mapping)
    return mapping
  } catch {
    return null
  }
}

/**
 * Sauvegarde un mapping de catégorie
 */
export async function saveCategoryMapping(
  mapping: Omit<CategoryMapping, 'id' | 'user_id'>
): Promise<CategoryMapping | null> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) throw new Error('User not authenticated')
    
    // Save to field_mappings table
    const { data, error } = await supabase
      .from('field_mappings')
      .upsert({
        user_id: user.user.id,
        source_entity: 'category',
        source_field: mapping.source_category,
        target_entity: mapping.platform,
        target_field: mapping.target_category,
        is_required: mapping.is_verified,
        default_value: String(mapping.confidence_score)
      } as any)
      .select()
      .single()
    
    if (error) throw error
    
    const result: CategoryMapping = {
      id: data.id,
      user_id: data.user_id,
      source_category: mapping.source_category,
      platform: mapping.platform,
      target_category: mapping.target_category,
      confidence_score: mapping.confidence_score,
      is_verified: mapping.is_verified
    }
    
    // Update cache
    const cacheKey = `${mapping.source_category}:${mapping.platform}`
    categoryMappingsCache.set(cacheKey, result)
    
    return result
  } catch {
    return null
  }
}

/**
 * Mappe une catégorie automatiquement (en utilisant le cache DB ou l'algo)
 */
export async function mapCategory(
  sourceCategory: string,
  platform: string
): Promise<{ category: string; confidence: number; cached: boolean }> {
  // Vérifier si mapping existe déjà
  const existingMapping = await getCategoryMapping(sourceCategory, platform)
  
  if (existingMapping?.is_verified) {
    return {
      category: existingMapping.target_category,
      confidence: 1.0,
      cached: true
    }
  }
  
  // Sinon, calculer le meilleur match
  const match = findBestCategoryMatch(sourceCategory, platform)
  
  // Sauvegarder pour usage futur (si confiance > 0.7)
  if (match.confidence > 0.7) {
    await saveCategoryMapping({
      source_category: sourceCategory,
      platform,
      target_category: match.category,
      confidence_score: match.confidence,
      is_verified: false
    })
  }
  
  return { ...match, cached: false }
}

/**
 * Récupère toutes les catégories disponibles pour une plateforme
 */
export function getPlatformCategories(platform: string): string[] {
  return PLATFORM_CATEGORIES[platform.toLowerCase()] || []
}

/**
 * Récupère tous les mappings de l'utilisateur
 */
export async function getUserCategoryMappings(): Promise<CategoryMapping[]> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return []
    
    const { data, error } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('source_entity', 'category')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      source_category: item.source_field,
      platform: item.target_entity,
      target_category: item.target_field,
      confidence_score: parseFloat(item.default_value || '0.8'),
      is_verified: item.is_required || false
    }))
  } catch {
    return []
  }
}
