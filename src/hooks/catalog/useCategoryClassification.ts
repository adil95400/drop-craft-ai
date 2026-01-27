/**
 * useCategoryClassification - Hook pour la classification des produits
 * Analyse des catégories/marques et suggestions IA
 */
import { useMemo } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'

export interface CategoryStats {
  name: string
  count: number
  percentage: number
  avgPrice: number
  avgMargin: number
}

export interface BrandStats {
  name: string
  count: number
  percentage: number
}

export interface ClassificationIssue {
  product: UnifiedProduct
  issueType: 'no_category' | 'no_brand' | 'misclassified'
  suggestion?: string
  confidence?: number
}

export interface ClassificationMetrics {
  total: number
  withCategory: number
  withBrand: number
  missingCategory: number
  missingBrand: number
  classificationScore: number
  topCategories: CategoryStats[]
  topBrands: BrandStats[]
}

export function useCategoryClassification() {
  const { products, isLoading } = useProductsUnified()

  // Métriques de classification
  const metrics = useMemo<ClassificationMetrics>(() => {
    if (!products || products.length === 0) {
      return {
        total: 0, withCategory: 0, withBrand: 0,
        missingCategory: 0, missingBrand: 0, classificationScore: 0,
        topCategories: [], topBrands: []
      }
    }

    const total = products.length
    const withCategory = products.filter(p => p.category).length
    const withBrand = products.filter(p => (p as any).brand || p.supplier_name).length
    const missingCategory = total - withCategory
    const missingBrand = total - withBrand

    // Score de classification
    const categoryScore = (withCategory / total) * 60
    const brandScore = (withBrand / total) * 40
    const classificationScore = Math.round(categoryScore + brandScore)

    // Agrégation par catégorie
    const categoryMap = new Map<string, UnifiedProduct[]>()
    products.forEach(p => {
      if (p.category) {
        const existing = categoryMap.get(p.category) || []
        categoryMap.set(p.category, [...existing, p])
      }
    })

    const topCategories: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([name, prods]) => ({
        name,
        count: prods.length,
        percentage: Math.round((prods.length / total) * 100),
        avgPrice: prods.reduce((sum, p) => sum + (p.price || 0), 0) / prods.length,
        avgMargin: prods.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / prods.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Agrégation par marque
    const brandMap = new Map<string, number>()
    products.forEach(p => {
      const brand = (p as any).brand || p.supplier_name
      if (brand) {
        brandMap.set(brand, (brandMap.get(brand) || 0) + 1)
      }
    })

    const topBrands: BrandStats[] = Array.from(brandMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      total,
      withCategory,
      withBrand,
      missingCategory,
      missingBrand,
      classificationScore,
      topCategories,
      topBrands
    }
  }, [products])

  // Problèmes de classification
  const issues = useMemo<ClassificationIssue[]>(() => {
    if (!products) return []

    const issueList: ClassificationIssue[] = []

    products.forEach(product => {
      const p = product as any
      if (!product.category) {
        // Suggestion IA basée sur le nom du produit
        const suggestion = suggestCategory(product.name || '')
        issueList.push({
          product,
          issueType: 'no_category',
          suggestion: suggestion.category,
          confidence: suggestion.confidence
        })
      }

      if (!p.brand && !product.supplier_name) {
        issueList.push({
          product,
          issueType: 'no_brand',
          suggestion: extractBrandFromName(product.name || '')
        })
      }
    })

    return issueList.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  }, [products])

  // Produits sans catégorie
  const uncategorized = useMemo(() => 
    products?.filter(p => !p.category) || [],
    [products]
  )

  // Produits sans marque
  const unbranded = useMemo(() => 
    products?.filter(p => !(p as any).brand && !p.supplier_name) || [],
    [products]
  )

  // Produits avec suggestions IA disponibles
  const withSuggestions = useMemo(() => 
    issues.filter(i => i.suggestion && (i.confidence || 0) > 0.5),
    [issues]
  )

  return {
    metrics,
    issues,
    uncategorized,
    unbranded,
    withSuggestions,
    isLoading,
    products
  }
}

// Suggestion de catégorie basée sur le nom (heuristique simple)
function suggestCategory(name: string): { category: string; confidence: number } {
  const nameLower = name.toLowerCase()
  
  const patterns: Array<{ keywords: string[]; category: string; confidence: number }> = [
    { keywords: ['t-shirt', 'tee', 'polo', 'chemise', 'shirt'], category: 'Mode & Vêtements', confidence: 0.85 },
    { keywords: ['pantalon', 'jean', 'jeans', 'short', 'bermuda'], category: 'Mode & Vêtements', confidence: 0.85 },
    { keywords: ['robe', 'jupe', 'dress'], category: 'Mode & Vêtements', confidence: 0.85 },
    { keywords: ['chaussure', 'basket', 'sneaker', 'botte', 'sandale'], category: 'Chaussures', confidence: 0.9 },
    { keywords: ['montre', 'watch', 'bracelet', 'collier', 'bague'], category: 'Bijoux & Montres', confidence: 0.8 },
    { keywords: ['téléphone', 'phone', 'smartphone', 'iphone', 'samsung'], category: 'High-Tech', confidence: 0.9 },
    { keywords: ['ordinateur', 'laptop', 'pc', 'macbook', 'tablette'], category: 'High-Tech', confidence: 0.9 },
    { keywords: ['casque', 'écouteur', 'airpods', 'headphone'], category: 'High-Tech', confidence: 0.85 },
    { keywords: ['lampe', 'luminaire', 'ampoule'], category: 'Maison & Décoration', confidence: 0.8 },
    { keywords: ['canapé', 'fauteuil', 'chaise', 'table', 'meuble'], category: 'Maison & Décoration', confidence: 0.85 },
    { keywords: ['jouet', 'jeu', 'puzzle', 'lego'], category: 'Jouets & Jeux', confidence: 0.85 },
    { keywords: ['sport', 'fitness', 'yoga', 'musculation'], category: 'Sport & Loisirs', confidence: 0.8 },
    { keywords: ['beauté', 'maquillage', 'cosmétique', 'parfum'], category: 'Beauté & Santé', confidence: 0.85 },
    { keywords: ['jardin', 'plante', 'pot', 'arrosage'], category: 'Jardin', confidence: 0.8 },
    { keywords: ['cuisine', 'poêle', 'casserole', 'robot'], category: 'Cuisine', confidence: 0.8 },
  ]

  for (const pattern of patterns) {
    if (pattern.keywords.some(kw => nameLower.includes(kw))) {
      return { category: pattern.category, confidence: pattern.confidence }
    }
  }

  return { category: 'Autre', confidence: 0.3 }
}

// Extraction de marque du nom (heuristique)
function extractBrandFromName(name: string): string | undefined {
  const knownBrands = [
    'Nike', 'Adidas', 'Apple', 'Samsung', 'Sony', 'Lego', 'Ikea',
    'Zara', 'H&M', 'Gucci', 'Prada', 'Louis Vuitton', 'Chanel',
    'Canon', 'Nikon', 'Dell', 'HP', 'Lenovo', 'Asus', 'Philips'
  ]

  for (const brand of knownBrands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand
    }
  }

  return undefined
}
