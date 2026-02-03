/**
 * Types pour la documentation professionnelle ShopOpti+
 * Architecture enterprise-grade pour le Help Center
 */

export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type PlanType = 'standard' | 'pro' | 'ultra_pro';
export type ModuleCategory = 
  | 'core' 
  | 'catalog' 
  | 'sourcing' 
  | 'sales' 
  | 'marketing' 
  | 'analytics' 
  | 'automation' 
  | 'enterprise';

export interface TroubleshootingItem {
  symptom: string;
  cause: string;
  solution: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface UseCase {
  level: UserLevel;
  title: string;
  description: string;
  steps?: string[];
  expectedOutcome?: string;
}

export interface StepByStep {
  stepNumber: number;
  title: string;
  description: string;
  tip?: string;
  warning?: string;
  screenshot?: string;
}

export interface BestPractice {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ExpertTip {
  title: string;
  content: string;
  author?: string;
  differentiator?: string;
}

export interface CallToValue {
  headline: string;
  description: string;
  metrics?: {
    label: string;
    value: string;
    improvement?: string;
  }[];
  cta?: {
    label: string;
    route: string;
  };
}

export interface FAQ {
  question: string;
  answer: string;
  relatedLinks?: { label: string; url: string }[];
}

export interface ModuleDocumentation {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  category: ModuleCategory;
  routes: string[];
  
  // Métadonnées
  minPlan: PlanType;
  targetLevels: UserLevel[];
  estimatedReadTime: number; // minutes
  lastUpdated: string;
  version: string;
  tags: string[];
  
  // Vue d'ensemble
  overview: {
    purpose: string;
    whenToUse: string;
    targetAudience: string;
    prerequisites?: string[];
    keyFeatures: string[];
  };
  
  // Cas d'usage
  useCases: UseCase[];
  
  // Guide pas-à-pas
  stepByStep: StepByStep[];
  
  // Bonnes pratiques
  bestPractices: {
    recommendations: BestPractice[];
    pitfalls: BestPractice[];
  };
  
  // Erreurs fréquentes
  troubleshooting: TroubleshootingItem[];
  
  // Conseils d'expert
  expertTips: ExpertTip[];
  
  // Call-to-value
  callToValue: CallToValue;
  
  // FAQ
  faqs: FAQ[];
  
  // Liens connexes
  relatedModules: string[];
  externalResources?: { label: string; url: string }[];
}

export interface DocumentationSearchResult {
  moduleId: string;
  moduleTitle: string;
  sectionType: 'overview' | 'useCase' | 'step' | 'troubleshooting' | 'faq';
  title: string;
  excerpt: string;
  relevance: number;
}

export interface DocumentationCategory {
  id: ModuleCategory;
  name: string;
  description: string;
  icon: string;
  modules: string[];
  order: number;
}

// Constantes pour les catégories - Alignées avec les 6 pôles de navigation
export const DOCUMENTATION_CATEGORIES: DocumentationCategory[] = [
  {
    id: 'core',
    name: 'Accueil',
    description: 'Dashboard et vue d\'ensemble',
    icon: 'Home',
    modules: ['dashboard', 'notifications'],
    order: 1
  },
  {
    id: 'catalog',
    name: 'Catalogue',
    description: 'Gestion des produits et exécution quotidienne',
    icon: 'Package',
    modules: ['products', 'toProcess', 'variants', 'catalogMedia', 'attributes', 'categoriesBrands', 'catalogHealth'],
    order: 2
  },
  {
    id: 'sourcing',
    name: 'Sourcing',
    description: 'Import, fournisseurs et veille',
    icon: 'Truck',
    modules: ['import', 'suppliers', 'research', 'extensions'],
    order: 3
  },
  {
    id: 'sales',
    name: 'Ventes',
    description: 'Boutiques, commandes et clients',
    icon: 'ShoppingCart',
    modules: ['stores', 'orders', 'customers', 'crm', 'marketing'],
    order: 4
  },
  {
    id: 'analytics',
    name: 'Performance',
    description: 'Analytics, audit et optimisation',
    icon: 'BarChart3',
    modules: ['analytics', 'quality', 'pricing'],
    order: 5
  },
  {
    id: 'enterprise',
    name: 'Configuration',
    description: 'Paramètres, IA et administration',
    icon: 'Settings',
    modules: ['settings', 'integrations', 'ai', 'academy', 'support'],
    order: 6
  }
];
