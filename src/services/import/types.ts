/**
 * Types pour le système d'import unifié
 */

// Sources d'import supportées
export type ImportSource = 
  | 'aliexpress'
  | 'amazon'
  | 'ebay'
  | 'shopify'
  | 'temu'
  | 'etsy'
  | 'csv'
  | 'xml'
  | 'json'
  | 'api'
  | 'extension'
  | 'feed'

// Statuts de job
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Requête d'import
export interface ImportRequest {
  source: ImportSource
  url?: string
  data?: any
  file?: File
  options?: ImportOptions
}

// Options d'import
export interface ImportOptions {
  mapping?: Record<string, string>
  autoDetect?: boolean
  fromExtension?: boolean
  includeReviews?: boolean
  includeVariants?: boolean
  includeImages?: boolean
  maxProducts?: number
  skipValidation?: boolean
}

// Résultat d'import
export interface ImportResult {
  success: boolean
  products?: NormalizedProduct[]
  error?: ImportError
  metadata?: ImportMetadata
}

// Erreur d'import
export interface ImportError {
  code: string
  message: string
  details?: any
}

// Métadonnées d'import
export interface ImportMetadata {
  requestId: string
  source: ImportSource
  jobId?: string
  durationMs?: number
  totalExtracted?: number
  totalImported?: number
  totalErrors?: number
  errors?: Array<{ index: number; error: string }>
  timestamp: string
}

// Job d'import
export interface ImportJob {
  id: string
  userId: string
  source: ImportSource
  status: ImportStatus
  totalProducts?: number
  successfulImports?: number
  failedImports?: number
  errorLog?: any
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

// Produit normalisé (structure unifiée)
export interface NormalizedProduct {
  id?: string
  title: string
  description: string
  price: number
  costPrice?: number
  compareAtPrice?: number
  sku?: string
  barcode?: string
  images: string[]
  videos?: string[]
  category?: string
  categoryPath?: string[]
  brand?: string
  stock?: number
  weight?: number
  weightUnit?: 'kg' | 'g' | 'lb' | 'oz'
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: 'cm' | 'in'
  }
  variants?: ProductVariant[]
  options?: ProductOption[]
  attributes?: Record<string, string>
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  sourceUrl?: string
  sourceId?: string
  sourcePlatform?: ImportSource
  reviews?: ProductReview[]
  rating?: number
  reviewCount?: number
  soldCount?: number
  shippingInfo?: ShippingInfo
  supplier?: SupplierInfo
  completenessScore: number
  sourceAttribution: SourceAttribution
  status: 'draft' | 'ready' | 'error_incomplete'
}

// Variante produit
export interface ProductVariant {
  id?: string
  sku?: string
  title: string
  price: number
  compareAtPrice?: number
  stock?: number
  weight?: number
  options: Record<string, string>
  image?: string
  barcode?: string
}

// Option produit (ex: Taille, Couleur)
export interface ProductOption {
  name: string
  values: string[]
}

// Avis produit
export interface ProductReview {
  id?: string
  author: string
  rating: number
  title?: string
  content: string
  date?: string
  verified?: boolean
  images?: string[]
  helpful?: number
}

// Info de livraison
export interface ShippingInfo {
  freeShipping?: boolean
  estimatedDays?: { min: number; max: number }
  methods?: Array<{
    name: string
    price: number
    estimatedDays?: { min: number; max: number }
  }>
}

// Info fournisseur
export interface SupplierInfo {
  id?: string
  name: string
  rating?: number
  responseTime?: string
  location?: string
  verified?: boolean
}

// Attribution de source (pour traçabilité)
export interface SourceAttribution {
  title: SourceField
  description: SourceField
  price: SourceField
  images: SourceField
  variants?: SourceField
  reviews?: SourceField
}

export interface SourceField {
  source: 'api' | 'headless' | 'html' | 'manual' | 'ai'
  confidence: number // 0-100
  extractedAt: string
}

// Interface adaptateur
export interface ImportAdapter {
  name: string
  supportedSources: ImportSource[]
  
  /**
   * Extrait les données brutes depuis la source
   */
  extract(request: ImportRequest): Promise<any[]>
  
  /**
   * Normalise un produit brut vers la structure unifiée
   */
  normalize(rawProduct: any): NormalizedProduct
  
  /**
   * Valide qu'un produit a tous les champs requis
   */
  validate?(product: NormalizedProduct): { valid: boolean; errors: string[] }
}

// Configuration de catégories internes
export const INTERNAL_CATEGORIES = [
  'electronics',
  'clothing',
  'home-garden',
  'beauty-health',
  'toys-games',
  'sports-outdoors',
  'automotive',
  'books-media',
  'food-grocery',
  'jewelry-accessories',
  'pet-supplies',
  'office-supplies',
  'baby-kids',
  'tools-hardware',
  'arts-crafts',
  'musical-instruments',
  'uncategorized'
] as const

export type InternalCategory = typeof INTERNAL_CATEGORIES[number]
