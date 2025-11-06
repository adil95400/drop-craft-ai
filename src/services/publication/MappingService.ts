export interface MappingRule {
  sourceField: string
  targetField: string
  transform?: (value: any) => any
  required?: boolean
}

export interface CategoryMapping {
  localCategory: string
  marketplaceCategory: string
  marketplaceTaxonomyId?: string
}

export interface AttributeMapping {
  localAttribute: string
  marketplaceAttribute: string
  valueMapping?: Record<string, string>
}

export class MappingService {
  private static instance: MappingService

  private constructor() {}

  static getInstance(): MappingService {
    if (!MappingService.instance) {
      MappingService.instance = new MappingService()
    }
    return MappingService.instance
  }

  // Règles de mapping pour chaque marketplace
  private marketplaceMappings: Record<string, MappingRule[]> = {
    amazon: [
      { sourceField: 'sku', targetField: 'seller-sku', required: true },
      { sourceField: 'name', targetField: 'item-name', required: true },
      { sourceField: 'description', targetField: 'item-description', required: true },
      { sourceField: 'price', targetField: 'standard-price', required: true },
      { sourceField: 'stock_quantity', targetField: 'quantity', required: true },
      { sourceField: 'brand', targetField: 'brand-name', required: true },
      { sourceField: 'category', targetField: 'item-type', transform: (cat) => this.mapCategoryAmazon(cat) },
    ],
    ebay: [
      { sourceField: 'sku', targetField: 'SKU', required: true },
      { sourceField: 'name', targetField: 'Title', required: true, transform: (title) => title.substring(0, 80) },
      { sourceField: 'description', targetField: 'Description', required: true },
      { sourceField: 'price', targetField: 'StartPrice', required: true },
      { sourceField: 'stock_quantity', targetField: 'Quantity', required: true },
      { sourceField: 'category', targetField: 'CategoryID', transform: (cat) => this.mapCategoryEbay(cat) },
    ],
    etsy: [
      { sourceField: 'sku', targetField: 'sku', required: true },
      { sourceField: 'name', targetField: 'title', required: true, transform: (title) => title.substring(0, 140) },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'stock_quantity', targetField: 'quantity', required: true },
      { sourceField: 'category', targetField: 'taxonomy_id', transform: (cat) => this.mapCategoryEtsy(cat) },
    ],
    shopify: [
      { sourceField: 'sku', targetField: 'variant_sku', required: true },
      { sourceField: 'name', targetField: 'title', required: true },
      { sourceField: 'description', targetField: 'body_html', required: true },
      { sourceField: 'price', targetField: 'variant_price', required: true },
      { sourceField: 'stock_quantity', targetField: 'variant_inventory_quantity', required: true },
      { sourceField: 'brand', targetField: 'vendor' },
      { sourceField: 'category', targetField: 'product_type' },
    ],
    woocommerce: [
      { sourceField: 'sku', targetField: 'sku', required: true },
      { sourceField: 'name', targetField: 'name', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'regular_price', required: true },
      { sourceField: 'stock_quantity', targetField: 'stock_quantity', required: true },
      { sourceField: 'category', targetField: 'categories', transform: (cat) => [{ name: cat }] },
    ],
  }

  // Mapping des catégories
  private categoryMappings: Record<string, CategoryMapping[]> = {
    amazon: [
      { localCategory: 'Electronics', marketplaceCategory: 'Electronics', marketplaceTaxonomyId: '172282' },
      { localCategory: 'Fashion', marketplaceCategory: 'Clothing, Shoes & Jewelry', marketplaceTaxonomyId: '7141123011' },
      { localCategory: 'Home & Garden', marketplaceCategory: 'Home & Kitchen', marketplaceTaxonomyId: '1055398' },
      { localCategory: 'Sports', marketplaceCategory: 'Sports & Outdoors', marketplaceTaxonomyId: '3375251' },
      { localCategory: 'Beauty', marketplaceCategory: 'Beauty & Personal Care', marketplaceTaxonomyId: '3760911' },
    ],
    ebay: [
      { localCategory: 'Electronics', marketplaceCategory: 'Consumer Electronics', marketplaceTaxonomyId: '293' },
      { localCategory: 'Fashion', marketplaceCategory: 'Clothing, Shoes & Accessories', marketplaceTaxonomyId: '11450' },
      { localCategory: 'Home & Garden', marketplaceCategory: 'Home & Garden', marketplaceTaxonomyId: '11700' },
      { localCategory: 'Sports', marketplaceCategory: 'Sporting Goods', marketplaceTaxonomyId: '888' },
      { localCategory: 'Beauty', marketplaceCategory: 'Health & Beauty', marketplaceTaxonomyId: '26395' },
    ],
    etsy: [
      { localCategory: 'Electronics', marketplaceCategory: 'Electronics & Accessories', marketplaceTaxonomyId: '69150433' },
      { localCategory: 'Fashion', marketplaceCategory: 'Clothing', marketplaceTaxonomyId: '69150353' },
      { localCategory: 'Home & Garden', marketplaceCategory: 'Home & Living', marketplaceTaxonomyId: '1' },
      { localCategory: 'Sports', marketplaceCategory: 'Toys & Games', marketplaceTaxonomyId: '1063' },
      { localCategory: 'Beauty', marketplaceCategory: 'Bath & Beauty', marketplaceTaxonomyId: '562' },
    ],
  }

  // Mapping des attributs (tailles, couleurs, etc.)
  private attributeMappings: Record<string, AttributeMapping[]> = {
    size: [
      { localAttribute: 'S', marketplaceAttribute: 'Small' },
      { localAttribute: 'M', marketplaceAttribute: 'Medium' },
      { localAttribute: 'L', marketplaceAttribute: 'Large' },
      { localAttribute: 'XL', marketplaceAttribute: 'X-Large' },
      { localAttribute: 'XXL', marketplaceAttribute: 'XX-Large' },
    ],
    color: [
      { localAttribute: 'Rouge', marketplaceAttribute: 'Red' },
      { localAttribute: 'Bleu', marketplaceAttribute: 'Blue' },
      { localAttribute: 'Vert', marketplaceAttribute: 'Green' },
      { localAttribute: 'Noir', marketplaceAttribute: 'Black' },
      { localAttribute: 'Blanc', marketplaceAttribute: 'White' },
    ],
  }

  mapProduct(product: any, marketplaceId: string): any {
    const rules = this.marketplaceMappings[marketplaceId]
    if (!rules) {
      console.warn(`No mapping rules found for marketplace: ${marketplaceId}`)
      return product
    }

    const mappedProduct: any = {}

    for (const rule of rules) {
      let value = product[rule.sourceField]

      if (value === undefined || value === null) {
        if (rule.required) {
          throw new Error(`Required field ${rule.sourceField} is missing`)
        }
        continue
      }

      if (rule.transform) {
        value = rule.transform(value)
      }

      mappedProduct[rule.targetField] = value
    }

    return mappedProduct
  }

  mapCategory(localCategory: string, marketplaceId: string): string | null {
    const mappings = this.categoryMappings[marketplaceId]
    if (!mappings) return localCategory

    const mapping = mappings.find(m => 
      m.localCategory.toLowerCase() === localCategory.toLowerCase()
    )

    return mapping?.marketplaceTaxonomyId || mapping?.marketplaceCategory || localCategory
  }

  mapAttribute(attributeType: string, localValue: string): string {
    const mappings = this.attributeMappings[attributeType]
    if (!mappings) return localValue

    const mapping = mappings.find(m => 
      m.localAttribute.toLowerCase() === localValue.toLowerCase()
    )

    return mapping?.marketplaceAttribute || localValue
  }

  validateMapping(product: any, marketplaceId: string): { valid: boolean; errors: string[] } {
    const rules = this.marketplaceMappings[marketplaceId]
    if (!rules) {
      return { valid: false, errors: [`No mapping rules for ${marketplaceId}`] }
    }

    const errors: string[] = []

    for (const rule of rules) {
      if (rule.required && !product[rule.sourceField]) {
        errors.push(`Required field ${rule.sourceField} is missing`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  private mapCategoryAmazon(category: string): string {
    return this.mapCategory(category, 'amazon') || 'Generic'
  }

  private mapCategoryEbay(category: string): string {
    return this.mapCategory(category, 'ebay') || '0'
  }

  private mapCategoryEtsy(category: string): string {
    return this.mapCategory(category, 'etsy') || '1'
  }

  addCustomMapping(
    marketplaceId: string,
    sourceField: string,
    targetField: string,
    transform?: (value: any) => any,
    required?: boolean
  ): void {
    if (!this.marketplaceMappings[marketplaceId]) {
      this.marketplaceMappings[marketplaceId] = []
    }

    this.marketplaceMappings[marketplaceId].push({
      sourceField,
      targetField,
      transform,
      required
    })
  }

  addCategoryMapping(
    marketplaceId: string,
    localCategory: string,
    marketplaceCategory: string,
    taxonomyId?: string
  ): void {
    if (!this.categoryMappings[marketplaceId]) {
      this.categoryMappings[marketplaceId] = []
    }

    this.categoryMappings[marketplaceId].push({
      localCategory,
      marketplaceCategory,
      marketplaceTaxonomyId: taxonomyId
    })
  }
}

export const mappingService = MappingService.getInstance()
