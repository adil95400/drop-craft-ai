/**
 * Adaptateur AliExpress / Temu
 * Extraction et normalisation des produits
 */

import { ImportRequest, NormalizedProduct, ImportSource } from '../types'
import { BaseAdapter } from './BaseAdapter'
import { supabase } from '@/integrations/supabase/client'

export class AliExpressAdapter extends BaseAdapter {
  name = 'AliExpress/Temu Adapter'
  supportedSources: ImportSource[] = ['aliexpress', 'temu']

  async extract(request: ImportRequest): Promise<any[]> {
    // Si données déjà fournies (extension)
    if (request.data) {
      return Array.isArray(request.data) ? request.data : [request.data]
    }

    // Sinon extraction via edge function
    if (request.url) {
      const { data, error } = await supabase.functions.invoke('product-url-scraper', {
        body: { url: request.url, source: 'aliexpress' }
      })

      if (error) throw new Error(`Extraction failed: ${error.message}`)
      return data?.products || (data?.product ? [data.product] : [])
    }

    return []
  }

  normalize(raw: any): NormalizedProduct {
    const images = this.extractImages(raw)
    const variants = this.extractVariants(raw)
    const price = this.parsePrice(raw.price || raw.salePrice || raw.originalPrice || 0)

    return this.finalize({
      title: raw.title || raw.name || raw.productTitle || 'Sans titre',
      description: raw.description || raw.productDescription || '',
      price,
      costPrice: this.parsePrice(raw.originalPrice || raw.regularPrice),
      compareAtPrice: this.parsePrice(raw.originalPrice || raw.compareAtPrice),
      sku: raw.sku || raw.productId || raw.itemId,
      images: images.map(url => this.upgradeImageUrl(url, 'aliexpress')),
      videos: raw.videos || [],
      category: this.mapCategory(raw.category || raw.categoryName),
      categoryPath: raw.categoryPath?.split(' > ') || [],
      brand: raw.brand || raw.storeName,
      stock: this.parseStock(raw.stock || raw.quantity || raw.availableQuantity),
      variants,
      options: this.extractOptions(raw),
      rating: parseFloat(raw.rating || raw.averageRating || '0'),
      reviewCount: parseInt(raw.reviewCount || raw.reviews || '0', 10),
      soldCount: parseInt(raw.orders || raw.soldCount || '0', 10),
      sourceUrl: raw.url || raw.productUrl,
      sourceId: raw.productId || raw.itemId,
      sourcePlatform: 'aliexpress',
      shippingInfo: {
        freeShipping: raw.freeShipping || raw.shippingFree,
        estimatedDays: raw.deliveryDays ? { min: raw.deliveryDays, max: raw.deliveryDays + 10 } : undefined
      },
      supplier: raw.seller ? {
        name: raw.seller.name || raw.storeName,
        rating: parseFloat(raw.seller.rating || '0'),
        location: raw.seller.location || 'China'
      } : undefined,
      sourceAttribution: this.createAttribution('api', 90)
    })
  }

  private extractImages(raw: any): string[] {
    const images: string[] = []

    // Images directes
    if (raw.images && Array.isArray(raw.images)) {
      images.push(...raw.images)
    }
    if (raw.imageUrls && Array.isArray(raw.imageUrls)) {
      images.push(...raw.imageUrls)
    }
    if (raw.mainImage) images.push(raw.mainImage)
    if (raw.image) images.push(raw.image)
    if (raw.thumbnail) images.push(raw.thumbnail)

    // Images des variantes
    if (raw.variants && Array.isArray(raw.variants)) {
      raw.variants.forEach((v: any) => {
        if (v.image) images.push(v.image)
        if (v.imageUrl) images.push(v.imageUrl)
      })
    }

    // Dédoublonner
    return [...new Set(images.filter(Boolean))]
  }

  private extractVariants(raw: any): NormalizedProduct['variants'] {
    if (!raw.variants || !Array.isArray(raw.variants)) {
      if (!raw.skuList || !Array.isArray(raw.skuList)) {
        return undefined
      }
      raw.variants = raw.skuList
    }

    return raw.variants.map((v: any, index: number) => ({
      id: v.id || v.skuId || `variant-${index}`,
      sku: v.sku || v.skuId,
      title: v.title || v.name || this.buildVariantTitle(v),
      price: this.parsePrice(v.price || v.salePrice || raw.price),
      compareAtPrice: this.parsePrice(v.originalPrice),
      stock: this.parseStock(v.stock || v.quantity),
      image: v.image || v.imageUrl,
      options: v.options || this.extractVariantOptions(v)
    }))
  }

  private buildVariantTitle(variant: any): string {
    const parts: string[] = []
    if (variant.color) parts.push(variant.color)
    if (variant.size) parts.push(variant.size)
    if (variant.style) parts.push(variant.style)
    return parts.join(' / ') || 'Default'
  }

  private extractVariantOptions(variant: any): Record<string, string> {
    const options: Record<string, string> = {}
    if (variant.color) options['Color'] = variant.color
    if (variant.size) options['Size'] = variant.size
    if (variant.style) options['Style'] = variant.style
    if (variant.material) options['Material'] = variant.material
    return options
  }

  private extractOptions(raw: any): NormalizedProduct['options'] {
    if (!raw.options && !raw.skuProps) return undefined

    const optionsData = raw.options || raw.skuProps || []
    
    return optionsData.map((opt: any) => ({
      name: opt.name || opt.propName || 'Option',
      values: opt.values || opt.propValues?.map((v: any) => v.name || v.value) || []
    }))
  }
}
