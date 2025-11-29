/**
 * SERVICE DE GÉNÉRATION DE FEEDS MULTI-CANAUX
 * Google Merchant, Meta, TikTok, Amazon
 */

import { UnifiedProduct } from '@/services/ProductsUnifiedService'
import { ProductRule } from '@/lib/rules/ruleTypes'

export type FeedChannel = 'google' | 'meta' | 'tiktok' | 'amazon'
export type FeedFormat = 'xml' | 'csv' | 'json'

export interface FeedConfig {
  channel: FeedChannel
  format: FeedFormat
  includeLowQuality?: boolean
  minQualityScore?: number
  applyChannelRules?: boolean
  customMapping?: Record<string, string>
}

export interface FeedProduct {
  id: string
  title: string
  description: string
  link: string
  imageLink: string
  additionalImageLinks?: string[]
  price: string
  availability: 'in stock' | 'out of stock' | 'preorder'
  brand?: string
  gtin?: string
  mpn?: string
  condition: 'new' | 'refurbished' | 'used'
  
  // Channel-specific
  googleProductCategory?: string
  productType?: string
  customLabels?: Record<string, string>
  
  // Meta-specific
  facebookProductCategory?: string
  
  // Amazon-specific
  amazonCategory?: string
  fulfillmentChannel?: 'FBA' | 'FBM'
}

class FeedServiceClass {
  /**
   * Générer un feed pour un canal spécifique
   */
  async generateFeed(
    products: UnifiedProduct[],
    config: FeedConfig,
    rules?: ProductRule[]
  ): Promise<string> {
    // Filtrer les produits selon qualité
    let filteredProducts = products.filter(p => 
      p.status === 'active' && 
      (!config.minQualityScore || (p.ai_score || 0) >= config.minQualityScore)
    )

    // Appliquer les règles par canal si demandé
    if (config.applyChannelRules && rules) {
      const channelRules = rules.filter(r => 
        r.enabled && 
        (r.channel === config.channel || r.channel === 'global')
      )
      
      // Ici on pourrait appliquer les règles, pour l'instant on filtre juste
      filteredProducts = filteredProducts.filter(p => {
        // Vérifier que le produit respecte les contraintes du canal
        return this.validateProductForChannel(p, config.channel)
      })
    }

    // Convertir en format feed
    const feedProducts = filteredProducts.map(p => this.convertToFeedProduct(p, config))

    // Générer selon le format
    switch (config.format) {
      case 'xml':
        return this.generateXMLFeed(feedProducts, config.channel)
      case 'csv':
        return this.generateCSVFeed(feedProducts, config.channel)
      case 'json':
        return this.generateJSONFeed(feedProducts, config.channel)
      default:
        throw new Error(`Format non supporté: ${config.format}`)
    }
  }

  /**
   * Valider qu'un produit est compatible avec un canal
   */
  private validateProductForChannel(product: UnifiedProduct, channel: FeedChannel): boolean {
    switch (channel) {
      case 'google':
        // Google exige: title, description, price, image
        return !!(
          product.name &&
          product.description &&
          product.price &&
          product.image_url
        )
      
      case 'meta':
        // Meta exige: title, description, price, image
        return !!(
          product.name &&
          product.description &&
          product.price &&
          product.image_url
        )
      
      case 'tiktok':
        // TikTok: title court
        return !!(
          product.name &&
          product.name.length <= 100 &&
          product.price &&
          product.image_url
        )
      
      case 'amazon':
        // Amazon: catégorie requise
        return !!(
          product.name &&
          product.price &&
          product.category
        )
      
      default:
        return true
    }
  }

  /**
   * Convertir UnifiedProduct → FeedProduct
   */
  private convertToFeedProduct(product: UnifiedProduct, config: FeedConfig): FeedProduct {
    const baseUrl = window.location.origin
    const availability = product.stock_quantity && product.stock_quantity > 0 ? 'in stock' : 'out of stock'

    return {
      id: product.id,
      title: product.name,
      description: product.description || '',
      link: `${baseUrl}/products/${product.id}`,
      imageLink: product.image_url || '',
      additionalImageLinks: product.images?.slice(1, 10),
      price: `${product.price} EUR`,
      availability,
      brand: product.category,
      gtin: product.sku,
      mpn: product.sku,
      condition: 'new',
      
      // Channel-specific mapping
      productType: product.category
    }
  }

  private mapAvailability(status?: string): 'in stock' | 'out of stock' | 'preorder' {
    if (!status || status === 'out_of_stock') return 'out of stock'
    if (status === 'in_stock') return 'in stock'
    return 'preorder'
  }

  /**
   * Générer feed XML (Google Merchant Center)
   */
  private generateXMLFeed(products: FeedProduct[], channel: FeedChannel): string {
    const items = products.map(p => `
    <item>
      <g:id>${this.escapeXML(p.id)}</g:id>
      <g:title>${this.escapeXML(p.title)}</g:title>
      <g:description>${this.escapeXML(p.description)}</g:description>
      <g:link>${this.escapeXML(p.link)}</g:link>
      <g:image_link>${this.escapeXML(p.imageLink)}</g:image_link>
      ${p.additionalImageLinks?.map(img => `<g:additional_image_link>${this.escapeXML(img)}</g:additional_image_link>`).join('') || ''}
      <g:price>${this.escapeXML(p.price)}</g:price>
      <g:availability>${this.escapeXML(p.availability)}</g:availability>
      ${p.brand ? `<g:brand>${this.escapeXML(p.brand)}</g:brand>` : ''}
      ${p.gtin ? `<g:gtin>${this.escapeXML(p.gtin)}</g:gtin>` : ''}
      ${p.mpn ? `<g:mpn>${this.escapeXML(p.mpn)}</g:mpn>` : ''}
      <g:condition>${this.escapeXML(p.condition)}</g:condition>
      ${p.googleProductCategory ? `<g:google_product_category>${this.escapeXML(p.googleProductCategory)}</g:google_product_category>` : ''}
      ${p.productType ? `<g:product_type>${this.escapeXML(p.productType)}</g:product_type>` : ''}
    </item>`).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed - ${channel}</title>
    <link>${window.location.origin}</link>
    <description>Product feed generated by ShopOpti</description>
    ${items}
  </channel>
</rss>`
  }

  /**
   * Générer feed CSV (Meta Commerce)
   */
  private generateCSVFeed(products: FeedProduct[], channel: FeedChannel): string {
    const headers = [
      'id', 'title', 'description', 'link', 'image_link',
      'price', 'availability', 'brand', 'gtin', 'mpn', 'condition'
    ]

    const rows = products.map(p => [
      p.id,
      this.escapeCSV(p.title),
      this.escapeCSV(p.description),
      p.link,
      p.imageLink,
      p.price,
      p.availability,
      p.brand || '',
      p.gtin || '',
      p.mpn || '',
      p.condition
    ])

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
  }

  /**
   * Générer feed JSON (TikTok Shop)
   */
  private generateJSONFeed(products: FeedProduct[], channel: FeedChannel): string {
    return JSON.stringify({
      channel,
      generated_at: new Date().toISOString(),
      product_count: products.length,
      products: products.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        url: p.link,
        image_url: p.imageLink,
        additional_images: p.additionalImageLinks || [],
        price: p.price,
        availability: p.availability,
        brand: p.brand,
        gtin: p.gtin,
        sku: p.mpn,
        condition: p.condition,
        category: p.productType
      }))
    }, null, 2)
  }

  private escapeXML(str: string): string {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  private escapeCSV(str: string): string {
    if (!str) return ''
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  /**
   * Obtenir les statistiques d'un feed
   */
  getFeedStats(products: UnifiedProduct[], channel: FeedChannel) {
    const eligible = products.filter(p => this.validateProductForChannel(p, channel))
    const highQuality = eligible.filter(p => (p.ai_score || 0) >= 70)
    const lowQuality = eligible.filter(p => (p.ai_score || 0) < 40)

    return {
      total_products: products.length,
      eligible_products: eligible.length,
      high_quality: highQuality.length,
      low_quality: lowQuality.length,
      eligibility_rate: (eligible.length / products.length) * 100,
      avg_quality_score: eligible.reduce((sum, p) => sum + (p.ai_score || 0), 0) / eligible.length
    }
  }
}

export const FeedService = new FeedServiceClass()
