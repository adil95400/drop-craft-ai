import type { PlanType } from '@/lib/unified-plan-system';

/**
 * Navigation PRO - 10 pôles métier
 * Structure alignée sur les standards e-commerce (Shopify-like)
 * 
 * ARCHITECTURE:
 * 1. Tableau de bord  : Dashboard & Notifications
 * 2. Catalogue        : Produits, Catégories, Fournisseurs, Variantes, Import, Dropshipping
 * 3. Commandes        : Commandes, Expéditions, Retours, Stock
 * 4. Clients          : CRM, Base clients, Avis, Fidélité
 * 5. Marketing        : Campagnes, SEO, Publicité, Promotions
 * 6. Automatisation   : Scénarios IA, Monitoring, Règles, Tarification
 * 7. Extensions       : Marketplace, Intégrations, Boutiques, Flux
 * 8. Rapports         : Analytics, Qualité, Rapports, Calculateur
 * 9. Paramètres       : Profil, Abonnement, Réglages, Admin
 * 10. Aide            : Académie, Support, Documentation
 */

// =============================================================================
// TYPES
// =============================================================================

export type NavGroupId =
  | 'dashboard'       // Tableau de bord
  | 'catalog'         // Catalogue / Produits
  | 'orders'          // Commandes & Expéditions
  | 'customers'       // Clients / CRM
  | 'marketing'       // Marketing & Ventes
  | 'automation'      // Automatisation / Workflows
  | 'integrations'    // Extensions & Intégrations
  | 'reports'         // Rapports & Analyses
  | 'settings'        // Paramètres & Administration
  | 'help';           // Aide & Support

export interface NavGroupConfig {
  id: NavGroupId;
  label: string;
  icon: string;
  order: number;
  description?: string;
}

export interface SubModule {
  id: string;
  name: string;
  route: string;
  icon: string;
  description: string;
  features: string[];
  order: number;
}

export interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  minPlan: PlanType;
  route: string;
  features: string[];
  description: string;
  category: 'core' | 'product' | 'learning' | 'analytics' | 'automation' | 'customer' | 'enterprise' | 'integrations' | 'system';
  subModules?: SubModule[];
  order: number;
  groupId: NavGroupId;
  badge?: 'new' | 'beta' | 'pro' | 'ultra';
  /** Module en développement - affiché grisé dans la sidebar */
  comingSoon?: boolean;
}

// =============================================================================
// GROUPES DE NAVIGATION (10 pôles métier)
// =============================================================================

export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'dashboard',    label: 'Tableau de bord',          icon: 'LayoutDashboard', order: 1,  description: 'Vue d\'ensemble & alertes' },
  { id: 'catalog',      label: 'Catalogue',                icon: 'Package',         order: 2,  description: 'Produits & fournisseurs' },
  { id: 'orders',       label: 'Commandes & Expéditions',  icon: 'ShoppingCart',    order: 3,  description: 'Commandes, livraisons & stock' },
  { id: 'customers',    label: 'Clients',                  icon: 'Users',           order: 4,  description: 'CRM, fidélité & avis' },
  { id: 'marketing',    label: 'Marketing & Ventes',       icon: 'Megaphone',       order: 5,  description: 'Campagnes, SEO & promotions' },
  { id: 'automation',   label: 'Automatisation',           icon: 'Zap',             order: 6,  description: 'Scénarios IA & workflows' },
  { id: 'integrations', label: 'Extensions & Intégrations',icon: 'Plug',            order: 7,  description: 'Boutiques, flux & connecteurs' },
  { id: 'reports',      label: 'Rapports & Analyses',      icon: 'BarChart3',       order: 8,  description: 'Statistiques & audit' },
  { id: 'settings',     label: 'Paramètres',               icon: 'Settings',        order: 9,  description: 'Configuration & administration' },
  { id: 'help',         label: 'Aide & Support',           icon: 'HelpCircle',      order: 10, description: 'Formation, support & docs' },
];

// =============================================================================
// MODULE_REGISTRY - Réorganisé en 10 pôles métier
// =============================================================================

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. TABLEAU DE BORD
  // ═══════════════════════════════════════════════════════════════════════════
  
  dashboard: {
    id: 'dashboard',
    name: 'Vue d\'ensemble',
    icon: 'LayoutDashboard',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard',
    features: ['overview', 'quick-stats', 'recent-activity', 'widgets', 'shortcuts', 'quick-actions', 'kpi-cards'],
    description: 'Indicateurs clés, alertes et recommandations IA',
    category: 'core',
    order: 1,
    groupId: 'dashboard'
  },

  notifications: {
    id: 'notifications',
    name: 'Notifications',
    icon: 'Bell',
    enabled: true,
    minPlan: 'standard',
    route: '/notifications',
    features: ['alerts', 'messages'],
    description: 'Alertes et fil d\'actualités',
    category: 'core',
    order: 2,
    groupId: 'dashboard'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CATALOGUE / PRODUITS
  // ═══════════════════════════════════════════════════════════════════════════
  
  products: {
    id: 'products',
    name: 'Produits',
    icon: 'Package',
    enabled: true,
    minPlan: 'standard',
    route: '/products',
    features: ['command-center', 'ai-priority', 'bulk-actions', 'prescriptive-badges'],
    description: 'Création, importation et modifications en masse',
    category: 'product',
    order: 1,
    groupId: 'catalog'
  },

  categoriesBrands: {
    id: 'categoriesBrands',
    name: 'Catégories & Collections',
    icon: 'FolderTree',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/categories-brands',
    features: ['uncategorized', 'misclassified', 'missing-brand', 'ai-suggestions'],
    description: 'Organisation hiérarchique des produits',
    category: 'product',
    order: 2,
    groupId: 'catalog'
  },

  suppliers: {
    id: 'suppliers',
    name: 'Fournisseurs',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/suppliers',
    features: ['supplier-management', 'dropshipping', 'catalog-sync', 'marketplace-connect'],
    description: 'Suivi des partenaires et ajout de fournisseurs',
    category: 'product',
    order: 3,
    groupId: 'catalog',
    subModules: [
      { id: 'suppliers-overview', name: 'Vue d\'ensemble', route: '/suppliers', icon: 'LayoutDashboard', description: 'Dashboard fournisseurs', features: ['overview'], order: 1 },
      { id: 'suppliers-catalog', name: 'Catalogue Unifié', route: '/suppliers/catalog', icon: 'Package', description: 'Tous les produits', features: ['catalog'], order: 2 },
      { id: 'suppliers-engine', name: 'Moteur Avancé', route: '/suppliers/engine', icon: 'Zap', description: 'Auto-import & exécution', features: ['advanced'], order: 3 },
      { id: 'suppliers-my', name: 'Mes Fournisseurs', route: '/suppliers/my', icon: 'Truck', description: 'Fournisseurs connectés', features: ['list'], order: 4 },
      { id: 'suppliers-analytics', name: 'Statistiques', route: '/suppliers/analytics', icon: 'BarChart3', description: 'Performance fournisseurs', features: ['analytics'], order: 5 },
    ]
  },

  variants: {
    id: 'variants',
    name: 'Variantes & Attributs',
    icon: 'Layers',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/variants',
    features: ['variant-stock', 'variant-price', 'variant-sync', 'parent-inconsistencies'],
    description: 'Gestion des tailles, couleurs et options',
    category: 'product',
    order: 4,
    groupId: 'catalog'
  },

  attributes: {
    id: 'attributes',
    name: 'Attributs',
    icon: 'Tag',
    enabled: true,
    minPlan: 'pro',
    route: '/catalog/attributes',
    features: ['missing-attributes', 'normalization', 'marketplace-critical', 'ai-enrichment'],
    description: 'Enrichissement et normalisation des attributs',
    category: 'product',
    order: 5,
    groupId: 'catalog',
    badge: 'pro'
  },

  import: {
    id: 'import',
    name: 'Importation',
    icon: 'Upload',
    enabled: true,
    minPlan: 'standard',
    route: '/import',
    features: ['csv-import', 'url-import', 'api-import'],
    description: 'Importer des produits depuis plusieurs sources',
    category: 'product',
    order: 6,
    groupId: 'catalog'
  },

  catalogMedia: {
    id: 'catalogMedia',
    name: 'Médias',
    icon: 'Image',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/media',
    features: ['missing-images', 'non-compliant-images', 'missing-videos', 'ai-optimization'],
    description: 'Correction et optimisation des médias produits',
    category: 'product',
    order: 7,
    groupId: 'catalog'
  },

  toProcess: {
    id: 'toProcess',
    name: 'À traiter',
    icon: 'AlertCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/to-process',
    features: ['ai-priority-queue', 'bulk-actions', 'action-required', 'opportunities'],
    description: 'Actions requises et opportunités',
    category: 'product',
    order: 8,
    groupId: 'catalog'
  },

  catalogHealth: {
    id: 'catalogHealth',
    name: 'Santé du Catalogue',
    icon: 'HeartPulse',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/health',
    features: ['optimized-percentage', 'blocking-issues', 'global-score', 'evolution'],
    description: 'KPIs et score global du catalogue',
    category: 'product',
    order: 9,
    groupId: 'catalog'
  },

  productViews: {
    id: 'productViews',
    name: 'Vues Produits',
    icon: 'BookmarkCheck',
    enabled: true,
    minPlan: 'standard',
    route: '/products/views',
    features: ['saved-views', 'smart-filters', 'predefined-views'],
    description: 'Filtres prédéfinis et vues enregistrées',
    category: 'product',
    order: 10,
    groupId: 'catalog'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. COMMANDES & EXPÉDITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  orders: {
    id: 'orders',
    name: 'Commandes',
    icon: 'ShoppingCart',
    enabled: true,
    minPlan: 'standard',
    route: '/orders',
    features: ['order-management', 'tracking', 'returns', 'fulfillment'],
    description: 'Liste, statuts et actions rapides',
    category: 'core',
    order: 1,
    groupId: 'orders',
    subModules: [
      { id: 'orders-all', name: 'Toutes les commandes', route: '/orders', icon: 'ShoppingCart', description: 'Liste complète', features: ['list'], order: 1 },
      { id: 'orders-create', name: 'Créer', route: '/orders/create', icon: 'Plus', description: 'Nouvelle commande', features: ['create'], order: 2 },
      { id: 'orders-bulk', name: 'Commandes en masse', route: '/orders/bulk', icon: 'Layers', description: 'Gestion par lot', features: ['bulk'], order: 3 },
      { id: 'orders-fulfillment', name: 'Exécution & Expéditions', route: '/orders/fulfillment', icon: 'PackageCheck', description: 'Étiquettes, suivi, transporteurs & retours', features: ['fulfillment', 'carriers', 'rules', 'returns', 'tracking', 'notifications'], order: 4 },
    ]
  },

  inventory: {
    id: 'inventory',
    name: 'Stock',
    icon: 'Boxes',
    enabled: true,
    minPlan: 'standard',
    route: '/stock',
    features: ['stock-alerts', 'restock'],
    description: 'Alertes de stock et réapprovisionnement',
    category: 'product',
    order: 2,
    groupId: 'orders'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CLIENTS / CRM
  // ═══════════════════════════════════════════════════════════════════════════
  
  customers: {
    id: 'customers',
    name: 'Base Clients',
    icon: 'Users',
    enabled: true,
    minPlan: 'standard',
    route: '/customers',
    features: ['customer-management', 'segmentation'],
    description: 'Fiches détaillées, segmentation et historique',
    category: 'customer',
    order: 1,
    groupId: 'customers',
    subModules: [
      { id: 'customers-all', name: 'Tous les clients', route: '/customers', icon: 'Users', description: 'Liste clients', features: ['list'], order: 1 },
      { id: 'customers-segmentation', name: 'Segmentation', route: '/customers/segmentation', icon: 'PieChart', description: 'Segmenter les clients', features: ['segmentation'], order: 2 },
    ]
  },

  crm: {
    id: 'crm',
    name: 'Service Client',
    icon: 'Contact',
    enabled: true,
    minPlan: 'pro',
    route: '/crm',
    features: ['leads', 'pipeline', 'contacts'],
    description: 'Messagerie, tickets et réponses IA',
    category: 'customer',
    order: 2,
    groupId: 'customers',
    badge: 'pro',
    subModules: [
      { id: 'crm-dashboard', name: 'Vue d\'ensemble', route: '/crm', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'crm-leads', name: 'Prospects', route: '/crm/leads', icon: 'UserPlus', description: 'Gestion des prospects', features: ['leads'], order: 2 },
      { id: 'crm-pipeline', name: 'Tunnel de ventes', route: '/crm/pipeline', icon: 'GitBranch', description: 'Tunnel de ventes', features: ['pipeline'], order: 3 },
      { id: 'crm-emails', name: 'E-mails', route: '/crm/emails', icon: 'Mail', description: 'Historique e-mails', features: ['emails'], order: 4 },
      { id: 'crm-scoring', name: 'Notation prospects', route: '/crm/scoring', icon: 'Target', description: 'Notation des prospects', features: ['scoring'], order: 5 },
    ]
  },

  reviews: {
    id: 'reviews',
    name: 'Avis Clients',
    icon: 'Star',
    enabled: true,
    minPlan: 'standard',
    route: '/reviews',
    features: ['review-management'],
    description: 'Gestion et modération des avis',
    category: 'customer',
    order: 3,
    groupId: 'customers'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MARKETING & VENTES
  // ═══════════════════════════════════════════════════════════════════════════

  marketing: {
    id: 'marketing',
    name: 'Campagnes',
    icon: 'Megaphone',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing',
    features: ['campaigns', 'email', 'promotions', 'abandoned-cart', 'loyalty'],
    description: 'E-mailing, SMS, notifications et segmentation',
    category: 'customer',
    order: 1,
    groupId: 'marketing',
    badge: 'pro',
    subModules: [
      { id: 'marketing-dashboard', name: 'Vue d\'ensemble', route: '/marketing', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'marketing-ads', name: 'Publicité', route: '/marketing/ads', icon: 'Megaphone', description: 'Création de campagnes pub', features: ['ads'], order: 2 },
      { id: 'marketing-email', name: 'E-mailing', route: '/marketing/email', icon: 'Mail', description: 'Marketing par e-mail', features: ['email'], order: 3 },
      { id: 'marketing-promotions', name: 'Promotions', route: '/marketing/promotions', icon: 'Tag', description: 'Codes promo et remises', features: ['coupons'], order: 4 },
      { id: 'marketing-abandoned', name: 'Paniers Abandonnés', route: '/marketing/abandoned-cart', icon: 'ShoppingCart', description: 'Récupération paniers', features: ['abandoned'], order: 5 },
      { id: 'marketing-loyalty', name: 'Fidélité', route: '/marketing/loyalty', icon: 'Award', description: 'Points, coupons et parrainage', features: ['loyalty'], order: 6 },
      { id: 'marketing-flash', name: 'Ventes Flash', route: '/marketing/flash-sales', icon: 'Zap', description: 'Ventes flash', features: ['flash-sales'], order: 7 },
      { id: 'marketing-social', name: 'Commerce Social', route: '/marketing/social-commerce', icon: 'Share2', description: 'Réseaux sociaux', features: ['social'], order: 8 },
      { id: 'marketing-affiliate', name: 'Affiliation', route: '/marketing/affiliate', icon: 'Users', description: 'Programme affiliés', features: ['affiliate'], order: 9 },
      { id: 'marketing-calendar', name: 'Calendrier', route: '/marketing/calendar', icon: 'Calendar', description: 'Planification campagnes', features: ['calendar'], order: 10 },
      { id: 'marketing-ab-testing', name: 'Tests A/B', route: '/marketing/ab-testing', icon: 'BarChart3', description: 'Tests A/B', features: ['ab-testing'], order: 11 },
      { id: 'marketing-content', name: 'Contenu IA', route: '/marketing/content-generation', icon: 'Sparkles', description: 'Génération de contenu', features: ['ai-content'], order: 12 },
    ]
  },

  seo: {
    id: 'seo',
    name: 'SEO & Contenu',
    icon: 'Search',
    enabled: true,
    minPlan: 'standard',
    route: '/marketing/seo',
    features: ['seo-audit', 'keywords', 'rankings'],
    description: 'Optimisation des pages et mots-clés',
    category: 'analytics',
    order: 2,
    groupId: 'marketing',
    subModules: [
      { id: 'seo-manager', name: 'Gestionnaire', route: '/marketing/seo', icon: 'Search', description: 'Gestion SEO', features: ['manager'], order: 1 },
      { id: 'seo-keywords', name: 'Mots-clés', route: '/marketing/seo/keywords', icon: 'Key', description: 'Recherche de mots-clés', features: ['keywords'], order: 2 },
      { id: 'seo-rank', name: 'Classements', route: '/marketing/seo/rank-tracker', icon: 'TrendingUp', description: 'Suivi des positions', features: ['rankings'], order: 3 },
    ]
  },

  research: {
    id: 'research',
    name: 'Veille Publicitaire',
    icon: 'Eye',
    enabled: true,
    minPlan: 'pro',
    route: '/research',
    features: ['product-research', 'winning-products', 'competitor-tracking', 'ads-spy'],
    description: 'Espionnage des annonces et tendances',
    category: 'analytics',
    order: 3,
    groupId: 'marketing',
    badge: 'pro',
    subModules: [
      { id: 'research-winning', name: 'Produits Gagnants', route: '/research/winning', icon: 'Trophy', description: 'Découvrir les gagnants', features: ['winning-products'], order: 1 },
      { id: 'research-competitors', name: 'Concurrents', route: '/research/competitors', icon: 'Eye', description: 'Veille concurrentielle', features: ['competitor-tracking'], order: 2 },
      { id: 'research-ads', name: 'Publicités', route: '/research/ads', icon: 'Megaphone', description: 'Espionner les pubs', features: ['ads-spy'], order: 3 },
      { id: 'research-trends', name: 'Tendances', route: '/research/trends', icon: 'TrendingUp', description: 'Tendances du marché', features: ['trends'], order: 4 },
      { id: 'research-sourcing', name: 'Sourcing', route: '/research/sourcing', icon: 'Search', description: 'Trouver des produits', features: ['sourcing'], order: 5 },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. AUTOMATISATION / WORKFLOWS
  // ═══════════════════════════════════════════════════════════════════════════

  automation: {
    id: 'automation',
    name: 'Scénarios & Workflows',
    icon: 'Zap',
    enabled: true,
    minPlan: 'pro',
    route: '/automation',
    features: ['workflows', 'triggers'],
    description: 'Scénarios IA, déclencheurs et règles',
    category: 'automation',
    order: 1,
    groupId: 'automation',
    badge: 'pro',
    subModules: [
      { id: 'automation-hub', name: 'Vue d\'ensemble', route: '/automation', icon: 'Zap', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'automation-workflows', name: 'Scénarios', route: '/automation/workflows', icon: 'Workflow', description: 'Créer des scénarios', features: ['workflows'], order: 2 },
      { id: 'automation-triggers', name: 'Déclencheurs', route: '/automation/triggers', icon: 'Play', description: 'Gérer les déclencheurs', features: ['triggers'], order: 3 },
      { id: 'automation-studio', name: 'Studio', route: '/automation/studio', icon: 'Palette', description: 'Studio d\'automatisation', features: ['studio'], order: 4 },
      { id: 'automation-ai-hub', name: 'Hub IA', route: '/automation/ai-hub', icon: 'Brain', description: 'Hub Intelligence Artificielle', features: ['ai'], order: 5 },
    ]
  },

  pricing: {
    id: 'pricing',
    name: 'Tarification & Marges',
    icon: 'DollarSign',
    enabled: true,
    minPlan: 'standard',
    route: '/pricing-manager',
    features: ['price-rules', 'dynamic-pricing', 'repricing', 'margin-control', 'store-sync'],
    description: 'Surveillance prix/stock et optimisation des marges',
    category: 'automation',
    order: 2,
    groupId: 'automation',
    subModules: [
      { id: 'pricing-hub', name: 'Vue d\'ensemble', route: '/pricing-manager', icon: 'LayoutDashboard', description: 'Vue d\'ensemble et indicateurs', features: ['overview', 'kpis'], order: 1 },
      { id: 'pricing-rules', name: 'Règles de Prix', route: '/pricing-manager/rules', icon: 'GitBranch', description: 'Règles statiques (markup, marge, arrondi)', features: ['rules'], order: 2 },
      { id: 'pricing-automation', name: 'Repricing Auto', route: '/pricing-manager/repricing', icon: 'Zap', description: 'Repricing temps réel vers boutiques', features: ['repricing', 'sync'], order: 3 },
      { id: 'pricing-monitoring', name: 'Veille Prix', route: '/pricing-manager/monitoring', icon: 'Eye', description: 'Surveillance concurrence et auto-pricing', features: ['monitoring', 'competitors'], order: 4 },
      { id: 'pricing-optimization', name: 'Optimisation IA', route: '/pricing-manager/optimization', icon: 'Brain', description: 'Recommandations IA et élasticité', features: ['ai', 'elasticity'], order: 5 },
    ]
  },

  ai: {
    id: 'ai',
    name: 'Intelligence IA',
    icon: 'Brain',
    enabled: true,
    minPlan: 'pro',
    route: '/ai',
    features: ['ai-descriptions', 'ai-seo', 'ai-content', 'ai-assistant'],
    description: 'Outils IA transversaux',
    category: 'automation',
    order: 3,
    groupId: 'automation',
    badge: 'pro',
    subModules: [
      { id: 'ai-optimization', name: 'Optimisation', route: '/ai/optimization', icon: 'Sparkles', description: 'Optimisation IA', features: ['optimization'], order: 1 },
      { id: 'ai-content', name: 'Génération Contenu', route: '/ai/content', icon: 'Wand2', description: 'Créer du contenu', features: ['content'], order: 2 },
      { id: 'ai-assistant', name: 'Assistant IA', route: '/ai/assistant', icon: 'Bot', description: 'Assistant intelligent', features: ['assistant'], order: 3 },
      { id: 'ai-rewrite', name: 'Réécriture', route: '/ai/rewrite', icon: 'FileEdit', description: 'Réécrire les textes', features: ['rewrite'], order: 4 },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EXTENSIONS & INTÉGRATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  stores: {
    id: 'stores',
    name: 'Boutiques',
    icon: 'Store',
    enabled: true,
    minPlan: 'standard',
    route: '/stores-channels',
    features: ['store-management', 'multi-store'],
    description: 'Connexions aux places de marché',
    category: 'core',
    order: 1,
    groupId: 'integrations',
    subModules: [
      { id: 'stores-hub', name: 'Vue d\'ensemble', route: '/stores-channels', icon: 'Store', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'stores-shopify', name: 'Shopify', route: '/import/shopify', icon: 'Store', description: 'Import depuis Shopify', features: ['shopify'], order: 2 },
      { id: 'stores-connect', name: 'Connecter', route: '/stores-channels/connect', icon: 'Plug', description: 'Ajouter une boutique', features: ['oauth'], order: 3 },
      { id: 'stores-sync', name: 'Synchronisation', route: '/stores-channels/sync', icon: 'RefreshCw', description: 'État des syncs', features: ['sync-status'], order: 4 },
      { id: 'stores-analytics', name: 'Statistiques', route: '/stores-channels/analytics', icon: 'BarChart3', description: 'Performances', features: ['analytics'], order: 5 },
      { id: 'stores-diagnostic', name: 'Diagnostic Shopify', route: '/stores-channels/shopify-diagnostic', icon: 'Stethoscope', description: 'Tester et diagnostiquer Shopify', features: ['diagnostic'], order: 6 },
    ]
  },

  feeds: {
    id: 'feeds',
    name: 'Flux Produits',
    icon: 'Rss',
    enabled: true,
    minPlan: 'standard',
    route: '/feeds',
    features: ['google-feed', 'meta-feed', 'amazon-feed'],
    description: 'Exports vers Google, Meta, Amazon...',
    category: 'product',
    order: 2,
    groupId: 'integrations',
    subModules: [
      { id: 'feeds-manager', name: 'Gestion', route: '/feeds', icon: 'Rss', description: 'Créer et gérer', features: ['feed-creation'], order: 1 },
      { id: 'feeds-optimization', name: 'Optimisation', route: '/feeds/optimization', icon: 'TrendingUp', description: 'Optimiser les feeds', features: ['optimization'], order: 2 },
      { id: 'feeds-rules', name: 'Règles Feed', route: '/feeds/rules', icon: 'GitBranch', description: 'Règles de transformation', features: ['rules'], order: 3 },
      { id: 'feeds-categories', name: 'Catégories', route: '/feeds/categories', icon: 'Layers', description: 'Mapping catégories', features: ['mapping'], order: 4 },
    ]
  },

  extensions: {
    id: 'extensions',
    name: 'Marketplace d\'Extensions',
    icon: 'Puzzle',
    enabled: true,
    minPlan: 'standard',
    route: '/extensions',
    features: ['chrome-extension', 'api-access', 'cli-tools', 'marketplace'],
    description: 'Installation et gestion de modules',
    category: 'integrations',
    order: 3,
    groupId: 'integrations'
  },

  integrations: {
    id: 'integrations',
    name: 'Connecteurs & APIs',
    icon: 'Plug',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations',
    features: ['api-keys', 'webhooks', 'connectors'],
    description: 'APIs, webhooks et partenaires logistiques',
    category: 'integrations',
    order: 4,
    groupId: 'integrations',
    subModules: [
      { id: 'integrations-overview', name: 'Vue d\'ensemble', route: '/integrations', icon: 'Plug', description: 'Connecteurs et APIs', features: ['overview'], order: 1 },
      { id: 'integrations-marketplace', name: 'Hub de Services', route: '/integrations/marketplace/services', icon: 'Store', description: 'Hub de services tiers', features: ['marketplace'], order: 2 },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. RAPPORTS & ANALYSES
  // ═══════════════════════════════════════════════════════════════════════════

  analytics: {
    id: 'analytics',
    name: 'Statistiques',
    icon: 'BarChart3',
    enabled: true,
    minPlan: 'standard',
    route: '/analytics',
    features: ['dashboards', 'reports', 'charts'],
    description: 'Rapports de ventes, marketing et inventaire',
    category: 'analytics',
    order: 1,
    groupId: 'reports',
    subModules: [
      { id: 'analytics-dashboard', name: 'Vue d\'ensemble', route: '/analytics', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'analytics-advanced', name: 'Avancé', route: '/analytics/advanced', icon: 'TrendingUp', description: 'Statistiques avancées', features: ['advanced'], order: 2 },
      { id: 'analytics-reports', name: 'Rapports', route: '/analytics/reports', icon: 'FileText', description: 'Rapports personnalisés', features: ['reports'], order: 3 },
      { id: 'analytics-bi', name: 'Intelligence Commerciale', route: '/analytics/bi', icon: 'Brain', description: 'BI avancée', features: ['bi'], order: 4 },
      { id: 'analytics-predictive', name: 'Prédictif', route: '/analytics/predictive', icon: 'TrendingUp', description: 'Statistiques prédictives', features: ['predictive'], order: 5 },
      { id: 'analytics-real-data', name: 'Temps Réel', route: '/analytics/real-data', icon: 'Activity', description: 'Données temps réel', features: ['real-data'], order: 6 },
    ]
  },

  quality: {
    id: 'quality',
    name: 'Qualité & Audit',
    icon: 'CheckCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/audit',
    features: ['quality-scoring', 'seo-audit', 'product-audit', 'qa'],
    description: 'Diagnostic et contrôle qualité',
    category: 'product',
    order: 2,
    groupId: 'reports',
    subModules: [
      { id: 'quality-dashboard', name: 'Vue d\'ensemble', route: '/audit', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'quality-products', name: 'Audit Produits', route: '/audit/products', icon: 'Package', description: 'Auditer les produits', features: ['products'], order: 2 },
      { id: 'quality-scoring', name: 'Scoring', route: '/audit/scoring', icon: 'Star', description: 'Score qualité', features: ['scoring'], order: 3 },
      { id: 'quality-seo', name: 'Audit SEO', route: '/audit/seo', icon: 'Search', description: 'Audit référencement', features: ['seo'], order: 4 },
      { id: 'quality-feed', name: 'Audit Feed', route: '/audit/feed', icon: 'Rss', description: 'Qualité des feeds', features: ['feed'], order: 5 },
      { id: 'quality-images', name: 'Audit Images', route: '/products/image-audit', icon: 'Image', description: 'Enrichir galeries produits', features: ['images'], order: 6 },
      { id: 'quality-batch', name: 'Audit en Masse', route: '/audit/batch', icon: 'Layers', description: 'Audit par lot', features: ['batch'], order: 7 },
    ]
  },

  reports: {
    id: 'reports',
    name: 'Rapports & Exports',
    icon: 'FileText',
    enabled: true,
    minPlan: 'standard',
    route: '/reports',
    features: ['reports', 'exports', 'scheduled-reports'],
    description: 'Export CSV/Excel et tableaux de bord dynamiques',
    category: 'analytics',
    order: 3,
    groupId: 'reports'
  },

  profitCalculator: {
    id: 'profitCalculator',
    name: 'Calculateur Profits',
    icon: 'Calculator',
    enabled: true,
    minPlan: 'standard',
    route: '/tools/profit-calculator',
    features: ['profit-calculation', 'margins', 'roi-analysis'],
    description: 'Calcul de marges et rentabilité',
    category: 'analytics',
    order: 4,
    groupId: 'reports'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. PARAMÈTRES & ADMINISTRATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  profile: {
    id: 'profile',
    name: 'Mon Profil',
    icon: 'User',
    enabled: true,
    minPlan: 'standard',
    route: '/profile',
    features: ['profile', 'avatar', 'preferences'],
    description: 'Informations du titulaire',
    category: 'system',
    order: 1,
    groupId: 'settings'
  },

  subscription: {
    id: 'subscription',
    name: 'Abonnement & Facturation',
    icon: 'CreditCard',
    enabled: true,
    minPlan: 'standard',
    route: '/subscription',
    features: ['plan', 'billing', 'invoices'],
    description: 'Abonnements et factures',
    category: 'system',
    order: 2,
    groupId: 'settings'
  },
  
  settings: {
    id: 'settings',
    name: 'Paramètres Boutique',
    icon: 'Settings',
    enabled: true,
    minPlan: 'standard',
    route: '/settings',
    features: ['account', 'preferences'],
    description: 'Taxes, devise, langues, paiements, expédition',
    category: 'system',
    order: 3,
    groupId: 'settings',
    subModules: [
      { id: 'settings-general', name: 'Général', route: '/settings', icon: 'Settings', description: 'Paramètres généraux', features: ['general'], order: 1 },
      { id: 'settings-api', name: 'API', route: '/settings/api', icon: 'Key', description: 'Gestion API', features: ['api'], order: 2 },
      { id: 'settings-billing', name: 'Facturation', route: '/settings/billing', icon: 'Receipt', description: 'Facturation', features: ['billing'], order: 3 },
      { id: 'settings-security', name: 'Sécurité', route: '/settings/security', icon: 'Shield', description: 'Sécurité du compte', features: ['security'], order: 4 },
    ]
  },

  admin: {
    id: 'admin',
    name: 'Administration',
    icon: 'Shield',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/admin',
    features: ['admin-panel', 'security'],
    description: 'Rôles, permissions et journal d\'activité',
    category: 'enterprise',
    order: 4,
    groupId: 'settings',
    badge: 'ultra',
    subModules: [
      { id: 'admin-panel', name: 'Panel', route: '/admin', icon: 'Shield', description: 'Administration', features: ['admin'], order: 1 },
      { id: 'admin-security', name: 'Sécurité', route: '/admin/security', icon: 'Lock', description: 'Sécurité', features: ['security'], order: 2 },
      { id: 'admin-suppliers', name: 'Fournisseurs', route: '/admin/suppliers', icon: 'Truck', description: 'Gestion fournisseurs', features: ['suppliers'], order: 3 },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. AIDE & SUPPORT
  // ═══════════════════════════════════════════════════════════════════════════

  academy: {
    id: 'academy',
    name: 'Centre d\'Aide',
    icon: 'GraduationCap',
    enabled: true,
    minPlan: 'standard',
    route: '/academy',
    features: ['courses', 'tutorials'],
    description: 'FAQ, guides interactifs et vidéos',
    category: 'learning',
    order: 1,
    groupId: 'help'
  },
  
  support: {
    id: 'support',
    name: 'Support en Direct',
    icon: 'HelpCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/support',
    features: ['tickets', 'chat', 'live-chat'],
    description: 'Chat en ligne et soumission de tickets',
    category: 'system',
    order: 2,
    groupId: 'help'
  },

  apiDocs: {
    id: 'apiDocs',
    name: 'Documentation API',
    icon: 'Code',
    enabled: true,
    minPlan: 'pro',
    route: '/api/documentation',
    features: ['api-docs', 'swagger', 'webhooks'],
    description: 'Documentation technique et API',
    category: 'integrations',
    order: 3,
    groupId: 'help',
    badge: 'pro'
  },
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Récupérer les modules par groupe
 */
export function getModulesByGroup(groupId: NavGroupId): ModuleConfig[] {
  return Object.values(MODULE_REGISTRY)
    .filter(m => m.groupId === groupId && m.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Récupérer un groupe par ID
 */
export function getNavGroup(groupId: NavGroupId): NavGroupConfig | undefined {
  return NAV_GROUPS.find(g => g.id === groupId);
}

/**
 * Récupérer les modules par plan
 */
export function getModulesByPlan(plan: PlanType): ModuleConfig[] {
  const planHierarchy: Record<PlanType, number> = {
    free: 0,
    standard: 1,
    pro: 2,
    ultra_pro: 3
  };
  
  const userPlanLevel = planHierarchy[plan] || 0;
  
  return Object.values(MODULE_REGISTRY)
    .filter(m => planHierarchy[m.minPlan] <= userPlanLevel && m.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Recherche globale dans les modules
 */
export function searchModules(query: string): ModuleConfig[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(MODULE_REGISTRY)
    .filter(m => 
      m.name.toLowerCase().includes(lowerQuery) ||
      m.description.toLowerCase().includes(lowerQuery) ||
      m.features.some(f => f.toLowerCase().includes(lowerQuery)) ||
      m.subModules?.some(sm => 
        sm.name.toLowerCase().includes(lowerQuery) ||
        sm.description.toLowerCase().includes(lowerQuery)
      )
    )
    .sort((a, b) => a.order - b.order);
}

/**
 * Récupérer tous les sous-modules à plat
 */
export function getAllSubModules(): SubModule[] {
  return Object.values(MODULE_REGISTRY)
    .flatMap(m => m.subModules || [])
    .sort((a, b) => a.order - b.order);
}

/**
 * ModuleManager - Gestion de l'accès aux modules
 */
export class ModuleManager {
  private currentPlan: PlanType;
  private planHierarchy: Record<PlanType, number> = {
    free: 0,
    standard: 1,
    pro: 2,
    ultra_pro: 3
  };

  constructor(plan: PlanType) {
    this.currentPlan = plan;
  }

  canAccessModule(moduleId: string): boolean {
    const module = MODULE_REGISTRY[moduleId];
    if (!module || !module.enabled) return false;
    
    const userLevel = this.planHierarchy[this.currentPlan] || 0;
    const requiredLevel = this.planHierarchy[module.minPlan] || 0;
    
    return userLevel >= requiredLevel;
  }

  getAvailableModules(): ModuleConfig[] {
    return Object.values(MODULE_REGISTRY)
      .filter(m => this.canAccessModule(m.id))
      .sort((a, b) => a.order - b.order);
  }

  getModuleConfig(moduleId: string): ModuleConfig | null {
    return MODULE_REGISTRY[moduleId] || null;
  }

  hasFeature(feature: string): boolean {
    const modules = this.getAvailableModules();
    return modules.some(m => m.features.includes(feature));
  }

  getAvailableFeatures(): string[] {
    const modules = this.getAvailableModules();
    const features = new Set<string>();
    modules.forEach(m => m.features.forEach(f => features.add(f)));
    return Array.from(features);
  }
}

/**
 * Statistiques de la navigation
 */
export function getNavigationStats() {
  const modules = Object.values(MODULE_REGISTRY);
  const subModulesCount = modules.reduce((acc, m) => acc + (m.subModules?.length || 0), 0);
  
  return {
    totalModules: modules.length,
    totalSubModules: subModulesCount,
    totalEntries: modules.length + subModulesCount,
    byGroup: NAV_GROUPS.map(g => ({
      group: g.label,
      count: modules.filter(m => m.groupId === g.id).length
    })),
    byPlan: {
      standard: modules.filter(m => m.minPlan === 'standard').length,
      pro: modules.filter(m => m.minPlan === 'pro').length,
      ultra_pro: modules.filter(m => m.minPlan === 'ultra_pro').length,
    }
  };
}
