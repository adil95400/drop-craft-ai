import type { PlanType } from '@/hooks/usePlan';

// Configuration des modules par plan
export interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  minPlan: PlanType;
  route: string;
  features: string[];
  description: string;
}

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  // Modules Standard (gratuits)
  dashboard: {
    id: 'dashboard',
    name: 'Tableau de Bord',
    icon: 'BarChart3',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard',
    features: ['basic-analytics', 'product-overview'],
    description: 'Vue d\'ensemble de votre activité'
  },
  products: {
    id: 'products',
    name: 'Catalogue Produits',
    icon: 'Package',
    enabled: true,
    minPlan: 'standard',
    route: '/products',
    features: ['product-management', 'basic-search'],
    description: 'Gestion de votre catalogue produit'
  },
  suppliers: {
    id: 'suppliers',
    name: 'Fournisseurs',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/suppliers',
    features: ['supplier-management', 'basic-import'],
    description: 'Gestion des fournisseurs'
  },
  import: {
    id: 'import',
    name: 'Import Produits',
    icon: 'Upload',
    enabled: true,
    minPlan: 'standard',
    route: '/import',
    features: ['basic-import', 'bulk-import', 'url-scraping'],
    description: 'Import de données produits'
  },
  winners: {
    id: 'winners',
    name: 'Winning Products',
    icon: 'Trophy',
    enabled: true,
    minPlan: 'standard',
    route: '/winners',
    features: ['product-research', 'trend-analysis', 'competitor-analysis'],
    description: 'Découvrez les produits gagnants'
  },

  // Modules Pro
  analytics: {
    id: 'analytics',
    name: 'Analytics Pro',
    icon: 'TrendingUp',
    enabled: true,
    minPlan: 'pro',
    route: '/analytics',
    features: ['advanced-analytics', 'custom-reports', 'ai-insights'],
    description: 'Analytics avancés avec IA'
  },
  automation: {
    id: 'automation',
    name: 'Automatisation',
    icon: 'Zap',
    enabled: true,
    minPlan: 'pro',
    route: '/automation',
    features: ['workflow-builder', 'auto-pricing', 'inventory-sync'],
    description: 'Automatisation des processus'
  },
  crm: {
    id: 'crm',
    name: 'CRM',
    icon: 'Users',
    enabled: true,
    minPlan: 'pro',
    route: '/crm',
    features: ['customer-management', 'lead-tracking', 'sales-pipeline'],
    description: 'Gestion de la relation client'
  },
  seo: {
    id: 'seo',
    name: 'SEO Manager',
    icon: 'Search',
    enabled: true,
    minPlan: 'pro',
    route: '/seo',
    features: ['seo-optimization', 'keyword-tracking', 'content-analysis'],
    description: 'Optimisation SEO avancée'
  },

  // Modules Ultra Pro
  ai: {
    id: 'ai',
    name: 'IA Avancée',
    icon: 'Brain',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/ai',
    features: ['ai-analysis', 'predictive-analytics', 'ai-import', 'smart-recommendations'],
    description: 'Suite complète d\'intelligence artificielle'
  },
  commerce: {
    id: 'commerce',
    name: 'Commerce Pro',
    icon: 'ShoppingCart',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/commerce',
    features: ['multi-channel', 'inventory-management', 'order-management'],
    description: 'Solution e-commerce complète'
  },
  security: {
    id: 'security',
    name: 'Sécurité Avancée',
    icon: 'Shield',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/security',
    features: ['security-monitoring', 'audit-logs', 'access-control'],
    description: 'Sécurité et conformité enterprise'
  },
  integrations: {
    id: 'integrations',
    name: 'Intégrations Premium',
    icon: 'Plug',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/integrations',
    features: ['premium-apis', 'custom-connectors', 'webhooks'],
    description: 'Intégrations avancées et API premium'
  }
};

// Hiérarchie des plans
export const PLAN_HIERARCHY: Record<PlanType, number> = {
  'standard': 1,
  'pro': 2,
  'ultra_pro': 3,
};

// Hook pour la gestion des modules
export class ModuleManager {
  private currentPlan: PlanType = 'standard';
  
  constructor(plan: PlanType) {
    this.currentPlan = plan;
  }

  // Obtenir les modules disponibles pour le plan actuel
  getAvailableModules(): ModuleConfig[] {
    return Object.values(MODULE_REGISTRY).filter(module => 
      PLAN_HIERARCHY[this.currentPlan] >= PLAN_HIERARCHY[module.minPlan]
    );
  }

  // Vérifier si un module est accessible
  canAccessModule(moduleId: string): boolean {
    const module = MODULE_REGISTRY[moduleId];
    if (!module) return false;
    
    return PLAN_HIERARCHY[this.currentPlan] >= PLAN_HIERARCHY[module.minPlan];
  }

  // Obtenir les fonctionnalités disponibles
  getAvailableFeatures(): string[] {
    return this.getAvailableModules()
      .flatMap(module => module.features);
  }

  // Vérifier l'accès à une fonctionnalité
  hasFeature(feature: string): boolean {
    return this.getAvailableFeatures().includes(feature);
  }

  // Obtenir la configuration d'un module
  getModuleConfig(moduleId: string): ModuleConfig | null {
    return MODULE_REGISTRY[moduleId] || null;
  }

  // Mettre à jour le plan
  updatePlan(newPlan: PlanType): void {
    this.currentPlan = newPlan;
  }
}