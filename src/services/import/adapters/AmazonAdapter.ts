/**
 * Adaptateur Amazon / eBay
 * Extraction et normalisation des produits
 */

import { ImportRequest, NormalizedProduct, ImportSource } from '../types'
import { BaseAdapter } from './BaseAdapter'
import { supabase } from '@/integrations/supabase/client'

export class AmazonAdapter extends BaseAdapter {
  name = 'Amazon/eBay Adapter'
  supportedSources: ImportSource[] = ['amazon', 'ebay']

  async extract(request: ImportRequest): Promise<any[]> {
    // Si données déjà fournies (extension)
    if (request.data) {
      return Array.isArray(request.data) ? request.data : [request.data]
    }

    // Extraction via edge function
    if (request.url) {
      const isAmazon = request.url.includes('amazon')
      const edgeFunction = isAmazon ? 'amazon-pa-api' : 'ebay-browse-api'

      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: { url: request.url }
      })

      if (error) throw new Error(`Extraction failed: ${error.message}`)
      return data?.products || (data?.product ? [data.product] : [])
    }

    return []
  }

  normalize(raw: any): NormalizedProduct {
    const images = this.extractImages(raw)
    const price = this.parsePrice(raw.price || raw.buyingOptions?.[0]?.price?.value || 0)

    return this.finalize({
      title: raw.title || raw.name || 'Sans titre',
      description: raw.description || raw.shortDescription || '',
      price,
      costPrice: this.parsePrice(raw.listPrice || raw.originalPrice),
      compareAtPrice: this.parsePrice(raw.listPrice || raw.originalPrice),
      sku: raw.asin || raw.itemId || raw.sku,
      barcode: raw.ean || raw.upc || raw.isbn,
      images: images.map(url => this.upgradeImageUrl(url, 'amazon')),
      videos: raw.videos || [],
      category: this.mapCategory(raw.category || raw.categoryPath?.[0]),
      categoryPath: raw.categoryPath || [],
      brand: raw.brand || raw.manufacturer,
      stock: this.parseStock(raw.availability || raw.stock),
      variants: this.extractVariants(raw),
      options: this.extractOptions(raw),
      attributes: this.extractAttributes(raw),
      rating: parseFloat(raw.rating || raw.averageRating || '0'),
      reviewCount: parseInt(raw.reviewsCount || raw.reviewCount || '0', 10),
      sourceUrl: raw.url || raw.itemWebUrl,
      sourceId: raw.asin || raw.itemId,
      sourcePlatform: raw.url?.includes('amazon') ? 'amazon' : 'ebay',
      shippingInfo: this.extractShippingInfo(raw),
      supplier: {
        name: raw.seller?.name || raw.sellerName || 'Amazon',
        rating: parseFloat(raw.seller?.rating || '0'),
        verified: true
      },
      sourceAttribution: this.createAttribution('api', 95)
    })
  }

  private extractImages(raw: any): string[] {
    const images: string[] = []

    // Images Amazon
    if (raw.images) {
      if (Array.isArray(raw.images)) {
        raw.images.forEach((img: any) => {
          if (typeof img === 'string') images.push(img)
          else if (img.large) images.push(img.large)
          else if (img.url) images.push(img.url)
        })
      }
    }

    // Image principale
    if (raw.mainImage) images.push(raw.mainImage)
    if (raw.image) images.push(typeof raw.image === 'string' ? raw.image : raw.image?.url)
    if (raw.thumbnailImage) images.push(raw.thumbnailImage)

    // Images eBay
    if (raw.additionalImages && Array.isArray(raw.additionalImages)) {
      raw.additionalImages.forEach((img: any) => {
        if (img.imageUrl) images.push(img.imageUrl)
      })
    }

    return [...new Set(images.filter(Boolean))]
  }

  private extractVariants(raw: any): NormalizedProduct['variants'] {
    if (!raw.variations && !raw.variants) return undefined

    const variations = raw.variations || raw.variants
    if (!Array.isArray(variations)) return undefined

    return variations.map((v: any, index: number) => ({
      id: v.variationId || v.asin || `variant-${index}`,
      sku: v.asin || v.sku,
      title: v.title || v.variationName || this.buildVariantTitle(v),
      price: this.parsePrice(v.price || raw.price),
      compareAtPrice: this.parsePrice(v.listPrice),
      stock: this.parseStock(v.availability),
      image: v.image,
      options: v.dimensions || this.extractVariantDimensions(v)
    }))
  }

  private buildVariantTitle(variant: any): string {
    const dimensions = variant.dimensions || {}
    return Object.values(dimensions).filter(Boolean).join(' / ') || 'Default'
  }

  private extractVariantDimensions(variant: any): Record<string, string> {
    const options: Record<string, string> = {}
    if (variant.size) options['Size'] = variant.size
    if (variant.color) options['Color'] = variant.color
    if (variant.style) options['Style'] = variant.style
    if (variant.pattern) options['Pattern'] = variant.pattern
    return options
  }

  private extractOptions(raw: any): NormalizedProduct['options'] {
    if (!raw.variationAttributes) return undefined

    return raw.variationAttributes.map((attr: any) => ({
      name: attr.name,
      values: attr.values || []
    }))
  }

  private extractAttributes(raw: any): Record<string, string> {
    const attrs: Record<string, string> = {}
    
    // Amazon features/specs
    if (raw.features && Array.isArray(raw.features)) {
      raw.features.forEach((f: string, i: number) => {
        attrs[`Feature ${i + 1}`] = f
      })
    }

    // Specifications
    if (raw.specifications && typeof raw.specifications === 'object') {
      Object.entries(raw.specifications).forEach(([key, value]) => {
        if (typeof value === 'string') attrs[key] = value
      })
    }

    return attrs
  }

  private extractShippingInfo(raw: any): NormalizedProduct['shippingInfo'] {
    return {
      freeShipping: raw.freeShipping || raw.shippingOptions?.some((o: any) => o.shippingCost?.value === '0.00'),
      estimatedDays: raw.deliveryInfo ? {
        min: raw.deliveryInfo.minDays || 2,
        max: raw.deliveryInfo.maxDays || 7
      } : { min: 2, max: 7 }
    }
  }
}
