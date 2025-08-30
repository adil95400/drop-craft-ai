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

export interface VariantMapping {
  id: string
  attribute_name: string
  supplier_values: string[]
  standard_values: string[]
  mapping_rules: Record<string, string>
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

  // Traitement des variantes d'un produit
  async processProductVariants(parentProduct: any, rawVariants: any[]): Promise<ProductVariant[]> {
    console.log(`Processing ${rawVariants.length} variants for product ${parentProduct.sku}`)

    const processedVariants: ProductVariant[] = []

    for (const rawVariant of rawVariants) {
      try {
        const variant = await this.transformVariant(parentProduct, rawVariant)
        const standardizedVariant = await this.standardizeAttributes(variant)
        processedVariants.push(standardizedVariant)
      } catch (error) {
        console.error(`Failed to process variant ${rawVariant.sku}:`, error)
      }
    }

    // Enregistrer les variantes en base
    await this.saveVariants(processedVariants)

    return processedVariants
  }

  // Transformation d'une variante brute
  private async transformVariant(parentProduct: any, rawVariant: any): Promise<ProductVariant> {
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

  // Extraction des attributs d'une variante
  private extractAttributes(rawVariant: any): Record<string, string> {
    const attributes: Record<string, string> = {}

    // Attributs standards
    if (rawVariant.color) attributes.color = rawVariant.color
    if (rawVariant.size) attributes.size = rawVariant.size
    if (rawVariant.material) attributes.material = rawVariant.material
    if (rawVariant.style) attributes.style = rawVariant.style

    // Attributs custom depuis les données brutes
    if (rawVariant.attributes && typeof rawVariant.attributes === 'object') {
      Object.assign(attributes, rawVariant.attributes)
    }

    // Attributs depuis options Shopify/BigBuy format
    if (rawVariant.option1) attributes.option1 = rawVariant.option1
    if (rawVariant.option2) attributes.option2 = rawVariant.option2
    if (rawVariant.option3) attributes.option3 = rawVariant.option3

    return attributes
  }

  // Standardisation des attributs avec mapping
  private async standardizeAttributes(variant: ProductVariant): Promise<ProductVariant> {
    const standardizedAttributes: Record<string, string> = {}

    for (const [key, value] of Object.entries(variant.attributes)) {
      const mappedValue = await this.getMappedValue(key, value)
      standardizedAttributes[key] = mappedValue
    }

    return {
      ...variant,
      attributes: standardizedAttributes
    }
  }

  // Récupération de la valeur mappée pour un attribut
  private async getMappedValue(attributeName: string, supplierValue: string): Promise<string> {
    try {
      // Chercher une règle de mapping existante
      const { data: mappings } = await supabase
        .from('category_mapping_rules')
        .select('*')
        .eq('supplier_category', supplierValue)
        .limit(1)

      if (mappings && mappings.length > 0) {
        return mappings[0].target_category
      }

      // Si pas de mapping, appliquer des règles de standardisation automatiques
      return this.autoStandardizeValue(attributeName, supplierValue)
    } catch (error) {
      console.error(`Failed to map attribute ${attributeName}:`, error)
      return supplierValue
    }
  }

  // Auto-standardisation des valeurs
  private autoStandardizeValue(attributeName: string, value: string): string {
    const normalized = value.toLowerCase().trim()

    // Mapping des couleurs
    if (attributeName === 'color' || attributeName === 'couleur') {
      const colorMap: Record<string, string> = {
        'noir': 'black',
        'blanc': 'white',
        'rouge': 'red',
        'bleu': 'blue',
        'vert': 'green',
        'jaune': 'yellow',
        'rose': 'pink',
        'gris': 'gray',
        'marron': 'brown'
      }
      return colorMap[normalized] || value
    }

    // Mapping des tailles
    if (attributeName === 'size' || attributeName === 'taille') {
      const sizeMap: Record<string, string> = {
        'très petit': 'XS',
        'petit': 'S',
        'moyen': 'M',
        'grand': 'L',
        'très grand': 'XL',
        'extra grand': 'XXL'
      }
      return sizeMap[normalized] || value.toUpperCase()
    }

    // Mapping des matériaux
    if (attributeName === 'material' || attributeName === 'matériau') {
      const materialMap: Record<string, string> = {
        'coton': 'cotton',
        'polyester': 'polyester',
        'cuir': 'leather',
        'soie': 'silk',
        'laine': 'wool'
      }
      return materialMap[normalized] || value
    }

    return value
  }

  // Sauvegarde des variantes en base
  private async saveVariants(variants: ProductVariant[]): Promise<void> {
    for (const variant of variants) {
      try {
        // Utiliser imported_products pour stocker les variantes
        await supabase
          .from('imported_products')
          .upsert({
            sku: variant.variant_sku,
            name: variant.name,
            price: variant.price,
            cost_price: variant.cost_price,
            stock_quantity: variant.stock_quantity,
            image_urls: variant.image_urls,
            weight: variant.weight,
            variant_sku: variant.variant_sku,
            variant_name: variant.name,
            variant_group: variant.parent_sku,
            color: variant.attributes.color || variant.attributes.couleur,
            size: variant.attributes.size || variant.attributes.taille,
            material: variant.attributes.material || variant.attributes.matériau,
            style: variant.attributes.style,
            user_id: (await supabase.auth.getUser()).data.user?.id || '',
            updated_at: new Date().toISOString()
          }, { onConflict: 'sku' })

        console.log(`Saved variant: ${variant.variant_sku}`)
      } catch (error) {
        console.error(`Failed to save variant ${variant.variant_sku}:`, error)
      }
    }
  }

  // Génération de variantes à partir d'attributs
  async generateVariants(parentProduct: any, attributeOptions: Record<string, string[]>): Promise<ProductVariant[]> {
    const variants: ProductVariant[] = []
    
    // Générer toutes les combinaisons possibles
    const attributeNames = Object.keys(attributeOptions)
    const combinations = this.generateCombinations(attributeOptions)

    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i]
      const variantSku = `${parentProduct.sku}-${i + 1}`
      
      const variant: ProductVariant = {
        id: crypto.randomUUID(),
        parent_sku: parentProduct.sku,
        variant_sku: variantSku,
        name: this.generateVariantName(parentProduct.name, combination),
        price: parentProduct.price,
        cost_price: parentProduct.cost_price,
        stock_quantity: Math.floor(parentProduct.stock_quantity / combinations.length) || 0,
        attributes: combination,
        image_urls: parentProduct.image_urls,
        weight: parentProduct.weight
      }

      variants.push(variant)
    }

    return variants
  }

  // Génération des combinaisons d'attributs
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
      const values = options[key]
      
      for (const value of values) {
        generate(index + 1, { ...current, [key]: value })
      }
    }

    generate(0, {})
    return result
  }

  // Génération du nom de variante
  private generateVariantName(baseName: string, attributes: Record<string, string>): string {
    const attributeStrings = Object.entries(attributes)
      .map(([key, value]) => `${value}`)
      .join(' / ')

    return attributeStrings ? `${baseName} - ${attributeStrings}` : baseName
  }

  // Groupement de variantes par produit parent
  async groupVariantsByParent(variants: ProductVariant[]): Promise<Map<string, ProductVariant[]>> {
    const groups = new Map<string, ProductVariant[]>()

    variants.forEach(variant => {
      const parentSku = variant.parent_sku
      if (!groups.has(parentSku)) {
        groups.set(parentSku, [])
      }
      groups.get(parentSku)!.push(variant)
    })

    return groups
  }

  // Synchronisation des variantes avec une boutique externe
  async syncVariantsToShop(parentSku: string, shopifyConnector?: any): Promise<void> {
    // Récupérer toutes les variantes du produit
    const { data: variants } = await supabase
      .from('imported_products')
      .select('*')
      .eq('variant_group', parentSku)

    if (!variants || variants.length === 0) return

    console.log(`Syncing ${variants.length} variants for ${parentSku}`)

    // Grouper les options pour Shopify
    const options = this.extractOptionsFromVariants(variants)
    
    // Si un connecteur Shopify est fourni, synchroniser
    if (shopifyConnector) {
      const shopifyProduct = {
        title: variants[0].name.split(' - ')[0], // Nom de base
        body_html: variants[0].description || '',
        vendor: variants[0].brand || variants[0].supplier_name || 'Unknown',
        product_type: variants[0].category || 'General',
        tags: (variants[0].tags || []).join(', '),
        status: 'active' as const,
        images: variants[0].image_urls?.map((url: string, index: number) => ({
          src: url,
          alt: variants[0].name,
          position: index + 1
        })) || [],
        variants: variants.map(variant => ({
          title: variant.variant_name || 'Default',
          price: variant.price.toString(),
          sku: variant.sku,
          inventory_quantity: variant.stock_quantity || 0,
          weight: variant.weight
        })),
        options: options
      }

      await shopifyConnector.createOrUpdateProduct(shopifyProduct)
    }
  }

  // Extraction des options Shopify depuis les variantes
  private extractOptionsFromVariants(variants: any[]): Array<{ name: string; values: string[] }> {
    const optionsMap = new Map<string, Set<string>>()

    variants.forEach(variant => {
      if (variant.color) {
        if (!optionsMap.has('Color')) optionsMap.set('Color', new Set())
        optionsMap.get('Color')!.add(variant.color)
      }
      if (variant.size) {
        if (!optionsMap.has('Size')) optionsMap.set('Size', new Set())
        optionsMap.get('Size')!.add(variant.size)
      }
      if (variant.material) {
        if (!optionsMap.has('Material')) optionsMap.set('Material', new Set())
        optionsMap.get('Material')!.add(variant.material)
      }
    })

    return Array.from(optionsMap.entries()).map(([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet)
    }))
  }

  // Création de règles de mapping automatiques
  async createMappingRule(params: {
    attribute_name: string
    supplier_values: string[]
    standard_values: string[]
    confidence?: number
  }): Promise<void> {
    const mappingRules: Record<string, string> = {}
    
    // Créer les associations automatiques
    params.supplier_values.forEach((supplierValue, index) => {
      if (index < params.standard_values.length) {
        mappingRules[supplierValue] = params.standard_values[index]
      }
    })

    try {
      await supabase.from('category_mapping_rules').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        supplier_category: params.attribute_name,
        target_category: params.standard_values.join(','),
        keywords: params.supplier_values,
        confidence: params.confidence || 0.9,
        is_ai: true
      })

      console.log(`Created mapping rule for ${params.attribute_name}`)
    } catch (error) {
      console.error('Failed to create mapping rule:', error)
    }
  }

  // Détection automatique des variantes depuis un texte de description
  async detectVariantsFromDescription(description: string): Promise<Record<string, string[]>> {
    const variants: Record<string, string[]> = {}

    // Regex patterns pour différents attributs
    const patterns = {
      colors: /colou?rs?:?\s*([^.]+)/gi,
      sizes: /tailles?:?\s*([^.]+)/gi,
      materials: /matiè?res?:?\s*([^.]+)/gi
    }

    for (const [attribute, pattern] of Object.entries(patterns)) {
      const matches = description.match(pattern)
      if (matches) {
        const values = matches[0]
          .replace(pattern, '$1')
          .split(/[,;\/]/)
          .map(v => v.trim())
          .filter(v => v.length > 0)

        if (values.length > 0) {
          variants[attribute] = values
        }
      }
    }

    return variants
  }

  // Statistiques sur les variantes
  async getVariantStats(): Promise<any> {
    const { data: products } = await supabase
      .from('imported_products')
      .select('variant_group, color, size, material')
      .not('variant_group', 'is', null)

    if (!products) return null

    const stats = {
      total_variants: products.length,
      total_parent_products: new Set(products.map(p => p.variant_group)).size,
      by_attribute: {} as Record<string, Record<string, number>>
    }

    // Compter par attribut
    const attributes = ['color', 'size', 'material']
    attributes.forEach(attr => {
      stats.by_attribute[attr] = {}
      products.forEach(product => {
        const value = (product as any)[attr]
        if (value) {
          stats.by_attribute[attr][value] = (stats.by_attribute[attr][value] || 0) + 1
        }
      })
    })

    return stats
  }
}

export const variantService = VariantService.getInstance()