// Types for the Extensions system

export interface ExtensionManifest {
  readonly name: string
  readonly version: string
  readonly description: string
  readonly author: string
  readonly homepage?: string
  readonly repository?: string
  readonly main: string
  readonly permissions: readonly string[]
  readonly api?: {
    readonly endpoints: readonly string[]
    readonly auth: 'none' | 'bearer' | 'api-key'
  }
  readonly secrets?: readonly string[]
  readonly categories: readonly string[]
  readonly tags: readonly string[]
  readonly price?: number
  readonly currency?: string
  readonly screenshots?: readonly string[]
  readonly changelog?: string
}

export interface MarketplaceExtension {
  id: string
  name: string
  description: string
  version: string
  category: string
  price: number
  currency: string
  author_id: string
  author_name: string
  manifest: ExtensionManifest
  icon_url?: string
  images: string[]
  tags: string[]
  rating: number
  downloads_count: number
  reviews_count: number
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'suspended'
  featured: boolean
  trending: boolean
  commission_rate: number
  revenue_total: number
  last_updated: string
  created_at: string
  updated_at: string
}

export interface UserExtension {
  id: string
  user_id: string
  extension_id: string
  version: string
  status: 'active' | 'inactive' | 'uninstalled'
  configuration: Record<string, any>
  installed_at: string
  last_used?: string
  usage_count: number
  created_at: string
  updated_at: string
}

export interface ExtensionJob {
  id: string
  user_id: string
  extension_id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  parameters: Record<string, any>
  results: Record<string, any>
  progress: number
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface SSOProvider {
  id: string
  name: string
  type: 'saml' | 'oauth' | 'oidc' | 'ldap'
  entity_id?: string
  sso_url: string
  certificate?: string
  configuration: Record<string, any>
  enabled: boolean
  user_count: number
  last_sync?: string
  created_at: string
  updated_at: string
}

export interface WhiteLabelMarketplace {
  id: string
  owner_id: string
  name: string
  domain?: string
  configuration: {
    branding?: {
      logo?: string
      primaryColor?: string
      customCSS?: string
    }
    payments?: {
      enabled?: boolean
      currency?: string
      commissionRate?: number
    }
    sso?: {
      enabled?: boolean
      providers?: string[]
    }
  }
  status: 'active' | 'inactive' | 'suspended'
  plan: 'starter' | 'professional' | 'enterprise'
  monthly_price: number
  commission_rate: number
  extensions_count: number
  active_users: number
  monthly_revenue: number
  created_at: string
  updated_at: string
}

export interface ExtensionReview {
  id: string
  extension_id: string
  user_id: string
  rating: number
  title?: string
  review?: string
  helpful_count: number
  verified_purchase: boolean
  created_at: string
  updated_at: string
}

export interface ExtensionPurchase {
  id: string
  extension_id: string
  user_id: string
  price: number
  currency: string
  stripe_payment_intent_id?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  marketplace_id?: string
  commission_rate: number
  commission_amount: number
  author_amount: number
  created_at: string
  updated_at: string
}

// API Request/Response types
export interface ExtensionSearchFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  tags?: string[]
  featured?: boolean
  trending?: boolean
}

export interface ExtensionSearchResult {
  extensions: MarketplaceExtension[]
  total: number
  page: number
  pageSize: number
  filters: ExtensionSearchFilters
}

export interface DeveloperStats {
  totalExtensions: number
  totalDownloads: number
  totalRevenue: number
  monthlyRevenue: number
  averageRating: number
  totalReviews: number
}

export interface CLICommand {
  command: string
  description: string
  parameters?: Record<string, any>
}

export interface CLIResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}