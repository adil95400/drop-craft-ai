/**
 * useAttributeAnalysis - Hook pour l'analyse des attributs produits
 * Détection des attributs manquants et suggestions IA
 */
import { useMemo, useCallback } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface AttributeIssue {
  product: UnifiedProduct
  missingAttributes: string[]
  criticality: 'high' | 'medium' | 'low'
  marketplace: string | null
  estimatedImpact?: string
}

export interface MarketplaceRequirement {
  marketplace: string
  requiredAttributes: string[]
  missingCount: number
  products: UnifiedProduct[]
  readinessScore: number
}

export interface AttributeStats {
  total: number
  complete: number
  incomplete: number
  missingGTIN: number
  missingBrand: number
  missingCategory: number
  missingSKU: number
  missingDescription: number
  completenessScore: number
}

export interface AttributeSuggestion {
  productId: string
  productName: string
  attribute: string
  suggestedValue: string
  confidence: number
  source: 'ai' | 'similar_products' | 'category_default'
}

// Attributs critiques par marketplace
const MARKETPLACE_REQUIREMENTS: Record<string, string[]> = {
  'Google Shopping': ['gtin', 'brand', 'mpn', 'category', 'description', 'image'],
  'Amazon': ['sku', 'brand', 'category', 'description', 'bullet_points'],
  'Meta/Facebook': ['brand', 'category', 'price', 'description', 'image'],
  'eBay': ['sku', 'brand', 'category', 'condition', 'description'],
  'Cdiscount': ['ean', 'brand', 'category', 'description'],
  'Fnac': ['ean', 'brand', 'category', 'description', 'weight']
}

// Poids des attributs pour le score
const ATTRIBUTE_WEIGHTS: Record<string, number> = {
  category: 25,
  brand: 20,
  sku: 15,
  gtin: 15,
  description: 15,
  image: 10
}

export function useAttributeAnalysis() {
  const { products, isLoading } = useProductsUnified()
  const { toast } = useToast()

  // Statistiques des attributs
  const stats = useMemo<AttributeStats>(() => {
    if (!products || products.length === 0) {
      return {
        total: 0, complete: 0, incomplete: 0,
        missingGTIN: 0, missingBrand: 0, missingCategory: 0, 
        missingSKU: 0, missingDescription: 0,
        completenessScore: 0
      }
    }

    const total = products.length
    
    // Comptages - accès aux propriétés du UnifiedProduct
    const missingGTIN = products.filter(p => {
      const product = p as any
      return !product.gtin && !product.ean && !product.barcode
    }).length
    
    const missingBrand = products.filter(p => {
      const product = p as any
      return !product.brand && !p.supplier_name && !p.supplier
    }).length
    
    const missingCategory = products.filter(p => !p.category).length
    const missingSKU = products.filter(p => !p.sku).length
    const missingDescription = products.filter(p => !p.description || p.description.length < 50).length

    // Produits complets (ont tous les attributs essentiels)
    const complete = products.filter(p => {
      const product = p as any
      const hasBrand = product.brand || p.supplier_name || p.supplier
      const hasIdentifier = product.gtin || product.ean || p.sku
      return p.category && hasBrand && hasIdentifier && (p.price || 0) > 0 && p.description
    }).length

    const incomplete = total - complete

    // Score de complétude pondéré
    const categoryScore = ((total - missingCategory) / total) * ATTRIBUTE_WEIGHTS.category
    const brandScore = ((total - missingBrand) / total) * ATTRIBUTE_WEIGHTS.brand
    const skuScore = ((total - missingSKU) / total) * ATTRIBUTE_WEIGHTS.sku
    const gtinScore = ((total - missingGTIN) / total) * ATTRIBUTE_WEIGHTS.gtin
    const descScore = ((total - missingDescription) / total) * ATTRIBUTE_WEIGHTS.description
    const completenessScore = Math.round(categoryScore + brandScore + skuScore + gtinScore + descScore)

    return {
      total,
      complete,
      incomplete,
      missingGTIN,
      missingBrand,
      missingCategory,
      missingSKU,
      missingDescription,
      completenessScore
    }
  }, [products])

  // Analyse par marketplace
  const marketplaceAnalysis = useMemo<MarketplaceRequirement[]>(() => {
    if (!products) return []

    return Object.entries(MARKETPLACE_REQUIREMENTS).map(([marketplace, required]) => {
      const productsWithIssues = products.filter(product => {
        const p = product as any
        return required.some(attr => {
          switch (attr) {
            case 'gtin': 
            case 'ean': return !p.gtin && !p.ean && !p.barcode
            case 'brand': return !p.brand && !product.supplier_name && !product.supplier
            case 'mpn': return !p.mpn && !product.sku
            case 'category': return !product.category
            case 'sku': return !product.sku
            case 'description': return !product.description || product.description.length < 50
            case 'price': return !(product.price && product.price > 0)
            case 'condition': return !p.condition
            case 'image': return !product.image_url
            case 'bullet_points': return !p.bullet_points
            case 'weight': return !p.weight
            default: return false
          }
        })
      })

      const readinessScore = products.length > 0 
        ? Math.round(((products.length - productsWithIssues.length) / products.length) * 100)
        : 0

      return {
        marketplace,
        requiredAttributes: required,
        missingCount: productsWithIssues.length,
        products: productsWithIssues.slice(0, 50),
        readinessScore
      }
    }).sort((a, b) => b.readinessScore - a.readinessScore)
  }, [products])

  // Produits avec problèmes d'attributs
  const productIssues = useMemo<AttributeIssue[]>(() => {
    if (!products) return []

    return products
      .map(product => {
        const p = product as any
        const missing: string[] = []
        
        if (!product.category) missing.push('Catégorie')
        if (!p.brand && !product.supplier_name && !product.supplier) missing.push('Marque')
        if (!product.sku) missing.push('SKU')
        if (!p.gtin && !p.ean && !p.barcode) missing.push('GTIN/EAN')
        if (!product.description || product.description.length < 50) missing.push('Description')
        if (!product.image_url) missing.push('Image')

        if (missing.length === 0) return null

        const criticality: 'high' | 'medium' | 'low' = 
          missing.length >= 4 ? 'high' :
          missing.length >= 2 ? 'medium' : 'low'

        // Estimer l'impact business
        const estimatedImpact = criticality === 'high' 
          ? 'Bloquant pour publication' 
          : criticality === 'medium' 
            ? 'Visibilité réduite (-30% CTR)' 
            : 'Impact mineur'

        // Identifier la marketplace la plus impactée
        let impactedMarketplace: string | null = null
        for (const [mp, attrs] of Object.entries(MARKETPLACE_REQUIREMENTS)) {
          const mpMissing = attrs.filter(attr => {
            switch (attr) {
              case 'gtin': case 'ean': return missing.includes('GTIN/EAN')
              case 'brand': return missing.includes('Marque')
              case 'category': return missing.includes('Catégorie')
              case 'sku': return missing.includes('SKU')
              case 'description': return missing.includes('Description')
              case 'image': return missing.includes('Image')
              default: return false
            }
          })
          if (mpMissing.length > 0) {
            impactedMarketplace = mp
            break
          }
        }

        return {
          product,
          missingAttributes: missing,
          criticality,
          marketplace: impactedMarketplace,
          estimatedImpact
        } as AttributeIssue
      })
      .filter((issue): issue is AttributeIssue => issue !== null)
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.criticality] - order[b.criticality]
      })
  }, [products])

  // Produits enrichissables par IA
  const enrichableProducts = useMemo(() => 
    productIssues.filter(issue => 
      issue.missingAttributes.some(attr => 
        ['Description', 'Catégorie', 'Marque'].includes(attr)
      )
    ),
    [productIssues]
  )

  // Suggestions IA (mock pour l'instant, sera connecté à l'edge function)
  const aiSuggestions = useMemo<AttributeSuggestion[]>(() => {
    if (!products) return []
    
    // Générer des suggestions pour les 10 premiers produits incomplets
    return productIssues.slice(0, 10).flatMap(issue => {
      const suggestions: AttributeSuggestion[] = []
      
      if (issue.missingAttributes.includes('Catégorie')) {
        suggestions.push({
          productId: issue.product.id,
          productName: issue.product.name,
          attribute: 'Catégorie',
          suggestedValue: inferCategoryFromName(issue.product.name),
          confidence: 0.75,
          source: 'ai'
        })
      }
      
      if (issue.missingAttributes.includes('Marque')) {
        const extractedBrand = extractBrandFromName(issue.product.name)
        if (extractedBrand) {
          suggestions.push({
            productId: issue.product.id,
            productName: issue.product.name,
            attribute: 'Marque',
            suggestedValue: extractedBrand,
            confidence: 0.65,
            source: 'ai'
          })
        }
      }
      
      return suggestions
    })
  }, [productIssues])

  // Action: Enrichir un produit via IA
  const enrichProduct = useCallback(async (productId: string, attributes: string[]) => {
    toast({
      title: "Enrichissement IA lancé",
      description: `Analyse de ${attributes.length} attribut(s) en cours...`
    })
    const { data, error } = await supabase.functions.invoke('ai-enrich-import', {
      body: { product_ids: [productId], language: 'fr', tone: 'professionnel' }
    })
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" })
      return { success: false }
    }
    return { success: true, jobId: data?.job_id }
  }, [toast])

  // Action: Enrichir en masse
  const bulkEnrich = useCallback(async (productIds: string[], attributes: string[]) => {
    toast({
      title: "Enrichissement en masse",
      description: `${productIds.length} produits en file d'attente`
    })
    const { data, error } = await supabase.functions.invoke('ai-enrich-import', {
      body: { product_ids: productIds, language: 'fr', tone: 'professionnel' }
    })
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" })
      return { success: false, queued: 0 }
    }
    return { success: true, queued: productIds.length, jobId: data?.job_id }
  }, [toast])

  return {
    stats,
    marketplaceAnalysis,
    productIssues,
    enrichableProducts,
    aiSuggestions,
    isLoading,
    products,
    // Actions
    enrichProduct,
    bulkEnrich
  }
}

// Helpers pour l'inférence IA locale
function inferCategoryFromName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('téléphone') || lower.includes('phone') || lower.includes('smartphone')) return 'Électronique > Téléphonie'
  if (lower.includes('t-shirt') || lower.includes('chemise') || lower.includes('pull')) return 'Mode > Vêtements'
  if (lower.includes('chaussure') || lower.includes('basket') || lower.includes('sneaker')) return 'Mode > Chaussures'
  if (lower.includes('montre') || lower.includes('watch')) return 'Accessoires > Montres'
  if (lower.includes('sac') || lower.includes('bag')) return 'Accessoires > Maroquinerie'
  if (lower.includes('casque') || lower.includes('écouteur') || lower.includes('headphone')) return 'Électronique > Audio'
  return 'Non classifié'
}

function extractBrandFromName(name: string): string | null {
  const knownBrands = ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer']
  for (const brand of knownBrands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand
    }
  }
  // Essayer d'extraire le premier mot capitalisé
  const firstWord = name.split(' ')[0]
  if (firstWord && firstWord[0] === firstWord[0].toUpperCase() && firstWord.length > 2) {
    return firstWord
  }
  return null
}
