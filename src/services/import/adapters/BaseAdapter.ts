/**
 * Adaptateur de base pour l'import
 * Fournit les fonctionnalités communes à tous les adaptateurs
 */

import { 
  ImportAdapter, 
  ImportRequest, 
  ImportSource, 
  NormalizedProduct,
  SourceAttribution,
  SourceField,
  InternalCategory,
  INTERNAL_CATEGORIES
} from '../types'
import { calculateCompletenessScore, determineProductStatus } from '../validators'

export abstract class BaseAdapter implements ImportAdapter {
  abstract name: string
  abstract supportedSources: ImportSource[]

  abstract extract(request: ImportRequest): Promise<any[]>
  abstract normalize(rawProduct: any): NormalizedProduct

  /**
   * Crée un champ source pour l'attribution
   */
  protected createSourceField(
    source: 'api' | 'headless' | 'html' | 'manual' | 'ai',
    confidence: number
  ): SourceField {
    return {
      source,
      confidence: Math.min(100, Math.max(0, confidence)),
      extractedAt: new Date().toISOString()
    }
  }

  /**
   * Crée une attribution de source complète
   */
  protected createAttribution(
    source: 'api' | 'headless' | 'html',
    confidence: number = 85
  ): SourceAttribution {
    return {
      title: this.createSourceField(source, confidence),
      description: this.createSourceField(source, confidence),
      price: this.createSourceField(source, confidence + 10),
      images: this.createSourceField(source, confidence)
    }
  }

  /**
   * Mappe une catégorie externe vers une catégorie interne
   */
  protected mapCategory(externalCategory?: string): InternalCategory {
    if (!externalCategory) return 'uncategorized'

    const lower = externalCategory.toLowerCase()
    
    // Mapping basique par mots-clés
    const mappings: Record<InternalCategory, string[]> = {
      'electronics': ['electronics', 'tech', 'computer', 'phone', 'gadget', 'électronique'],
      'clothing': ['clothing', 'fashion', 'apparel', 'vêtement', 'mode', 'shirt', 'pants', 'dress'],
      'home-garden': ['home', 'garden', 'furniture', 'decor', 'maison', 'jardin', 'kitchen'],
      'beauty-health': ['beauty', 'health', 'cosmetic', 'skincare', 'makeup', 'beauté', 'santé'],
      'toys-games': ['toys', 'games', 'jouet', 'jeux', 'puzzle', 'hobby'],
      'sports-outdoors': ['sports', 'outdoor', 'fitness', 'camping', 'sport', 'gym'],
      'automotive': ['auto', 'car', 'vehicle', 'moto', 'voiture', 'automotive'],
      'books-media': ['book', 'media', 'music', 'movie', 'livre', 'musique'],
      'food-grocery': ['food', 'grocery', 'alimentaire', 'cuisine', 'gourmet'],
      'jewelry-accessories': ['jewelry', 'accessory', 'watch', 'bijou', 'montre', 'bag'],
      'pet-supplies': ['pet', 'animal', 'dog', 'cat', 'animaux'],
      'office-supplies': ['office', 'stationery', 'bureau', 'papeterie'],
      'baby-kids': ['baby', 'kids', 'children', 'bébé', 'enfant'],
      'tools-hardware': ['tools', 'hardware', 'outil', 'bricolage'],
      'arts-crafts': ['art', 'craft', 'diy', 'creative'],
      'musical-instruments': ['music', 'instrument', 'guitar', 'piano'],
      'uncategorized': []
    }

    for (const [internal, keywords] of Object.entries(mappings)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return internal as InternalCategory
      }
    }

    return 'uncategorized'
  }

  /**
   * Extrait les images haute résolution depuis les thumbnails
   */
  protected upgradeImageUrl(url: string, source: ImportSource): string {
    if (!url) return url

    switch (source) {
      case 'amazon':
        // Amazon: force high-res SL1500
        return url
          .replace(/_S[XY]\d+_/g, '_SL1500_')
          .replace(/_AC_S[XY]\d+_/g, '_AC_SL1500_')
          .replace(/\._[A-Z]{2}[\d_,]+_\./, '._AC_SL1500_.')

      case 'aliexpress':
      case 'temu':
        // AliExpress/Temu: remove resize suffixes for full res
        return url
          .replace(/_\d+x\d+\.(jpg|png|webp)/gi, '.$1')
          .replace(/\.(jpg|png|webp)_\d+x\d+\.\1/gi, '.$1')

      case 'shopify':
        // Shopify: remove size suffixes for max res
        return url.replace(/(_\d+x\d*|_\d*x\d+)\./, '.')

      case 'ebay':
        // eBay: replace s-l300/s-l500 with s-l1600
        return url
          .replace(/s-l\d+\./g, 's-l1600.')
          .replace(/\/s-l\d+/g, '/s-l1600')

      case 'etsy':
        // Etsy: replace il_340x270 etc. with il_fullxfull
        return url.replace(/il_\d+x\d+/g, 'il_fullxfull')

      default:
        return url
    }
  }

  /**
   * Nettoie le prix depuis une chaîne
   */
  protected parsePrice(priceStr: string | number): number {
    if (typeof priceStr === 'number') return priceStr
    if (!priceStr) return 0

    // Supprimer devise et espaces
    const cleaned = priceStr
      .replace(/[€$£¥₹]/g, '')
      .replace(/\s/g, '')
      .replace(/,/g, '.')
      .trim()

    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * Extrait le stock depuis différents formats
   */
  protected parseStock(stockData: any): number | undefined {
    if (typeof stockData === 'number') return stockData
    if (typeof stockData === 'string') {
      const match = stockData.match(/\d+/)
      return match ? parseInt(match[0], 10) : undefined
    }
    if (stockData?.quantity) return stockData.quantity
    if (stockData?.available) return stockData.available
    return undefined
  }

  /**
   * Finalise un produit normalisé avec score et statut
   */
  protected finalize(product: Partial<NormalizedProduct>): NormalizedProduct {
    const completenessScore = calculateCompletenessScore(product)
    const status = determineProductStatus(completenessScore)

    return {
      title: product.title || 'Sans titre',
      description: product.description || '',
      price: product.price || 0,
      images: product.images || [],
      completenessScore,
      status,
      sourceAttribution: product.sourceAttribution || this.createAttribution('html', 70),
      ...product
    } as NormalizedProduct
  }
}
