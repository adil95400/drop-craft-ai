/**
 * Adaptateur Shopify
 * Extraction et normalisation des produits depuis boutiques Shopify
 */

import { ImportRequest, NormalizedProduct, ImportSource } from '../types'
import { BaseAdapter } from './BaseAdapter'
import { supabase } from '@/integrations/supabase/client'

export class ShopifyAdapter extends BaseAdapter {
  name = 'Shopify Adapter'
  supportedSources: ImportSource[] = ['shopify']

  async extract(request: ImportRequest): Promise<any[]> {
    // Si données déjà fournies
    if (request.data) {
      return Array.isArray(request.data) ? request.data : [request.data]
    }

    // Extraction depuis URL de boutique Shopify
    if (request.url) {
      const { data, error } = await supabase.functions.invoke('shopify-store-import', {
        body: { 
          storeUrl: request.url,
          includeVariants: request.options?.includeVariants ?? true,
          limit: request.options?.maxProducts || 50
        }
      })

      if (error) throw new Error(`Extraction failed: ${error.message}`)
      return data?.products || []
    }

    return []
  }

  normalize(raw: any): NormalizedProduct {
    const images = this.extractImages(raw)
    const variants = this.extractVariants(raw)
    const firstVariant = variants?.[0] || raw.variants?.[0] || {}
    const price = this.parsePrice(firstVariant.price || raw.price || 0)

    return this.finalize({
      title: raw.title || raw.name || 'Sans titre',
      description: raw.body_html || raw.description || '',
      price,
      costPrice: this.parsePrice(firstVariant.compare_at_price || raw.compare_at_price),
      compareAtPrice: this.parsePrice(firstVariant.compare_at_price || raw.compare_at_price),
      sku: firstVariant.sku || raw.sku,
      barcode: firstVariant.barcode || raw.barcode,
      images: images.map(url => this.upgradeImageUrl(url, 'shopify')),
      category: this.mapCategory(raw.product_type || raw.category),
      tags: raw.tags ? (typeof raw.tags === 'string' ? raw.tags.split(',').map((t: string) => t.trim()) : raw.tags) : [],
      brand: raw.vendor || raw.brand,
      stock: this.parseStock(firstVariant.inventory_quantity || raw.inventory_quantity),
      weight: firstVariant.weight || raw.weight,
      weightUnit: (firstVariant.weight_unit || raw.weight_unit || 'kg') as any,
      variants,
      options: this.extractOptions(raw),
      seoTitle: raw.metafields_global_title_tag || raw.title,
      seoDescription: raw.metafields_global_description_tag || raw.description?.slice(0, 160),
      sourceUrl: raw.url || raw.handle ? `https://${raw.store}/products/${raw.handle}` : undefined,
      sourceId: raw.id?.toString(),
      sourcePlatform: 'shopify',
      sourceAttribution: this.createAttribution('api', 98)
    })
  }

  private extractImages(raw: any): string[] {
    const images: string[] = []

    // Images Shopify standard
    if (raw.images && Array.isArray(raw.images)) {
      raw.images.forEach((img: any) => {
        if (typeof img === 'string') images.push(img)
        else if (img.src) images.push(img.src)
        else if (img.url) images.push(img.url)
      })
    }

    // Image principale
    if (raw.image) {
      if (typeof raw.image === 'string') images.push(raw.image)
      else if (raw.image.src) images.push(raw.image.src)
    }

    // Featured image
    if (raw.featured_image) images.push(raw.featured_image)

    return [...new Set(images.filter(Boolean))]
  }

  private extractVariants(raw: any): NormalizedProduct['variants'] {
    if (!raw.variants || !Array.isArray(raw.variants)) return undefined

    return raw.variants.map((v: any) => ({
      id: v.id?.toString(),
      sku: v.sku,
      title: v.title || 'Default',
      price: this.parsePrice(v.price),
      compareAtPrice: this.parsePrice(v.compare_at_price),
      stock: this.parseStock(v.inventory_quantity),
      weight: v.weight,
      barcode: v.barcode,
      image: v.featured_image?.src || v.image,
      options: this.buildVariantOptions(v, raw.options)
    }))
  }

  private buildVariantOptions(variant: any, productOptions: any[]): Record<string, string> {
    const options: Record<string, string> = {}
    
    if (productOptions && Array.isArray(productOptions)) {
      productOptions.forEach((opt: any, index: number) => {
        const optionKey = `option${index + 1}`
        if (variant[optionKey]) {
          options[opt.name] = variant[optionKey]
        }
      })
    }

    // Fallback direct
    if (Object.keys(options).length === 0) {
      if (variant.option1) options['Option 1'] = variant.option1
      if (variant.option2) options['Option 2'] = variant.option2
      if (variant.option3) options['Option 3'] = variant.option3
    }

    return options
  }

  private extractOptions(raw: any): NormalizedProduct['options'] {
    if (!raw.options || !Array.isArray(raw.options)) return undefined

    return raw.options
      .filter((opt: any) => opt.name !== 'Title' || opt.values?.length > 1)
      .map((opt: any) => ({
        name: opt.name,
        values: opt.values || []
      }))
  }
}
