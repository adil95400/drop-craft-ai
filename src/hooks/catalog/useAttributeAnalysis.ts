/**
 * useAttributeAnalysis - Hook pour l'analyse des attributs produits
 * Détection des attributs manquants et suggestions IA
 */
import { useMemo } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'

export interface AttributeIssue {
  product: UnifiedProduct
  missingAttributes: string[]
  criticality: 'high' | 'medium' | 'low'
  marketplace: string | null
}

export interface MarketplaceRequirement {
  marketplace: string
  requiredAttributes: string[]
  missingCount: number
  products: UnifiedProduct[]
}

export interface AttributeStats {
  total: number
  complete: number
  incomplete: number
  missingGTIN: number
  missingBrand: number
  missingCategory: number
  missingSKU: number
  completenessScore: number
}

// Attributs critiques par marketplace
const MARKETPLACE_REQUIREMENTS: Record<string, string[]> = {
  'Google Shopping': ['gtin', 'brand', 'mpn', 'category'],
  'Amazon': ['sku', 'brand', 'category', 'description'],
  'Meta/Facebook': ['brand', 'category', 'price'],
  'eBay': ['sku', 'brand', 'category', 'condition']
}

export function useAttributeAnalysis() {
  const { products, isLoading } = useProductsUnified()

  // Statistiques des attributs
  const stats = useMemo<AttributeStats>(() => {
    if (!products || products.length === 0) {
      return {
        total: 0, complete: 0, incomplete: 0,
        missingGTIN: 0, missingBrand: 0, missingCategory: 0, missingSKU: 0,
        completenessScore: 0
      }
    }

    const total = products.length
    
    // Comptages - utiliser type assertion pour propriétés optionnelles
    const missingGTIN = products.filter(p => !(p as any).gtin && !(p as any).ean).length
    const missingBrand = products.filter(p => !(p as any).brand && !p.supplier_name).length
    const missingCategory = products.filter(p => !p.category).length
    const missingSKU = products.filter(p => !p.sku).length

    // Produits complets (ont tous les attributs essentiels)
    const complete = products.filter(p => 
      p.category && ((p as any).brand || p.supplier_name) && p.sku && (p.price || 0) > 0
    ).length

    const incomplete = total - complete

    // Score de complétude pondéré
    const categoryScore = ((total - missingCategory) / total) * 30
    const brandScore = ((total - missingBrand) / total) * 25
    const skuScore = ((total - missingSKU) / total) * 25
    const gtinScore = ((total - missingGTIN) / total) * 20
    const completenessScore = Math.round(categoryScore + brandScore + skuScore + gtinScore)

    return {
      total,
      complete,
      incomplete,
      missingGTIN,
      missingBrand,
      missingCategory,
      missingSKU,
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
            case 'gtin': return !p.gtin && !p.ean
            case 'brand': return !p.brand && !product.supplier_name
            case 'mpn': return !p.mpn && !product.sku
            case 'category': return !product.category
            case 'sku': return !product.sku
            case 'description': return !product.description
            case 'price': return !(product.price && product.price > 0)
            case 'condition': return true // Généralement manquant
            default: return false
          }
        })
      })

      return {
        marketplace,
        requiredAttributes: required,
        missingCount: productsWithIssues.length,
        products: productsWithIssues.slice(0, 50) // Limiter pour performance
      }
    }).sort((a, b) => b.missingCount - a.missingCount)
  }, [products])

  // Produits avec problèmes d'attributs
  const productIssues = useMemo<AttributeIssue[]>(() => {
    if (!products) return []

    return products
      .map(product => {
        const p = product as any
        const missing: string[] = []
        
        if (!product.category) missing.push('Catégorie')
        if (!p.brand && !product.supplier_name) missing.push('Marque')
        if (!product.sku) missing.push('SKU')
        if (!p.gtin && !p.ean) missing.push('GTIN/EAN')
        if (!product.description) missing.push('Description')

        if (missing.length === 0) return null

        const criticality: 'high' | 'medium' | 'low' = 
          missing.length >= 3 ? 'high' :
          missing.length >= 2 ? 'medium' : 'low'

        // Identifier la marketplace la plus impactée
        let impactedMarketplace: string | null = null
        for (const [mp, attrs] of Object.entries(MARKETPLACE_REQUIREMENTS)) {
          const mpMissing = attrs.filter(attr => {
            switch (attr) {
              case 'gtin': return missing.includes('GTIN/EAN')
              case 'brand': return missing.includes('Marque')
              case 'category': return missing.includes('Catégorie')
              case 'sku': return missing.includes('SKU')
              case 'description': return missing.includes('Description')
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
          marketplace: impactedMarketplace
        }
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

  return {
    stats,
    marketplaceAnalysis,
    productIssues,
    enrichableProducts,
    isLoading,
    products
  }
}
