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
  },

  // =====================================================
  // NOUVEAUX FOURNISSEURS WISE2SYNC (Ajoutés depuis wise2sync.com)
  // =====================================================

  // ALSO - IT Distribution
  {
    id: 'also',
    name: 'also',
    displayName: 'ALSO',
    description: '30K+ produits ICT, distribution informatique',
    category: 'IT & Électronique',
    icon: '💻',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML', 'CSV'],
    features: ['ICT', 'Distribution', 'B2B', 'Hardware'],
    regions: ['EU', 'DE', 'NL'],
    isPopular: true,
    status: 'active'
  },

  // Itrade - Lettonie
  {
    id: 'itrade',
    name: 'itrade',
    displayName: 'iTrade SIA',
    description: '20K+ produits IT & accessoires, marques Swissten',
    category: 'IT & Électronique',
    icon: '🇱🇻',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['IT', 'Accessoires', 'Swissten', 'Baltic'],
    regions: ['LV', 'LT', 'EE'],
    isNew: true,
    status: 'active'
  },

  // Xindao - Pays-Bas
  {
    id: 'xindao',
    name: 'xindao',
    displayName: 'Xindao',
    description: '15K+ produits promotionnels, design néerlandais',
    category: 'Articles Promotionnels',
    icon: '🇳🇱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Promotionnel', 'Design', 'Personnalisation'],
    regions: ['NL', 'EU'],
    isNew: true,
    status: 'active'
  },

  // Candellux - Pologne (Éclairage)
  {
    id: 'candellux',
    name: 'candellux',
    displayName: 'Candellux',
    description: '4K+ produits éclairage, solutions lumineuses',
    category: 'Éclairage',
    icon: '💡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Éclairage', 'LED', 'Design', 'B2B'],
    regions: ['PL', 'EU'],
    isNew: true,
    status: 'active'
  },

  // Janshop - Piscines & Gonflables
  {
    id: 'janshop',
    name: 'janshop',
    displayName: 'JanShop',
    description: '4.5K+ produits piscines Intex/Bestway',
    category: 'Jardin & Piscines',
    icon: '🏊',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Piscines', 'Intex', 'Bestway', 'Gonflables'],
    regions: ['EU'],
    isNew: true,
    status: 'active'
  },

  // FragrancesWholesale - Parfums
  {
    id: 'fragrances-wholesale',
    name: 'fragrances-wholesale',
    displayName: 'FragrancesWholesale.eu',
    description: '31K+ parfums designer, 20+ ans expérience',
    category: 'Parfums & Cosmétiques',
    icon: '🌸',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML', 'CSV'],
    features: ['Parfums', 'Designer', 'Wholesale', 'Premium'],
    regions: ['CZ', 'EU'],
    isNew: true,
    status: 'active'
  },

  // B2B Sports Wholesale
  {
    id: 'b2b-sports-wholesale',
    name: 'b2b-sports-wholesale',
    displayName: 'B2B Sports Wholesale',
    description: '45K+ produits sport Adidas/Nike/Puma',
    category: 'Sport & Loisirs',
    icon: '⚽',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Sport', 'Nike', 'Adidas', 'Puma', 'Wholesale'],
    regions: ['EU'],
    isPopular: true,
    status: 'active'
  },

  // Qubo - Poufs Lettonie
  {
    id: 'qubo',
    name: 'qubo',
    displayName: 'Qubo',
    description: '500+ poufs design, fabricant letton',
    category: 'Mobilier',
    icon: '🛋️',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Poufs', 'Design', 'Fabricant', 'Baltic'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Artool - Roumanie (Jardin)
  {
    id: 'artool',
    name: 'artool',
    displayName: 'Artool',
    description: '10K+ produits jardin & mobilier outdoor',
    category: 'Jardin & Piscines',
    icon: '🌿',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Jardin', 'Mobilier outdoor', 'Import'],
    regions: ['RO', 'EU'],
    status: 'active'
  },

  // GameRoom - Lituanie (Gaming)
  {
    id: 'gameroom',
    name: 'gameroom',
    displayName: 'GameRoom',
    description: '9K+ produits gaming, équipement PC',
    category: 'Gaming',
    icon: '🎮',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Gaming', 'PC', 'Accessoires', 'Board games'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Lic Gotus - Lettonie (DIY)
  {
    id: 'lic-gotus',
    name: 'lic-gotus',
    displayName: 'Lic Gotus',
    description: '21K+ produits bricolage, outils, fixations',
    category: 'Bricolage & Outils',
    icon: '🔧',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['DIY', 'Outils', 'Fixations', 'B2B'],
    regions: ['LV', 'LT', 'EE'],
    status: 'active'
  },

  // Topo Grupe - Lituanie (Électronique)
  {
    id: 'topo-grupe',
    name: 'topo-grupe',
    displayName: 'Topo Grupe',
    description: '100K+ produits électronique maison',
    category: 'Électronique',
    icon: '📺',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électronique', 'Électroménager', 'Retail'],
    regions: ['LT', 'EU'],
    isPopular: true,
    status: 'active'
  },

  // Rekman - Pologne (Jouets)
  {
    id: 'rekman',
    name: 'rekman',
    displayName: 'Rekman',
    description: '20K+ jouets, leader distribution Pologne',
    category: 'Jouets',
    icon: '🧸',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Jouets', 'Distribution', '400+ catégories'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Czasnabuty - Pologne (Chaussures)
  {
    id: 'czasnabuty',
    name: 'czasnabuty',
    displayName: 'Czasnabuty',
    description: '20K+ chaussures mode, prix attractifs',
    category: 'Chaussures',
    icon: '👟',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Chaussures', 'Mode', 'Enfants', 'Adultes'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // BROCK ELECTRONICS - Lettonie
  {
    id: 'brock-electronics',
    name: 'brock-electronics',
    displayName: 'BROCK Electronics',
    description: '20K+ produits non-alimentaires, depuis 1999',
    category: 'Électronique',
    icon: '⚡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électronique', 'Électroménager', 'Wholesale'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Ikonka - Pologne
  {
    id: 'ikonka',
    name: 'ikonka',
    displayName: 'Ikonka',
    description: '18K+ produits B2B, jouets, maison, jardin',
    category: 'Multi-catégories',
    icon: '🏪',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Jouets', 'Maison', 'Jardin', 'B2B'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Hurtel - Pologne (GSM)
  {
    id: 'hurtel',
    name: 'hurtel',
    displayName: 'Hurtel',
    description: '10.5K+ accessoires GSM originaux',
    category: 'Mobile & Accessoires',
    icon: '📱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['GSM', 'Accessoires', 'Coques', 'Chargeurs'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // 3MK - Pologne (Protection mobile)
  {
    id: '3mk',
    name: '3mk',
    displayName: '3MK',
    description: '20K+ protections mobiles, 18 ans expérience',
    category: 'Mobile & Accessoires',
    icon: '🛡️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Protection écran', 'Coques', 'Verre trempé'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // HDC Baltic - Électronique
  {
    id: 'hdc-baltic',
    name: 'hdc-baltic',
    displayName: 'HDC Baltic',
    description: '10K+ produits Apple/Samsung/Xiaomi',
    category: 'Électronique',
    icon: '🍎',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Apple', 'Samsung', 'Xiaomi', 'Canon'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Action.pl - Pologne
  {
    id: 'action-pl',
    name: 'action-pl',
    displayName: 'Action.pl',
    description: '30K+ produits électronique, export 50+ pays',
    category: 'Électronique',
    icon: '🇵🇱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électronique', 'Export', 'Wholesale'],
    regions: ['PL', 'EU'],
    isPopular: true,
    status: 'active'
  },

  // Elko - Lituanie (IT)
  {
    id: 'elko',
    name: 'elko',
    displayName: 'Elko',
    description: '17K+ produits IT, plus grand distributeur Est Europe',
    category: 'IT & Électronique',
    icon: '💿',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['IT', 'Distribution', '36K+ produits', 'B2B'],
    regions: ['LT', 'EU'],
    isPopular: true,
    status: 'active'
  },

  // YourNewStyle - Mode
  {
    id: 'yournewstyle',
    name: 'yournewstyle',
    displayName: 'YourNewStyle',
    description: '3K+ vêtements mode France/Italie/Londres',
    category: 'Mode',
    icon: '👗',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Mode', 'Import France/Italie', 'Tendances'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // MyFusion - Baltic (Mobile)
  {
    id: 'myfusion',
    name: 'myfusion',
    displayName: 'MyFusion',
    description: '40K+ accessoires mobiles et périphériques',
    category: 'Mobile & Accessoires',
    icon: '📲',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Mobile', 'Périphériques', 'Wholesale Baltic'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Chomik - Pologne (Maison/Jardin)
  {
    id: 'chomik',
    name: 'chomik',
    displayName: 'Chomik',
    description: '11K+ produits maison et jardin depuis 1993',
    category: 'Maison & Jardin',
    icon: '🏡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Maison', 'Jardin', 'Cuisine', 'Nettoyage'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // ORCCAN - Baltic (Sport)
  {
    id: 'orccan',
    name: 'orccan',
    displayName: 'ORCCAN',
    description: '10K+ équipements sport professionnel',
    category: 'Sport & Loisirs',
    icon: '🏋️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Sport pro', 'Équipement', 'Fitness'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Amona - Lituanie (Jouets/Sport)
  {
    id: 'amona',
    name: 'amona',
    displayName: 'Amona',
    description: '40K+ jouets et équipements sport/loisirs',
    category: 'Jouets',
    icon: '🎯',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Jouets', 'Sport', 'Loisirs', 'Tourisme'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Qoltec - Pologne (Tech)
  {
    id: 'qoltec',
    name: 'qoltec',
    displayName: 'Qoltec',
    description: '20K+ produits tech haute qualité',
    category: 'IT & Électronique',
    icon: '🔌',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Tech', 'Innovation', 'Qualité EU'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Numoco - Pologne (Robes)
  {
    id: 'numoco',
    name: 'numoco',
    displayName: 'Numoco',
    description: '9K+ robes et vêtements femme, fabricant',
    category: 'Mode',
    icon: '👠',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Robes', 'Mode femme', 'Fabricant'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Latakko - Baltic (Auto)
  {
    id: 'latakko',
    name: 'latakko',
    displayName: 'Latakko',
    description: '39.5K+ pneus et roues, leader Baltic auto',
    category: 'Automobile',
    icon: '🚗',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Pneus', 'Roues', 'Wholesale', 'Auto'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Eltap - Pologne (Meubles)
  {
    id: 'eltap',
    name: 'eltap',
    displayName: 'Eltap',
    description: '10K+ meubles rembourrés, canapés, lits',
    category: 'Mobilier',
    icon: '🛏️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Canapés', 'Lits', 'Design', 'Fabricant'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Kosatec - Allemagne (Électronique)
  {
    id: 'kosatec',
    name: 'kosatec',
    displayName: 'Kosatec',
    description: '10K+ composants électroniques, CPU/SSD/GPU',
    category: 'IT & Électronique',
    icon: '🖥️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['CPU', 'SSD', 'GPU', 'Moniteurs'],
    regions: ['DE', 'EU'],
    status: 'active'
  },

  // Partnertele - Pologne (GSM)
  {
    id: 'partnertele',
    name: 'partnertele',
    displayName: 'Partnertele',
    description: '24K+ accessoires GSM, plus grand en Europe',
    category: 'Mobile & Accessoires',
    icon: '📞',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['GSM', 'Accessoires', 'Europe', 'Wholesale'],
    regions: ['PL', 'EU'],
    isPopular: true,
    status: 'active'
  },

  // Black Red White - Pologne (Mobilier)
  {
    id: 'black-red-white',
    name: 'black-red-white',
    displayName: 'Black Red White',
    description: '6.5K+ meubles, plus grand fabricant EU',
    category: 'Mobilier',
    icon: '🪑',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Meubles', 'Design intérieur', 'Fabricant'],
    regions: ['PL', 'EU'],
    isPopular: true,
    status: 'active'
  },

  // MC Distribution - Europe (Électronique)
  {
    id: 'mc-distribution',
    name: 'mc-distribution',
    displayName: 'MC Distribution',
    description: '150K+ produits électronique grand public',
    category: 'Électronique',
    icon: '📦',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électronique', 'Distribution EU', 'Wholesale'],
    regions: ['EU'],
    isPopular: true,
    status: 'active'
  },

  // BOSCH - Pièces auto
  {
    id: 'bosch-auto',
    name: 'bosch-auto',
    displayName: 'BOSCH Auto Parts',
    description: '67K+ pièces auto et diagnostic',
    category: 'Automobile',
    icon: '🔧',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Pièces auto', 'Diagnostic', 'OEM'],
    regions: ['LT', 'LV', 'EE', 'EU'],
    isNew: true,
    status: 'active'
  },

  // Marsietis - Lituanie (Électronique)
  {
    id: 'marsietis',
    name: 'marsietis',
    displayName: 'Marsietis',
    description: '85K+ produits électronique, Rego Tech',
    category: 'Électronique',
    icon: '🛸',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électronique', 'Retail', 'Wholesale'],
    regions: ['LT', 'EU'],
    isNew: true,
    status: 'active'
  },

  // Komputronik - Pologne
  {
    id: 'komputronik',
    name: 'komputronik',
    displayName: 'Komputronik',
    description: '110K+ produits électro/électroménager',
    category: 'IT & Électronique',
    icon: '🖱️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['IT', 'Électroménager', 'Consumer electronics'],
    regions: ['PL', 'EU'],
    isPopular: true,
    status: 'active'
  },

  // ACTIVESHOP - Pologne (Cosmétique pro)
  {
    id: 'activeshop',
    name: 'activeshop',
    displayName: 'ACTIVESHOP',
    description: '11K+ produits cosmétique & coiffure pro',
    category: 'Parfums & Cosmétiques',
    icon: '💇',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Cosmétique pro', 'Coiffure', 'Équipement salon'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Ila Uhren - Montres/Bijoux
  {
    id: 'ila-uhren',
    name: 'ila-uhren',
    displayName: 'Ila Uhren',
    description: '9K+ montres et bijoux depuis 1992',
    category: 'Montres & Bijoux',
    icon: '⌚',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Montres', 'Bijoux', 'Accessoires', 'Wholesale'],
    regions: ['DE', 'EU'],
    status: 'active'
  },

  // Signal Meble - Pologne (Mobilier)
  {
    id: 'signal-meble',
    name: 'signal-meble',
    displayName: 'Signal Meble',
    description: '2.1K+ meubles design polonais depuis 1992',
    category: 'Mobilier',
    icon: '🏠',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Meubles', 'Design moderne', 'Fabricant'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // AbeStock - Estonie (Électro)
  {
    id: 'abestock',
    name: 'abestock',
    displayName: 'AbeStock',
    description: '15K+ produits électronique Estonie',
    category: 'Électronique',
    icon: '🇪🇪',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électronique', 'Import', 'Distribution EE'],
    regions: ['EE', 'EU'],
    status: 'active'
  },

  // TD Baltic - IT/Électroménager
  {
    id: 'td-baltic',
    name: 'td-baltic',
    displayName: 'TD Baltic',
    description: '5K+ produits IT et électroménager Baltic',
    category: 'IT & Électronique',
    icon: '🔋',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['IT', 'Électroménager', 'Distribution'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Innpro/RCpro - Drones/RC
  {
    id: 'innpro',
    name: 'innpro',
    displayName: 'Innpro (RCpro)',
    description: '10K+ modèles RC et drones',
    category: 'Jouets',
    icon: '🚁',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['RC', 'Drones', 'Modélisme'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Ravak - Salles de bain
  {
    id: 'ravak',
    name: 'ravak',
    displayName: 'Ravak',
    description: '6.5K+ produits salle de bain premium',
    category: 'Salle de bain',
    icon: '🚿',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Baignoires', 'Douches', 'Premium'],
    regions: ['CZ', 'EU'],
    isNew: true,
    status: 'active'
  },

  // Home4You - Estonie (Mobilier)
  {
    id: 'home4you',
    name: 'home4you',
    displayName: 'Home4You',
    description: '6.6K+ meubles et décoration maison',
    category: 'Mobilier',
    icon: '🪴',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Mobilier', 'Décoration', 'Design scandinave'],
    regions: ['EE', 'EU'],
    status: 'active'
  },

  // Mebeles - Lettonie (Mobilier bureau)
  {
    id: 'mebeles',
    name: 'mebeles',
    displayName: 'Mebeles.lv',
    description: '12.5K+ meubles bureau professionnels',
    category: 'Mobilier',
    icon: '🗄️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Mobilier bureau', 'Pro', 'Design'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // TuningTec - Auto tuning
  {
    id: 'tuningtec',
    name: 'tuningtec',
    displayName: 'TuningTec',
    description: '10K+ pièces tuning et performance auto',
    category: 'Automobile',
    icon: '🏎️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Tuning', 'Performance', 'Carrosserie'],
    regions: ['DE', 'EU'],
    status: 'active'
  },

  // JWTrade - Vélos
  {
    id: 'jwtrade',
    name: 'jwtrade',
    displayName: 'JWTrade.lt',
    description: '19.5K+ vélos CUBE/Merida et accessoires',
    category: 'Sport & Loisirs',
    icon: '🚴',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Vélos', 'CUBE', 'Merida', 'Accessoires'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // SportOn - Sport/Vélos
  {
    id: 'sporton',
    name: 'sporton',
    displayName: 'SportOn',
    description: '6.1K+ vélos, sport et équipements outdoor',
    category: 'Sport & Loisirs',
    icon: '🏂',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Vélos', 'Sport', 'Outdoor', 'Roller'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Butosklep - Chaussures
  {
    id: 'butosklep',
    name: 'butosklep',
    displayName: 'Butosklep',
    description: '10K+ chaussures homme/femme/enfant',
    category: 'Chaussures',
    icon: '👞',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Chaussures', 'Toutes tailles', 'Mode'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // AVAD Baltic - Apple Distributor
  {
    id: 'avad-baltic',
    name: 'avad-baltic',
    displayName: 'AVAD Baltic',
    description: '2.5K+ produits Apple autorisé Baltic',
    category: 'IT & Électronique',
    icon: '🍏',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Apple', 'Authorized', 'Premium'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Stokker - Outils Baltic
  {
    id: 'stokker',
    name: 'stokker',
    displayName: 'Stokker',
    description: '5.4K+ outils pro, leader Baltic 25+ ans',
    category: 'Bricolage & Outils',
    icon: '🛠️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Outils', 'Pro', 'Équipement'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Gitana - Lituanie (Outils)
  {
    id: 'gitana',
    name: 'gitana',
    displayName: 'Gitana',
    description: '40K+ outils et équipements professionnels',
    category: 'Bricolage & Outils',
    icon: '⚙️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Outils', 'Équipement pro', 'Représentant'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Verners - Lettonie (Multi)
  {
    id: 'verners',
    name: 'verners',
    displayName: 'Verners LV',
    description: '11K+ produits multi-catégories wholesale',
    category: 'Multi-catégories',
    icon: '🏬',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Multi-catégories', 'Wholesale', 'One-stop'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Virsotne - Sport/Outdoor
  {
    id: 'virsotne',
    name: 'virsotne',
    displayName: 'Virsotne',
    description: '15K+ produits tourisme et sport outdoor',
    category: 'Sport & Loisirs',
    icon: '🏔️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Outdoor', 'La Sportiva', 'Trekking'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Eselo - Électricité Lettonie
  {
    id: 'eselo',
    name: 'eselo',
    displayName: 'Eselo',
    description: '25K+ câbles et matériel électrique',
    category: 'Électricité',
    icon: '⚡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Câbles', 'Électricité', 'Éclairage'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Electro Base - Lettonie
  {
    id: 'electro-base',
    name: 'electro-base',
    displayName: 'Electro Base',
    description: '15K+ éclairage et sécurité, 14+ ans',
    category: 'Éclairage',
    icon: '💡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Éclairage', 'Sécurité', 'Installation'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // BALTIC DATA - IT Lettonie
  {
    id: 'baltic-data',
    name: 'baltic-data',
    displayName: 'BALTIC DATA',
    description: '9.5K+ produits IT depuis 1992',
    category: 'IT & Électronique',
    icon: '🖥️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['IT', 'Wholesale', 'Baltic'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Santechcity - Plomberie
  {
    id: 'santechcity',
    name: 'santechcity',
    displayName: 'Santechcity',
    description: '17K+ produits plomberie, plus grand LV',
    category: 'Salle de bain',
    icon: '🚰',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Plomberie', 'Sanitaire', 'Chauffage'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Akvedukts - Wholesale Baltic
  {
    id: 'akvedukts',
    name: 'akvedukts',
    displayName: 'Akvedukts',
    description: '14K+ produits modernes wholesale Baltic',
    category: 'Multi-catégories',
    icon: '🌊',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Wholesale', 'Baltic', 'Fiable'],
    regions: ['LV', 'LT', 'EE'],
    status: 'active'
  },

  // Unimall - Cosmétiques luxe
  {
    id: 'unimall',
    name: 'unimall',
    displayName: 'Unimall',
    description: '3K+ cosmétiques et parfums luxe EU',
    category: 'Parfums & Cosmétiques',
    icon: '💄',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Cosmétiques luxe', 'Parfums', 'Exclusif'],
    regions: ['EU'],
    status: 'active'
  },

  // Darbo drabužiai - Vêtements travail
  {
    id: 'darbo-drabuziai',
    name: 'darbo-drabuziai',
    displayName: 'Darbo drabužiai',
    description: '14K+ vêtements et équipements travail',
    category: 'Vêtements de travail',
    icon: '👷',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Vêtements travail', 'Sécurité', 'EPI'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Mirpol - Jardin Pologne
  {
    id: 'mirpol',
    name: 'mirpol',
    displayName: 'Mirpol',
    description: '5K+ mobilier jardin, leader import PL',
    category: 'Jardin & Piscines',
    icon: '🌳',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Mobilier jardin', 'Import', 'Design'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // AM Furnitura - Composants meubles
  {
    id: 'am-furnitura',
    name: 'am-furnitura',
    displayName: 'AM Furnitura',
    description: '9.9K+ composants meubles, fabricant Baltic',
    category: 'Mobilier',
    icon: '🔩',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Composants', 'Fabricant', 'B2B'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Magma - Plomberie
  {
    id: 'magma-plumbing',
    name: 'magma-plumbing',
    displayName: 'Magma',
    description: '9K+ robinetterie et équipements sanitaires',
    category: 'Salle de bain',
    icon: '🚿',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Robinetterie', 'Douches', 'Sanitaire'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Play Pro LT - Gaming
  {
    id: 'playpro',
    name: 'playpro',
    displayName: 'Play Pro LT',
    description: '8K+ équipements gaming, premier LT',
    category: 'Gaming',
    icon: '🎧',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Gaming', 'PC', 'Périphériques'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Mercurius Trade - Électroménager
  {
    id: 'mercurius-trade',
    name: 'mercurius-trade',
    displayName: 'Mercurius Trade',
    description: '10K+ électroménager Sharp/Bosch/Philips',
    category: 'Électroménager',
    icon: '🍳',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électroménager', 'Grandes marques', 'Wholesale'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Tayma - Montres/Bijoux Pologne
  {
    id: 'tayma',
    name: 'tayma',
    displayName: 'Tayma',
    description: '3K+ montres, bijoux et accessoires mode',
    category: 'Montres & Bijoux',
    icon: '💎',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Montres', 'Bijoux', 'Sacs', 'Accessoires'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // MIG Baltic - Outils
  {
    id: 'mig-baltic',
    name: 'mig-baltic',
    displayName: 'MIG Baltic',
    description: '7K+ outils à main et équipements',
    category: 'Bricolage & Outils',
    icon: '🔨',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Outils', 'Distribution', 'Wholesale'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Treenikamat - Sport Finlande
  {
    id: 'treenikamat',
    name: 'treenikamat',
    displayName: 'Treenikamat',
    description: '5K+ équipements sport yoga/fitness/camping',
    category: 'Sport & Loisirs',
    icon: '🧘',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Yoga', 'Fitness', 'Camping', 'Hiking'],
    regions: ['FI', 'EU'],
    status: 'active'
  },

  // Levenhuk Baltic - Optique
  {
    id: 'levenhuk-baltic',
    name: 'levenhuk-baltic',
    displayName: 'Levenhuk Baltic',
    description: '3K+ produits optiques spécialisés',
    category: 'Optique',
    icon: '🔭',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Optique', 'Télescopes', 'Microscopes'],
    regions: ['LV', 'LT', 'EE'],
    status: 'active'
  },

  // Medexy - Cosmétiques pro
  {
    id: 'medexy',
    name: 'medexy',
    displayName: 'Medexy',
    description: '3K+ produits soins peau professionnels',
    category: 'Parfums & Cosmétiques',
    icon: '🧴',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Soins peau', 'Pro', 'Algotherm', 'Sesderma'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Insplay - Jouets Estonie
  {
    id: 'insplay',
    name: 'insplay',
    displayName: 'Insplay.eu',
    description: '5K+ jouets éducatifs et puzzles, 30 ans',
    category: 'Jouets',
    icon: '🧩',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Jouets éducatifs', 'Puzzles', 'Board games'],
    regions: ['EE', 'EU'],
    status: 'active'
  },

  // Dietisur - Espagne (Bio/Naturel)
  {
    id: 'dietisur',
    name: 'dietisur',
    displayName: 'Dietisur',
    description: '3K+ produits bio et naturels Espagne',
    category: 'Santé & Bio',
    icon: '🌿',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Bio', 'Naturel', 'Compléments', 'Hygiène'],
    regions: ['ES', 'EU'],
    status: 'active'
  },

  // Eurodigital - Accessoires tech
  {
    id: 'eurodigital',
    name: 'eurodigital',
    displayName: 'Eurodigital',
    description: '5.5K+ accessoires smartphones/laptops',
    category: 'Mobile & Accessoires',
    icon: '🔌',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Accessoires', 'Smartphones', 'Smart home'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Daily Print - Consommables
  {
    id: 'daily-print',
    name: 'daily-print',
    displayName: 'Daily Print',
    description: '11K+ consommables imprimantes Baltic',
    category: 'Bureautique',
    icon: '🖨️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Toners', 'Cartouches', 'Compatible', 'Original'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Nordic Digital - Estonie
  {
    id: 'nordic-digital',
    name: 'nordic-digital',
    displayName: 'Nordic Digital',
    description: '8K+ produits imaging et électronique',
    category: 'IT & Électronique',
    icon: '📷',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Imaging', 'Canon authorized', 'Photo'],
    regions: ['EE', 'EU'],
    status: 'active'
  },

  // Leker - Jouets marques
  {
    id: 'leker',
    name: 'leker',
    displayName: 'Leker',
    description: '5K+ jouets grandes marques depuis 2001',
    category: 'Jouets',
    icon: '🎁',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Jouets marques', 'Wholesale', 'LEGO', 'Hasbro'],
    regions: ['LT', 'EU'],
    isNew: true,
    status: 'active'
  },

  // BabyOno - Bébé
  {
    id: 'babyono',
    name: 'babyono',
    displayName: 'BabyOno',
    description: '1.8K+ produits bébé et enfants depuis 1990',
    category: 'Bébé & Enfants',
    icon: '👶',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Bébé', 'Enfants', 'Puériculture'],
    regions: ['PL', 'EU'],
    isNew: true,
    status: 'active'
  },

  // Aqua Planet - Animalerie
  {
    id: 'aqua-planet',
    name: 'aqua-planet',
    displayName: 'Aqua Planet',
    description: '8.5K+ produits animalerie spécialisés',
    category: 'Animalerie',
    icon: '🐠',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Aquariophilie', 'Reptiles', 'Oiseaux'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Tommy Toys Story - Jouets
  {
    id: 'tommy-toys-story',
    name: 'tommy-toys-story',
    displayName: 'Tommy Toys Story',
    description: '4K+ jouets et articles sport enfants',
    category: 'Jouets',
    icon: '🎈',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Jouets', 'Sport enfants', 'Wholesale'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // LtVaikas - Chaussures enfants
  {
    id: 'ltvaikas',
    name: 'ltvaikas',
    displayName: 'LtVaikas',
    description: '6.2K+ chaussures enfants D.D.STEP/PONTE20',
    category: 'Chaussures',
    icon: '👣',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Chaussures enfants', 'D.D.STEP', 'PONTE20'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Keno - Panneaux solaires
  {
    id: 'keno',
    name: 'keno',
    displayName: 'Keno',
    description: '3.5K+ produits photovoltaïques et solaires',
    category: 'Énergie Solaire',
    icon: '☀️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Solaire', 'PV', 'Onduleurs', 'Montage'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Mirgo - K+B Progres
  {
    id: 'mirgo',
    name: 'mirgo',
    displayName: 'Mirgo',
    description: '3.5K+ outils et équipements K+B Progres',
    category: 'Bricolage & Outils',
    icon: '🔧',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Outils', 'Distribution', 'République Tchèque'],
    regions: ['RO', 'BG', 'EU'],
    status: 'active'
  },

  // Biurteksa - Consommables imprimantes
  {
    id: 'biurteksa',
    name: 'biurteksa',
    displayName: 'Biurteksa',
    description: '6K+ toners et cartouches OEM',
    category: 'Bureautique',
    icon: '🖨️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Toners OEM', 'Cartouches', 'East Europe leader'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // SportX - Sport Lettonie
  {
    id: 'sportx',
    name: 'sportx',
    displayName: 'SportX',
    description: '6.5K+ équipements sport indoor/outdoor',
    category: 'Sport & Loisirs',
    icon: '🏃',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Sport', 'Indoor', 'Outdoor', 'Revêtements'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Duna Electronics - Smartphones
  {
    id: 'duna-electronics',
    name: 'duna-electronics',
    displayName: 'Duna Electronics',
    description: '850+ smartphones originaux sim-free EU',
    category: 'Mobile & Accessoires',
    icon: '📱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Smartphones', 'Sim-free', 'Original EU'],
    regions: ['SK', 'EU'],
    status: 'active'
  },

  // Essve - Outils bois
  {
    id: 'essve',
    name: 'essve',
    displayName: 'Essve',
    description: '4K+ outils travail du bois, 7 marchés EU',
    category: 'Bricolage & Outils',
    icon: '🪚',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Bois', 'Menuiserie', 'Outils pro'],
    regions: ['SE', 'EU'],
    status: 'active'
  },

  // Elux SIA - Électroménager cuisine
  {
    id: 'elux-sia',
    name: 'elux-sia',
    displayName: 'Elux SIA',
    description: '3.7K+ électroménager cuisine AEG/Bosch/Franke',
    category: 'Électroménager',
    icon: '🍳',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Cuisine', 'AEG', 'Bosch', 'Franke'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Rimonne - Jouets/Jeux
  {
    id: 'rimonne',
    name: 'rimonne',
    displayName: 'Rimonne',
    description: '4K+ constructeurs et jeux de société',
    category: 'Jouets',
    icon: '🧱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Constructeurs', 'Board games', 'Tous âges'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Biston - Sanitaire
  {
    id: 'biston',
    name: 'biston',
    displayName: 'Biston',
    description: '3.4K+ sanitaires Cersanit/Alcaplast',
    category: 'Salle de bain',
    icon: '🚽',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Sanitaire', 'Cersanit', 'Alcaplast'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Labie Instrumenti - Outils
  {
    id: 'labie-instrumenti',
    name: 'labie-instrumenti',
    displayName: 'Labie Instrumenti',
    description: '3K+ outils peintres, constructeurs, serruriers',
    category: 'Bricolage & Outils',
    icon: '🖌️',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Peinture', 'Construction', 'Serrurerie'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Cita Santehnika - Plomberie
  {
    id: 'cita-santehnika',
    name: 'cita-santehnika',
    displayName: 'Cita Santehnika',
    description: '9.2K+ sanitaire, chauffage, jardinage',
    category: 'Salle de bain',
    icon: '🔧',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Sanitaire', 'Chauffage', 'Jardinage'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Baltic Auto Parts - Pièces auto
  {
    id: 'baltic-auto-parts',
    name: 'baltic-auto-parts',
    displayName: 'Baltic Auto Parts',
    description: '11K+ pièces auto Koivunen Oy Scandinavie',
    category: 'Automobile',
    icon: '🚙',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Pièces auto', 'Scandinave', 'Koivunen'],
    regions: ['LV', 'LT', 'EE'],
    status: 'active'
  },

  // Intersol SIA - Chauffage
  {
    id: 'intersol',
    name: 'intersol',
    displayName: 'Intersol SIA',
    description: '2.5K+ équipements chauffage et plomberie',
    category: 'Chauffage',
    icon: '🔥',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Chauffage', 'Plomberie', 'Direct fabricant'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // INTRAD - Sport Wilson/Suunto
  {
    id: 'intrad',
    name: 'intrad',
    displayName: 'INTRAD',
    description: '2K+ équipements sport Wilson/Suunto/Stiga',
    category: 'Sport & Loisirs',
    icon: '🎾',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Wilson', 'Suunto', 'Stiga', 'Sport'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Eva Sat - Sanitaire/Chauffage
  {
    id: 'eva-sat',
    name: 'eva-sat',
    displayName: 'Eva Sat',
    description: '8.4K+ sanitaire et chauffage depuis 1989',
    category: 'Salle de bain',
    icon: '🛁',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Sanitaire', 'Chauffage', 'Retail & Wholesale'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Silteks - Protection travail
  {
    id: 'silteks',
    name: 'silteks',
    displayName: 'Silteks',
    description: '5K+ EPI, gants, chaussures, vêtements',
    category: 'Vêtements de travail',
    icon: '🧤',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['EPI', 'Gants', 'Chaussures sécurité'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Stipro - Fixations
  {
    id: 'stipro',
    name: 'stipro',
    displayName: 'Stipro',
    description: '4K+ vis, fixations et consommables construction',
    category: 'Bricolage & Outils',
    icon: '🔩',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Vis', 'Fixations', 'Construction'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // StDalys - Pièces machines jardin
  {
    id: 'stdalys',
    name: 'stdalys',
    displayName: 'StDalys',
    description: '3K+ pièces tracteurs, tondeuses, tronçonneuses',
    category: 'Jardin & Piscines',
    icon: '🚜',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Pièces jardin', 'Tracteurs', 'Tondeuses'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // EUROLED.LV - LED
  {
    id: 'euroled',
    name: 'euroled',
    displayName: 'EUROLED.LV',
    description: '5K+ solutions LED indoor/outdoor',
    category: 'Éclairage',
    icon: '💡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['LED', 'Indoor', 'Outdoor', 'Manufacture'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Santeko - Plomberie/Arrosage
  {
    id: 'santeko',
    name: 'santeko',
    displayName: 'Santeko',
    description: '7.4K+ équipements plomberie et arrosage auto',
    category: 'Jardin & Piscines',
    icon: '💧',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Plomberie', 'Arrosage', 'Automatisation'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Sarmi - Ménage
  {
    id: 'sarmi',
    name: 'sarmi',
    displayName: 'Sarmi',
    description: '4.2K+ produits ménagers représentant marques',
    category: 'Maison & Jardin',
    icon: '🧹',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Ménage', 'Représentant officiel', 'Marques'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Maxy.pl - Électronique/Cadeaux
  {
    id: 'maxy-pl',
    name: 'maxy-pl',
    displayName: 'Maxy.pl',
    description: '1.7K+ électronique, cadeaux et accessoires',
    category: 'Multi-catégories',
    icon: '🎁',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électronique', 'Cadeaux', 'Jouets'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Aktivcentrs - Loisirs Lettonie
  {
    id: 'aktivcentrs',
    name: 'aktivcentrs',
    displayName: 'Aktivcentrs',
    description: '1K+ produits loisirs/sport/tourisme spécialisés',
    category: 'Sport & Loisirs',
    icon: '🏕️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Loisirs', 'Sport', 'Tourisme', 'Spécialisé'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Led Europa - V-TAC Pologne
  {
    id: 'led-europa',
    name: 'led-europa',
    displayName: 'Led Europa',
    description: '2K+ produits V-TAC Europe en Pologne',
    category: 'Éclairage',
    icon: '💡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['LED', 'V-TAC', 'Distribution'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Siglus - Électricité industrielle
  {
    id: 'siglus',
    name: 'siglus',
    displayName: 'Siglus',
    description: '6K+ électricité industrielle et automation',
    category: 'Électricité',
    icon: '⚡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Industriel', 'Automation', 'Éclairage'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Sils LV - Machines jardin
  {
    id: 'sils-lv',
    name: 'sils-lv',
    displayName: 'Sils LV',
    description: '1K+ machines préparation sol et jardin',
    category: 'Jardin & Piscines',
    icon: '🌱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Machines jardin', 'Terrassement', 'Déneigement'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Baltyre - Pneus Lituanie
  {
    id: 'baltyre',
    name: 'baltyre',
    displayName: 'Baltyre',
    description: '3.2K+ pneus import/export tous types',
    category: 'Automobile',
    icon: '🛞',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Pneus', 'Import/Export', 'Wholesale'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Printplius - Consommables bureau
  {
    id: 'printplius',
    name: 'printplius',
    displayName: 'Printplius',
    description: '2K+ consommables et produits bureau',
    category: 'Bureautique',
    icon: '📋',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Imprimantes', 'Bureau', 'Accessoires'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Zuja - Jouets représentant
  {
    id: 'zuja',
    name: 'zuja',
    displayName: 'Zuja',
    description: '1.5K+ jouets Plus Plus/Lottie/PlayMais',
    category: 'Jouets',
    icon: '🧸',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Plus Plus', 'Lottie', 'PlayMais', 'Représentant'],
    regions: ['LT', 'EU'],
    isNew: true,
    status: 'active'
  },

  // Sanifinas - Jouets Lituanie
  {
    id: 'sanifinas',
    name: 'sanifinas',
    displayName: 'Sanifinas',
    description: '1.3K+ jouets et jeux de société qualité',
    category: 'Jouets',
    icon: '🎲',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Jouets qualité', 'Jeux société', 'Wholesale'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // LENO HOLDING - Électronique enfants
  {
    id: 'leno-holding',
    name: 'leno-holding',
    displayName: 'LENO Holding',
    description: '1.5K+ électronique et produits enfants',
    category: 'Électronique',
    icon: '🔋',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Électronique', 'Enfants', 'Distribution'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Krinona - Ménage
  {
    id: 'krinona',
    name: 'krinona',
    displayName: 'Krinona',
    description: '800+ produits ménagers wholesale/retail',
    category: 'Maison & Jardin',
    icon: '🧽',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Ménage', 'Household', 'Wholesale'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Mobalt - Mobilier Baltija
  {
    id: 'mobalt',
    name: 'mobalt',
    displayName: 'Mobalt (MB+)',
    description: '2K+ meubles groupe Mobili Baltija',
    category: 'Mobilier',
    icon: '🛋️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Meubles', 'Groupe Baltic', 'B2B'],
    regions: ['LT', 'LV', 'EE'],
    isNew: true,
    status: 'active'
  },

  // Sponge - Électromobilité
  {
    id: 'sponge',
    name: 'sponge',
    displayName: 'Sponge',
    description: '150+ produits électromobilité depuis 2010',
    category: 'Électromobilité',
    icon: '🛴',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Électromobilité', 'Fabricant', 'B2B'],
    regions: ['EU'],
    status: 'active'
  },

  // MAE Technology - Photo
  {
    id: 'mae-technology',
    name: 'mae-technology',
    displayName: 'MAE Technology',
    description: '500+ équipements photo DSLR, objectifs',
    category: 'Optique',
    icon: '📸',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['DSLR', 'Objectifs', 'Batteries', 'Photo'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Deimena - Nettoyage pro
  {
    id: 'deimena',
    name: 'deimena',
    displayName: 'Deimena',
    description: '3K+ produits nettoyage KiiltoClean/Kärcher/Vikan',
    category: 'Nettoyage Professionnel',
    icon: '🧼',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Nettoyage', 'Kärcher', 'Vikan', 'Pro'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Hamakų Sala - Hamacs
  {
    id: 'hamaku-sala',
    name: 'hamaku-sala',
    displayName: 'Hamakų Sala',
    description: '500+ hamacs AMAZONAS représentant Baltic',
    category: 'Jardin & Piscines',
    icon: '🌴',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Hamacs', 'AMAZONAS', 'Outdoor'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // Montis Magia - Randonnée
  {
    id: 'montis-magia',
    name: 'montis-magia',
    displayName: 'Montis Magia',
    description: '1K+ équipements randonnée et loisirs actifs',
    category: 'Sport & Loisirs',
    icon: '🥾',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Randonnée', 'Chaussures', 'Outdoor'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Oliver - Fournitures bureau
  {
    id: 'oliver',
    name: 'oliver',
    displayName: 'Oliver',
    description: '10K+ fournitures bureau, 15+ ans',
    category: 'Bureautique',
    icon: '📎',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Bureau', 'Fournitures', 'Équipement'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // ForMe EU - Ménage pratique
  {
    id: 'forme',
    name: 'forme',
    displayName: 'ForMe EU',
    description: '120+ produits ménagers utiles et confortables',
    category: 'Maison & Jardin',
    icon: '🏡',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Ménage', 'Pratique', 'Quotidien'],
    regions: ['EU'],
    status: 'active'
  },

  // Grizzly Baltic - Jardin
  {
    id: 'grizzly-baltic',
    name: 'grizzly-baltic',
    displayName: 'Grizzly Baltic',
    description: '200+ machines jardin haute qualité',
    category: 'Jardin & Piscines',
    icon: '🌿',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Jardin', 'Machines', 'Grizzly officiel'],
    regions: ['LT', 'LV', 'EE'],
    status: 'active'
  },

  // KamadoClub - Barbecues
  {
    id: 'kamadoclub',
    name: 'kamadoclub',
    displayName: 'KamadoClub',
    description: '100+ grills Kamado DiamondCut exclusifs',
    category: 'Jardin & Piscines',
    icon: '🍖',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Kamado', 'BBQ', 'Premium', 'Exclusif'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // PAA - Baignoires Lettonie
  {
    id: 'paa',
    name: 'paa',
    displayName: 'PAA',
    description: '280+ baignoires et lavabos fabricant LV',
    category: 'Salle de bain',
    icon: '🛁',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Baignoires', 'Lavabos', 'Fabricant'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Vilde - Maison/Jardin
  {
    id: 'vilde',
    name: 'vilde',
    displayName: 'Vilde',
    description: '1K+ produits maison et jardin européens',
    category: 'Maison & Jardin',
    icon: '🏠',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Maison', 'Jardin', 'Qualité EU'],
    regions: ['EU'],
    status: 'active'
  },

  // Ambergs - Éclairage/Plomberie
  {
    id: 'ambergs',
    name: 'ambergs',
    displayName: 'Ambergs',
    description: '1.1K+ éclairage, capteurs et plomberie',
    category: 'Éclairage',
    icon: '💡',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Éclairage', 'Capteurs', 'Plomberie'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Ilguciems - Produits LV
  {
    id: 'ilguciems',
    name: 'ilguciems',
    displayName: 'Ilguciems',
    description: '280+ produits lettons depuis 30+ ans',
    category: 'Multi-catégories',
    icon: '🇱🇻',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Made in Latvia', 'Fiable', '30+ ans'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Smartstat - Thermostats
  {
    id: 'smartstat',
    name: 'smartstat',
    displayName: 'Smartstat',
    description: '131+ thermostats Fantini Cosmi innovants',
    category: 'Chauffage',
    icon: '🌡️',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Thermostats', 'Smart home', 'Fantini Cosmi'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Vinteko - Toiture
  {
    id: 'vinteko',
    name: 'vinteko',
    displayName: 'Vinteko',
    description: '4.9K+ matériaux toiture et accessoires',
    category: 'Construction',
    icon: '🏗️',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Toiture', 'Polycarbonate', 'Construction'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Velve - Matériaux construction
  {
    id: 'velve',
    name: 'velve',
    displayName: 'Velve',
    description: '1K+ matériaux construction et finition',
    category: 'Construction',
    icon: '🧱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Colles', 'Mastics', 'Étanchéité'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // Sanro - Sport maison
  {
    id: 'sanro',
    name: 'sanro',
    displayName: 'Sanro',
    description: '500+ équipements sport maison et outdoor',
    category: 'Sport & Loisirs',
    icon: '🏠',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Sport maison', 'Gymnastique', 'Barres'],
    regions: ['PL', 'EU'],
    status: 'active'
  },

  // Sivs - Ventilation/Climatisation
  {
    id: 'sivs',
    name: 'sivs',
    displayName: 'Sivs',
    description: '500+ produits ventilation et climatisation',
    category: 'Chauffage',
    icon: '❄️',
    requiresAuth: true,
    authType: 'credentials',
    supportedFormats: ['CSV', 'XML'],
    features: ['Ventilation', 'Climatisation', 'Chauffage'],
    regions: ['LV', 'EU'],
    status: 'active'
  },

  // AU Sistemas - Chauffage/Eau
  {
    id: 'au-sistemas',
    name: 'au-sistemas',
    displayName: 'AU Sistemas',
    description: '900+ équipements eau et chauffage qualité',
    category: 'Chauffage',
    icon: '💧',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Eau', 'Chauffage', 'Qualité'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // BAUMERA - Serres
  {
    id: 'baumera',
    name: 'baumera',
    displayName: 'BAUMERA',
    description: '1K+ serres et polycarbonates fabricant',
    category: 'Jardin & Piscines',
    icon: '🌱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Serres', 'Polycarbonate', 'Fabricant'],
    regions: ['LT', 'EU'],
    status: 'active'
  },

  // Mobilux - Mobile Lituanie
  {
    id: 'mobilux',
    name: 'mobilux',
    displayName: 'Mobilux',
    description: '5K+ accessoires mobiles et périphériques',
    category: 'Mobile & Accessoires',
    icon: '📱',
    requiresAuth: true,
    authType: 'api_key',
    supportedFormats: ['API', 'XML'],
    features: ['Mobile', 'Accessoires', 'Périphériques'],
    regions: ['LT', 'EU'],
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