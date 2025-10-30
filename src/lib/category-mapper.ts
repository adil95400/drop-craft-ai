/**
 * Category Mapper - Gère le mapping automatique des catégories entre votre système et les plateformes
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
 * Récupère le mapping de catégorie depuis la base de données
 */
export async function getCategoryMapping(
  sourceCategory: string,
  platform: string
): Promise<CategoryMapping | null> {
  try {
    const { data, error } = await supabase
      .from('category_mappings')
      .select('*')
      .eq('source_category', sourceCategory)
      .eq('platform', platform)
      .single()
    
    if (error) throw error
    return data
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
    
    const { data, error } = await supabase
      .from('category_mappings')
      .upsert({
        user_id: user.user.id,
        source_category: mapping.source_category,
        platform: mapping.platform,
        target_category: mapping.target_category,
        confidence_score: mapping.confidence_score,
        is_verified: mapping.is_verified
      })
      .select()
      .single()
    
    if (error) throw error
    return data
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
      .from('category_mappings')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch {
    return []
  }
}
