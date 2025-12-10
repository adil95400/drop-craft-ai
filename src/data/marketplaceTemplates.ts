// TEMPLATES MARKETPLACES ÉTENDUS
// Inclut Temu, Cdiscount, et autres marketplaces demandées

import type { BaseSupplier } from "@/types/suppliers";

export interface MarketplaceTemplate extends BaseSupplier {
  type: 'supplier' | 'marketplace' | 'platform';
  features: string[];
  integrationLevel: 'full' | 'partial' | 'manual';
  avgShippingDays?: number;
  minOrderValue?: number;
  commissionRate?: number;
}

export const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  // Marketplaces principales
  {
    id: "amazon",
    name: "Amazon",
    displayName: "Amazon Seller",
    description: "Le plus grand marketplace mondial avec des millions d'acheteurs actifs",
    category: "marketplace",
    type: "marketplace",
    logo: "",
    website: "https://sellercentral.amazon.com",
    country: "Global",
    status: "active",
    rating: 4.8,
    features: ["FBA", "Prime", "Advertising", "Brand Registry"],
    integrationLevel: "full",
    avgShippingDays: 2,
    commissionRate: 15
  },
  {
    id: "ebay",
    name: "eBay",
    displayName: "eBay",
    description: "Marketplace mondial pour ventes aux enchères et prix fixes",
    category: "marketplace",
    type: "marketplace",
    logo: "",
    website: "https://www.ebay.com",
    country: "Global",
    status: "active",
    rating: 4.5,
    features: ["Enchères", "Buy It Now", "eBay Plus"],
    integrationLevel: "full",
    avgShippingDays: 5,
    commissionRate: 12
  },
  {
    id: "temu",
    name: "Temu",
    displayName: "Temu",
    description: "Marketplace à croissance rapide avec prix ultra-compétitifs",
    category: "marketplace",
    type: "marketplace",
    logo: "",
    website: "https://www.temu.com",
    country: "China",
    status: "active",
    rating: 4.2,
    features: ["Prix bas", "Livraison directe", "App mobile"],
    integrationLevel: "partial",
    avgShippingDays: 10,
    commissionRate: 8
  },
  {
    id: "cdiscount",
    name: "Cdiscount",
    displayName: "Cdiscount",
    description: "Leader français du e-commerce avec forte audience locale",
    category: "marketplace",
    type: "marketplace",
    logo: "",
    website: "https://www.cdiscount.com",
    country: "France",
    status: "active",
    rating: 4.0,
    features: ["Cdiscount à volonté", "Express", "Marketplace"],
    integrationLevel: "full",
    avgShippingDays: 3,
    commissionRate: 14
  },
  {
    id: "etsy",
    name: "Etsy",
    displayName: "Etsy",
    description: "Marketplace pour produits artisanaux et créatifs",
    category: "marketplace",
    type: "marketplace",
    logo: "",
    website: "https://www.etsy.com",
    country: "United States",
    status: "active",
    rating: 4.6,
    features: ["Artisanat", "Vintage", "Personnalisation"],
    integrationLevel: "full",
    avgShippingDays: 7,
    commissionRate: 6.5
  },
  {
    id: "rakuten",
    name: "Rakuten",
    displayName: "Rakuten France",
    description: "Marketplace française avec programme de fidélité Superbons",
    category: "marketplace",
    type: "marketplace",
    logo: "",
    website: "https://fr.shopping.rakuten.com",
    country: "France",
    status: "active",
    rating: 4.1,
    features: ["Superbons", "Club R", "Occasion"],
    integrationLevel: "full",
    avgShippingDays: 4,
    commissionRate: 11
  },
  {
    id: "fnac",
    name: "Fnac",
    displayName: "Fnac Marketplace",
    description: "Marketplace culturel et high-tech de référence en France",
    category: "marketplace",
    type: "marketplace",
    logo: "",
    website: "https://www.fnac.com",
    country: "France",
    status: "active",
    rating: 4.3,
    features: ["Click & Collect", "Adhérents", "Culture"],
    integrationLevel: "full",
    avgShippingDays: 3,
    commissionRate: 13
  },
  {
    id: "tiktok-shop",
    name: "TikTok Shop",
    displayName: "TikTok Shop",
    description: "Vente sociale intégrée à la plateforme TikTok",
    category: "marketplace",
    type: "marketplace",
    logo: "",
    website: "https://shop.tiktok.com",
    country: "Global",
    status: "active",
    rating: 4.4,
    features: ["Live Shopping", "Vidéos", "Influenceurs"],
    integrationLevel: "partial",
    avgShippingDays: 7,
    commissionRate: 5
  },
  {
    id: "google-shopping",
    name: "Google Shopping",
    displayName: "Google Shopping",
    description: "Comparateur de prix et annonces shopping de Google",
    category: "marketplace",
    type: "platform",
    logo: "",
    website: "https://merchants.google.com",
    country: "Global",
    status: "active",
    rating: 4.7,
    features: ["Shopping Ads", "Free Listings", "Buy on Google"],
    integrationLevel: "full"
  },
  {
    id: "meta-commerce",
    name: "Meta Commerce",
    displayName: "Meta Commerce",
    description: "Vente sur Facebook et Instagram Shops",
    category: "marketplace",
    type: "platform",
    logo: "",
    website: "https://business.facebook.com",
    country: "Global",
    status: "active",
    rating: 4.3,
    features: ["Facebook Shop", "Instagram Shop", "Checkout"],
    integrationLevel: "full"
  },

  // Fournisseurs Dropshipping
  {
    id: "aliexpress",
    name: "AliExpress",
    displayName: "AliExpress",
    description: "Plateforme mondiale de dropshipping avec des millions de produits",
    category: "dropshipping",
    type: "supplier",
    logo: "",
    website: "https://www.aliexpress.com",
    country: "China",
    status: "active",
    rating: 4.2,
    features: ["Dropshipping", "Prix bas", "Large catalogue"],
    integrationLevel: "full",
    avgShippingDays: 15,
    minOrderValue: 0
  },
  {
    id: "cjdropshipping",
    name: "CJ Dropshipping",
    displayName: "CJ Dropshipping",
    description: "Plateforme tout-en-un: sourcing, warehousing et fulfillment",
    category: "dropshipping",
    type: "supplier",
    logo: "",
    website: "https://cjdropshipping.com",
    country: "China",
    status: "active",
    rating: 4.5,
    features: ["Entrepôts US/EU", "POD", "Branding"],
    integrationLevel: "full",
    avgShippingDays: 8,
    minOrderValue: 0
  },
  {
    id: "bigbuy",
    name: "BigBuy",
    displayName: "BigBuy",
    description: "Leader européen du dropshipping B2B avec 100 000+ produits",
    category: "wholesale",
    type: "supplier",
    logo: "",
    website: "https://www.bigbuy.eu",
    country: "Spain",
    status: "active",
    rating: 4.5,
    features: ["EU Shipping", "Multi-langues", "API"],
    integrationLevel: "full",
    avgShippingDays: 3,
    minOrderValue: 0
  },
  {
    id: "spocket",
    name: "Spocket",
    displayName: "Spocket",
    description: "Dropshipping de produits US et EU avec expédition rapide",
    category: "dropshipping",
    type: "supplier",
    logo: "",
    website: "https://www.spocket.co",
    country: "United States",
    status: "active",
    rating: 4.3,
    features: ["US/EU Suppliers", "Fast Shipping", "Branded Invoicing"],
    integrationLevel: "full",
    avgShippingDays: 5,
    minOrderValue: 0
  },
  {
    id: "printful",
    name: "Printful",
    displayName: "Printful",
    description: "Leader du print-on-demand avec impression et expédition automatisées",
    category: "print-on-demand",
    type: "supplier",
    logo: "",
    website: "https://www.printful.com",
    country: "United States",
    status: "active",
    rating: 4.7,
    features: ["POD", "Mockup Generator", "Branding"],
    integrationLevel: "full",
    avgShippingDays: 5,
    minOrderValue: 0
  },

  // Plateformes E-commerce
  {
    id: "shopify",
    name: "Shopify",
    displayName: "Shopify",
    description: "Plateforme e-commerce leader pour créer votre boutique",
    category: "platform",
    type: "platform",
    logo: "",
    website: "https://www.shopify.com",
    country: "Canada",
    status: "active",
    rating: 4.8,
    features: ["Themes", "Apps", "Payments"],
    integrationLevel: "full"
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    displayName: "WooCommerce",
    description: "Plugin e-commerce open-source pour WordPress",
    category: "platform",
    type: "platform",
    logo: "",
    website: "https://woocommerce.com",
    country: "United States",
    status: "active",
    rating: 4.5,
    features: ["WordPress", "Extensions", "Open Source"],
    integrationLevel: "full"
  },
  {
    id: "prestashop",
    name: "PrestaShop",
    displayName: "PrestaShop",
    description: "Solution e-commerce européenne open-source",
    category: "platform",
    type: "platform",
    logo: "",
    website: "https://www.prestashop.com",
    country: "France",
    status: "active",
    rating: 4.2,
    features: ["Open Source", "Modules", "Multi-boutique"],
    integrationLevel: "full"
  },
];

// Helper pour obtenir les marketplaces par type
export const getMarketplacesByType = (type: 'supplier' | 'marketplace' | 'platform') => {
  return MARKETPLACE_TEMPLATES.filter(m => m.type === type);
};

// Helper pour obtenir toutes les catégories uniques
export const getUniqueCategories = () => {
  return Array.from(new Set(MARKETPLACE_TEMPLATES.map(m => m.category)));
};
