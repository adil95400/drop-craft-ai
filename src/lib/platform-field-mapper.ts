/**
 * Platform Field Mapper - Gère le mapping automatique des champs entre produits et plateformes
 */

export interface FieldMapping {
  sourceField: string
  targetField: string
  transform?: (value: any) => any
  required?: boolean
  defaultValue?: any
}

export interface PlatformFieldMappings {
  [platform: string]: {
    standard: FieldMapping[]
    custom: FieldMapping[]
  }
}

// Mappings standards par plateforme
export const STANDARD_FIELD_MAPPINGS: PlatformFieldMappings = {
  shopify: {
    standard: [
      { sourceField: 'name', targetField: 'title', required: true },
      { sourceField: 'description', targetField: 'body_html', required: true },
      { sourceField: 'price', targetField: 'variants[0].price', required: true },
      { sourceField: 'sku', targetField: 'variants[0].sku' },
      { sourceField: 'stock', targetField: 'variants[0].inventory_quantity' },
      { sourceField: 'brand', targetField: 'vendor' },
      { sourceField: 'category', targetField: 'product_type' },
      { sourceField: 'image_url', targetField: 'images[0].src' }
    ],
    custom: []
  },
  woocommerce: {
    standard: [
      { sourceField: 'name', targetField: 'name', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'regular_price', required: true },
      { sourceField: 'sku', targetField: 'sku' },
      { sourceField: 'stock', targetField: 'stock_quantity' },
      { sourceField: 'brand', targetField: 'attributes[0].name', transform: () => 'Brand' },
      { sourceField: 'brand', targetField: 'attributes[0].options[0]' },
      { sourceField: 'category', targetField: 'categories[0].name' },
      { sourceField: 'image_url', targetField: 'images[0].src' }
    ],
    custom: []
  },
  amazon: {
    standard: [
      { sourceField: 'name', targetField: 'title', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'sku', targetField: 'sku', required: true },
      { sourceField: 'stock', targetField: 'quantity', required: true },
      { sourceField: 'brand', targetField: 'brand', required: true },
      { sourceField: 'category', targetField: 'product_type' },
      { sourceField: 'image_url', targetField: 'main_image_url' }
    ],
    custom: [
      { sourceField: 'ean', targetField: 'product_id', required: false },
      { sourceField: 'condition', targetField: 'condition_type', defaultValue: 'New' }
    ]
  },
  ebay: {
    standard: [
      { sourceField: 'name', targetField: 'title', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'price.value', required: true },
      { sourceField: 'sku', targetField: 'sku' },
      { sourceField: 'stock', targetField: 'availability.shipToLocationAvailability.quantity', required: true },
      { sourceField: 'brand', targetField: 'product.brand' },
      { sourceField: 'category', targetField: 'categoryId', required: true },
      { sourceField: 'image_url', targetField: 'pictureUrls[0]' }
    ],
    custom: [
      { sourceField: 'condition', targetField: 'condition', defaultValue: 'NEW', required: true },
      { sourceField: 'ean', targetField: 'product.ean' }
    ]
  },
  facebook: {
    standard: [
      { sourceField: 'name', targetField: 'name', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'brand', targetField: 'brand' },
      { sourceField: 'category', targetField: 'google_product_category' },
      { sourceField: 'image_url', targetField: 'image_url', required: true }
    ],
    custom: [
      { sourceField: 'availability', targetField: 'availability', defaultValue: 'in stock', required: true },
      { sourceField: 'condition', targetField: 'condition', defaultValue: 'new', required: true }
    ]
  },
  instagram: {
    standard: [
      { sourceField: 'name', targetField: 'name', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'brand', targetField: 'brand' },
      { sourceField: 'image_url', targetField: 'image_url', required: true }
    ],
    custom: [
      { sourceField: 'availability', targetField: 'availability', defaultValue: 'in stock', required: true },
      { sourceField: 'checkout_url', targetField: 'checkout_url', required: true }
    ]
  },
  tiktok: {
    standard: [
      { sourceField: 'name', targetField: 'title', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'brand', targetField: 'brand' },
      { sourceField: 'category', targetField: 'category_id', required: true },
      { sourceField: 'image_url', targetField: 'images[0]', required: true }
    ],
    custom: [
      { sourceField: 'stock', targetField: 'stock_quantity', required: true }
    ]
  },
  pinterest: {
    standard: [
      { sourceField: 'name', targetField: 'title', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'brand', targetField: 'brand' },
      { sourceField: 'image_url', targetField: 'image_link', required: true }
    ],
    custom: [
      { sourceField: 'availability', targetField: 'availability', defaultValue: 'in stock', required: true },
      { sourceField: 'link', targetField: 'link', required: true }
    ]
  },
  google: {
    standard: [
      { sourceField: 'name', targetField: 'title', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'brand', targetField: 'brand' },
      { sourceField: 'category', targetField: 'google_product_category', required: true },
      { sourceField: 'image_url', targetField: 'image_link', required: true }
    ],
    custom: [
      { sourceField: 'gtin', targetField: 'gtin' },
      { sourceField: 'availability', targetField: 'availability', defaultValue: 'in stock', required: true },
      { sourceField: 'condition', targetField: 'condition', defaultValue: 'new', required: true }
    ]
  },
  rakuten: {
    standard: [
      { sourceField: 'name', targetField: 'itemName', required: true },
      { sourceField: 'description', targetField: 'itemCaption', required: true },
      { sourceField: 'price', targetField: 'itemPrice', required: true },
      { sourceField: 'sku', targetField: 'itemNumber', required: true },
      { sourceField: 'stock', targetField: 'inventoryQuantity' },
      { sourceField: 'brand', targetField: 'brand' },
      { sourceField: 'category', targetField: 'genreId', required: true },
      { sourceField: 'image_url', targetField: 'imageUrl' }
    ],
    custom: []
  },
  fnac: {
    standard: [
      { sourceField: 'name', targetField: 'product_name', required: true },
      { sourceField: 'description', targetField: 'product_description', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'sku', targetField: 'product_reference', required: true },
      { sourceField: 'stock', targetField: 'quantity', required: true },
      { sourceField: 'brand', targetField: 'brand' },
      { sourceField: 'category', targetField: 'product_type' },
      { sourceField: 'image_url', targetField: 'image_url' }
    ],
    custom: [
      { sourceField: 'ean', targetField: 'ean', required: true }
    ]
  },
  bigbuy: {
    standard: [
      { sourceField: 'name', targetField: 'name', required: true },
      { sourceField: 'description', targetField: 'description', required: true },
      { sourceField: 'price', targetField: 'retail_price', required: true },
      { sourceField: 'sku', targetField: 'sku', required: true },
      { sourceField: 'brand', targetField: 'brand' },
      { sourceField: 'category', targetField: 'category' },
      { sourceField: 'image_url', targetField: 'images[0]' }
    ],
    custom: []
  },
  aliexpress: {
    standard: [
      { sourceField: 'name', targetField: 'subject', required: true },
      { sourceField: 'description', targetField: 'detail', required: true },
      { sourceField: 'price', targetField: 'price', required: true },
      { sourceField: 'stock', targetField: 'inventory', required: true },
      { sourceField: 'category', targetField: 'category_id', required: true },
      { sourceField: 'image_url', targetField: 'image_urls[0]', required: true }
    ],
    custom: [
      { sourceField: 'shipping_template', targetField: 'freight_template_id', required: true }
    ]
  }
}

/**
 * Récupère les mappings pour une plateforme spécifique
 */
export function getPlatformMappings(platform: string): FieldMapping[] {
  const mappings = STANDARD_FIELD_MAPPINGS[platform.toLowerCase()]
  if (!mappings) return []
  
  return [...mappings.standard, ...mappings.custom]
}

/**
 * Mappe les données d'un produit vers le format d'une plateforme
 */
export function mapProductFields(
  product: Record<string, any>,
  platform: string,
  customMappings?: FieldMapping[]
): Record<string, any> {
  const mappings = getPlatformMappings(platform)
  const allMappings = customMappings ? [...mappings, ...customMappings] : mappings
  
  const mapped: Record<string, any> = {}
  
  allMappings.forEach(mapping => {
    let value = product[mapping.sourceField]
    
    // Utiliser la valeur par défaut si pas de valeur et que défaut existe
    if (value === undefined && mapping.defaultValue !== undefined) {
      value = mapping.defaultValue
    }
    
    // Appliquer la transformation si elle existe
    if (value !== undefined && mapping.transform) {
      value = mapping.transform(value)
    }
    
    // Setter la valeur dans l'objet mappé (gérer les chemins imbriqués)
    if (value !== undefined) {
      setNestedValue(mapped, mapping.targetField, value)
    }
  })
  
  return mapped
}

/**
 * Set une valeur dans un objet avec un chemin imbriqué (ex: "variants[0].price")
 */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split(/[.\[\]]/).filter(Boolean)
  let current = obj
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const nextPart = parts[i + 1]
    
    if (!isNaN(Number(nextPart))) {
      // Prochain est un index, créer un tableau
      if (!current[part]) current[part] = []
    } else {
      // Créer un objet
      if (!current[part]) current[part] = {}
    }
    
    current = current[part]
  }
  
  const lastPart = parts[parts.length - 1]
  current[lastPart] = value
}

/**
 * Valide que tous les champs requis sont présents
 */
export function validateRequiredFields(
  product: Record<string, any>,
  platform: string
): { valid: boolean; missingFields: string[] } {
  const mappings = getPlatformMappings(platform)
  const requiredMappings = mappings.filter(m => m.required)
  
  const missingFields: string[] = []
  
  requiredMappings.forEach(mapping => {
    const value = product[mapping.sourceField]
    if (value === undefined || value === null || value === '') {
      missingFields.push(mapping.sourceField)
    }
  })
  
  return {
    valid: missingFields.length === 0,
    missingFields
  }
}
