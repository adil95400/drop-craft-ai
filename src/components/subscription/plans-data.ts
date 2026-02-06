/**
 * Subscription plans configuration for the Choose Plan page
 * Maps to real Stripe price IDs from stripe-config.ts
 */

export interface PlanFeatureRow {
  key: string;
  labelFr: string;
  labelEn: string;
  tooltip?: string;
  standard: string | boolean;
  pro: string | boolean;
  ultra_pro: string | boolean;
}

export interface PlanInfo {
  id: 'standard' | 'pro' | 'ultra_pro';
  nameFr: string;
  nameEn: string;
  subtitleFr: string;
  subtitleEn: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  promoFirstMonth: number;
  popular?: boolean;
  stores: number;
  annualSavings: number;
  descriptionFr: string;
  descriptionEn: string;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'standard',
    nameFr: 'Standard 200',
    nameEn: 'Standard 200',
    subtitleFr: 'Importateur de base',
    subtitleEn: 'Basic importer',
    monthlyPrice: 29,
    annualPrice: 19,
    currency: '€',
    promoFirstMonth: 0.99,
    stores: 1,
    annualSavings: 120,
    descriptionFr: 'Nos fonctionnalités d\'automatisation les plus basiques.',
    descriptionEn: 'Our most basic automation features.',
  },
  {
    id: 'pro',
    nameFr: 'Pro 500',
    nameEn: 'Pro 500',
    subtitleFr: 'Solution complète',
    subtitleEn: 'Complete solution',
    monthlyPrice: 49,
    annualPrice: 35,
    currency: '€',
    promoFirstMonth: 0.99,
    popular: true,
    stores: 5,
    annualSavings: 168,
    descriptionFr: 'Une solution dropshipping complète, idéale pour les débutants qui créent une boutique.',
    descriptionEn: 'A complete dropshipping solution, ideal for beginners creating a store.',
  },
  {
    id: 'ultra_pro',
    nameFr: 'Ultra Pro 1K',
    nameEn: 'Ultra Pro 1K',
    subtitleFr: 'Pour les experts',
    subtitleEn: 'For experts',
    monthlyPrice: 99,
    annualPrice: 75,
    currency: '€',
    promoFirstMonth: 0.99,
    stores: -1, // unlimited
    annualSavings: 288,
    descriptionFr: 'Pour les dropshippers expérimentés qui ont besoin de plus de produits et d\'une assistance rapide.',
    descriptionEn: 'For experienced dropshippers who need more products and faster support.',
  },
];

export const FEATURE_ROWS: PlanFeatureRow[] = [
  {
    key: 'product_import',
    labelFr: 'Importateur de produits',
    labelEn: 'Product Importer',
    tooltip: 'Import en masse depuis les marketplaces',
    standard: '200 produits',
    pro: '500 produits',
    ultra_pro: '1K+ produits',
  },
  {
    key: 'price_monitor',
    labelFr: 'Moniteur de prix & stock',
    labelEn: 'Price & Stock Monitor',
    tooltip: 'Surveillance automatisée des prix et des stocks',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'ai',
    labelFr: 'Intelligence Artificielle',
    labelEn: 'Artificial Intelligence',
    tooltip: 'Suggestion de produits et prix optimaux par IA',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'order_management',
    labelFr: 'Gestion des commandes',
    labelEn: 'Order Management',
    tooltip: 'Traitement automatique ou guidé des commandes',
    standard: true,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'browser_extension',
    labelFr: 'Extension navigateur',
    labelEn: 'Browser Extension',
    tooltip: 'Plugin pour l\'import depuis le site marchand',
    standard: true,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'product_editing',
    labelFr: 'Édition de produit complet',
    labelEn: 'Full Product Editor',
    tooltip: 'Édition rapide des titres, descriptions, images',
    standard: true,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'smart_rules',
    labelFr: 'Règles intelligentes',
    labelEn: 'Smart Rules',
    tooltip: 'Modification automatique de prix, stock, titres',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'auto_orders',
    labelFr: 'Commandes automatiques',
    labelEn: 'Automatic Orders',
    standard: '10/jour',
    pro: '100/jour',
    ultra_pro: 'Illimité',
  },
  {
    key: 'multi_store',
    labelFr: 'Multi-boutiques',
    labelEn: 'Multi-Store',
    standard: '1 boutique',
    pro: '5 boutiques',
    ultra_pro: 'Illimité',
  },
  {
    key: 'analytics',
    labelFr: 'Analytics avancés',
    labelEn: 'Advanced Analytics',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'white_label',
    labelFr: 'White-label',
    labelEn: 'White-label',
    standard: false,
    pro: false,
    ultra_pro: true,
  },
  {
    key: 'api_access',
    labelFr: 'Accès API complète',
    labelEn: 'Full API Access',
    standard: false,
    pro: false,
    ultra_pro: true,
  },
  {
    key: 'support',
    labelFr: 'Support & tutoriels',
    labelEn: 'Support & Tutorials',
    tooltip: 'Accès à l\'académie Shopopti et support dédié',
    standard: 'Email',
    pro: 'Prioritaire',
    ultra_pro: 'Dédié 24/7',
  },
];
