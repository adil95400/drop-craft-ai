/**
 * Nouveaux connecteurs Phase 2
 * Walmart, TikTok Shop, PrestaShop, Rakuten + autres
 */

export interface MarketplaceConnector {
  id: string
  name: string
  platform_type: string
  logo_url?: string
  description: string
  features: string[]
  api_version?: string
  documentation_url?: string
  requires_approval: boolean
  supported_countries: string[]
  commission_structure?: {
    type: 'percentage' | 'fixed'
    value: number
    currency?: string
  }
}

export const PHASE2_CONNECTORS: MarketplaceConnector[] = [
  {
    id: 'walmart',
    name: 'Walmart Marketplace',
    platform_type: 'marketplace',
    logo_url: '/connectors/walmart.svg',
    description: 'Leader du retail US avec 110M+ visiteurs/mois',
    features: ['API robuste', 'Fulfillment WFS', 'Buy Box', 'Analytics avancés'],
    api_version: '3.0',
    documentation_url: 'https://developer.walmart.com/',
    requires_approval: true,
    supported_countries: ['US', 'CA', 'MX'],
    commission_structure: {
      type: 'percentage',
      value: 15
    }
  },
  {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    platform_type: 'social_commerce',
    logo_url: '/connectors/tiktok.svg',
    description: 'E-commerce social en hyper-croissance, public jeune',
    features: ['Live Shopping', 'Vidéos produits', 'Influencer partnerships', 'In-app checkout'],
    api_version: '2.0',
    documentation_url: 'https://partner.tiktokshop.com/dev',
    requires_approval: true,
    supported_countries: ['US', 'UK', 'FR', 'DE', 'ES', 'IT', 'TH', 'VN', 'MY', 'PH'],
    commission_structure: {
      type: 'percentage',
      value: 8
    }
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    platform_type: 'cms',
    logo_url: '/connectors/prestashop.svg',
    description: 'CMS e-commerce open-source populaire en Europe',
    features: ['Modules', 'Thèmes', 'Multi-boutique', 'Multi-langue'],
    api_version: 'REST',
    documentation_url: 'https://devdocs.prestashop.com/',
    requires_approval: false,
    supported_countries: ['ALL'],
    commission_structure: {
      type: 'fixed',
      value: 0,
      currency: 'EUR'
    }
  },
  {
    id: 'rakuten',
    name: 'Rakuten',
    platform_type: 'marketplace',
    logo_url: '/connectors/rakuten.svg',
    description: 'Marketplace japonaise/européenne avec cashback',
    features: ['Cashback', 'Programme fidélité', 'Multi-pays', 'Support 24/7'],
    api_version: '2.0',
    documentation_url: 'https://api.rakuten.com/',
    requires_approval: true,
    supported_countries: ['JP', 'FR', 'DE', 'ES', 'UK', 'IT'],
    commission_structure: {
      type: 'percentage',
      value: 12
    }
  },
  {
    id: 'wish',
    name: 'Wish',
    platform_type: 'marketplace',
    logo_url: '/connectors/wish.svg',
    description: 'Marketplace discount, fort volume international',
    features: ['ProductBoost', 'Express shipping', 'Global reach', 'Price point $1-50'],
    api_version: '2.0',
    documentation_url: 'https://merchant.wish.com/documentation/api',
    requires_approval: true,
    supported_countries: ['US', 'EU', 'CA', 'AU', 'UK', 'BR'],
    commission_structure: {
      type: 'percentage',
      value: 15
    }
  },
  {
    id: 'kaufland',
    name: 'Kaufland Marketplace',
    platform_type: 'marketplace',
    logo_url: '/connectors/kaufland.svg',
    description: 'Marketplace allemande en expansion (DACH + CEE)',
    features: ['Fulfillment', 'Cross-border', 'Niche categories', 'Low competition'],
    api_version: '1.0',
    documentation_url: 'https://www.kaufland.de/api/',
    requires_approval: true,
    supported_countries: ['DE', 'AT', 'CZ', 'SK', 'PL', 'RO'],
    commission_structure: {
      type: 'percentage',
      value: 10
    }
  },
  {
    id: 'bol',
    name: 'Bol.com',
    platform_type: 'marketplace',
    logo_url: '/connectors/bol.svg',
    description: 'Leader e-commerce Benelux, forte fidélité client',
    features: ['LVB Fulfillment', 'Premium placement', 'Select badge', 'Analytics'],
    api_version: '7.0',
    documentation_url: 'https://api.bol.com/',
    requires_approval: true,
    supported_countries: ['NL', 'BE'],
    commission_structure: {
      type: 'percentage',
      value: 12
    }
  },
  {
    id: 'allegro',
    name: 'Allegro',
    platform_type: 'marketplace',
    logo_url: '/connectors/allegro.svg',
    description: 'Leader e-commerce Pologne, 20M+ utilisateurs',
    features: ['Smart Delivery', 'Allegro Fulfillment', 'Allegro Ads', 'Allegro Coins'],
    api_version: '2.0',
    documentation_url: 'https://developer.allegro.pl/',
    requires_approval: true,
    supported_countries: ['PL', 'CZ', 'SK'],
    commission_structure: {
      type: 'percentage',
      value: 9
    }
  },
  {
    id: 'magento',
    name: 'Adobe Commerce (Magento)',
    platform_type: 'cms',
    logo_url: '/connectors/magento.svg',
    description: 'Plateforme enterprise e-commerce pour grandes marques',
    features: ['Multi-store', 'B2B', 'Advanced inventory', 'Extensible'],
    api_version: '2.4',
    documentation_url: 'https://developer.adobe.com/commerce/',
    requires_approval: false,
    supported_countries: ['ALL'],
    commission_structure: {
      type: 'fixed',
      value: 0
    }
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    platform_type: 'cms',
    logo_url: '/connectors/woocommerce.svg',
    description: 'Plugin WordPress pour e-commerce, 30% du marché',
    features: ['WordPress integration', 'Extensions', 'Flexible', 'Open source'],
    api_version: 'REST v3',
    documentation_url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
    requires_approval: false,
    supported_countries: ['ALL'],
    commission_structure: {
      type: 'fixed',
      value: 0
    }
  },
  {
    id: 'zalando',
    name: 'Zalando',
    platform_type: 'marketplace',
    logo_url: '/connectors/zalando.svg',
    description: 'Leader mode européenne, 50M+ clients actifs',
    features: ['Zalando Fulfillment', 'Premium fashion', 'Returns handling', 'Marketing support'],
    api_version: '1.0',
    documentation_url: 'https://partner.zalando.com/',
    requires_approval: true,
    supported_countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'CH', 'SE', 'FI', 'DK', 'NO'],
    commission_structure: {
      type: 'percentage',
      value: 20
    }
  },
  {
    id: 'otto',
    name: 'OTTO Market',
    platform_type: 'marketplace',
    logo_url: '/connectors/otto.svg',
    description: 'Marketplace allemande #2, focus lifestyle & home',
    features: ['Fulfillment partner', 'Marketing tools', 'Product recommendations', 'Analytics'],
    api_version: '2.0',
    documentation_url: 'https://api.otto.market/',
    requires_approval: true,
    supported_countries: ['DE', 'AT'],
    commission_structure: {
      type: 'percentage',
      value: 14
    }
  },
  {
    id: 'fnac_darty',
    name: 'Fnac Darty Marketplace',
    platform_type: 'marketplace',
    logo_url: '/connectors/fnac.svg',
    description: 'Marketplace française culture, tech, électroménager',
    features: ['Forte notoriété France', 'Adhésion marketplace', 'Support vendeurs', 'Click & collect'],
    api_version: '1.0',
    documentation_url: 'https://developer.fnacdarty.com/',
    requires_approval: true,
    supported_countries: ['FR', 'BE', 'ES', 'PT'],
    commission_structure: {
      type: 'percentage',
      value: 13
    }
  },
  {
    id: 'mercadolibre',
    name: 'MercadoLibre',
    platform_type: 'marketplace',
    logo_url: '/connectors/mercadolibre.svg',
    description: 'Leader e-commerce Amérique Latine, 80M+ utilisateurs',
    features: ['Mercado Envios', 'Mercado Pago', 'MercadoLibre Ads', 'Cross-border'],
    api_version: '2.0',
    documentation_url: 'https://developers.mercadolibre.com/',
    requires_approval: true,
    supported_countries: ['AR', 'BR', 'MX', 'CL', 'CO', 'VE', 'PE', 'UY'],
    commission_structure: {
      type: 'percentage',
      value: 16
    }
  },
  {
    id: 'lazada',
    name: 'Lazada',
    platform_type: 'marketplace',
    logo_url: '/connectors/lazada.svg',
    description: 'Leader e-commerce Asie du Sud-Est (Alibaba Group)',
    features: ['Lazada Fulfillment', 'LazMall', 'Live streaming', 'Cross-border program'],
    api_version: '2.0',
    documentation_url: 'https://open.lazada.com/',
    requires_approval: true,
    supported_countries: ['SG', 'MY', 'TH', 'PH', 'ID', 'VN'],
    commission_structure: {
      type: 'percentage',
      value: 8
    }
  },
  {
    id: 'shopee',
    name: 'Shopee',
    platform_type: 'marketplace',
    logo_url: '/connectors/shopee.svg',
    description: 'Marketplace #1 Asie du Sud-Est, gamification shopping',
    features: ['Shopee Fulfillment', 'Shopee Live', 'In-app games', 'Social features'],
    api_version: '2.0',
    documentation_url: 'https://open.shopee.com/',
    requires_approval: true,
    supported_countries: ['SG', 'MY', 'TH', 'TW', 'PH', 'ID', 'VN', 'BR', 'MX', 'CO', 'CL'],
    commission_structure: {
      type: 'percentage',
      value: 7
    }
  }
]
