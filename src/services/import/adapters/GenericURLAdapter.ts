/**
 * Adaptateur URL Générique
 * Extraction via scraping pour URLs non reconnues
 */

import { ImportRequest, NormalizedProduct, ImportSource } from '../types'
import { BaseAdapter } from './BaseAdapter'
import { supabase } from '@/integrations/supabase/client'

export class GenericURLAdapter extends BaseAdapter {
  name = 'Generic URL Adapter'
  supportedSources: ImportSource[] = ['api', 'extension', 'feed']

  async extract(request: ImportRequest): Promise<any[]> {
    // Si données déjà fournies (API/extension)
    if (request.data) {
      return Array.isArray(request.data) ? request.data : [request.data]
    }

    // Extraction via scraper générique
    if (request.url) {
      const { data, error } = await supabase.functions.invoke('product-url-scraper', {
        body: { 
          url: request.url,
          mode: 'full',
          extractReviews: request.options?.includeReviews ?? false
        }
      })

      if (error) throw new Error(`Extraction failed: ${error.message}`)
      return data?.products || (data?.product ? [data.product] : [])
    }

    return []
  }

  normalize(raw: any): NormalizedProduct {
    // Normalisation flexible pour données variées
    const images = this.extractImages(raw)
    const price = this.parsePrice(raw.price || raw.salePrice || raw.currentPrice || 0)

    return this.finalize({
      title: this.extractTitle(raw),
      description: this.extractDescription(raw),
      price,
      costPrice: this.parsePrice(raw.originalPrice || raw.listPrice || raw.costPrice),
      compareAtPrice: this.parsePrice(raw.originalPrice || raw.compareAtPrice || raw.msrp),
      sku: raw.sku || raw.productId || raw.id,
      barcode: raw.barcode || raw.ean || raw.upc || raw.gtin,
      images,
      videos: this.extractVideos(raw),
      category: this.mapCategory(raw.category || raw.productType || raw.categoryName),
      categoryPath: raw.breadcrumbs || raw.categoryPath,
      brand: raw.brand || raw.manufacturer || raw.vendor,
      stock: this.parseStock(raw.stock || raw.availability || raw.quantity),
      weight: parseFloat(raw.weight || '0') || undefined,
      variants: this.extractVariants(raw),
      options: this.extractOptions(raw),
      attributes: this.extractAttributes(raw),
      tags: this.extractTags(raw),
      rating: parseFloat(raw.rating || raw.averageRating || '0') || undefined,
      reviewCount: parseInt(raw.reviewCount || raw.reviews || '0', 10) || undefined,
      soldCount: parseInt(raw.soldCount || raw.orders || '0', 10) || undefined,
      seoTitle: raw.seoTitle || raw.metaTitle,
      seoDescription: raw.seoDescription || raw.metaDescription,
      sourceUrl: raw.url || raw.productUrl || raw.link,
      sourceId: raw.id || raw.productId,
      sourcePlatform: 'api',
      shippingInfo: this.extractShippingInfo(raw),
      supplier: this.extractSupplierInfo(raw),
      sourceAttribution: this.createAttribution('headless', 80)
    })
  }

  private extractTitle(raw: any): string {
    return raw.title || raw.name || raw.productTitle || raw.productName || 'Sans titre'
  }

  private extractDescription(raw: any): string {
    return raw.description || raw.body || raw.content || 
           raw.productDescription || raw.longDescription || 
           raw.shortDescription || ''
  }

  private extractImages(raw: any): string[] {
    const images: string[] = []

    // Images array
    const imageArrays = ['images', 'imageUrls', 'photos', 'gallery', 'pictures']
    for (const key of imageArrays) {
      const arr = raw[key]
      if (Array.isArray(arr)) {
        arr.forEach((img: any) => {
          if (typeof img === 'string') images.push(img)
          else if (img?.src) images.push(img.src)
          else if (img?.url) images.push(img.url)
          else if (img?.large) images.push(img.large)
        })
      }
    }

    // Single image fields
    const singleFields = ['image', 'mainImage', 'thumbnail', 'featuredImage', 'picture']
    for (const key of singleFields) {
      const val = raw[key]
      if (typeof val === 'string') images.push(val)
      else if (val?.src) images.push(val.src)
      else if (val?.url) images.push(val.url)
    }

    return [...new Set(images.filter(Boolean))]
  }

  private extractVideos(raw: any): string[] {
    const videos: string[] = []

    if (raw.videos && Array.isArray(raw.videos)) {
      raw.videos.forEach((v: any) => {
        if (typeof v === 'string') videos.push(v)
        else if (v?.url) videos.push(v.url)
        else if (v?.src) videos.push(v.src)
      })
    }

    if (raw.video) {
      if (typeof raw.video === 'string') videos.push(raw.video)
      else if (raw.video?.url) videos.push(raw.video.url)
    }

    return [...new Set(videos.filter(Boolean))]
  }

  private extractVariants(raw: any): NormalizedProduct['variants'] {
    const variantArrays = raw.variants || raw.skus || raw.options
    if (!variantArrays || !Array.isArray(variantArrays)) return undefined

    return variantArrays.map((v: any, index: number) => ({
      id: v.id || v.variantId || v.skuId || `variant-${index}`,
      sku: v.sku || v.skuId,
      title: v.title || v.name || v.variantName || 'Default',
      price: this.parsePrice(v.price || raw.price),
      compareAtPrice: this.parsePrice(v.originalPrice || v.compareAtPrice),
      stock: this.parseStock(v.stock || v.quantity || v.inventory),
      image: v.image || v.imageUrl,
      options: v.options || v.attributes || {}
    }))
  }

  private extractOptions(raw: any): NormalizedProduct['options'] {
    if (!raw.productOptions && !raw.optionTypes) return undefined

    const opts = raw.productOptions || raw.optionTypes
    if (!Array.isArray(opts)) return undefined

    return opts.map((o: any) => ({
      name: o.name || o.optionName || 'Option',
      values: o.values || o.optionValues || []
    }))
  }

  private extractAttributes(raw: any): Record<string, string> | undefined {
    const attrs = raw.attributes || raw.specifications || raw.features
    if (!attrs) return undefined

    if (typeof attrs === 'object' && !Array.isArray(attrs)) {
      const result: Record<string, string> = {}
      Object.entries(attrs).forEach(([k, v]) => {
        if (typeof v === 'string') result[k] = v
      })
      return Object.keys(result).length > 0 ? result : undefined
    }

    if (Array.isArray(attrs)) {
      const result: Record<string, string> = {}
      attrs.forEach((attr: any, i: number) => {
        if (typeof attr === 'string') {
          result[`Feature ${i + 1}`] = attr
        } else if (attr.name && attr.value) {
          result[attr.name] = attr.value
        }
      })
      return Object.keys(result).length > 0 ? result : undefined
    }

    return undefined
  }

  private extractTags(raw: any): string[] | undefined {
    const tags = raw.tags || raw.keywords || raw.labels
    if (!tags) return undefined

    if (Array.isArray(tags)) {
      return tags.map(t => String(t).trim()).filter(Boolean)
    }

    if (typeof tags === 'string') {
      return tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    return undefined
  }

  private extractShippingInfo(raw: any): NormalizedProduct['shippingInfo'] | undefined {
    if (!raw.shipping && !raw.delivery) return undefined

    const shipping = raw.shipping || raw.delivery || {}
    
    return {
      freeShipping: shipping.free || shipping.freeShipping || raw.freeShipping,
      estimatedDays: shipping.days ? {
        min: shipping.minDays || shipping.days,
        max: shipping.maxDays || shipping.days + 7
      } : undefined,
      methods: shipping.methods
    }
  }

  private extractSupplierInfo(raw: any): NormalizedProduct['supplier'] | undefined {
    const seller = raw.seller || raw.vendor || raw.supplier
    if (!seller) return undefined

    if (typeof seller === 'string') {
      return { name: seller }
    }

    return {
      id: seller.id,
      name: seller.name || seller.storeName,
      rating: parseFloat(seller.rating || '0') || undefined,
      responseTime: seller.responseTime,
      location: seller.location || seller.country,
      verified: seller.verified || seller.trusted
    }
  }
}
