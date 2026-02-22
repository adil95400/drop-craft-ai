import type { PlanType } from '@/lib/unified-plan-system';

/**
 * Navigation PRO consolidée - 6 groupes essentiels
 * Structure: 1 fonctionnalité = 1 endroit clair
 * 
 * ARCHITECTURE:
 * - Accueil: Dashboard & Notifications
 * - Catalogue: Zone d'EXÉCUTION quotidienne (Produits, Backlog, Variantes, Médias)
 * - Sourcing: Données ENTRANTES (Import, Fournisseurs, Veille)
 * - Ventes: Données SORTANTES (Boutiques, Commandes, Automatisation)
 * - Performance: ANALYSE & DIAGNOSTIC (Analytics, Tarification, Qualité)
 * - Configuration: Paramètres, IA, Intégrations
 */

// =============================================================================
// TYPES
// =============================================================================

export type NavGroupId =
  | 'home'        // Dashboard & Accueil
  | 'catalog'     // Produits & Exécution (zone pilote quotidienne)
  | 'sourcing'    // Import & Fournisseurs (données entrantes)
  | 'sales'       // Boutiques & Commandes (données sortantes)
  | 'performance' // Analytics & Diagnostic
  | 'config';     // Configuration & Admin

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
// GROUPES DE NAVIGATION (6 groupes consolidés - Structure PRO)
// =============================================================================

export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'home', label: 'Accueil', icon: 'Home', order: 1, description: 'Vue d\'ensemble' },
  { id: 'catalog', label: 'Catalogue', icon: 'Package', order: 2, description: 'Gestion produits' },
  { id: 'sourcing', label: 'Sourcing', icon: 'Truck', order: 3, description: 'Import & Fournisseurs' },
  { id: 'sales', label: 'Ventes', icon: 'ShoppingCart', order: 4, description: 'Boutiques & Commandes' },
  { id: 'performance', label: 'Performance', icon: 'BarChart3', order: 5, description: 'Analytics & Audit' },
  { id: 'config', label: 'Configuration', icon: 'Settings', order: 6, description: 'Paramètres & Outils' },
];

// =============================================================================
// MODULE_REGISTRY - Navigation optimisée sans doublons
// =============================================================================

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HOME - Dashboard & Vue d'ensemble (2 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard',
    features: ['overview', 'quick-stats', 'recent-activity', 'widgets', 'shortcuts', 'quick-actions', 'kpi-cards'],
    description: 'Vue d\'ensemble, widgets et raccourcis',
    category: 'core',
    order: 1,
    groupId: 'home'
  },

  notifications: {
    id: 'notifications',
    name: 'Notifications',
    icon: 'Bell',
    enabled: true,
    minPlan: 'standard',
    route: '/notifications',
    features: ['alerts', 'messages'],
    description: 'Centre de notifications',
    category: 'core',
    order: 2,
    groupId: 'home'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SOURCING - Import & Fournisseurs (données entrantes)
  // ═══════════════════════════════════════════════════════════════════════════
  
  import: {
    id: 'import',
    name: 'Import',
    icon: 'Upload',
    enabled: true,
    minPlan: 'standard',
    route: '/import',
    features: ['csv-import', 'url-import', 'api-import'],
    description: 'Importer des produits',
    category: 'product',
    order: 1,
    groupId: 'sourcing'
  },
  
  suppliers: {
    id: 'suppliers',
    name: 'Fournisseurs & Canaux',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/suppliers',
    features: ['supplier-management', 'dropshipping', 'catalog-sync', 'marketplace-connect'],
    description: 'Fournisseurs, dropshipping et connexions marketplace',
    category: 'product',
    order: 2,
    groupId: 'sourcing',
    subModules: [
      { id: 'suppliers-overview', name: 'Vue d\'ensemble', route: '/suppliers', icon: 'LayoutDashboard', description: 'Dashboard fournisseurs', features: ['overview'], order: 1 },
      { id: 'suppliers-catalog', name: 'Catalogue Unifié', route: '/suppliers/catalog', icon: 'Package', description: 'Tous les produits', features: ['catalog'], order: 2 },
      { id: 'suppliers-engine', name: 'Moteur Avancé', route: '/suppliers/engine', icon: 'Zap', description: 'Auto-import & fulfillment', features: ['advanced'], order: 3 },
      { id: 'suppliers-my', name: 'Mes Fournisseurs', route: '/suppliers/my', icon: 'Truck', description: 'Fournisseurs connectés', features: ['list'], order: 4 },
      { id: 'suppliers-analytics', name: 'Analytics', route: '/suppliers/analytics', icon: 'BarChart3', description: 'Performance fournisseurs', features: ['analytics'], order: 5 },
    ]
  },

  // Module FUSIONNÉ: Veille & Recherche (remplace research, competitive, adsSpy, winners)
  research: {
    id: 'research',
    name: 'Veille & Recherche',
    icon: 'Search',
    enabled: true,
    minPlan: 'pro',
    route: '/research',
    features: ['product-research', 'winning-products', 'competitor-tracking', 'ads-spy'],
    description: 'Veille produits et concurrence',
    category: 'analytics',
    order: 3,
    groupId: 'sourcing',
    badge: 'pro',
    subModules: [
      { id: 'research-winning', name: 'Produits Gagnants', route: '/research/winning', icon: 'Trophy', description: 'Découvrir les gagnants', features: ['winning-products'], order: 1 },
      { id: 'research-competitors', name: 'Concurrents', route: '/research/competitors', icon: 'Eye', description: 'Veille concurrentielle', features: ['competitor-tracking'], order: 2 },
      { id: 'research-ads', name: 'Publicités', route: '/research/ads', icon: 'Megaphone', description: 'Espionner les pubs', features: ['ads-spy'], order: 3 },
      { id: 'research-trends', name: 'Tendances', route: '/research/trends', icon: 'TrendingUp', description: 'Tendances du marché', features: ['trends'], order: 4 },
      { id: 'research-sourcing', name: 'Sourcing', route: '/research/sourcing', icon: 'Search', description: 'Trouver des produits', features: ['sourcing'], order: 5 },
    ]
  },

  // Extensions de navigateur et outils
  extensions: {
    id: 'extensions',
    name: 'Extensions',
    icon: 'Puzzle',
    enabled: true,
    minPlan: 'standard',
    route: '/extensions',
    features: ['chrome-extension', 'api-access', 'cli-tools', 'marketplace'],
    description: 'Extensions navigateur et outils',
    category: 'integrations',
    order: 4,
    groupId: 'sourcing'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CATALOG - Hub d'exécution produit (7 modules)
  // Vision: Catalogue = Exécution / Qualité & Audit = Diagnostic / IA = Transversal
  // ═══════════════════════════════════════════════════════════════════════════
  
  // 1. Produits - Command Center (page pilier quotidienne)
  products: {
    id: 'products',
    name: 'Produits',
    icon: 'Package',
    enabled: true,
    minPlan: 'standard',
    route: '/products',
    features: ['command-center', 'ai-priority', 'bulk-actions', 'prescriptive-badges'],
    description: 'Command Center - Vue quotidienne pilotée par IA',
    category: 'product',
    order: 1,
    groupId: 'catalog'
  },
  
  // 2. À traiter - Backlog intelligent (raccourci mental quotidien)
  toProcess: {
    id: 'toProcess',
    name: 'À traiter',
    icon: 'AlertCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/to-process',
    features: ['ai-priority-queue', 'bulk-actions', 'action-required', 'opportunities'],
    description: 'Backlog intelligent - Actions requises et opportunités',
    category: 'product',
    order: 2,
    groupId: 'catalog'
  },

  // 3. Variantes - Gestion anomalies variantes
  variants: {
    id: 'variants',
    name: 'Variantes',
    icon: 'Layers',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/variants',
    features: ['variant-stock', 'variant-price', 'variant-sync', 'parent-inconsistencies'],
    description: 'Variantes sans stock, prix ou synchronisation',
    category: 'product',
    order: 3,
    groupId: 'catalog'
  },

  // 4. Médias - Correction images/vidéos (pas diagnostic, exécution)
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
    order: 4,
    groupId: 'catalog'
  },

  // 5. Attributs (PRO) - Enrichissement attributs (déplacé sous Catalogue)
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

  // 6. Catégories & Marques - Classification produits
  categoriesBrands: {
    id: 'categoriesBrands',
    name: 'Catégories & Marques',
    icon: 'FolderTree',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/categories-brands',
    features: ['uncategorized', 'misclassified', 'missing-brand', 'ai-suggestions'],
    description: 'Classification et organisation des produits',
    category: 'product',
    order: 6,
    groupId: 'catalog'
  },

  // 7. Santé du Catalogue - KPIs macro et évolution
  catalogHealth: {
    id: 'catalogHealth',
    name: 'Santé du Catalogue',
    icon: 'HeartPulse',
    enabled: true,
    minPlan: 'standard',
    route: '/catalog/health',
    features: ['optimized-percentage', 'blocking-issues', 'global-score', 'evolution'],
    description: 'Vue macro et KPIs pour pilotage long terme',
    category: 'product',
    order: 7,
    groupId: 'catalog'
  },

  // 8. Vues Produits - Filtres prédéfinis et vues enregistrées
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
    order: 8,
    groupId: 'catalog'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE - Modules Diagnostic & Analyse
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Module FUSIONNÉ: Qualité & Audit (diagnostic, pas exécution)
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
    order: 1,
    groupId: 'performance',
    subModules: [
      { id: 'quality-dashboard', name: 'Dashboard', route: '/audit', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'quality-products', name: 'Audit Produits', route: '/audit/products', icon: 'Package', description: 'Auditer les produits', features: ['products'], order: 2 },
      { id: 'quality-scoring', name: 'Scoring', route: '/audit/scoring', icon: 'Star', description: 'Score qualité', features: ['scoring'], order: 3 },
      { id: 'quality-seo', name: 'Audit SEO', route: '/audit/seo', icon: 'Search', description: 'Audit référencement', features: ['seo'], order: 4 },
      { id: 'quality-feed', name: 'Audit Feed', route: '/audit/feed', icon: 'Rss', description: 'Qualité des feeds', features: ['feed'], order: 5 },
      { id: 'quality-images', name: 'Audit Images', route: '/products/image-audit', icon: 'Image', description: 'Enrichir galeries produits', features: ['images'], order: 6 },
      { id: 'quality-batch', name: 'Audit en Masse', route: '/audit/batch', icon: 'Layers', description: 'Audit par lot', features: ['batch'], order: 7 },
    ]
  },
  
  // Module FUSIONNÉ: Tarification (moteur de règles, automatisation)
  pricing: {
    id: 'pricing',
    name: 'Tarification',
    icon: 'DollarSign',
    enabled: true,
    minPlan: 'standard',
    route: '/pricing-manager',
    features: ['price-rules', 'dynamic-pricing', 'repricing', 'margin-control', 'store-sync'],
    description: 'Gestion et optimisation des prix',
    category: 'automation',
    order: 2,
    groupId: 'performance',
    subModules: [
      { id: 'pricing-hub', name: 'Hub Tarification', route: '/pricing-manager', icon: 'LayoutDashboard', description: 'Vue d\'ensemble et KPIs', features: ['overview', 'kpis'], order: 1 },
      { id: 'pricing-rules', name: 'Règles de Prix', route: '/pricing-manager/rules', icon: 'GitBranch', description: 'Règles statiques (markup, marge, arrondi)', features: ['rules'], order: 2 },
      { id: 'pricing-automation', name: 'Repricing Auto', route: '/pricing-manager/repricing', icon: 'Zap', description: 'Repricing temps réel vers boutiques', features: ['repricing', 'sync'], order: 3 },
      { id: 'pricing-monitoring', name: 'Veille Prix', route: '/pricing-manager/monitoring', icon: 'Eye', description: 'Surveillance concurrence et auto-pricing', features: ['monitoring', 'competitors'], order: 4 },
      { id: 'pricing-optimization', name: 'Optimisation IA', route: '/pricing-manager/optimization', icon: 'Brain', description: 'Recommandations IA et élasticité', features: ['ai', 'elasticity'], order: 5 },
    ]
  },

  // Module Intelligence IA (transversal - dans config)
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
    groupId: 'config',
    badge: 'pro',
    subModules: [
      { id: 'ai-optimization', name: 'Optimisation', route: '/ai/optimization', icon: 'Sparkles', description: 'Optimisation IA', features: ['optimization'], order: 1 },
      { id: 'ai-content', name: 'Génération Contenu', route: '/ai/content', icon: 'Wand2', description: 'Créer du contenu', features: ['content'], order: 2 },
      { id: 'ai-assistant', name: 'Assistant IA', route: '/ai/assistant', icon: 'Bot', description: 'Assistant intelligent', features: ['assistant'], order: 3 },
      { id: 'ai-rewrite', name: 'Réécriture', route: '/ai/rewrite', icon: 'FileEdit', description: 'Réécrire les textes', features: ['rewrite'], order: 4 },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SALES - Boutiques, Commandes & Exports (données sortantes)
  // ═══════════════════════════════════════════════════════════════════════════
  
  stores: {
    id: 'stores',
    name: 'Boutiques',
    icon: 'Store',
    enabled: true,
    minPlan: 'standard',
    route: '/stores-channels',
    features: ['store-management', 'multi-store'],
    description: 'Gérer vos boutiques',
    category: 'core',
    order: 1,
    groupId: 'sales',
    subModules: [
      { id: 'stores-hub', name: 'Hub', route: '/stores-channels', icon: 'Store', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'stores-shopify', name: 'Shopify', route: '/import/shopify', icon: 'Store', description: 'Import depuis Shopify', features: ['shopify'], order: 2 },
      { id: 'stores-connect', name: 'Connecter', route: '/stores-channels/connect', icon: 'Plug', description: 'Ajouter une boutique', features: ['oauth'], order: 3 },
      { id: 'stores-sync', name: 'Synchronisation', route: '/stores-channels/sync', icon: 'RefreshCw', description: 'État des syncs', features: ['sync-status'], order: 4 },
      { id: 'stores-analytics', name: 'Analytics', route: '/stores-channels/analytics', icon: 'BarChart3', description: 'Performances', features: ['analytics'], order: 5 },
      { id: 'stores-diagnostic', name: 'Diagnostic Shopify', route: '/stores-channels/shopify-diagnostic', icon: 'Stethoscope', description: 'Tester et diagnostiquer Shopify', features: ['diagnostic'], order: 6 },
    ]
  },
  
  feeds: {
    id: 'feeds',
    name: 'Feeds',
    icon: 'Rss',
    enabled: true,
    minPlan: 'standard',
    route: '/feeds',
    features: ['google-feed', 'meta-feed', 'amazon-feed'],
    description: 'Exports vers Google, Meta...',
    category: 'product',
    order: 2,
    groupId: 'sales',
    subModules: [
      { id: 'feeds-manager', name: 'Gestion', route: '/feeds', icon: 'Rss', description: 'Créer et gérer', features: ['feed-creation'], order: 1 },
      { id: 'feeds-optimization', name: 'Optimisation', route: '/feeds/optimization', icon: 'TrendingUp', description: 'Optimiser les feeds', features: ['optimization'], order: 2 },
      { id: 'feeds-rules', name: 'Règles Feed', route: '/feeds/rules', icon: 'GitBranch', description: 'Règles de transformation', features: ['rules'], order: 3 },
      { id: 'feeds-categories', name: 'Catégories', route: '/feeds/categories', icon: 'Layers', description: 'Mapping catégories', features: ['mapping'], order: 4 },
    ]
  },

  orders: {
    id: 'orders',
    name: 'Commandes',
    icon: 'ShoppingCart',
    enabled: true,
    minPlan: 'standard',
    route: '/orders',
    features: ['order-management', 'tracking', 'returns', 'fulfillment'],
    description: 'Gérer les commandes et expéditions',
    category: 'core',
    order: 3,
    groupId: 'sales',
    subModules: [
      { id: 'orders-all', name: 'Toutes les commandes', route: '/orders', icon: 'ShoppingCart', description: 'Liste complète', features: ['list'], order: 1 },
      { id: 'orders-create', name: 'Créer', route: '/orders/create', icon: 'Plus', description: 'Nouvelle commande', features: ['create'], order: 2 },
      { id: 'orders-bulk', name: 'Commandes en masse', route: '/orders/bulk', icon: 'Layers', description: 'Gestion par lot', features: ['bulk'], order: 3 },
      { id: 'orders-fulfillment', name: 'Exécution', route: '/orders/fulfillment', icon: 'PackageCheck', description: 'Expédition, retours, suivi & automatisation', features: ['fulfillment', 'carriers', 'rules', 'returns', 'tracking', 'notifications'], order: 4 },
    ]
  },
  
  customers: {
    id: 'customers',
    name: 'Clients',
    icon: 'Users',
    enabled: true,
    minPlan: 'standard',
    route: '/customers',
    features: ['customer-management', 'segmentation'],
    description: 'Base clients',
    category: 'customer',
    order: 4,
    groupId: 'sales',
    subModules: [
      { id: 'customers-all', name: 'Tous les clients', route: '/customers', icon: 'Users', description: 'Liste clients', features: ['list'], order: 1 },
      { id: 'customers-segmentation', name: 'Segmentation', route: '/customers/segmentation', icon: 'PieChart', description: 'Segmenter les clients', features: ['segmentation'], order: 2 },
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
    description: 'Gestion du stock',
    category: 'product',
    order: 5,
    groupId: 'sales'
  },

  reviews: {
    id: 'reviews',
    name: 'Avis',
    icon: 'Star',
    enabled: true,
    minPlan: 'standard',
    route: '/reviews',
    features: ['review-management'],
    description: 'Gérer les avis',
    category: 'customer',
    order: 6,
    groupId: 'sales'
  },

  automation: {
    id: 'automation',
    name: 'Automatisation',
    icon: 'Zap',
    enabled: true,
    minPlan: 'pro',
    route: '/automation',
    features: ['workflows', 'triggers'],
    description: 'Workflows automatisés',
    category: 'automation',
    order: 7,
    groupId: 'sales',
    badge: 'pro',
    subModules: [
      { id: 'automation-hub', name: 'Hub', route: '/automation', icon: 'Zap', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'automation-workflows', name: 'Workflows', route: '/automation/workflows', icon: 'Workflow', description: 'Créer des workflows', features: ['workflows'], order: 2 },
      { id: 'automation-triggers', name: 'Déclencheurs', route: '/automation/triggers', icon: 'Play', description: 'Gérer les triggers', features: ['triggers'], order: 3 },
      { id: 'automation-studio', name: 'Studio', route: '/automation/studio', icon: 'Palette', description: 'Studio automation', features: ['studio'], order: 4 },
      { id: 'automation-ai-hub', name: 'AI Hub', route: '/automation/ai-hub', icon: 'Brain', description: 'Hub IA', features: ['ai'], order: 5 },
    ]
  },

  // shipping supprimé - fusionné avec orders.subModules (fulfillment)

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. PERFORMANCE - Analytics & Intelligence
  // ═══════════════════════════════════════════════════════════════════════════
  
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    icon: 'BarChart3',
    enabled: true,
    minPlan: 'standard',
    route: '/analytics',
    features: ['dashboards', 'reports', 'charts'],
    description: 'Tableaux de bord et rapports',
    category: 'analytics',
    order: 3,
    groupId: 'performance',
    subModules: [
      { id: 'analytics-dashboard', name: 'Dashboard', route: '/analytics', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'analytics-advanced', name: 'Avancé', route: '/analytics/advanced', icon: 'TrendingUp', description: 'Analytics avancés', features: ['advanced'], order: 2 },
      { id: 'analytics-reports', name: 'Rapports', route: '/analytics/reports', icon: 'FileText', description: 'Rapports personnalisés', features: ['reports'], order: 3 },
      { id: 'analytics-bi', name: 'Business Intelligence', route: '/analytics/bi', icon: 'Brain', description: 'BI avancée', features: ['bi'], order: 4 },
      { id: 'analytics-predictive', name: 'Prédictif', route: '/analytics/predictive', icon: 'TrendingUp', description: 'Analytics prédictifs', features: ['predictive'], order: 5 },
      { id: 'analytics-real-data', name: 'Temps Réel', route: '/analytics/real-data', icon: 'Activity', description: 'Données temps réel', features: ['real-data'], order: 6 },
    ]
  },

  marketing: {
    id: 'marketing',
    name: 'Marketing',
    icon: 'Megaphone',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing',
    features: ['campaigns', 'email', 'promotions', 'abandoned-cart', 'loyalty'],
    description: 'Campagnes marketing',
    category: 'customer',
    order: 4,
    groupId: 'performance',
    badge: 'pro',
    subModules: [
      { id: 'marketing-dashboard', name: 'Dashboard', route: '/marketing', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'marketing-ads', name: 'Campagnes Ads', route: '/marketing/ads', icon: 'Megaphone', description: 'Publicités', features: ['ads'], order: 2 },
      { id: 'marketing-email', name: 'Email', route: '/marketing/email', icon: 'Mail', description: 'Email marketing', features: ['email'], order: 3 },
      { id: 'marketing-promotions', name: 'Promotions', route: '/marketing/promotions', icon: 'Tag', description: 'Codes promo', features: ['coupons'], order: 4 },
      { id: 'marketing-abandoned', name: 'Paniers Abandonnés', route: '/marketing/abandoned-cart', icon: 'ShoppingCart', description: 'Récupération paniers', features: ['abandoned'], order: 5 },
      { id: 'marketing-loyalty', name: 'Fidélité', route: '/marketing/loyalty', icon: 'Award', description: 'Programme fidélité', features: ['loyalty'], order: 6 },
      { id: 'marketing-flash', name: 'Ventes Flash', route: '/marketing/flash-sales', icon: 'Zap', description: 'Ventes flash', features: ['flash-sales'], order: 7 },
      { id: 'marketing-social', name: 'Social Commerce', route: '/marketing/social-commerce', icon: 'Share2', description: 'Réseaux sociaux', features: ['social'], order: 8 },
      { id: 'marketing-affiliate', name: 'Affiliation', route: '/marketing/affiliate', icon: 'Users', description: 'Programme affiliés', features: ['affiliate'], order: 9 },
      { id: 'marketing-calendar', name: 'Calendrier', route: '/marketing/calendar', icon: 'Calendar', description: 'Planification campagnes', features: ['calendar'], order: 10 },
      { id: 'marketing-ab-testing', name: 'A/B Testing', route: '/marketing/ab-testing', icon: 'BarChart3', description: 'Tests A/B', features: ['ab-testing'], order: 11 },
      { id: 'marketing-content', name: 'Contenu IA', route: '/marketing/content-generation', icon: 'Sparkles', description: 'Génération contenu', features: ['ai-content'], order: 12 },
    ]
  },

  crm: {
    id: 'crm',
    name: 'CRM',
    icon: 'Contact',
    enabled: true,
    minPlan: 'pro',
    route: '/crm',
    features: ['leads', 'pipeline', 'contacts'],
    description: 'Gestion relation client',
    category: 'customer',
    order: 8,
    groupId: 'sales',
    badge: 'pro',
    subModules: [
      { id: 'crm-dashboard', name: 'Dashboard', route: '/crm', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'crm-leads', name: 'Leads', route: '/crm/leads', icon: 'UserPlus', description: 'Gestion des leads', features: ['leads'], order: 2 },
      { id: 'crm-pipeline', name: 'Pipeline', route: '/crm/pipeline', icon: 'GitBranch', description: 'Pipeline de ventes', features: ['pipeline'], order: 3 },
      { id: 'crm-emails', name: 'Emails', route: '/crm/emails', icon: 'Mail', description: 'Historique emails', features: ['emails'], order: 4 },
      { id: 'crm-scoring', name: 'Lead Scoring', route: '/crm/scoring', icon: 'Target', description: 'Notation des leads', features: ['scoring'], order: 5 },
    ]
  },

  seo: {
    id: 'seo',
    name: 'SEO',
    icon: 'Search',
    enabled: true,
    minPlan: 'standard',
    route: '/marketing/seo',
    features: ['seo-audit', 'keywords', 'rankings'],
    description: 'Optimisation référencement',
    category: 'analytics',
    order: 5,
    groupId: 'performance',
    subModules: [
      { id: 'seo-manager', name: 'Manager', route: '/marketing/seo', icon: 'Search', description: 'Gestion SEO', features: ['manager'], order: 1 },
      { id: 'seo-keywords', name: 'Mots-clés', route: '/marketing/seo/keywords', icon: 'Key', description: 'Recherche mots-clés', features: ['keywords'], order: 2 },
      { id: 'seo-rank', name: 'Rankings', route: '/marketing/seo/rank-tracker', icon: 'TrendingUp', description: 'Suivi positions', features: ['rankings'], order: 3 },
    ]
  },

  reports: {
    id: 'reports',
    name: 'Rapports',
    icon: 'FileText',
    enabled: true,
    minPlan: 'standard',
    route: '/reports',
    features: ['reports', 'exports', 'scheduled-reports'],
    description: 'Rapports et exports',
    category: 'analytics',
    order: 6,
    groupId: 'performance'
  },

  // Outils intégrés dans config
  profitCalculator: {
    id: 'profitCalculator',
    name: 'Calculateur Profits',
    icon: 'Calculator',
    enabled: true,
    minPlan: 'standard',
    route: '/tools/profit-calculator',
    features: ['profit-calculation', 'margins', 'roi-analysis'],
    description: 'Calculez vos marges et rentabilité',
    category: 'analytics',
    order: 7,
    groupId: 'performance'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. CONFIG - Configuration & Administration
  // ═══════════════════════════════════════════════════════════════════════════
  
  profile: {
    id: 'profile',
    name: 'Mon Profil',
    icon: 'User',
    enabled: true,
    minPlan: 'standard',
    route: '/profile',
    features: ['profile', 'avatar', 'preferences'],
    description: 'Gérer votre profil',
    category: 'system',
    order: 1,
    groupId: 'config'
  },

  subscription: {
    id: 'subscription',
    name: 'Abonnement',
    icon: 'CreditCard',
    enabled: true,
    minPlan: 'standard',
    route: '/subscription',
    features: ['plan', 'billing', 'invoices'],
    description: 'Gérer votre abonnement',
    category: 'system',
    order: 2,
    groupId: 'config'
  },
  
  settings: {
    id: 'settings',
    name: 'Paramètres',
    icon: 'Settings',
    enabled: true,
    minPlan: 'standard',
    route: '/settings',
    features: ['account', 'preferences'],
    description: 'Configuration générale',
    category: 'system',
    order: 3,
    groupId: 'config',
    subModules: [
      { id: 'settings-general', name: 'Général', route: '/settings', icon: 'Settings', description: 'Paramètres généraux', features: ['general'], order: 1 },
      { id: 'settings-api', name: 'API', route: '/settings/api', icon: 'Key', description: 'Gestion API', features: ['api'], order: 2 },
      { id: 'settings-billing', name: 'Facturation', route: '/settings/billing', icon: 'Receipt', description: 'Facturation', features: ['billing'], order: 3 },
      { id: 'settings-security', name: 'Sécurité', route: '/settings/security', icon: 'Shield', description: 'Sécurité du compte', features: ['security'], order: 4 },
    ]
  },
  
  integrations: {
    id: 'integrations',
    name: 'Intégrations',
    icon: 'Plug',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations',
    features: ['api-keys', 'webhooks', 'connectors'],
    description: 'APIs et connecteurs',
    category: 'integrations',
    order: 4,
    groupId: 'config',
    subModules: [
      { id: 'integrations-overview', name: 'Vue d\'ensemble', route: '/integrations', icon: 'Plug', description: 'Connecteurs et APIs', features: ['overview'], order: 1 },
      { id: 'integrations-marketplace', name: 'Marketplace Services', route: '/integrations/marketplace/services', icon: 'Store', description: 'Hub de services tiers', features: ['marketplace'], order: 2 },
    ]
  },
  
  academy: {
    id: 'academy',
    name: 'Academy',
    icon: 'GraduationCap',
    enabled: true,
    minPlan: 'standard',
    route: '/academy',
    features: ['courses', 'tutorials'],
    description: 'Formation et tutoriels',
    category: 'learning',
    order: 5,
    groupId: 'config'
  },
  
  support: {
    id: 'support',
    name: 'Support',
    icon: 'HelpCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/support',
    features: ['tickets', 'chat', 'live-chat'],
    description: 'Aide et assistance',
    category: 'system',
    order: 6,
    groupId: 'config'
  },

  apiDocs: {
    id: 'apiDocs',
    name: 'API & Docs',
    icon: 'Code',
    enabled: true,
    minPlan: 'pro',
    route: '/api/documentation',
    features: ['api-docs', 'swagger', 'webhooks'],
    description: 'Documentation API',
    category: 'integrations',
    order: 7,
    groupId: 'config',
    badge: 'pro'
  },
  
  admin: {
    id: 'admin',
    name: 'Administration',
    icon: 'Shield',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/admin',
    features: ['admin-panel', 'security'],
    description: 'Administration système',
    category: 'enterprise',
    order: 8,
    groupId: 'config',
    badge: 'ultra',
    subModules: [
      { id: 'admin-panel', name: 'Panel', route: '/admin', icon: 'Shield', description: 'Administration', features: ['admin'], order: 1 },
      { id: 'admin-security', name: 'Sécurité', route: '/admin/security', icon: 'Lock', description: 'Sécurité', features: ['security'], order: 2 },
      { id: 'admin-suppliers', name: 'Fournisseurs', route: '/admin/suppliers', icon: 'Truck', description: 'Gestion fournisseurs', features: ['suppliers'], order: 3 },
    ]
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
