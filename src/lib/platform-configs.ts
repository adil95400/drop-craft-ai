/**
 * Configurations et règles spécifiques pour chaque plateforme de publication
 */

export interface PlatformConfig {
  id: string
  name: string
  type: 'store' | 'marketplace' | 'social'
  icon: string
  
  // Règles de contenu
  title: {
    minLength: number
    maxLength: number
    forbidden?: string[]
    required: boolean
  }
  
  description: {
    minLength: number
    maxLength: number
    allowsHTML: boolean
    required: boolean
  }
  
  // Règles d'images
  images: {
    minCount: number
    maxCount: number
    minWidth: number
    minHeight: number
    maxSize: number // en KB
    formats: string[]
    aspectRatio?: string
  }
  
  // Règles de prix
  pricing: {
    currency: string[]
    minPrice?: number
    maxPrice?: number
    requiresShipping: boolean
    taxInclusive: boolean
  }
  
  // Champs spécifiques
  requiredFields: string[]
  optionalFields: string[]
  customFields?: Record<string, any>
  
  // Catégories
  categories: {
    usePlatformCategories: boolean
    mappingRequired: boolean
  }
  
  // Limites
  limits: {
    variants?: number
    tags?: number
    skuLength?: number
  }
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  // STORES
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    type: 'store',
    icon: '🛍️',
    title: {
      minLength: 3,
      maxLength: 255,
      required: true
    },
    description: {
      minLength: 10,
      maxLength: 65000,
      allowsHTML: true,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 250,
      minWidth: 100,
      minHeight: 100,
      maxSize: 20480,
      formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP', 'CAD'],
      requiresShipping: true,
      taxInclusive: false
    },
    requiredFields: ['title', 'price', 'description'],
    optionalFields: ['sku', 'barcode', 'weight', 'variants', 'tags'],
    categories: {
      usePlatformCategories: false,
      mappingRequired: false
    },
    limits: {
      variants: 100,
      tags: 250,
      skuLength: 255
    }
  },
  
  woocommerce: {
    id: 'woocommerce',
    name: 'WooCommerce',
    type: 'store',
    icon: '🔷',
    title: {
      minLength: 1,
      maxLength: 200,
      required: true
    },
    description: {
      minLength: 0,
      maxLength: 65000,
      allowsHTML: true,
      required: false
    },
    images: {
      minCount: 1,
      maxCount: 100,
      minWidth: 300,
      minHeight: 300,
      maxSize: 10240,
      formats: ['jpg', 'jpeg', 'png', 'gif']
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['name', 'regular_price'],
    optionalFields: ['sku', 'description', 'short_description', 'categories', 'tags', 'images'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 50,
      tags: 100
    }
  },

  // MARKETPLACES
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    type: 'marketplace',
    icon: '📦',
    title: {
      minLength: 1,
      maxLength: 200,
      required: true,
      forbidden: ['brand new', 'free shipping']
    },
    description: {
      minLength: 100,
      maxLength: 2000,
      allowsHTML: true,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 9,
      minWidth: 1000,
      minHeight: 1000,
      maxSize: 10240,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatio: '1:1'
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['title', 'brand', 'description', 'category', 'images', 'price', 'quantity'],
    optionalFields: ['ean', 'upc', 'isbn', 'variations', 'bullet_points'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 2000,
      skuLength: 40
    },
    customFields: {
      bullet_points: { maxCount: 5, maxLength: 500 },
      brand_required: true
    }
  },

  etsy: {
    id: 'etsy',
    name: 'Etsy',
    type: 'marketplace',
    icon: '🎨',
    title: {
      minLength: 1,
      maxLength: 140,
      required: true
    },
    description: {
      minLength: 20,
      maxLength: 5000,
      allowsHTML: false,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 10,
      minWidth: 2000,
      minHeight: 1500,
      maxSize: 10240,
      formats: ['jpg', 'jpeg', 'png', 'gif']
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP', 'CAD'],
      minPrice: 0.2,
      requiresShipping: true,
      taxInclusive: false
    },
    requiredFields: ['title', 'description', 'price', 'quantity', 'images', 'shipping_profile'],
    optionalFields: ['sku', 'variations', 'tags', 'materials', 'shop_section'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 70,
      tags: 13
    },
    customFields: {
      handmade: true,
      processing_min: 1,
      processing_max: 6
    }
  },

  cdiscount: {
    id: 'cdiscount',
    name: 'Cdiscount',
    type: 'marketplace',
    icon: '🇫🇷',
    title: {
      minLength: 1,
      maxLength: 100,
      required: true
    },
    description: {
      minLength: 50,
      maxLength: 4000,
      allowsHTML: true,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 4,
      minWidth: 500,
      minHeight: 500,
      maxSize: 5120,
      formats: ['jpg', 'jpeg', 'png']
    },
    pricing: {
      currency: ['EUR'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['title', 'ean', 'category', 'brand', 'price', 'stock'],
    optionalFields: ['description', 'warranty', 'color', 'size'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 30
    },
    customFields: {
      ean_required: true,
      brand_required: true
    }
  },

  // RÉSEAUX SOCIAUX
  facebook: {
    id: 'facebook',
    name: 'Facebook Shop',
    type: 'social',
    icon: '📘',
    title: {
      minLength: 1,
      maxLength: 100,
      required: true
    },
    description: {
      minLength: 1,
      maxLength: 5000,
      allowsHTML: false,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 20,
      minWidth: 500,
      minHeight: 500,
      maxSize: 8192,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatio: '1:1'
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['name', 'description', 'price', 'availability', 'condition', 'images'],
    optionalFields: ['brand', 'size', 'color', 'material'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      tags: 100
    }
  },

  instagram: {
    id: 'instagram',
    name: 'Instagram Shopping',
    type: 'social',
    icon: '📸',
    title: {
      minLength: 1,
      maxLength: 100,
      required: true
    },
    description: {
      minLength: 1,
      maxLength: 2200,
      allowsHTML: false,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 10,
      minWidth: 1080,
      minHeight: 1080,
      maxSize: 8192,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatio: '1:1'
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['name', 'description', 'price', 'images', 'checkout_url'],
    optionalFields: ['brand', 'category'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: false
    },
    limits: {
      tags: 30
    }
  },

  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    type: 'social',
    icon: '📌',
    title: {
      minLength: 1,
      maxLength: 100,
      required: true
    },
    description: {
      minLength: 1,
      maxLength: 500,
      allowsHTML: false,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 1,
      minWidth: 600,
      minHeight: 900,
      maxSize: 10240,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatio: '2:3'
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['title', 'description', 'link', 'price', 'availability', 'image'],
    optionalFields: ['brand', 'condition', 'sale_price'],
    categories: {
      usePlatformCategories: false,
      mappingRequired: false
    },
    limits: {
      tags: 50
    }
  }
}

export function getPlatformConfig(platformId: string): PlatformConfig | null {
  return PLATFORM_CONFIGS[platformId] || null
}

export function getAllPlatforms(): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS)
}

export function getPlatformsByType(type: 'store' | 'marketplace' | 'social'): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS).filter(p => p.type === type)
}
