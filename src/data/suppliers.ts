export interface Supplier {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  logo?: string
  icon?: string
  requiresAuth: boolean
  authType?: 'api_key' | 'oauth' | 'credentials'
  supportedFormats: string[]
  features: string[]
  regions: string[]
  isPopular?: boolean
  isNew?: boolean
  status: 'active' | 'beta' | 'coming_soon'
}

export const SUPPLIER_CATEGORIES = {
  MAJOR_PLATFORMS: 'Grandes Plateformes',
  FRENCH_RETAIL: 'Commerce Français', 
  EUROPEAN_RETAIL: 'Commerce Européen',
  AFFILIATE_NETWORKS: 'Réseaux d\'Affiliation',
  PRICE_COMPARISON: 'Comparateurs de Prix',
  ADVERTISING: 'Publicité & Marketing',
  SPECIALIZED: 'Sites Spécialisés'
}

export const SUPPLIERS: Supplier[] = [
  // Grandes Plateformes
  {
    id: 'amazon',
    name: 'amazon',
    displayName: 'Amazon',
    description: 'La plus grande marketplace mondiale',
    category: SUPPLIER_CATEGORIES.MAJOR_PLATFORMS,
    icon: '🛒',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'XML', 'API', 'Excel', 'FTP', 'URL'],
    features: ['Synchronisation stock', 'Import catalogue', 'Gestion commandes'],
    regions: ['FR', 'EU', 'US', 'Global'],
    isPopular: true,
    status: 'active'
  },
  {
    id: 'aliExpress',
    name: 'aliExpress',
    displayName: 'AliExpress',
    description: 'Marketplace chinoise pour le dropshipping',
    category: SUPPLIER_CATEGORIES.MAJOR_PLATFORMS,
    icon: '🇨🇳',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'API', 'URL', 'Excel', 'XML'],
    features: ['Import produits', 'Suivi prix', 'Stock temps réel'],
    regions: ['Global'],
    isPopular: true,
    status: 'active'
  },
  {
    id: 'ebay',
    name: 'ebay',
    displayName: 'eBay',
    description: 'Marketplace internationale d\'enchères et ventes',
    category: SUPPLIER_CATEGORIES.MAJOR_PLATFORMS,
    icon: '🔥',
    requiresAuth: true,
    authType: 'oauth',
    supportedFormats: ['CSV', 'API', 'XML', 'Excel', 'FTP'],
    features: ['Import catalogue', 'Gestion ventes', 'Analytics'],
    regions: ['FR', 'EU', 'US'],
    isPopular: true,
    status: 'active'
  },

  // Commerce Français
  {
    id: 'carrefour',
    name: 'carrefour',
    displayName: 'Carrefour',
    description: 'Grande distribution française',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '🛍️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'XML'],
    features: ['Catalogue produits', 'Prix en temps réel'],
    regions: ['FR'],
    status: 'active'
  },
  {
    id: 'cdiscount',
    name: 'cdiscount',
    displayName: 'Cdiscount',
    description: 'E-commerce français multi-catégories',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '💰',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'API'],
    features: ['Import catalogue', 'Gestion marketplace'],
    regions: ['FR'],
    status: 'active'
  },
  {
    id: 'fnac',
    name: 'fnac',
    displayName: 'Fnac',
    description: 'Enseigne culturelle et high-tech française',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '📚',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'API'],
    features: ['Catalogue culturel', 'High-tech'],
    regions: ['FR'],
    status: 'active'
  },
  {
    id: 'darty',
    name: 'darty',
    displayName: 'Darty',
    description: 'Spécialiste électroménager et high-tech',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '⚡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV'],
    features: ['Électroménager', 'High-tech'],
    regions: ['FR'],
    status: 'active'
  },
  {
    id: 'but',
    name: 'but',
    displayName: 'BUT',
    description: 'Ameublement et décoration',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '🪑',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV'],
    features: ['Mobilier', 'Décoration'],
    regions: ['FR'],
    status: 'active'
  },
  {
    id: 'conforama',
    name: 'conforama',
    displayName: 'Conforama',
    description: 'Ameublement et équipement de la maison',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '🏠',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV'],
    features: ['Mobilier', 'Électroménager'],
    regions: ['FR'],
    status: 'active'
  },
  {
    id: 'leroy_merlin',
    name: 'leroy_merlin',
    displayName: 'Leroy Merlin',
    description: 'Bricolage et aménagement de la maison',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '🔨',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'API'],
    features: ['Bricolage', 'Jardin', 'Outillage'],
    regions: ['FR', 'EU'],
    status: 'active'
  },
  {
    id: 'galeries_lafayette',
    name: 'galeries_lafayette',
    displayName: 'Galeries Lafayette',
    description: 'Grand magasin de mode et luxe',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '👗',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV'],
    features: ['Mode', 'Luxe', 'Beauté'],
    regions: ['FR'],
    status: 'active'
  },
  {
    id: 'decathlon',
    name: 'decathlon',
    displayName: 'Decathlon',
    description: 'Articles de sport et loisirs',
    category: SUPPLIER_CATEGORIES.FRENCH_RETAIL,
    icon: '⚽',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'API'],
    features: ['Sport', 'Outdoor', 'Fitness'],
    regions: ['FR', 'EU'],
    status: 'active'
  },

  // Commerce Européen
  {
    id: 'bol',
    name: 'bol',
    displayName: 'Bol.com',
    description: 'Marketplace néerlandaise leader',
    category: SUPPLIER_CATEGORIES.EUROPEAN_RETAIL,
    icon: '🇳🇱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'API'],
    features: ['Import catalogue', 'Gestion commandes'],
    regions: ['NL', 'BE'],
    status: 'active'
  },
  {
    id: 'allegro',
    name: 'allegro',
    displayName: 'Allegro',
    description: 'Plus grande marketplace polonaise',
    category: SUPPLIER_CATEGORIES.EUROPEAN_RETAIL,
    icon: '🇵🇱',
    requiresAuth: true,
    authType: 'oauth',
    supportedFormats: ['CSV', 'API'],
    features: ['Marketplace PL', 'Import produits'],
    regions: ['PL'],
    status: 'active'
  },
  {
    id: 'fruugo',
    name: 'fruugo',
    displayName: 'Fruugo',
    description: 'Marketplace européenne multi-pays',
    category: SUPPLIER_CATEGORIES.EUROPEAN_RETAIL,
    icon: '🇪🇺',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV', 'API'],
    features: ['Multi-devises', 'Multi-langues'],
    regions: ['EU'],
    status: 'active'
  },

  // Advertising & Marketing
  {
    id: 'google_shopping',
    name: 'google_shopping',
    displayName: 'Google Shopping',
    description: 'Plateforme shopping de Google',
    category: SUPPLIER_CATEGORIES.ADVERTISING,
    icon: '🔍',
    requiresAuth: true,
    authType: 'oauth',
    supportedFormats: ['CSV', 'API'],
    features: ['Shopping Ads', 'Catalogue produits'],
    regions: ['Global'],
    isPopular: true,
    status: 'active'
  },
  {
    id: 'facebook',
    name: 'facebook',
    displayName: 'Facebook Shop',
    description: 'Boutique Facebook et Instagram',
    category: SUPPLIER_CATEGORIES.ADVERTISING,
    icon: '📘',
    requiresAuth: true,
    authType: 'oauth',
    supportedFormats: ['CSV', 'API'],
    features: ['Facebook Ads', 'Instagram Shop'],
    regions: ['Global'],
    isPopular: true,
    status: 'active'
  },
  {
    id: 'meta',
    name: 'meta',
    displayName: 'Meta Business',
    description: 'Plateforme publicitaire Meta',
    category: SUPPLIER_CATEGORIES.ADVERTISING,
    icon: '🌐',
    requiresAuth: true,
    authType: 'oauth',
    supportedFormats: ['API'],
    features: ['Meta Ads', 'Catalogue Manager'],
    regions: ['Global'],
    status: 'active'
  },
  {
    id: 'tiktok',
    name: 'tiktok',
    displayName: 'TikTok Shop',
    description: 'E-commerce sur TikTok',
    category: SUPPLIER_CATEGORIES.ADVERTISING,
    icon: '🎵',
    requiresAuth: true,
    authType: 'oauth',
    supportedFormats: ['CSV', 'API'],
    features: ['TikTok Ads', 'Live Shopping'],
    regions: ['Global'],
    isNew: true,
    status: 'beta'
  },

  // Comparateurs de Prix
  {
    id: 'idealo',
    name: 'idealo',
    displayName: 'Idealo',
    description: 'Comparateur de prix allemand',
    category: SUPPLIER_CATEGORIES.PRICE_COMPARISON,
    icon: '💶',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV'],
    features: ['Comparaison prix', 'Market insights'],
    regions: ['DE', 'EU'],
    status: 'active'
  },
  {
    id: 'check24',
    name: 'check24',
    displayName: 'Check24',
    description: 'Comparateur allemand multi-secteurs',
    category: SUPPLIER_CATEGORIES.PRICE_COMPARISON,
    icon: '✓',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['CSV'],
    features: ['Comparaison', 'Lead generation'],
    regions: ['DE'],
    status: 'active'
  },

  // Import Générique
  {
    id: 'csv',
    name: 'csv',
    displayName: 'Import CSV/Excel',
    description: 'Import de fichiers personnalisés',
    category: 'Import Générique',
    icon: '📊',
    requiresAuth: false,
    supportedFormats: ['CSV', 'Excel', 'TSV'],
    features: ['Mapping automatique', 'Validation données'],
    regions: ['Global'],
    isPopular: true,
    status: 'active'
  }
]

export const getSuppliersByCategory = (category: string) => {
  return SUPPLIERS.filter(supplier => supplier.category === category)
}

export const getPopularSuppliers = () => {
  return SUPPLIERS.filter(supplier => supplier.isPopular)
}

export const getSupplierById = (id: string) => {
  return SUPPLIERS.find(supplier => supplier.id === id)
}