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

export const WISE2SYNC_SUPPLIERS: Supplier[] = [
  // FOURNISSEURS EUROPÉENS PRIORITAIRES
  
  // BigBuy - Espagne (Priority #1)
  {
    id: 'bigbuy',
    name: 'bigbuy',
    displayName: 'BigBuy',
    description: '300K+ produits européens, synchronisation temps réel',
    category: 'Dropshipping Premium',
    icon: '🇪🇸',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML', 'CSV'],
    features: ['API complète', 'Stock temps réel', 'Images HD', 'Tracking'],
    regions: ['EU', 'ES', 'FR', 'DE', 'IT'],
    isPopular: true,
    isNew: false,
    status: 'active'
  },

  // Cdiscount Pro - France (Priority #2)
  {
    id: 'cdiscount-pro',
    name: 'cdiscount-pro',
    displayName: 'Cdiscount Pro',
    description: 'Marketplace française, API/EDI complète',
    category: 'Marketplace Française',
    icon: '🇫🇷',
    requiresAuth: true,
    authType: 'oauth',
    supportedFormats: ['API', 'EDI', 'XML'],
    features: ['Marketplace', 'Publication auto', 'Gestion commandes'],
    regions: ['FR'],
    isPopular: true,
    status: 'active'
  },

  // Eprolo - Europe (Priority #3)
  {
    id: 'eprolo',
    name: 'eprolo',
    displayName: 'Eprolo',
    description: '1M+ produits, dropshipping européen premium',
    category: 'Dropshipping Premium',
    icon: '📦',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'CSV'],
    features: ['Dropshipping', 'POD', 'Branding', 'Fast Shipping'],
    regions: ['EU', 'US', 'Global'],
    isPopular: true,
    status: 'active'
  },

  // VidaXL - Pays-Bas (Priority #4)
  {
    id: 'vidaxl',
    name: 'vidaxl',
    displayName: 'VidaXL',
    description: '85K+ produits mobilier/jardin européen',
    category: 'Mobilier & Jardin',
    icon: '🪴',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML', 'CSV'],
    features: ['Mobilier', 'Jardin', 'Décoration', 'Livraison EU'],
    regions: ['EU', 'NL', 'DE', 'FR'],
    isPopular: true,
    status: 'active'
  },

  // Syncee - Hongrie (Priority #5)
  {
    id: 'syncee',
    name: 'syncee',
    displayName: 'Syncee',
    description: '8M+ produits, 12K+ marques mondiales',
    category: 'Marketplace Globale',
    icon: '🔄',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'CSV'],
    features: ['Sync auto', 'Multi-marques', 'Dropshipping'],
    regions: ['EU', 'Global'],
    isPopular: true,
    status: 'active'
  },

  // FOURNISSEURS LITUANIENS (67 fournisseurs selon Wise2Sync)
  {
    id: 'artejas',
    name: 'artejas',
    displayName: 'Artėjas',
    description: 'Fournisseur lituanien spécialisé produits techniques',
    category: 'Fournisseurs Européens',
    icon: '🇱🇹',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML', 'Email'],
    features: ['Technique', 'B2B', 'Export EU'],
    regions: ['LT', 'EU'],
    status: 'active'
  },
  {
    id: 'baltijos-prekes',
    name: 'baltijos-prekes',
    displayName: 'Baltijos prekės',
    description: 'Distributeur balte multi-catégories',
    category: 'Fournisseurs Européens',
    icon: '🇱🇹',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'FTP'],
    features: ['Multi-catégories', 'Distribution', 'Prix compétitifs'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },
  {
    id: 'lietuvos-prekyba',
    name: 'lietuvos-prekyba',
    displayName: 'Lietuvos prekyba',
    description: 'Grande distribution lituanienne',
    category: 'Fournisseurs Européens',
    icon: '🇱🇹',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'EDI'],
    features: ['Grande distribution', 'Alimentaire', 'Non-alimentaire'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // FOURNISSEURS LETTONS (65 fournisseurs)
  {
    id: 'baltijas-produkti',
    name: 'baltijas-produkti',
    displayName: 'Baltijas produkti',
    description: 'Produits baltes authentiques',
    category: 'Fournisseurs Européens',
    icon: '🇱🇻',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Produits locaux', 'Artisanat', 'Alimentaire'],
    regions: ['LV', 'EU'],
    status: 'active'
  },
  {
    id: 'latvijas-vairumtirgotajs',
    name: 'latvijas-vairumtirgotajs',
    displayName: 'Latvijas vairumtirgotājs',
    description: 'Grossiste letton multi-secteurs',
    category: 'Fournisseurs Européens',
    icon: '🇱🇻',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'Email'],
    features: ['Vente en gros', 'Multi-secteurs', 'B2B'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // FOURNISSEURS POLONAIS (43 fournisseurs)
  {
    id: 'hurtownia-polska',
    name: 'hurtownia-polska',
    displayName: 'Hurtownia Polska',
    description: 'Grande hurtownia polonaise',
    category: 'Fournisseurs Européens',
    icon: '🇵🇱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'CSV', 'EDI'],
    features: ['Hurtownia', 'Distribution', 'Logistique'],
    regions: ['PL', 'EU'],
    isPopular: true,
    status: 'active'
  },
  {
    id: 'dystrybutor-tech',
    name: 'dystrybutor-tech',
    displayName: 'Dystrybutor Tech',
    description: 'Distribution technologie Pologne',
    category: 'Technologie',
    icon: '🇵🇱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['High-tech', 'Électronique', 'B2B'],
    regions: ['PL', 'EU'],
    status: 'active'
  },
  {
    id: 'polskie-produkty',
    name: 'polskie-produkty',
    displayName: 'Polskie Produkty',
    description: 'Produits made in Poland',
    category: 'Fournisseurs Européens',
    icon: '🇵🇱',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'FTP'],
    features: ['Made in Poland', 'Artisanat', 'Export'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // FOURNISSEURS ESTONIENS (19 fournisseurs)
  {
    id: 'balti-kaubad',
    name: 'balti-kaubad',
    displayName: 'Balti kaubad',
    description: 'Fournisseur estonien premium',
    category: 'Fournisseurs Européens',
    icon: '🇪🇪',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Premium', 'Baltes', 'Digital'],
    regions: ['EE', 'EU'],
    status: 'active'
  },
  {
    id: 'eesti-hulgimuuk',
    name: 'eesti-hulgimuuk',
    displayName: 'Eesti hulgimüük',
    description: 'Vente en gros estonienne',
    category: 'Fournisseurs Européens',
    icon: '🇪🇪',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'Email'],
    features: ['Vente en gros', 'B2B', 'Digital'],
    regions: ['EE', 'EU'],
    status: 'active'
  },

  // FOURNISSEURS GRECS (6 fournisseurs)
  {
    id: 'greek-suppliers',
    name: 'greek-suppliers',
    displayName: 'Greek Suppliers',
    description: 'Fournisseurs grecs traditionnels',
    category: 'Fournisseurs Européens',
    icon: '🇬🇷',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'Email'],
    features: ['Produits grecs', 'Alimentaire', 'Artisanat'],
    regions: ['GR', 'EU'],
    status: 'active'
  },

  // PRINT-ON-DEMAND
  {
    id: 'printful',
    name: 'printful',
    displayName: 'Printful',
    description: 'Print-on-demand leader mondial',
    category: 'Print-on-Demand',
    icon: '🖨️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'Webhook'],
    features: ['POD', 'Personnalisation', 'Dropshipping', 'Global'],
    regions: ['Global', 'EU', 'US'],
    isPopular: true,
    status: 'active'
  },
  {
    id: 'printify',
    name: 'printify',
    displayName: 'Printify',
    description: 'Print-on-demand network global',
    category: 'Print-on-Demand',
    icon: '🎨',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'Webhook'],
    features: ['POD', 'Multi-fournisseurs', 'Qualité premium'],
    regions: ['Global', 'EU', 'US'],
    isPopular: true,
    status: 'active'
  },

  // DROPSHIPPING PREMIUM
  {
    id: 'appscenic',
    name: 'appscenic',
    displayName: 'AppScenic',
    description: 'Dropshipping UK/EU premium',
    category: 'Dropshipping Premium',
    icon: '🎭',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'CSV'],
    features: ['Dropshipping', 'UK/EU', 'Fast shipping', 'Qualité'],
    regions: ['UK', 'EU'],
    isPopular: true,
    status: 'active'
  },

  // MATTERHORN - Mode/Lingerie
  {
    id: 'matterhorn',
    name: 'matterhorn',
    displayName: 'Matterhorn',
    description: '120K+ produits lingerie/mode européens',
    category: 'Mode & Lingerie',
    icon: '👙',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML', 'EDI'],
    features: ['Mode', 'Lingerie', 'Premium brands', 'EU'],
    regions: ['EU', 'DE', 'FR'],
    isPopular: true,
    status: 'active'
  }
];

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