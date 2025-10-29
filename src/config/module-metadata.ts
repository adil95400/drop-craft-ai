/**
 * Métadonnées détaillées pour tous les modules et sous-modules
 * Utilisé pour la génération de documentation, breadcrumbs, SEO, etc.
 */

export interface ModuleMetadata {
  title: string;
  shortTitle?: string;
  description: string;
  longDescription?: string;
  keywords: string[];
  documentationUrl?: string;
  tutorialUrl?: string;
  category: string;
  tags: string[];
}

export const MODULE_METADATA: Record<string, ModuleMetadata> = {
  // Core Business
  dashboard: {
    title: 'Tableau de Bord',
    shortTitle: 'Dashboard',
    description: 'Vue d\'ensemble de votre activité e-commerce',
    longDescription: 'Tableau de bord centralisé avec KPIs, graphiques et statistiques en temps réel de votre activité dropshipping',
    keywords: ['dashboard', 'analytics', 'kpi', 'overview', 'metrics'],
    category: 'core',
    tags: ['essentiel', 'analytics', 'vue-ensemble']
  },
  
  stores: {
    title: 'Mes Boutiques',
    description: 'Gestion centralisée de vos boutiques e-commerce',
    longDescription: 'Interface unifiée pour gérer toutes vos boutiques connectées : Shopify, WooCommerce, PrestaShop et plus',
    keywords: ['stores', 'shops', 'integration', 'multi-store', 'e-commerce'],
    category: 'core',
    tags: ['boutiques', 'intégration', 'multi-plateforme']
  },

  marketplaceHub: {
    title: 'Marketplace Hub',
    description: 'Hub centralisé pour vos marketplaces',
    longDescription: 'Gérez Amazon, eBay, Etsy et autres marketplaces depuis une interface unique',
    keywords: ['marketplace', 'amazon', 'ebay', 'etsy', 'multi-channel'],
    category: 'core',
    tags: ['marketplace', 'multi-canal', 'vente']
  },

  // Product Management
  products: {
    title: 'Catalogue Produits',
    description: 'Gestion complète de votre catalogue produit',
    longDescription: 'Organisez, éditez et optimisez votre catalogue produit avec des outils avancés de gestion',
    keywords: ['products', 'catalog', 'inventory', 'sku', 'variants'],
    category: 'product',
    tags: ['produits', 'catalogue', 'gestion']
  },

  import: {
    title: 'Import Produits',
    description: 'Import multi-sources de produits',
    longDescription: 'Importez des produits depuis CSV, API, URL, web scraping, ou génération IA. Supporte l\'import planifié et automatisé',
    keywords: ['import', 'csv', 'api', 'scraping', 'bulk-import', 'automation'],
    category: 'product',
    tags: ['import', 'automatisation', 'sourcing']
  },

  importSources: {
    title: 'Sources d\'Import',
    description: 'Gestion des sources d\'importation',
    longDescription: 'Configurez et gérez vos sources d\'import : fournisseurs, APIs, connecteurs personnalisés',
    keywords: ['sources', 'suppliers', 'connectors', 'api', 'data-sources'],
    category: 'product',
    tags: ['sources', 'fournisseurs', 'connecteurs']
  },

  winners: {
    title: 'Winning Products',
    description: 'Découvrez les produits gagnants',
    longDescription: 'Base de données de produits à fort potentiel avec analyse de tendances et score de viralité',
    keywords: ['winning-products', 'trends', 'research', 'viral', 'bestsellers'],
    category: 'product',
    tags: ['recherche', 'tendances', 'gagnants']
  },

  marketplace: {
    title: 'AI Marketplace',
    description: '10,000+ produits analysés par IA',
    longDescription: 'Marketplace exclusive avec produits pré-analysés par IA : score de viralité, potentiel de vente, données concurrentielles',
    keywords: ['ai-marketplace', 'ai-products', 'validated', 'curated', 'viral-score'],
    category: 'product',
    tags: ['ia', 'marketplace', 'validé']
  },

  suppliers: {
    title: 'Fournisseurs',
    description: 'Gestion des fournisseurs',
    longDescription: 'Annuaire et gestion de vos fournisseurs avec évaluation, historique et synchronisation',
    keywords: ['suppliers', 'vendors', 'dropshipping', 'sourcing', 'wholesalers'],
    category: 'product',
    tags: ['fournisseurs', 'sourcing', 'dropshipping']
  },

  network: {
    title: 'Fournisseurs Premium',
    description: 'Réseau de fournisseurs premium',
    longDescription: 'Accédez à un réseau exclusif de fournisseurs vérifiés avec livraison rapide et tarifs négociés',
    keywords: ['premium-suppliers', 'exclusive', 'fast-shipping', 'quality', 'verified'],
    category: 'product',
    tags: ['premium', 'exclusif', 'qualité']
  },

  // Learning
  academy: {
    title: 'Academy',
    description: 'Formation dropshipping complète',
    longDescription: 'Cours vidéo, guides, webinaires et certifications pour maîtriser le dropshipping',
    keywords: ['training', 'courses', 'academy', 'education', 'learning', 'certification'],
    category: 'learning',
    tags: ['formation', 'cours', 'apprentissage']
  },

  // Analytics
  analytics: {
    title: 'Analytics Pro',
    description: 'Analytics avancés avec IA',
    longDescription: 'Tableaux de bord personnalisables, rapports avancés et insights générés par IA pour optimiser votre business',
    keywords: ['analytics', 'reports', 'metrics', 'ai-insights', 'business-intelligence'],
    category: 'analytics',
    tags: ['analytics', 'rapports', 'ia']
  },

  // Automation
  automation: {
    title: 'Automatisation',
    description: 'Automatisation des processus',
    longDescription: 'Créez des workflows automatisés : pricing dynamique, synchronisation inventaire, traitement commandes',
    keywords: ['automation', 'workflows', 'auto-pricing', 'sync', 'rules'],
    category: 'automation',
    tags: ['automatisation', 'workflows', 'productivité']
  },

  extension: {
    title: 'Extension Chrome',
    description: 'Extension navigateur pour import rapide',
    longDescription: 'Importez des produits en 1 clic depuis n\'importe quel site e-commerce avec analyse automatique',
    keywords: ['chrome-extension', 'browser', 'quick-import', '1-click', 'scraping'],
    category: 'automation',
    tags: ['extension', 'chrome', 'import-rapide']
  },

  // Customer Relations
  crm: {
    title: 'CRM',
    description: 'Gestion de la relation client',
    longDescription: 'CRM complet avec gestion des prospects, emails, appels, calendrier et suivi des activités',
    keywords: ['crm', 'customers', 'leads', 'sales', 'pipeline', 'emails'],
    category: 'customer',
    tags: ['crm', 'clients', 'ventes']
  },

  seo: {
    title: 'SEO Manager',
    description: 'Optimisation SEO avancée',
    longDescription: 'Outils SEO pour optimiser vos fiches produits : mots-clés, meta tags, contenu, analyse concurrentielle',
    keywords: ['seo', 'optimization', 'keywords', 'meta-tags', 'content', 'ranking'],
    category: 'customer',
    tags: ['seo', 'référencement', 'optimisation']
  },

  // Enterprise
  ai: {
    title: 'IA Avancée',
    description: 'Suite complète d\'intelligence artificielle',
    longDescription: 'Assistant IA, génération de contenu, analyse produits, descriptions auto, pricing IA, marketing automation, analyse sentiment',
    keywords: ['ai', 'artificial-intelligence', 'content-generation', 'auto-descriptions', 'ai-pricing'],
    category: 'enterprise',
    tags: ['ia', 'intelligence-artificielle', 'automation']
  },

  commerce: {
    title: 'Commerce Pro',
    description: 'Solution e-commerce complète',
    longDescription: 'Suite complète pour l\'e-commerce : gestion multi-canal, inventaire avancé, traitement commandes',
    keywords: ['commerce', 'multi-channel', 'inventory', 'orders', 'fulfillment'],
    category: 'enterprise',
    tags: ['commerce', 'e-commerce', 'vente']
  },

  multiTenant: {
    title: 'Multi-Tenant',
    description: 'Gestion multi-tenant enterprise',
    longDescription: 'Architecture multi-tenant pour gérer plusieurs clients/marques avec isolation des données et white-label',
    keywords: ['multi-tenant', 'saas', 'white-label', 'isolation', 'enterprise'],
    category: 'enterprise',
    tags: ['multi-tenant', 'enterprise', 'saas']
  },

  adminPanel: {
    title: 'Admin Panel',
    description: 'Panneau d\'administration système',
    longDescription: 'Interface d\'administration complète : gestion utilisateurs, configuration système, paramètres avancés',
    keywords: ['admin', 'administration', 'system', 'users', 'config'],
    category: 'enterprise',
    tags: ['admin', 'système', 'configuration']
  },

  // Integrations
  integrations: {
    title: 'Intégrations Premium',
    description: 'Intégrations avancées et API premium',
    longDescription: 'APIs complètes, webhooks, connecteurs personnalisés, documentation développeur et playground de test',
    keywords: ['integrations', 'api', 'webhooks', 'connectors', 'developer'],
    category: 'integrations',
    tags: ['api', 'intégrations', 'développeur']
  },

  security: {
    title: 'Sécurité Avancée',
    description: 'Sécurité et conformité enterprise',
    longDescription: 'Monitoring de sécurité, audit logs, contrôle d\'accès, conformité RGPD et certifications',
    keywords: ['security', 'audit', 'compliance', 'gdpr', 'access-control'],
    category: 'integrations',
    tags: ['sécurité', 'conformité', 'audit']
  },

  // System
  observability: {
    title: 'Observabilité',
    description: 'Monitoring et métriques avancés',
    longDescription: 'Surveillance temps réel, métriques système, alertes, logs analytics et tableaux de bord techniques',
    keywords: ['monitoring', 'observability', 'metrics', 'logs', 'alerts', 'apm'],
    category: 'system',
    tags: ['monitoring', 'métriques', 'alertes']
  }
};

/**
 * Obtenir les métadonnées d'un module
 */
export function getModuleMetadata(moduleId: string): ModuleMetadata | undefined {
  return MODULE_METADATA[moduleId];
}

/**
 * Rechercher des modules par mots-clés
 */
export function searchModulesByKeywords(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return Object.entries(MODULE_METADATA)
    .filter(([_, metadata]) => 
      metadata.keywords.some(keyword => keyword.includes(lowerQuery)) ||
      metadata.title.toLowerCase().includes(lowerQuery) ||
      metadata.description.toLowerCase().includes(lowerQuery) ||
      metadata.tags.some(tag => tag.includes(lowerQuery))
    )
    .map(([moduleId]) => moduleId);
}

/**
 * Obtenir les modules par catégorie
 */
export function getModulesByCategory(category: string): string[] {
  return Object.entries(MODULE_METADATA)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([moduleId]) => moduleId);
}
