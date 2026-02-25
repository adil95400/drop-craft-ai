/**
 * Registre centralisé de toutes les routes disponibles dans l'application
 * Source de vérité unique — utilisé pour navigation, breadcrumbs, sitemap, validation
 * 
 * Sprint 2 — nettoyé et enrichi avec helpers
 */

export type RouteGroup = 'core' | 'analytics' | 'automation' | 'marketing' | 'ai' | 'enterprise' | 'tools' | 'settings' | 'public';

export interface RouteConfig {
  path: string;
  component: string;
  protected: boolean;
  adminOnly?: boolean;
  category: RouteGroup;
  description: string;
  implemented: boolean;
  /** Label for breadcrumbs / sitemap */
  label?: string;
  /** Icon name from lucide-react */
  icon?: string;
  /** Route this one redirects to (deprecated routes) */
  redirectTo?: string;
}

export const ROUTES_REGISTRY: RouteConfig[] = [
  // ===== CORE PAGES =====
  { path: '/dashboard', component: 'DashboardHome', protected: true, category: 'core', description: 'Tableau de bord principal', implemented: true },
  { path: '/products', component: 'ModernProductsPage', protected: true, category: 'core', description: 'Gestion des produits', implemented: true },
  { path: '/orders', component: 'ModernOrdersPage', protected: true, category: 'core', description: 'Gestion des commandes', implemented: true },
  { path: '/customers', component: 'ModernCustomersPage', protected: true, category: 'core', description: 'Gestion des clients', implemented: true },
  { path: '/suppliers', component: 'ModernSuppliersHub', protected: true, category: 'core', description: 'Hub fournisseurs', implemented: true },
  
  // ===== ANALYTICS =====
  { path: '/analytics', component: 'ModernAnalyticsPage', protected: true, category: 'analytics', description: 'Analytics principal', implemented: true },
  { path: '/analytics-studio', component: 'AnalyticsStudio', protected: true, category: 'analytics', description: 'Studio analytics avancé', implemented: true },
  { path: '/advanced-analytics', component: 'AdvancedAnalytics', protected: true, category: 'analytics', description: 'Analytics avancé', implemented: true },
  { path: '/business-intelligence', component: 'BusinessIntelligencePage', protected: true, category: 'analytics', description: 'Business Intelligence', implemented: false },
  { path: '/reports', component: 'Reports', protected: true, category: 'analytics', description: 'Rapports', implemented: true },
  { path: '/customer-intelligence', component: 'CustomerIntelligencePage', protected: true, category: 'analytics', description: 'Intelligence client', implemented: true },
  { path: '/competitor-analysis', component: 'CompetitorAnalysisPage', protected: true, category: 'analytics', description: 'Analyse concurrentielle', implemented: true },
  { path: '/competitive-comparison', component: 'CompetitiveComparisonPage', protected: true, category: 'analytics', description: 'Comparaison concurrentielle', implemented: true },
  
  // ===== AUTOMATION =====
  { path: '/automation', component: 'AutomationPage', protected: true, category: 'automation', description: 'Automatisation', implemented: true },
  { path: '/automation-studio', component: 'AutomationStudio', protected: true, category: 'automation', description: 'Studio automation', implemented: true },
  { path: '/ai-automation', component: 'AIAutomationHub', protected: true, category: 'automation', description: 'Automation IA', implemented: true },
  { path: '/workflow-builder', component: 'WorkflowBuilder', protected: true, category: 'automation', description: 'Constructeur de workflows', implemented: false },
  { path: '/auto-fulfillment', component: 'AutoFulfillmentPage', protected: true, category: 'automation', description: 'Auto-fulfillment', implemented: true },
  { path: '/auto-order-system', component: 'AutoOrderSystem', protected: true, category: 'automation', description: 'Système de commandes auto', implemented: false },
  
  // ===== AI =====
  { path: '/ai', component: 'AIPage', protected: true, category: 'ai', description: 'Hub IA', implemented: true },
  { path: '/ai-studio', component: 'AIStudio', protected: true, category: 'ai', description: 'Studio IA', implemented: true },
  { path: '/ai-assistant', component: 'AIAssistant', protected: true, category: 'ai', description: 'Assistant IA', implemented: false },
  { path: '/ai-intelligence', component: 'AIIntelligencePage', protected: true, category: 'ai', description: 'Intelligence IA', implemented: true },
  { path: '/ai-marketplace', component: 'AIMarketplacePage', protected: true, category: 'ai', description: 'Marketplace IA', implemented: true },
  { path: '/ai-predictive-analytics', component: 'AIPredictiveAnalyticsPage', protected: true, category: 'ai', description: 'Analytics prédictive IA', implemented: false },
  
  // ===== MARKETING =====
  { path: '/marketing', component: 'ModernMarketingPage', protected: true, category: 'marketing', description: 'Marketing principal', implemented: true },
  { path: '/marketing-automation', component: 'MarketingAutomation', protected: true, category: 'marketing', description: 'Automation marketing', implemented: false },
  { path: '/ads-manager', component: 'AdsManagerPage', protected: true, category: 'marketing', description: 'Gestionnaire de publicités', implemented: true },
  { path: '/ads-marketing', component: 'AdsMarketingPage', protected: true, category: 'marketing', description: 'Marketing publicitaire', implemented: false },
  { path: '/email-marketing', component: 'EmailMarketing', protected: true, category: 'marketing', description: 'Email marketing', implemented: false },
  { path: '/content-generation', component: 'ContentGenerationPage', protected: true, category: 'marketing', description: 'Génération de contenu', implemented: false },
  { path: '/bulk-content', component: 'BulkContentCreationPage', protected: true, category: 'marketing', description: 'Création en masse', implemented: true },
  { path: '/marketing-calendar', component: 'MarketingCalendarPage', protected: true, category: 'marketing', description: 'Calendrier marketing', implemented: false },
  
  // ===== SEO =====
  { path: '/seo', component: 'SEOManagerPage', protected: true, category: 'marketing', description: 'Gestionnaire SEO', implemented: true },
  { path: '/seo-analytics', component: 'SEOAnalytics', protected: true, category: 'marketing', description: 'Analytics SEO', implemented: false },
  { path: '/keyword-research', component: 'KeywordResearch', protected: true, category: 'marketing', description: 'Recherche de mots-clés', implemented: false },
  { path: '/rank-tracker', component: 'RankTracker', protected: true, category: 'marketing', description: 'Suivi des classements', implemented: false },
  { path: '/schema-generator', component: 'SchemaGenerator', protected: true, category: 'marketing', description: 'Générateur de schémas', implemented: false },
  
  // ===== IMPORT & SYNC =====
  { path: '/import', component: 'UnifiedImport', protected: true, category: 'tools', description: 'Import unifié', implemented: true },
  { path: '/import/sources', component: 'ImportSourcesPage', protected: true, category: 'tools', description: 'Sources d\'import', implemented: true },
  { path: '/import/advanced', component: 'AdvancedImportPage', protected: true, category: 'tools', description: 'Import avancé', implemented: true },
  { path: '/import/csv', component: 'CSVImportPage', protected: true, category: 'tools', description: 'Import CSV', implemented: false },
  { path: '/import/api', component: 'APIImportPage', protected: true, category: 'tools', description: 'Import API', implemented: false },
  { path: '/import/web-scraping', component: 'WebScrapingPage', protected: true, category: 'tools', description: 'Web scraping', implemented: false },
  { path: '/sync-manager', component: 'SyncManagerPage', protected: true, category: 'tools', description: 'Gestionnaire de sync', implemented: true },
  
  // ===== INTEGRATIONS =====
  { path: '/integrations', component: 'ModernIntegrationsHub', protected: true, category: 'tools', description: 'Hub intégrations', implemented: true },
  { path: '/stores', component: 'StoreDashboard', protected: true, category: 'tools', description: 'Dashboard boutiques', implemented: true },
  { path: '/stores/connect', component: 'ConnectStorePage', protected: true, category: 'tools', description: 'Connexion boutique', implemented: true },
  { path: '/stores/integrations', component: 'IntegrationsPage', protected: true, category: 'tools', description: 'Intégrations boutiques', implemented: true },
  { path: '/marketplace-hub', component: 'MarketplaceHubPage', protected: true, category: 'tools', description: 'Hub marketplace', implemented: true },
  { path: '/marketplace-integrations', component: 'MarketplaceIntegrationsPage', protected: true, category: 'tools', description: 'Intégrations marketplace', implemented: true },
  
  // ===== CRM =====
  { path: '/crm', component: 'CrmPage', protected: true, category: 'core', description: 'CRM principal', implemented: true },
  { path: '/crm/leads', component: 'CRMLeads', protected: true, category: 'core', description: 'Leads CRM', implemented: true },
  { path: '/crm/activity', component: 'CRMActivity', protected: true, category: 'core', description: 'Activité CRM', implemented: true },
  { path: '/crm/emails', component: 'CRMEmails', protected: true, category: 'core', description: 'Emails CRM', implemented: true },
  { path: '/crm/calls', component: 'CRMCalls', protected: true, category: 'core', description: 'Appels CRM', implemented: true },
  { path: '/crm/calendar', component: 'CRMCalendar', protected: true, category: 'core', description: 'Calendrier CRM', implemented: true },
  
  // ===== INVENTORY & STOCK =====
  { path: '/inventory', component: 'Inventory', protected: true, category: 'tools', description: 'Inventaire', implemented: true },
  { path: '/inventory-predictor', component: 'InventoryPredictorPage', protected: true, category: 'tools', description: 'Prédicteur d\'inventaire', implemented: true },
  { path: '/stock', component: 'StockPage', protected: true, category: 'tools', description: 'Gestion du stock', implemented: false },
  { path: '/stock-alerts', component: 'StockAlerts', protected: true, category: 'tools', description: 'Alertes de stock', implemented: false },
  { path: '/warehouse-management', component: 'WarehouseManagement', protected: true, category: 'tools', description: 'Gestion d\'entrepôt', implemented: false },
  
  // ===== REVIEWS & TRACKING =====
  { path: '/reviews', component: 'Reviews', protected: true, category: 'tools', description: 'Avis clients', implemented: true },
  { path: '/review-management', component: 'ReviewManagementPage', protected: true, category: 'tools', description: 'Gestion des avis', implemented: false },
  { path: '/tracking', component: 'Tracking', protected: true, category: 'tools', description: 'Suivi des colis', implemented: true },
  { path: '/tracking-auto', component: 'TrackingAutoPage', protected: true, category: 'tools', description: 'Suivi automatique', implemented: false },
  
  // ===== EXTENSIONS =====
  { path: '/extensions-hub', component: 'ExtensionsHub', protected: true, category: 'tools', description: 'Hub extensions', implemented: true },
  { path: '/extension-marketplace', component: 'ExtensionMarketplace', protected: true, category: 'tools', description: 'Marketplace extensions', implemented: false },
  { path: '/extensions-api', component: 'ExtensionAPIPage', protected: true, category: 'tools', description: 'API extensions', implemented: true },
  { path: '/extension-cli', component: 'ExtensionCLI', protected: true, category: 'tools', description: 'CLI extensions', implemented: false },
  
  // ===== ENTERPRISE =====
  { path: '/multi-tenant', component: 'MultiTenantPage', protected: true, category: 'enterprise', description: 'Multi-tenant', implemented: true },
  { path: '/multi-tenant-management', component: 'MultiTenantManagementPage', protected: true, category: 'enterprise', description: 'Gestion multi-tenant', implemented: true },
  { path: '/collaboration', component: 'CollaborationPage', protected: true, category: 'enterprise', description: 'Collaboration', implemented: true },
  { path: '/team-management', component: 'TeamManagement', protected: true, category: 'enterprise', description: 'Gestion d\'équipe', implemented: false },
  { path: '/white-label', component: 'WhiteLabelPage', protected: true, category: 'enterprise', description: 'White label', implemented: false },
  { path: '/enterprise-api', component: 'EnterpriseAPIPage', protected: true, category: 'enterprise', description: 'API entreprise', implemented: false },
  
  // ===== TOOLS =====
  { path: '/profit-calculator', component: 'ProfitCalculatorPage', protected: true, category: 'tools', description: 'Calculateur de profit', implemented: true },
  { path: '/product-research', component: 'ProductResearchPage', protected: true, category: 'tools', description: 'Recherche de produits', implemented: true },
  { path: '/winners', component: 'WinnersPage', protected: true, category: 'tools', description: 'Produits gagnants', implemented: true },
  { path: '/product-finder', component: 'ProductFinder', protected: true, category: 'tools', description: 'Recherche de produits', implemented: false },
  { path: '/dynamic-pricing', component: 'DynamicPricing', protected: true, category: 'tools', description: 'Prix dynamiques', implemented: false },
  { path: '/pricing-automation', component: 'PricingAutomationPage', protected: true, category: 'tools', description: 'Automation des prix', implemented: false },
  
  // ===== MONITORING & SECURITY =====
  { path: '/observability', component: 'AdvancedMonitoringPage', protected: true, category: 'enterprise', description: 'Observabilité', implemented: true },
  { path: '/performance-monitoring', component: 'PerformanceMonitoringPage', protected: true, category: 'enterprise', description: 'Monitoring performance', implemented: true },
  { path: '/security', component: 'SecurityDashboard', protected: true, category: 'enterprise', description: 'Sécurité', implemented: true },
  { path: '/security-center', component: 'SecurityCenter', protected: true, category: 'enterprise', description: 'Centre de sécurité', implemented: false },
  { path: '/compliance-center', component: 'ComplianceCenter', protected: true, category: 'enterprise', description: 'Centre de conformité', implemented: false },
  
  // ===== API & DEVELOPER =====
  { path: '/api-docs', component: 'APIDocumentationPage', protected: true, category: 'tools', description: 'Documentation API', implemented: true },
  { path: '/api-developer', component: 'APIDeveloperPage', protected: true, category: 'tools', description: 'Console développeur', implemented: true },
  { path: '/api-management', component: 'APIManagement', protected: true, category: 'tools', description: 'Gestion API', implemented: false },
  
  // ===== SETTINGS =====
  { path: '/settings', component: 'SettingsPage', protected: true, category: 'settings', description: 'Paramètres', implemented: true },
  { path: '/profile', component: 'Profile', protected: true, category: 'settings', description: 'Profil', implemented: true },
  { path: '/notifications', component: 'Notifications', protected: true, category: 'settings', description: 'Notifications', implemented: false },
  { path: '/subscription', component: 'SubscriptionPage', protected: true, category: 'settings', description: 'Abonnement', implemented: false },
  
  // ===== PUBLIC PAGES =====
  { path: '/', component: 'Index', protected: false, category: 'public', description: 'Page d\'accueil', implemented: true },
  { path: '/auth', component: 'AuthPage', protected: false, category: 'public', description: 'Authentification', implemented: true },
  { path: '/pricing', component: 'Pricing', protected: false, category: 'public', description: 'Tarifs', implemented: true },
  { path: '/features', component: 'Features', protected: false, category: 'public', description: 'Fonctionnalités', implemented: true },
  { path: '/blog', component: 'ModernBlog', protected: false, category: 'public', description: 'Blog', implemented: true },
  { path: '/contact', component: 'Contact', protected: false, category: 'public', description: 'Contact', implemented: true },
  { path: '/faq', component: 'FAQ', protected: false, category: 'public', description: 'FAQ', implemented: true },
  { path: '/about', component: 'About', protected: false, category: 'public', description: 'À propos', implemented: true },
  { path: '/documentation', component: 'Documentation', protected: false, category: 'public', description: 'Documentation', implemented: true },
];

/**
 * Obtenir toutes les routes non implémentées
 */
export function getMissingRoutes(): RouteConfig[] {
  return ROUTES_REGISTRY.filter(route => !route.implemented);
}

/**
 * Obtenir les routes par catégorie
 */
export function getRoutesByCategory(category: RouteGroup): RouteConfig[] {
  return ROUTES_REGISTRY.filter(route => route.category === category);
}

/**
 * Trouver une route par path
 */
export function findRoute(path: string): RouteConfig | undefined {
  return ROUTES_REGISTRY.find(r => r.path === path);
}

/**
 * Obtenir le label d'une route (utile pour breadcrumbs)
 */
export function getRouteLabel(path: string): string {
  const route = findRoute(path);
  return route?.label || route?.description || path;
}

/**
 * Vérifier si un path est public
 */
export function isPublicRoute(path: string): boolean {
  const route = findRoute(path);
  return route ? !route.protected : false;
}

/**
 * Statistiques des routes
 */
export function getRoutesStats() {
  const total = ROUTES_REGISTRY.length;
  const implemented = ROUTES_REGISTRY.filter(r => r.implemented).length;
  const missing = total - implemented;
  
  return {
    total,
    implemented,
    missing,
    percentage: Math.round((implemented / total) * 100)
  };
}
