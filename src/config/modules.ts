import type { PlanType } from '@/lib/unified-plan-system';

/**
 * Navigation simplifiée style Channable
 * 7 groupes principaux - Structure claire sans doublons
 * Inspiré par Channable: Sources → Catalogue → Canaux → Insights
 */

// =============================================================================
// TYPES
// =============================================================================

export type NavGroupId =
  | 'home'        // Dashboard & Accueil
  | 'sources'     // Import & Fournisseurs (données entrantes)
  | 'catalog'     // Produits & Règles (gestion catalogue)
  | 'channels'    // Boutiques & Feeds (données sortantes)
  | 'orders'      // Commandes & Clients
  | 'insights'    // Analytics & Repricing
  | 'settings';   // Configuration & Admin

export interface NavGroupConfig {
  id: NavGroupId;
  label: string;
  icon: string;
  order: number;
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
}

// =============================================================================
// GROUPES DE NAVIGATION (7 groupes - Style Channable)
// =============================================================================

export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'home', label: 'Accueil', icon: 'Home', order: 1 },
  { id: 'sources', label: 'Sources', icon: 'Upload', order: 2 },
  { id: 'catalog', label: 'Catalogue', icon: 'Package', order: 3 },
  { id: 'channels', label: 'Canaux', icon: 'Store', order: 4 },
  { id: 'orders', label: 'Commandes', icon: 'ShoppingCart', order: 5 },
  { id: 'insights', label: 'Insights', icon: 'BarChart3', order: 6 },
  { id: 'settings', label: 'Paramètres', icon: 'Settings', order: 7 },
];

// =============================================================================
// MODULE_REGISTRY - Navigation complète sans doublons
// =============================================================================

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HOME - Dashboard & Vue d'ensemble
  // ═══════════════════════════════════════════════════════════════════════════
  
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard',
    features: ['overview', 'quick-stats', 'recent-activity'],
    description: 'Vue d\'ensemble de votre activité',
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
  // 2. SOURCES - Import de données & Fournisseurs
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
    groupId: 'sources',
    subModules: [
      { id: 'import-quick', name: 'Import Rapide', route: '/import/quick', icon: 'Zap', description: 'Upload CSV rapide', features: ['csv-upload'], order: 1 },
      { id: 'import-url', name: 'Import par URL', route: '/import/url', icon: 'Link', description: 'Importer depuis une URL', features: ['url-import'], order: 2 },
      { id: 'import-advanced', name: 'Import Avancé', route: '/import/advanced', icon: 'Settings', description: 'Mapping et transformations', features: ['field-mapping'], order: 3 },
      { id: 'import-shopify', name: 'Shopify', route: '/import/shopify', icon: 'Store', description: 'Import depuis Shopify', features: ['shopify'], order: 4 },
      { id: 'import-history', name: 'Historique', route: '/import/history', icon: 'History', description: 'Historique des imports', features: ['logs'], order: 5 },
    ]
  },
  
  suppliers: {
    id: 'suppliers',
    name: 'Fournisseurs',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/suppliers',
    features: ['supplier-management', 'dropshipping', 'catalog-sync'],
    description: 'Connectez vos fournisseurs',
    category: 'product',
    order: 2,
    groupId: 'sources'
  },

  research: {
    id: 'research',
    name: 'Recherche Produits',
    icon: 'Search',
    enabled: true,
    minPlan: 'pro',
    route: '/products/research',
    features: ['product-research', 'winning-products'],
    description: 'Trouver les produits gagnants',
    category: 'product',
    order: 3,
    groupId: 'sources',
    badge: 'pro'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CATALOG - Gestion du catalogue produits
  // ═══════════════════════════════════════════════════════════════════════════
  
  products: {
    id: 'products',
    name: 'Produits',
    icon: 'Package',
    enabled: true,
    minPlan: 'standard',
    route: '/products',
    features: ['product-management', 'bulk-actions'],
    description: 'Gérer votre catalogue',
    category: 'product',
    order: 1,
    groupId: 'catalog',
    subModules: [
      { id: 'products-all', name: 'Tous les produits', route: '/products', icon: 'Package', description: 'Liste complète', features: ['list'], order: 1 },
      { id: 'products-create', name: 'Créer un produit', route: '/products/create', icon: 'Plus', description: 'Nouveau produit', features: ['create'], order: 2 },
      { id: 'products-catalogue', name: 'Catalogue', route: '/products/catalogue', icon: 'Layers', description: 'Catalogue produits', features: ['catalog'], order: 3 },
    ]
  },
  
  rules: {
    id: 'rules',
    name: 'Règles',
    icon: 'GitBranch',
    enabled: true,
    minPlan: 'standard',
    route: '/rules',
    features: ['rule-engine', 'transformations'],
    description: 'Règles de transformation',
    category: 'automation',
    order: 2,
    groupId: 'catalog'
  },
  
  audit: {
    id: 'audit',
    name: 'Audit Qualité',
    icon: 'CheckCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/audit',
    features: ['quality-scoring', 'seo-audit'],
    description: 'Vérification qualité produits',
    category: 'product',
    order: 3,
    groupId: 'catalog',
    subModules: [
      { id: 'audit-dashboard', name: 'Dashboard', route: '/audit', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'audit-products', name: 'Produits', route: '/audit/products', icon: 'Package', description: 'Auditer produits', features: ['products'], order: 2 },
      { id: 'audit-batch', name: 'Audit en masse', route: '/audit/batch', icon: 'Layers', description: 'Audit par lot', features: ['batch'], order: 3 },
    ]
  },
  
  aiOptimization: {
    id: 'aiOptimization',
    name: 'Optimisation IA',
    icon: 'Sparkles',
    enabled: true,
    minPlan: 'pro',
    route: '/rewrite/generator',
    features: ['ai-descriptions', 'ai-seo'],
    description: 'Optimisation automatique par IA',
    category: 'automation',
    order: 4,
    groupId: 'catalog',
    badge: 'pro'
  },

  attributes: {
    id: 'attributes',
    name: 'Attributs',
    icon: 'Tag',
    enabled: true,
    minPlan: 'pro',
    route: '/attributes/manager',
    features: ['attribute-management', 'ai-attributes'],
    description: 'Gestion des attributs produits',
    category: 'product',
    order: 5,
    groupId: 'catalog',
    badge: 'pro'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CHANNELS - Boutiques & Exports (Feeds)
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
    groupId: 'channels',
    subModules: [
      { id: 'stores-hub', name: 'Hub', route: '/stores-channels', icon: 'Store', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'stores-connect', name: 'Connecter', route: '/stores-channels/connect', icon: 'Plug', description: 'Ajouter une boutique', features: ['oauth'], order: 2 },
      { id: 'stores-sync', name: 'Synchronisation', route: '/stores-channels/sync', icon: 'RefreshCw', description: 'État des syncs', features: ['sync-status'], order: 3 },
      { id: 'stores-analytics', name: 'Analytics', route: '/stores-channels/analytics', icon: 'BarChart3', description: 'Performances', features: ['analytics'], order: 4 },
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
    groupId: 'channels',
    subModules: [
      { id: 'feeds-manager', name: 'Gestion', route: '/feeds', icon: 'Rss', description: 'Créer et gérer', features: ['feed-creation'], order: 1 },
      { id: 'feeds-optimization', name: 'Optimisation', route: '/feeds/optimization', icon: 'TrendingUp', description: 'Optimiser les feeds', features: ['optimization'], order: 2 },
      { id: 'feeds-rules', name: 'Règles Feed', route: '/feeds/rules', icon: 'GitBranch', description: 'Règles de transformation', features: ['rules'], order: 3 },
      { id: 'feeds-categories', name: 'Catégories', route: '/feeds/categories', icon: 'Layers', description: 'Mapping catégories', features: ['mapping'], order: 4 },
    ]
  },
  
  fulfillment: {
    id: 'fulfillment',
    name: 'Fulfillment',
    icon: 'PackageCheck',
    enabled: true,
    minPlan: 'pro',
    route: '/fulfillment',
    features: ['auto-fulfillment', 'carriers'],
    description: 'Expédition automatique',
    category: 'automation',
    order: 3,
    groupId: 'channels',
    badge: 'pro',
    subModules: [
      { id: 'fulfillment-hub', name: 'Hub', route: '/fulfillment', icon: 'PackageCheck', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'fulfillment-dashboard', name: 'Dashboard', route: '/fulfillment/dashboard', icon: 'LayoutDashboard', description: 'Tableau de bord', features: ['dashboard'], order: 2 },
      { id: 'fulfillment-rules', name: 'Règles', route: '/fulfillment/rules', icon: 'GitBranch', description: 'Règles d\'expédition', features: ['rules'], order: 3 },
      { id: 'fulfillment-carriers', name: 'Transporteurs', route: '/fulfillment/carriers', icon: 'Truck', description: 'Gestion transporteurs', features: ['carriers'], order: 4 },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ORDERS - Commandes & Clients
  // ═══════════════════════════════════════════════════════════════════════════
  
  orders: {
    id: 'orders',
    name: 'Commandes',
    icon: 'ShoppingCart',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/orders',
    features: ['order-management', 'tracking'],
    description: 'Gérer les commandes',
    category: 'core',
    order: 1,
    groupId: 'orders',
    subModules: [
      { id: 'orders-all', name: 'Toutes les commandes', route: '/dashboard/orders', icon: 'ShoppingCart', description: 'Liste complète', features: ['list'], order: 1 },
      { id: 'orders-create', name: 'Créer', route: '/orders/create', icon: 'Plus', description: 'Nouvelle commande', features: ['create'], order: 2 },
      { id: 'orders-bulk', name: 'Commandes en masse', route: '/orders/bulk', icon: 'Layers', description: 'Gestion par lot', features: ['bulk'], order: 3 },
    ]
  },
  
  customers: {
    id: 'customers',
    name: 'Clients',
    icon: 'Users',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/customers',
    features: ['customer-management'],
    description: 'Base clients',
    category: 'customer',
    order: 2,
    groupId: 'orders'
  },
  
  inventory: {
    id: 'inventory',
    name: 'Stock',
    icon: 'Boxes',
    enabled: true,
    minPlan: 'standard',
    route: '/stock',
    features: ['stock-management', 'alerts'],
    description: 'Gestion des stocks',
    category: 'product',
    order: 3,
    groupId: 'orders',
    subModules: [
      { id: 'stock-management', name: 'Gestion', route: '/stock', icon: 'Boxes', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'stock-repricing', name: 'Repricing', route: '/stock/repricing', icon: 'TrendingUp', description: 'Prix dynamiques', features: ['repricing'], order: 2 },
      { id: 'stock-predictions', name: 'Prédictions', route: '/stock/predictions', icon: 'Brain', description: 'Prédictions IA', features: ['predictions'], order: 3 },
    ]
  },
  
  reviews: {
    id: 'reviews',
    name: 'Avis clients',
    icon: 'Star',
    enabled: true,
    minPlan: 'standard',
    route: '/reviews',
    features: ['review-management'],
    description: 'Gérer les avis',
    category: 'customer',
    order: 4,
    groupId: 'orders'
  },

  returns: {
    id: 'returns',
    name: 'Retours',
    icon: 'RotateCcw',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/returns',
    features: ['returns-management'],
    description: 'Gérer les retours',
    category: 'core',
    order: 5,
    groupId: 'orders'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. INSIGHTS - Analytics & Intelligence
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
    order: 1,
    groupId: 'insights',
    subModules: [
      { id: 'analytics-dashboard', name: 'Dashboard', route: '/analytics', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'analytics-advanced', name: 'Avancé', route: '/analytics/advanced', icon: 'TrendingUp', description: 'Analytics avancés', features: ['advanced'], order: 2 },
      { id: 'analytics-reports', name: 'Rapports', route: '/analytics/reports', icon: 'FileText', description: 'Rapports personnalisés', features: ['reports'], order: 3 },
      { id: 'analytics-bi', name: 'Business Intelligence', route: '/analytics/bi', icon: 'Brain', description: 'BI avancée', features: ['bi'], order: 4 },
    ]
  },
  
  repricing: {
    id: 'repricing',
    name: 'Repricing',
    icon: 'TrendingUp',
    enabled: true,
    minPlan: 'pro',
    route: '/repricing',
    features: ['dynamic-pricing', 'buybox'],
    description: 'Prix dynamiques automatiques',
    category: 'automation',
    order: 2,
    groupId: 'insights',
    badge: 'pro'
  },
  
  competitive: {
    id: 'competitive',
    name: 'Veille concurrentielle',
    icon: 'Eye',
    enabled: true,
    minPlan: 'pro',
    route: '/analytics/competitive',
    features: ['competitor-tracking', 'price-monitoring'],
    description: 'Surveiller la concurrence',
    category: 'analytics',
    order: 3,
    groupId: 'insights',
    badge: 'pro'
  },
  
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    icon: 'Megaphone',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing',
    features: ['campaigns', 'email', 'promotions'],
    description: 'Campagnes marketing',
    category: 'customer',
    order: 4,
    groupId: 'insights',
    badge: 'pro',
    subModules: [
      { id: 'marketing-dashboard', name: 'Dashboard', route: '/marketing', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'marketing-ads', name: 'Campagnes Ads', route: '/marketing/ads', icon: 'Megaphone', description: 'Publicités', features: ['ads'], order: 2 },
      { id: 'marketing-email', name: 'Email', route: '/marketing/email', icon: 'Mail', description: 'Email marketing', features: ['email'], order: 3 },
      { id: 'marketing-promotions', name: 'Promotions', route: '/marketing/promotions', icon: 'Tag', description: 'Codes promo', features: ['coupons'], order: 4 },
    ]
  },

  aiAssistant: {
    id: 'aiAssistant',
    name: 'IA Assistant',
    icon: 'Bot',
    enabled: true,
    minPlan: 'pro',
    route: '/automation/ai-assistant',
    features: ['ai-chat', 'recommendations'],
    description: 'Assistant IA intelligent',
    category: 'automation',
    order: 5,
    groupId: 'insights',
    badge: 'pro'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SETTINGS - Configuration & Administration
  // ═══════════════════════════════════════════════════════════════════════════
  
  settings: {
    id: 'settings',
    name: 'Paramètres',
    icon: 'Settings',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/settings',
    features: ['account', 'preferences'],
    description: 'Configuration générale',
    category: 'system',
    order: 1,
    groupId: 'settings'
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
    order: 2,
    groupId: 'settings'
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
    order: 3,
    groupId: 'settings',
    badge: 'pro',
    subModules: [
      { id: 'automation-hub', name: 'Hub', route: '/automation', icon: 'Zap', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'automation-workflows', name: 'Workflows', route: '/automation/workflows', icon: 'Workflow', description: 'Créer des workflows', features: ['workflows'], order: 2 },
      { id: 'automation-triggers', name: 'Déclencheurs', route: '/automation/triggers', icon: 'Play', description: 'Gérer les triggers', features: ['triggers'], order: 3 },
    ]
  },
  
  extensions: {
    id: 'extensions',
    name: 'Extensions',
    icon: 'Puzzle',
    enabled: true,
    minPlan: 'pro',
    route: '/extensions',
    features: ['marketplace', 'plugins'],
    description: 'Apps et extensions',
    category: 'system',
    order: 4,
    groupId: 'settings',
    badge: 'pro',
    subModules: [
      { id: 'extensions-hub', name: 'Hub', route: '/extensions', icon: 'Puzzle', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'extensions-marketplace', name: 'Marketplace', route: '/extensions/marketplace', icon: 'Store', description: 'Découvrir des extensions', features: ['marketplace'], order: 2 },
      { id: 'extensions-developer', name: 'Développeur', route: '/extensions/developer', icon: 'Code', description: 'Créer des extensions', features: ['developer'], order: 3 },
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
    groupId: 'settings'
  },
  
  support: {
    id: 'support',
    name: 'Support',
    icon: 'HelpCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/support',
    features: ['tickets', 'chat'],
    description: 'Aide et assistance',
    category: 'system',
    order: 6,
    groupId: 'settings'
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
    order: 7,
    groupId: 'settings',
    badge: 'ultra',
    subModules: [
      { id: 'admin-panel', name: 'Panel', route: '/admin', icon: 'Shield', description: 'Administration', features: ['admin'], order: 1 },
      { id: 'admin-security', name: 'Sécurité', route: '/admin/security', icon: 'Lock', description: 'Sécurité', features: ['security'], order: 2 },
      { id: 'admin-suppliers', name: 'Fournisseurs', route: '/admin/suppliers', icon: 'Truck', description: 'Gestion fournisseurs', features: ['suppliers'], order: 3 },
    ]
  }
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
