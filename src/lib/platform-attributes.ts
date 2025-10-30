/**
 * Platform Attributes - Gère les attributs spécifiques requis par plateforme et catégorie
 */

export interface PlatformAttribute {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean'
  required: boolean
  options?: string[]
  description?: string
  pattern?: string
}

export interface PlatformAttributeRequirements {
  [platform: string]: {
    global: PlatformAttribute[]
    byCategory?: {
      [category: string]: PlatformAttribute[]
    }
  }
}

// Attributs requis par plateforme
export const PLATFORM_ATTRIBUTES: PlatformAttributeRequirements = {
  amazon: {
    global: [
      {
        name: 'condition_type',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['New', 'Used - Like New', 'Used - Very Good', 'Used - Good', 'Used - Acceptable']
      },
      {
        name: 'product_id',
        label: 'Product ID (EAN/UPC/ISBN)',
        type: 'text',
        required: true,
        description: 'Code barre unique du produit',
        pattern: '^[0-9]{8,14}$'
      }
    ],
    byCategory: {
      'Books': [
        {
          name: 'isbn',
          label: 'ISBN',
          type: 'text',
          required: true,
          pattern: '^[0-9]{10,13}$'
        },
        {
          name: 'author',
          label: 'Auteur',
          type: 'text',
          required: true
        },
        {
          name: 'publisher',
          label: 'Éditeur',
          type: 'text',
          required: false
        }
      ],
      'Electronics': [
        {
          name: 'upc',
          label: 'UPC',
          type: 'text',
          required: true,
          pattern: '^[0-9]{12}$'
        },
        {
          name: 'warranty',
          label: 'Garantie',
          type: 'text',
          required: false
        }
      ]
    }
  },
  ebay: {
    global: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['NEW', 'LIKE_NEW', 'USED_EXCELLENT', 'USED_GOOD', 'USED_ACCEPTABLE', 'FOR_PARTS_OR_NOT_WORKING']
      },
      {
        name: 'return_accepted',
        label: 'Retours acceptés',
        type: 'boolean',
        required: true
      },
      {
        name: 'return_period',
        label: 'Période de retour (jours)',
        type: 'select',
        required: true,
        options: ['14', '30', '60']
      }
    ]
  },
  google: {
    global: [
      {
        name: 'gtin',
        label: 'GTIN (EAN/UPC)',
        type: 'text',
        required: false,
        pattern: '^[0-9]{8,14}$'
      },
      {
        name: 'mpn',
        label: 'MPN (Numéro fabricant)',
        type: 'text',
        required: false
      },
      {
        name: 'condition',
        label: 'État',
        type: 'select',
        required: true,
        options: ['new', 'refurbished', 'used']
      },
      {
        name: 'age_group',
        label: 'Groupe d\'âge',
        type: 'select',
        required: false,
        options: ['newborn', 'infant', 'toddler', 'kids', 'adult']
      },
      {
        name: 'gender',
        label: 'Genre',
        type: 'select',
        required: false,
        options: ['male', 'female', 'unisex']
      }
    ]
  },
  facebook: {
    global: [
      {
        name: 'condition',
        label: 'État',
        type: 'select',
        required: true,
        options: ['new', 'refurbished', 'used']
      },
      {
        name: 'availability',
        label: 'Disponibilité',
        type: 'select',
        required: true,
        options: ['in stock', 'out of stock', 'preorder', 'available for order']
      }
    ]
  },
  fnac: {
    global: [
      {
        name: 'ean',
        label: 'EAN',
        type: 'text',
        required: true,
        pattern: '^[0-9]{13}$'
      },
      {
        name: 'shipping_delay',
        label: 'Délai de livraison (jours)',
        type: 'number',
        required: true
      }
    ]
  },
  aliexpress: {
    global: [
      {
        name: 'freight_template_id',
        label: 'Template de livraison',
        type: 'text',
        required: true,
        description: 'ID du template de livraison configuré sur AliExpress'
      },
      {
        name: 'processing_time',
        label: 'Temps de traitement (jours)',
        type: 'number',
        required: true
      }
    ]
  }
}

/**
 * Récupère les attributs requis pour une plateforme et catégorie
 */
export function getRequiredAttributes(
  platform: string,
  category?: string
): PlatformAttribute[] {
  const platformAttrs = PLATFORM_ATTRIBUTES[platform.toLowerCase()]
  if (!platformAttrs) return []
  
  const attributes = [...platformAttrs.global]
  
  if (category && platformAttrs.byCategory?.[category]) {
    attributes.push(...platformAttrs.byCategory[category])
  }
  
  return attributes
}

/**
 * Valide que tous les attributs requis sont présents
 */
export function validateAttributes(
  product: Record<string, any>,
  platform: string,
  category?: string
): { valid: boolean; missingAttributes: PlatformAttribute[] } {
  const requiredAttrs = getRequiredAttributes(platform, category)
  const missingAttributes: PlatformAttribute[] = []
  
  requiredAttrs.forEach(attr => {
    if (attr.required) {
      const value = product[attr.name]
      if (value === undefined || value === null || value === '') {
        missingAttributes.push(attr)
      }
      
      // Valider le pattern si présent
      if (value && attr.pattern) {
        const regex = new RegExp(attr.pattern)
        if (!regex.test(String(value))) {
          missingAttributes.push(attr)
        }
      }
    }
  })
  
  return {
    valid: missingAttributes.length === 0,
    missingAttributes
  }
}

/**
 * Remplit automatiquement les attributs avec des valeurs par défaut intelligentes
 */
export function fillDefaultAttributes(
  product: Record<string, any>,
  platform: string,
  category?: string
): Record<string, any> {
  const requiredAttrs = getRequiredAttributes(platform, category)
  const enriched = { ...product }
  
  requiredAttrs.forEach(attr => {
    if (!enriched[attr.name]) {
      // Tentative de mapping depuis d'autres champs
      switch (attr.name) {
        case 'ean':
        case 'gtin':
        case 'product_id':
          enriched[attr.name] = product.ean || product.barcode || product.gtin
          break
        case 'condition':
        case 'condition_type':
          enriched[attr.name] = 'new'
          break
        case 'availability':
          enriched[attr.name] = product.stock > 0 ? 'in stock' : 'out of stock'
          break
        case 'return_accepted':
          enriched[attr.name] = true
          break
        case 'return_period':
          enriched[attr.name] = '30'
          break
        case 'shipping_delay':
        case 'processing_time':
          enriched[attr.name] = 2
          break
      }
    }
  })
  
  return enriched
}
