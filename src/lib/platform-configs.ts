/**
 * Configurations et règles spécifiques pour chaque plateforme de publication
 */

export interface PlatformConfig {
  id: string
  name: string
  type: 'store' | 'marketplace' | 'social' | 'supplier'
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
    optionalFields: ['sku', 'barcode', 'weight', 'variants', 'tags', 'brand', 'category', 'stock'],
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
    optionalFields: ['sku', 'description', 'short_description', 'categories', 'tags', 'images', 'brand', 'stock'],
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
  },

  tiktok: {
    id: 'tiktok',
    name: 'TikTok Shop',
    type: 'social',
    icon: '🎵',
    title: {
      minLength: 1,
      maxLength: 34,
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
      maxCount: 9,
      minWidth: 800,
      minHeight: 800,
      maxSize: 10240,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatio: '1:1'
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP'],
      minPrice: 1,
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['title', 'description', 'price', 'category', 'images', 'stock'],
    optionalFields: ['brand', 'size', 'color', 'weight', 'dimensions'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 50,
      tags: 20
    },
    customFields: {
      video_required: true,
      min_video_duration: 5,
      max_video_duration: 60
    }
  },

  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    type: 'social',
    icon: '🐦',
    title: {
      minLength: 1,
      maxLength: 70,
      required: true
    },
    description: {
      minLength: 1,
      maxLength: 280,
      allowsHTML: false,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 4,
      minWidth: 600,
      minHeight: 335,
      maxSize: 5120,
      formats: ['jpg', 'jpeg', 'png', 'gif'],
      aspectRatio: '16:9'
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP'],
      requiresShipping: false,
      taxInclusive: true
    },
    requiredFields: ['title', 'description', 'link', 'image'],
    optionalFields: ['price', 'brand'],
    categories: {
      usePlatformCategories: false,
      mappingRequired: false
    },
    limits: {
      tags: 5
    }
  },

  ebay: {
    id: 'ebay',
    name: 'eBay',
    type: 'marketplace',
    icon: '🛒',
    title: {
      minLength: 1,
      maxLength: 80,
      required: true,
      forbidden: ['wholesale', 'bulk', 'lot']
    },
    description: {
      minLength: 200,
      maxLength: 500000,
      allowsHTML: true,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 12,
      minWidth: 500,
      minHeight: 500,
      maxSize: 12288,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatio: '1:1'
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP', 'AUD', 'CAD'],
      requiresShipping: true,
      taxInclusive: false
    },
    requiredFields: ['title', 'description', 'category', 'price', 'condition', 'quantity', 'images'],
    optionalFields: ['upc', 'ean', 'isbn', 'brand', 'mpn', 'shipping_service', 'return_policy'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 250,
      skuLength: 50
    },
    customFields: {
      condition_required: true,
      shipping_policy_required: true,
      return_policy_required: true,
      item_specifics: true
    }
  },

  allegro: {
    id: 'allegro',
    name: 'Allegro',
    type: 'marketplace',
    icon: '🇵🇱',
    title: {
      minLength: 1,
      maxLength: 75,
      required: true
    },
    description: {
      minLength: 20,
      maxLength: 50000,
      allowsHTML: true,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 16,
      minWidth: 500,
      minHeight: 500,
      maxSize: 10240,
      formats: ['jpg', 'jpeg', 'png']
    },
    pricing: {
      currency: ['PLN', 'EUR'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['title', 'description', 'category', 'price', 'images', 'location'],
    optionalFields: ['ean', 'brand', 'condition', 'delivery_time'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 5,
      tags: 50
    },
    customFields: {
      location_required: true,
      delivery_options: ['courier', 'post', 'pickup']
    }
  },

  manomano: {
    id: 'manomano',
    name: 'ManoMano',
    type: 'marketplace',
    icon: '🔨',
    title: {
      minLength: 1,
      maxLength: 150,
      required: true
    },
    description: {
      minLength: 50,
      maxLength: 8000,
      allowsHTML: false,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 10,
      minWidth: 500,
      minHeight: 500,
      maxSize: 5120,
      formats: ['jpg', 'jpeg', 'png']
    },
    pricing: {
      currency: ['EUR', 'GBP'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['title', 'description', 'category', 'brand', 'ean', 'price', 'images'],
    optionalFields: ['warranty', 'technical_specs', 'dimensions', 'weight'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 20
    },
    customFields: {
      technical_sheet_required: true,
      ean_required: true,
      brand_required: true,
      delivery_time_required: true
    }
  },

  rakuten: {
    id: 'rakuten',
    name: 'Rakuten',
    type: 'marketplace',
    icon: '🛍️',
    title: {
      minLength: 1,
      maxLength: 100,
      required: true
    },
    description: {
      minLength: 20,
      maxLength: 10000,
      allowsHTML: true,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 10,
      minWidth: 500,
      minHeight: 500,
      maxSize: 10240,
      formats: ['jpg', 'jpeg', 'png']
    },
    pricing: {
      currency: ['EUR'],
      requiresShipping: true,
      taxInclusive: true
    },
    requiredFields: ['title', 'description', 'category', 'price', 'ean', 'images'],
    optionalFields: ['brand', 'color', 'size', 'material'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 30
    }
  },

  fnac: {
    id: 'fnac',
    name: 'Fnac',
    type: 'marketplace',
    icon: '📚',
    title: {
      minLength: 1,
      maxLength: 200,
      required: true
    },
    description: {
      minLength: 50,
      maxLength: 5000,
      allowsHTML: false,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 5,
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
    requiredFields: ['title', 'description', 'ean', 'price', 'brand', 'category'],
    optionalFields: ['warranty', 'delivery_time'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 10
    },
    customFields: {
      ean_mandatory: true,
      brand_mandatory: true
    }
  },

  bigbuy: {
    id: 'bigbuy',
    name: 'BigBuy',
    type: 'supplier',
    icon: '📦',
    title: {
      minLength: 1,
      maxLength: 120,
      required: true
    },
    description: {
      minLength: 100,
      maxLength: 5000,
      allowsHTML: true,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 10,
      minWidth: 800,
      minHeight: 800,
      maxSize: 10240,
      formats: ['jpg', 'jpeg', 'png']
    },
    pricing: {
      currency: ['EUR', 'USD', 'GBP'],
      requiresShipping: true,
      taxInclusive: false
    },
    requiredFields: ['title', 'description', 'price', 'sku', 'barcode', 'weight', 'brand', 'category'],
    optionalFields: ['dimensions', 'warranty', 'color', 'size', 'material'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 50,
      tags: 10,
      skuLength: 50
    },
    customFields: {
      wholesale_price: true,
      min_order_quantity: true,
      supplier_sku: true,
      dropshipping_enabled: true
    }
  },

  aliexpress: {
    id: 'aliexpress',
    name: 'AliExpress',
    type: 'marketplace',
    icon: '🛒',
    title: {
      minLength: 1,
      maxLength: 128,
      required: true
    },
    description: {
      minLength: 100,
      maxLength: 8000,
      allowsHTML: true,
      required: true
    },
    images: {
      minCount: 1,
      maxCount: 6,
      minWidth: 800,
      minHeight: 800,
      maxSize: 5120,
      formats: ['jpg', 'jpeg', 'png']
    },
    pricing: {
      currency: ['USD', 'EUR', 'GBP', 'CNY'],
      requiresShipping: true,
      taxInclusive: false
    },
    requiredFields: ['title', 'description', 'price', 'stock', 'category', 'images'],
    optionalFields: ['brand', 'color', 'size', 'material', 'weight'],
    categories: {
      usePlatformCategories: true,
      mappingRequired: true
    },
    limits: {
      variants: 100,
      tags: 10,
      skuLength: 50
    },
    customFields: {
      shipping_time: true,
      dropshipping_enabled: true,
      bulk_pricing: true,
      supplier_rating: true
    }
  }
}

export function getPlatformConfig(platformId: string): PlatformConfig | null {
  return PLATFORM_CONFIGS[platformId] || null
}

export function getAllPlatforms(): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS)
}

export function getPlatformsByType(type: 'store' | 'marketplace' | 'social' | 'supplier'): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS).filter(p => p.type === type)
}
