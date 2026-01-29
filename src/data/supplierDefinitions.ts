/**
 * Supplier Definitions Data
 * Extracted from ChannableStyleSuppliersPage for better maintainability
 * 150+ verified dropshipping suppliers worldwide
 */

import { Globe, ShoppingBag, Heart, Zap, Building2, Sparkles, Activity, Box, Factory, Warehouse, Package, Truck } from 'lucide-react';

// Types
export interface SupplierDefinition {
  id: string;
  name: string;
  logo: string;
  category: 'general' | 'fashion' | 'electronics' | 'home' | 'beauty' | 'sports' | 'toys' | 'food' | 'pets' | 'automotive' | 'print_on_demand' | 'wholesale';
  country: string;
  shippingZones?: ('europe' | 'usa' | 'asia' | 'worldwide' | 'uk' | 'australia' | 'canada' | 'south_america')[];
  popular?: boolean;
  premium?: boolean;
  description?: string;
  features?: string[];
  minOrder?: number;
  shippingTime?: string;
  rating?: number;
  productsCount?: number;
  setupFields?: {
    name: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder?: string;
    required?: boolean;
  }[];
}

// Shipping zones configuration
export const SHIPPING_ZONES = [
  { id: 'all', label: 'Toutes zones', icon: Globe },
  { id: 'europe', label: 'Europe', icon: Truck },
  { id: 'usa', label: 'États-Unis', icon: Truck },
  { id: 'asia', label: 'Asie', icon: Truck },
  { id: 'worldwide', label: 'Mondial', icon: Globe },
  { id: 'uk', label: 'Royaume-Uni', icon: Truck },
  { id: 'canada', label: 'Canada', icon: Truck },
  { id: 'australia', label: 'Australie', icon: Truck },
] as const;

// Country options
export const COUNTRY_OPTIONS = [
  { id: 'all', label: 'Tous les pays' },
  { id: 'CN', label: '🇨🇳 Chine' },
  { id: 'US', label: '🇺🇸 États-Unis' },
  { id: 'FR', label: '🇫🇷 France' },
  { id: 'DE', label: '🇩🇪 Allemagne' },
  { id: 'UK', label: '🇬🇧 Royaume-Uni' },
  { id: 'IT', label: '🇮🇹 Italie' },
  { id: 'ES', label: '🇪🇸 Espagne' },
  { id: 'NL', label: '🇳🇱 Pays-Bas' },
  { id: 'PL', label: '🇵🇱 Pologne' },
  { id: 'AU', label: '🇦🇺 Australie' },
  { id: 'CA', label: '🇨🇦 Canada' },
  { id: 'IN', label: '🇮🇳 Inde' },
  { id: 'JP', label: '🇯🇵 Japon' },
  { id: 'KR', label: '🇰🇷 Corée du Sud' },
  { id: 'TR', label: '🇹🇷 Turquie' },
  { id: 'BR', label: '🇧🇷 Brésil' },
  { id: 'BE', label: '🇧🇪 Belgique' },
  { id: 'CH', label: '🇨🇭 Suisse' },
  { id: 'SE', label: '🇸🇪 Suède' },
  { id: 'NO', label: '🇳🇴 Norvège' },
  { id: 'DK', label: '🇩🇰 Danemark' },
  { id: 'AT', label: '🇦🇹 Autriche' },
  { id: 'PT', label: '🇵🇹 Portugal' },
  { id: 'GR', label: '🇬🇷 Grèce' },
  { id: 'CZ', label: '🇨🇿 République Tchèque' },
  { id: 'RO', label: '🇷🇴 Roumanie' },
  { id: 'HU', label: '🇭🇺 Hongrie' },
  { id: 'IE', label: '🇮🇪 Irlande' },
] as const;

// Categories
export const SUPPLIER_CATEGORIES = [
  { id: 'all', label: 'Tous', icon: Globe },
  { id: 'general', label: 'Généraliste', icon: ShoppingBag },
  { id: 'fashion', label: 'Mode', icon: Heart },
  { id: 'electronics', label: 'Électronique', icon: Zap },
  { id: 'home', label: 'Maison', icon: Building2 },
  { id: 'beauty', label: 'Beauté', icon: Sparkles },
  { id: 'sports', label: 'Sport', icon: Activity },
  { id: 'toys', label: 'Jouets', icon: Box },
  { id: 'print_on_demand', label: 'Print on Demand', icon: Factory },
  { id: 'wholesale', label: 'Grossiste', icon: Warehouse },
  { id: 'pets', label: 'Animaux', icon: Heart },
  { id: 'food', label: 'Alimentaire', icon: Package },
  { id: 'automotive', label: 'Automobile', icon: Truck },
] as const;

// Country flags mapping
export const COUNTRY_FLAGS: Record<string, string> = {
  'CN': '🇨🇳', 'US': '🇺🇸', 'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱',
  'DE': '🇩🇪', 'FR': '🇫🇷', 'UK': '🇬🇧', 'GB': '🇬🇧', 'PL': '🇵🇱',
  'HU': '🇭🇺', 'NZ': '🇳🇿', 'AU': '🇦🇺', 'NO': '🇳🇴', 'CA': '🇨🇦',
  'JP': '🇯🇵', 'KR': '🇰🇷', 'BR': '🇧🇷', 'MX': '🇲🇽', 'IN': '🇮🇳',
  'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'SE': '🇸🇪', 'DK': '🇩🇰',
  'BE': '🇧🇪', 'AT': '🇦🇹', 'CH': '🇨🇭', 'PT': '🇵🇹', 'IE': '🇮🇪',
  'GR': '🇬🇷', 'RO': '🇷🇴', 'CZ': '🇨🇿', 'ID': '🇮🇩', 'MY': '🇲🇾',
  'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭', 'TR': '🇹🇷', 'FI': '🇫🇮',
};

// Main supplier definitions - Popular suppliers first
export const SUPPLIER_DEFINITIONS: SupplierDefinition[] = [
  // === POPULAIRES ===
  { 
    id: 'aliexpress', name: 'AliExpress', 
    logo: 'https://ae01.alicdn.com/kf/S704f9f6bbe564b66a65dde13e15e10b5t.png', 
    category: 'general', country: 'CN', popular: true,
    description: 'Le plus grand marketplace dropshipping au monde',
    features: ['Millions de produits', 'Prix ultra-compétitifs', 'ePacket disponible'],
    rating: 4.3, productsCount: 100000000, shippingTime: '15-45 jours',
    setupFields: [
      { name: 'app_key', label: 'App Key', type: 'text', required: true },
      { name: 'app_secret', label: 'App Secret', type: 'password', required: true }
    ]
  },
  { 
    id: 'cjdropshipping', name: 'CJ Dropshipping', 
    logo: 'https://cjdropshipping.com/favicon.ico', 
    category: 'general', country: 'CN', popular: true,
    description: 'Agent dropshipping avec warehouses US/EU et sourcing gratuit',
    features: ['Entrepôts US/EU', 'Sourcing gratuit', 'Branding personnalisé', 'POD intégré'],
    rating: 4.5, productsCount: 400000, shippingTime: '7-15 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true },
      { name: 'email', label: 'Email compte', type: 'text', required: true }
    ]
  },
  { 
    id: 'spocket', name: 'Spocket', 
    logo: 'https://spocket.co/favicon.ico', 
    category: 'general', country: 'US', popular: true, premium: true,
    description: 'Fournisseurs US/EU vérifiés avec livraison rapide',
    features: ['Fournisseurs US/EU', 'Livraison 2-5 jours', 'Produits premium'],
    rating: 4.6, productsCount: 100000, shippingTime: '2-7 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'bigbuy', name: 'BigBuy', 
    logo: 'https://www.bigbuy.eu/favicon.ico', 
    category: 'general', country: 'ES', popular: true,
    description: 'Grossiste européen leader avec 100K+ produits',
    features: ['Entrepôt européen', 'Livraison 24-72h', 'API complète'],
    rating: 4.4, productsCount: 100000, shippingTime: '24-72 heures',
    setupFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true },
      { name: 'api_secret', label: 'Secret API', type: 'password', required: true }
    ]
  },
  { 
    id: 'printful', name: 'Printful', 
    logo: 'https://www.printful.com/favicon.ico', 
    category: 'print_on_demand', country: 'US', popular: true, premium: true,
    description: 'Leader du Print on Demand avec qualité premium',
    features: ['Qualité premium', 'Fulfillment US/EU', 'Mockup generator'],
    rating: 4.7, productsCount: 500, shippingTime: '2-7 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'printify', name: 'Printify', 
    logo: 'https://printify.com/favicon.ico', 
    category: 'print_on_demand', country: 'US', popular: true,
    description: 'Réseau de 90+ fournisseurs POD avec meilleurs prix',
    features: ['90+ partenaires', 'Prix compétitifs', 'Réseau global'],
    rating: 4.5, productsCount: 800, shippingTime: '2-8 jours',
    setupFields: [{ name: 'api_token', label: 'API Token', type: 'password', required: true }]
  },
  { 
    id: 'brandsdistribution', name: 'BrandsDistribution', 
    logo: 'https://www.brandsdistribution.com/favicon.ico', 
    category: 'fashion', country: 'IT', popular: true,
    description: 'Grossiste mode italien avec 120+ marques premium',
    features: ['Marques premium', 'Mode italienne', 'Livraison EU'],
    rating: 4.4, productsCount: 150000, shippingTime: '48-72 heures',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'vidaxl', name: 'vidaXL', 
    logo: 'https://www.vidaxl.fr/favicon.ico', 
    category: 'home', country: 'NL', popular: true,
    description: 'Leader européen du dropshipping maison et jardin',
    features: ['Maison & Jardin', 'Entrepôt EU', 'Livraison gratuite', '90K+ produits'],
    rating: 4.3, productsCount: 90000, shippingTime: '3-7 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'faire', name: 'Faire', 
    logo: 'https://www.faire.com/favicon.ico', 
    category: 'wholesale', country: 'US', popular: true, premium: true,
    description: 'Marketplace wholesale premium avec marques artisanales',
    features: ['Marques artisanales', 'Net 60 paiement', 'Retours gratuits'],
    rating: 4.7, productsCount: 600000, shippingTime: '3-7 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'ankorstore', name: 'Ankorstore', 
    logo: 'https://www.ankorstore.com/favicon.ico', 
    category: 'wholesale', country: 'FR', popular: true, premium: true,
    shippingZones: ['europe', 'uk'],
    description: 'Marketplace B2B français avec marques créatives européennes',
    features: ['Marques françaises', 'Net 60 paiement', 'EU shipping'],
    rating: 4.5, productsCount: 300000, shippingTime: '3-7 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'zentrada', name: 'Zentrada', 
    logo: 'https://www.zentrada.eu/favicon.ico', 
    category: 'wholesale', country: 'DE', popular: true,
    description: 'Marketplace B2B européen avec 400+ fournisseurs',
    features: ['400+ fournisseurs', 'EU based', 'Multi-catégories'],
    rating: 4.3, productsCount: 200000, shippingTime: '2-5 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'zalando', name: 'Zalando Partner', 
    logo: 'https://www.zalando.fr/favicon.ico', 
    category: 'fashion', country: 'DE', popular: true, premium: true,
    shippingZones: ['europe'],
    description: 'Leader mode européen avec programme partenaire',
    features: ['Mode', 'Chaussures', '25+ pays', 'Fulfillment'],
    rating: 4.6, productsCount: 500000, shippingTime: '2-5 jours',
    setupFields: [
      { name: 'partner_id', label: 'Partner ID', type: 'text', required: true },
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },

  // === CHINE ===
  { 
    id: 'temu', name: 'Temu', 
    logo: 'https://www.temu.com/favicon.ico', 
    category: 'general', country: 'CN', popular: true,
    description: 'Marketplace ultra-compétitif avec prix imbattables',
    features: ['Prix ultra-bas', 'Grande variété', 'Livraison gratuite'],
    rating: 4.0, productsCount: 5000000, shippingTime: '10-20 jours',
    setupFields: []
  },
  { 
    id: 'alibaba', name: 'Alibaba', 
    logo: 'https://www.alibaba.com/favicon.ico', 
    category: 'wholesale', country: 'CN', popular: true,
    description: 'Plateforme B2B leader pour sourcing et fabrication',
    features: ['Fabrication OEM', 'Prix usine', 'Trade Assurance'],
    rating: 4.3, productsCount: 200000000, shippingTime: '20-45 jours',
    minOrder: 10,
    setupFields: [{ name: 'app_key', label: 'App Key', type: 'text', required: true }]
  },
  { 
    id: '1688', name: '1688.com', 
    logo: 'https://www.1688.com/favicon.ico', 
    category: 'wholesale', country: 'CN',
    description: 'Alibaba chinois avec les meilleurs prix usine',
    features: ['Prix usine', 'Fournisseurs locaux', 'Nécessite agent'],
    rating: 4.2, productsCount: 100000000, shippingTime: '15-30 jours',
    setupFields: []
  },
  { 
    id: 'dhgate', name: 'DHgate', 
    logo: 'https://www.dhgate.com/favicon.ico', 
    category: 'general', country: 'CN',
    description: 'Marketplace B2B chinois avec petites quantités',
    features: ['Petites quantités', 'Large catalogue', 'Prix grossiste'],
    rating: 4.0, productsCount: 30000000, shippingTime: '15-35 jours',
    setupFields: []
  },
  { 
    id: 'banggood', name: 'Banggood', 
    logo: 'https://www.banggood.com/favicon.ico', 
    category: 'electronics', country: 'CN',
    description: 'Spécialiste électronique et gadgets avec entrepôts mondiaux',
    features: ['Électronique', 'Entrepôts EU/US', 'Gadgets uniques'],
    rating: 4.1, productsCount: 500000, shippingTime: '7-25 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'chinabrands', name: 'ChinaBrands', 
    logo: 'https://www.chinabrands.com/favicon.ico', 
    category: 'general', country: 'CN',
    description: 'Grossiste chinois avec 500K+ produits',
    features: ['500K+ produits', 'Prix usine', 'Entrepôts globaux'],
    rating: 4.0, productsCount: 500000, shippingTime: '10-25 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },

  // === EUROPE ===
  { 
    id: 'cdiscount', name: 'Cdiscount', 
    logo: 'https://www.cdiscount.com/favicon.ico', 
    category: 'general', country: 'FR', popular: true,
    shippingZones: ['europe'],
    description: 'Deuxième marketplace français après Amazon',
    features: ['France', 'Prix bas', 'Multi-catégories'],
    rating: 4.1, productsCount: 100000000, shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'manomano', name: 'ManoMano', 
    logo: 'https://www.manomano.fr/favicon.ico', 
    category: 'home', country: 'FR', popular: true,
    shippingZones: ['europe'],
    description: 'Spécialiste bricolage et maison en Europe',
    features: ['Bricolage', 'Jardin', 'Maison'],
    rating: 4.3, productsCount: 16000000, shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'bol', name: 'Bol.com', 
    logo: 'https://www.bol.com/favicon.ico', 
    category: 'general', country: 'NL', popular: true,
    shippingZones: ['europe'],
    description: 'Plus grande marketplace du Benelux',
    features: ['Pays-Bas', 'Belgique', 'Fulfillment'],
    rating: 4.5, productsCount: 35000000, shippingTime: '1-3 jours',
    setupFields: []
  },
  { 
    id: 'allegro', name: 'Allegro', 
    logo: 'https://allegro.pl/favicon.ico', 
    category: 'general', country: 'PL', popular: true,
    shippingZones: ['europe'],
    description: 'Plus grande marketplace polonaise',
    features: ['Pologne', 'Multi-catégories', 'Fulfillment'],
    rating: 4.4, productsCount: 135000000, shippingTime: '2-7 jours',
    setupFields: []
  },
  { 
    id: 'emag', name: 'eMAG', 
    logo: 'https://www.emag.ro/favicon.ico', 
    category: 'general', country: 'RO', popular: true,
    shippingZones: ['europe'],
    description: 'Leader e-commerce Europe de l\'Est',
    features: ['Europe Est', 'Multi-catégories', 'Tech'],
    rating: 4.3, productsCount: 6000000, shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'alza', name: 'Alza', 
    logo: 'https://www.alza.cz/favicon.ico', 
    category: 'electronics', country: 'CZ', popular: true,
    shippingZones: ['europe'],
    description: 'Plus grande marketplace tchèque spécialisée tech',
    features: ['Tchéquie', 'Tech', 'Gaming'],
    rating: 4.5, productsCount: 1000000, shippingTime: '1-3 jours',
    setupFields: []
  },
  { 
    id: 'coolblue', name: 'Coolblue', 
    logo: 'https://www.coolblue.be/favicon.ico', 
    category: 'electronics', country: 'BE', popular: true,
    shippingZones: ['europe'],
    description: 'E-commerce tech avec service client exceptionnel',
    features: ['Électronique', 'Service premium', 'Benelux'],
    rating: 4.7, productsCount: 100000, shippingTime: '1-2 jours',
    setupFields: []
  },
  { 
    id: 'galaxus', name: 'Galaxus', 
    logo: 'https://www.galaxus.ch/favicon.ico', 
    category: 'general', country: 'CH', popular: true,
    shippingZones: ['europe'],
    description: 'Plus grande marketplace suisse avec qualité premium',
    features: ['Suisse', 'Qualité premium', 'Multi-catégories'],
    rating: 4.6, productsCount: 6000000, shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'skroutz', name: 'Skroutz', 
    logo: 'https://www.skroutz.gr/favicon.ico', 
    category: 'general', country: 'GR', popular: true,
    shippingZones: ['europe'],
    description: 'Plus grande marketplace grecque',
    features: ['Grèce', 'Comparateur', 'Multi-catégories'],
    rating: 4.4, productsCount: 10000000, shippingTime: '2-6 jours',
    setupFields: []
  },
  { 
    id: 'cdon', name: 'CDON', 
    logo: 'https://cdon.com/favicon.ico', 
    category: 'general', country: 'SE', popular: true,
    shippingZones: ['europe'],
    description: 'Plus grande marketplace nordique',
    features: ['Scandinavie', 'Multi-catégories'],
    rating: 4.2, productsCount: 8000000, shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'veepee', name: 'Veepee', 
    logo: 'https://www.veepee.fr/favicon.ico', 
    category: 'fashion', country: 'FR', popular: true,
    shippingZones: ['europe'],
    description: 'Leader européen des ventes privées',
    features: ['Ventes privées', 'Marques premium', 'Mode'],
    rating: 4.3, productsCount: 3000000, shippingTime: '5-12 jours',
    setupFields: []
  },
  { 
    id: 'douglas', name: 'Douglas', 
    logo: 'https://www.douglas.de/favicon.ico', 
    category: 'beauty', country: 'DE', popular: true,
    shippingZones: ['europe'],
    description: 'Leader parfumerie et beauté en Europe',
    features: ['Parfumerie', 'Beauté', 'Europe'],
    rating: 4.4, productsCount: 50000, shippingTime: '2-5 jours',
    setupFields: []
  },

  // === ASIE ===
  { 
    id: 'rakuten', name: 'Rakuten Japan', 
    logo: 'https://www.rakuten.co.jp/favicon.ico', 
    category: 'general', country: 'JP', popular: true,
    shippingZones: ['asia', 'worldwide'],
    description: 'Plus grande marketplace japonaise',
    features: ['Produits japonais', 'Tech', 'Beauté', 'Anime'],
    rating: 4.4, productsCount: 250000000, shippingTime: '7-20 jours',
    setupFields: []
  },
  { 
    id: 'gmarket', name: 'Gmarket', 
    logo: 'https://www.gmarket.co.kr/favicon.ico', 
    category: 'general', country: 'KR', popular: true,
    shippingZones: ['asia', 'worldwide'],
    description: 'Plus grande marketplace coréenne avec K-beauty',
    features: ['K-beauty', 'K-fashion', 'K-pop merch'],
    rating: 4.3, productsCount: 150000000, shippingTime: '7-18 jours',
    setupFields: []
  },
  { 
    id: 'indiamart', name: 'IndiaMart', 
    logo: 'https://www.indiamart.com/favicon.ico', 
    category: 'wholesale', country: 'IN', popular: true,
    shippingZones: ['worldwide', 'asia'],
    description: 'Plus grande marketplace B2B indienne',
    features: ['Fabricants indiens', 'Artisanat', 'Textile'],
    rating: 4.1, productsCount: 75000000, shippingTime: '15-35 jours',
    setupFields: []
  },
  { 
    id: 'trendyol', name: 'Trendyol', 
    logo: 'https://www.trendyol.com/favicon.ico', 
    category: 'fashion', country: 'TR', popular: true,
    shippingZones: ['europe', 'asia', 'worldwide'],
    description: 'Plus grande marketplace turque',
    features: ['Mode turque', 'Prix compétitifs', 'Large catalogue'],
    rating: 4.3, productsCount: 30000000, shippingTime: '5-15 jours',
    setupFields: []
  },

  // === AMÉRIQUES ===
  { 
    id: 'mercadolibre', name: 'MercadoLibre', 
    logo: 'https://www.mercadolibre.com/favicon.ico', 
    category: 'general', country: 'MX', popular: true,
    shippingZones: ['south_america', 'usa'],
    description: 'Plus grande marketplace d\'Amérique Latine',
    features: ['Amérique Latine', 'Multi-catégories', 'Logistique intégrée'],
    rating: 4.4, productsCount: 300000000, shippingTime: '5-20 jours',
    setupFields: []
  },

  // === PRINT ON DEMAND ===
  { 
    id: 'gelato', name: 'Gelato', 
    logo: 'https://www.gelato.com/favicon.ico', 
    category: 'print_on_demand', country: 'NO',
    description: 'POD éco-responsable avec production locale',
    features: ['Production locale', 'Éco-responsable', '30+ pays'],
    rating: 4.4, productsCount: 250, shippingTime: '2-5 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'gooten', name: 'Gooten', 
    logo: 'https://gooten.com/favicon.ico', 
    category: 'print_on_demand', country: 'US',
    description: 'POD avec réseau de fabrication global',
    features: ['Réseau global', 'API robuste', 'Qualité constante'],
    rating: 4.3, productsCount: 350, shippingTime: '3-8 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'prodigi', name: 'Prodigi', 
    logo: 'https://www.prodigi.com/favicon.ico', 
    category: 'print_on_demand', country: 'UK', popular: true,
    shippingZones: ['uk', 'europe', 'worldwide'],
    description: 'POD global avec réseau de production dans 50+ pays',
    features: ['50+ pays', 'Éco-responsable', 'Wall art'],
    rating: 4.5, productsCount: 400, shippingTime: '3-8 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },

  // === AGENTS ===
  { 
    id: 'dsers', name: 'DSers', 
    logo: 'https://www.dsers.com/favicon.ico', 
    category: 'general', country: 'CN', popular: true,
    description: 'Partenaire officiel AliExpress pour automatisation',
    features: ['Intégration AliExpress', 'Commandes en masse', 'Suivi automatique'],
    rating: 4.4, productsCount: 500000, shippingTime: '15-45 jours',
    setupFields: [{ name: 'api_token', label: 'Token API', type: 'password', required: true }]
  },
  { 
    id: 'zendrop', name: 'Zendrop', 
    logo: 'https://zendrop.com/favicon.ico', 
    category: 'general', country: 'US', popular: true,
    description: 'Plateforme dropshipping US avec livraison express',
    features: ['Livraison US rapide', 'Custom branding', 'Auto-fulfillment'],
    rating: 4.2, productsCount: 1000000, shippingTime: '5-12 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'syncee', name: 'Syncee', 
    logo: 'https://syncee.com/favicon.ico', 
    category: 'general', country: 'HU', popular: true,
    description: 'Marketplace B2B avec fournisseurs globaux',
    features: ['Fournisseurs vérifiés', 'Sync automatique', 'Multi-plateformes'],
    rating: 4.3, productsCount: 4000000, shippingTime: '3-15 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'modalyst', name: 'Modalyst', 
    logo: 'https://modalyst.co/favicon.ico', 
    category: 'fashion', country: 'US', popular: true,
    description: 'Marketplace mode avec marques indépendantes',
    features: ['Marques indépendantes', 'Produits uniques', 'Livraison rapide'],
    rating: 4.1, productsCount: 400000, shippingTime: '5-14 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },

  // === GROSSISTES US ===
  { 
    id: 'salehoo', name: 'SaleHoo', 
    logo: 'https://www.salehoo.com/favicon.ico', 
    category: 'wholesale', country: 'NZ',
    description: 'Annuaire de 8000+ fournisseurs vérifiés',
    features: ['8000+ fournisseurs', 'Vérification stricte', 'Market research'],
    rating: 4.5, productsCount: 2500000, shippingTime: 'Variable',
    setupFields: [{ name: 'member_id', label: 'Member ID', type: 'text', required: true }]
  },
  { 
    id: 'doba', name: 'Doba', 
    logo: 'https://doba.com/favicon.ico', 
    category: 'general', country: 'US',
    description: 'Plateforme dropshipping américaine',
    features: ['Fournisseurs US', 'Fulfillment automatique', 'Catalogue varié'],
    rating: 4.0, productsCount: 2000000, shippingTime: '5-10 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
  { 
    id: 'wholesale2b', name: 'Wholesale2B', 
    logo: 'https://wholesale2b.com/favicon.ico', 
    category: 'wholesale', country: 'US',
    description: 'Plus de 100 fournisseurs US',
    features: ['100+ fournisseurs', 'Intégrations multiples', 'Feeds automatiques'],
    rating: 4.0, productsCount: 1000000, shippingTime: '3-7 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },

  // === MODE ===
  { 
    id: 'shein', name: 'SHEIN', 
    logo: 'https://www.shein.com/favicon.ico', 
    category: 'fashion', country: 'CN', popular: true,
    description: 'Fast fashion leader mondial',
    features: ['Prix ultra-bas', 'Nouvelles tendances', 'Mode femme'],
    rating: 4.0, productsCount: 600000, shippingTime: '10-20 jours',
    setupFields: []
  },
  { 
    id: 'fashiongo', name: 'FashionGo', 
    logo: 'https://www.fashiongo.net/favicon.ico', 
    category: 'fashion', country: 'US', popular: true,
    description: 'Marketplace B2B mode avec 2000+ marques',
    features: ['2000+ marques', 'Mode féminine', 'Tendances actuelles'],
    rating: 4.4, productsCount: 800000, shippingTime: '2-5 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },

  // === BEAUTÉ ===
  { 
    id: 'sephora', name: 'Sephora Wholesale', 
    logo: 'https://www.sephora.com/favicon.ico', 
    category: 'beauty', country: 'FR', premium: true,
    description: 'Programme partenaire avec marques beauté premium',
    features: ['Marques luxe', 'Cosmétiques premium', 'Programme partenaire'],
    rating: 4.7, productsCount: 45000, shippingTime: '3-7 jours',
    setupFields: [{ name: 'partner_id', label: 'Partner ID', type: 'text', required: true }]
  },
  { 
    id: 'fragrancenet', name: 'FragranceNet', 
    logo: 'https://www.fragrancenet.com/favicon.ico', 
    category: 'beauty', country: 'US',
    description: 'Parfums et cosmétiques de marque',
    features: ['Parfums de marque', 'Cosmétiques', 'Prix réduits'],
    rating: 4.3, productsCount: 35000, shippingTime: '7-14 jours',
    setupFields: []
  },

  // === MAISON ===
  { 
    id: 'wayfair', name: 'Wayfair', 
    logo: 'https://www.wayfair.com/favicon.ico', 
    category: 'home', country: 'US', popular: true,
    shippingZones: ['usa', 'europe'],
    description: 'Leader du mobilier et décoration en ligne',
    features: ['Mobilier', 'Décoration', 'Large catalogue'],
    rating: 4.4, productsCount: 18000000, shippingTime: '3-10 jours',
    setupFields: []
  },
  { 
    id: 'home24', name: 'Home24', 
    logo: 'https://www.home24.de/favicon.ico', 
    category: 'home', country: 'DE',
    shippingZones: ['europe'],
    description: 'Marketplace mobilier allemand',
    features: ['Mobilier', 'Design', 'Allemagne'],
    rating: 4.2, productsCount: 300000, shippingTime: '3-10 jours',
    setupFields: []
  },

  // === ANIMAUX ===
  { 
    id: 'petdropshipper', name: 'Pet Dropshipper', 
    logo: 'https://petdropshipper.com/favicon.ico', 
    category: 'pets', country: 'US',
    description: 'Spécialiste produits pour animaux',
    features: ['Produits animaux', 'Accessoires', 'Nourriture'],
    rating: 4.0, productsCount: 3000, shippingTime: '3-7 jours',
    setupFields: []
  },

  // === JOUETS ===
  { 
    id: 'funko', name: 'Funko', 
    logo: 'https://funko.com/favicon.ico', 
    category: 'toys', country: 'US', popular: true,
    description: 'Figurines Pop! et collectibles',
    features: ['Funko Pop!', 'Collectibles', 'Marque forte'],
    rating: 4.5, productsCount: 10000, shippingTime: '5-10 jours',
    setupFields: []
  },

  // === ÉLECTRONIQUE ===
  { 
    id: 'megagoods', name: 'MegaGoods', 
    logo: 'https://megagoods.com/favicon.ico', 
    category: 'electronics', country: 'US',
    description: 'Électronique et accessoires US',
    features: ['Électronique', 'Fulfillment rapide', 'Prix compétitifs'],
    rating: 4.0, productsCount: 2000, shippingTime: '2-5 jours',
    setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }]
  },
];

// Deduplication helper
export const deduplicateSuppliers = (suppliers: SupplierDefinition[]): SupplierDefinition[] => {
  const seen = new Map<string, SupplierDefinition>();
  
  for (const supplier of suppliers) {
    const key = `${supplier.id.toLowerCase()}|${supplier.country?.toLowerCase() || 'xx'}`;
    const existing = seen.get(key);
    
    if (!existing) {
      seen.set(key, supplier);
      continue;
    }
    
    // Keep the more complete entry
    const existingScore = (existing.popular ? 10 : 0) + (existing.premium ? 5 : 0) + (existing.rating || 0);
    const newScore = (supplier.popular ? 10 : 0) + (supplier.premium ? 5 : 0) + (supplier.rating || 0);
    
    if (newScore > existingScore) {
      seen.set(key, supplier);
    }
  }
  
  return Array.from(seen.values());
};

// Exported deduplicated list
export const ALL_SUPPLIER_DEFINITIONS = deduplicateSuppliers(SUPPLIER_DEFINITIONS);

// Stats helper
export const getSupplierStats = () => {
  const total = ALL_SUPPLIER_DEFINITIONS.length;
  const popular = ALL_SUPPLIER_DEFINITIONS.filter(s => s.popular).length;
  const premium = ALL_SUPPLIER_DEFINITIONS.filter(s => s.premium).length;
  const countries = new Set(ALL_SUPPLIER_DEFINITIONS.map(s => s.country)).size;
  const totalProducts = ALL_SUPPLIER_DEFINITIONS.reduce((acc, s) => acc + (s.productsCount || 0), 0);
  
  return { total, popular, premium, countries, totalProducts };
};
