import { supabase } from '@/integrations/supabase/client'

export interface ProductVariant {
  id: string
  parent_sku: string
  variant_sku: string
  name: string
  price: number
  cost_price?: number
  stock_quantity: number
  attributes: Record<string, string>
  image_urls?: string[]
  weight?: number
}

export class VariantService {
  private static instance: VariantService

  private constructor() {}

  static getInstance(): VariantService {
    if (!VariantService.instance) {
      VariantService.instance = new VariantService()
    }
    return VariantService.instance
  }

  async processProductVariants(parentProduct: any, rawVariants: any[]): Promise<ProductVariant[]> {
    const processedVariants: ProductVariant[] = []

    for (const rawVariant of rawVariants) {
      try {
        const variant = this.transformVariant(parentProduct, rawVariant)
        processedVariants.push(variant)
      } catch (error) {
        console.error(`Failed to process variant:`, error)
      }
    }

    return processedVariants
  }

  private transformVariant(parentProduct: any, rawVariant: any): ProductVariant {
    return {
      id: rawVariant.id?.toString() || crypto.randomUUID(),
      parent_sku: parentProduct.sku,
      variant_sku: rawVariant.sku || `${parentProduct.sku}-${rawVariant.id}`,
      name: rawVariant.name || rawVariant.title || 'Default Variant',
      price: parseFloat(rawVariant.price) || parentProduct.price,
      cost_price: parseFloat(rawVariant.cost_price) || parentProduct.cost_price,
      stock_quantity: parseInt(rawVariant.stock) || 0,
      attributes: this.extractAttributes(rawVariant),
      image_urls: rawVariant.images || parentProduct.image_urls,
      weight: parseFloat(rawVariant.weight) || parentProduct.weight
    }
  }

  private extractAttributes(rawVariant: any): Record<string, string> {
    const attributes: Record<string, string> = {}
    if (rawVariant.color) attributes.color = rawVariant.color
    if (rawVariant.size) attributes.size = rawVariant.size
    if (rawVariant.material) attributes.material = rawVariant.material
    return attributes
  }

  async generateVariants(parentProduct: any, attributeOptions: Record<string, string[]>): Promise<ProductVariant[]> {
    const variants: ProductVariant[] = []
    const combinations = this.generateCombinations(attributeOptions)

    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i]
      variants.push({
        id: crypto.randomUUID(),
        parent_sku: parentProduct.sku,
        variant_sku: `${parentProduct.sku}-${i + 1}`,
        name: `${parentProduct.name} - ${Object.values(combination).join(' / ')}`,
        price: parentProduct.price,
        cost_price: parentProduct.cost_price,
        stock_quantity: Math.floor(parentProduct.stock_quantity / combinations.length) || 0,
        attributes: combination,
        image_urls: parentProduct.image_urls,
        weight: parentProduct.weight
      })
    }

    return variants
  }

  private generateCombinations(options: Record<string, string[]>): Record<string, string>[] {
    const keys = Object.keys(options)
    if (keys.length === 0) return [{}]

    const result: Record<string, string>[] = []
    
    const generate = (index: number, current: Record<string, string>) => {
      if (index === keys.length) {
        result.push({ ...current })
        return
      }
      const key = keys[index]
      for (const value of options[key]) {
        generate(index + 1, { ...current, [key]: value })
      }
    }

    generate(0, {})
    return result
  }

  async getVariantStats(): Promise<any> {
    const { getProductList } = await import('@/services/api/productHelpers')
    const products = await getProductList(500)
    const withVariants = products.filter((p: any) => p.sku && p.sku.includes('-'))

    return {
      total_variants: withVariants.length,
      total_parent_products: new Set(withVariants.map((p: any) => p.sku?.split('-')[0])).size
    }
  }
}

export const variantService = VariantService.getInstance()
