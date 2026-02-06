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
  section?: string;
  sectionEn?: string;
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
  // ── Importation & Recherche ──
  {
    key: 'product_import',
    labelFr: 'Importateur de produits',
    labelEn: 'Product Importer',
    tooltip: 'Import en masse depuis les marketplaces',
    section: '📦 Importation & Recherche',
    sectionEn: '📦 Importing & Research',
    standard: '200 produits',
    pro: '500 produits',
    ultra_pro: '1K+ produits',
  },
  {
    key: 'winning_products',
    labelFr: 'Produits Gagnants',
    labelEn: 'Winning Products',
    tooltip: 'Découvrez les produits tendance à fort potentiel',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'ads_spy',
    labelFr: 'Veille Concurrentielle (Ads Spy)',
    labelEn: 'Competitive Intelligence (Ads Spy)',
    tooltip: 'Analysez les publicités de vos concurrents',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'supplier_search',
    labelFr: 'Recherche Fournisseurs',
    labelEn: 'Supplier Search',
    tooltip: 'Trouvez les meilleurs fournisseurs pour vos produits',
    standard: 'Basique',
    pro: 'Avancée',
    ultra_pro: 'Illimitée',
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
  // ── Catalogue & Produits ──
  {
    key: 'product_editing',
    labelFr: 'Édition de produit complet',
    labelEn: 'Full Product Editor',
    tooltip: 'Édition rapide des titres, descriptions, images',
    section: '🏷️ Catalogue & Produits',
    sectionEn: '🏷️ Catalog & Products',
    standard: true,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'draft_manager',
    labelFr: 'Gestionnaire de Brouillons',
    labelEn: 'Draft Manager (Backlog)',
    tooltip: 'Organisez vos produits en attente de publication',
    standard: true,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'variant_management',
    labelFr: 'Gestion des Variantes',
    labelEn: 'Variant Management',
    tooltip: 'Gérez tailles, couleurs et options de vos produits',
    standard: true,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'image_editor',
    labelFr: 'Éditeur d\'Images et Médias',
    labelEn: 'Image & Media Editor',
    tooltip: 'Retouchez et optimisez vos visuels produits',
    standard: 'Basique',
    pro: 'IA incluse',
    ultra_pro: 'IA Premium',
  },
  {
    key: 'attributes_enrichment',
    labelFr: 'Attributs et Enrichissement',
    labelEn: 'Attributes & Enrichment',
    tooltip: 'Enrichissez automatiquement vos fiches produits',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'categories_brands',
    labelFr: 'Catégories et Marques',
    labelEn: 'Categories & Brands',
    tooltip: 'Organisez vos produits par catégories et marques',
    standard: true,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'catalog_health',
    labelFr: 'Score de Santé Catalogue',
    labelEn: 'Catalog Health Score',
    tooltip: 'Évaluez et améliorez la qualité de votre catalogue',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  // ── Ventes & Automatisation ──
  {
    key: 'order_management',
    labelFr: 'Gestion des commandes',
    labelEn: 'Order Management',
    tooltip: 'Traitement automatique ou guidé des commandes',
    section: '⚡ Ventes & Automatisation',
    sectionEn: '⚡ Sales & Automation',
    standard: true,
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
    key: 'auto_tracking',
    labelFr: 'Suivi Automatique (Tracking)',
    labelEn: 'Automatic Tracking',
    tooltip: 'Mises à jour automatiques du suivi de livraison',
    standard: 'Manuel',
    pro: 'Auto',
    ultra_pro: 'Temps réel',
  },
  {
    key: 'stock_management',
    labelFr: 'Gestion du Stock',
    labelEn: 'Stock Management',
    tooltip: 'Synchronisation et alertes de stock automatisées',
    standard: 'Alertes',
    pro: 'Auto-restock',
    ultra_pro: 'Prédictif',
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
    key: 'price_monitor',
    labelFr: 'Moniteur de prix & stock',
    labelEn: 'Price & Stock Monitor',
    tooltip: 'Surveillance automatisée des prix et des stocks',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'crm_pipeline',
    labelFr: 'CRM et Pipeline',
    labelEn: 'CRM & Pipeline',
    tooltip: 'Gérez vos prospects et clients dans un pipeline visuel',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'multi_channel_feeds',
    labelFr: 'Feeds Multi-canaux (Google, Meta)',
    labelEn: 'Multi-Channel Feeds (Google, Meta)',
    tooltip: 'Diffusez vos produits sur plusieurs canaux de vente',
    standard: '1 feed',
    pro: '5 feeds',
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
  // ── Intelligence Artificielle & Marketing ──
  {
    key: 'ai',
    labelFr: 'Intelligence Artificielle',
    labelEn: 'Artificial Intelligence',
    tooltip: 'Suggestion de produits et prix optimaux par IA',
    section: '🤖 IA & Marketing',
    sectionEn: '🤖 AI & Marketing',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'marketing_automation',
    labelFr: 'Marketing Automation',
    labelEn: 'Marketing Automation',
    tooltip: 'Campagnes automatisées et relances clients',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'seo_optimization',
    labelFr: 'SEO Optimisation',
    labelEn: 'SEO Optimization',
    tooltip: 'Optimisez le référencement de vos fiches produits',
    standard: 'Basique',
    pro: 'Avancée',
    ultra_pro: 'IA Premium',
  },
  {
    key: 'analytics',
    labelFr: 'Analytics avancés',
    labelEn: 'Advanced Analytics',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  // ── Configuration & Extras ──
  {
    key: 'address_extension',
    labelFr: 'Extension Copier/Coller Adresses',
    labelEn: 'Address Copy/Paste Extension',
    tooltip: 'Copiez les adresses client en un clic',
    section: '🔧 Configuration & Extras',
    sectionEn: '🔧 Configuration & Extras',
    standard: false,
    pro: true,
    ultra_pro: true,
  },
  {
    key: 'academy',
    labelFr: 'ShopOpti Academy',
    labelEn: 'ShopOpti Academy',
    tooltip: 'Formations et ressources pour réussir en dropshipping',
    standard: 'Vidéos',
    pro: '+ Certifications',
    ultra_pro: '+ Coaching',
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
