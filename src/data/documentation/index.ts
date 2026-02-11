/**
 * Index centralisé de la documentation ShopOpti+
 * Exporte tous les modules et fonctions utilitaires
 */

import { dashboardDocumentation } from './modules/dashboard';
import { productsDocumentation } from './modules/products';
import { catalogDocumentation } from './modules/catalog';
import { importDocumentation } from './modules/import';
import { suppliersDocumentation } from './modules/suppliers';
import { pricingDocumentation } from './modules/pricing';
import { ordersDocumentation } from './modules/orders';
import { channelsDocumentation } from './modules/channels';
import { automationDocumentation } from './modules/automation';
import { aiDocumentation } from './modules/ai';
import { analyticsDocumentation } from './modules/analytics';
import { marketingDocumentation } from './modules/marketing';
import { integrationsDocumentation } from './modules/integrations';
import { settingsDocumentation } from './modules/settings';
import { enterpriseDocumentation } from './modules/enterprise';
import { preImportRulesDocumentation } from './modules/preImportRules';
import { itemRetryDocumentation } from './modules/itemRetry';
import { enrichmentSnapshotsDocumentation } from './modules/enrichmentSnapshots';
import { revenueForecastingDocumentation } from './modules/revenueForecasting';
import { imageDeduplicationDocumentation } from './modules/imageDeduplication';
import { domainRegistrationDocumentation } from './modules/domainRegistration';
import { sourcingAgentDocumentation } from './modules/sourcingAgent';
import { webhookManagementDocumentation } from './modules/webhookManagement';
import { dataExportDocumentation } from './modules/dataExport';
import { notificationPreferencesDocumentation } from './modules/notificationPreferences';

import type { ModuleDocumentation, DocumentationSearchResult, PlanType, UserLevel, DOCUMENTATION_CATEGORIES } from './types';

// Export all modules
export const ALL_DOCUMENTATION: ModuleDocumentation[] = [
  dashboardDocumentation,
  productsDocumentation,
  catalogDocumentation,
  importDocumentation,
  suppliersDocumentation,
  pricingDocumentation,
  ordersDocumentation,
  channelsDocumentation,
  automationDocumentation,
  aiDocumentation,
  analyticsDocumentation,
  marketingDocumentation,
  integrationsDocumentation,
  settingsDocumentation,
  enterpriseDocumentation,
  preImportRulesDocumentation,
  itemRetryDocumentation,
  enrichmentSnapshotsDocumentation,
  revenueForecastingDocumentation,
  imageDeduplicationDocumentation,
  domainRegistrationDocumentation,
  sourcingAgentDocumentation,
  webhookManagementDocumentation,
  dataExportDocumentation,
  notificationPreferencesDocumentation,
];

// Export individual modules
export {
  dashboardDocumentation,
  productsDocumentation,
  catalogDocumentation,
  importDocumentation,
  suppliersDocumentation,
  pricingDocumentation,
  ordersDocumentation,
  channelsDocumentation,
  automationDocumentation,
  aiDocumentation,
  analyticsDocumentation,
  marketingDocumentation,
  integrationsDocumentation,
  settingsDocumentation,
  enterpriseDocumentation,
  preImportRulesDocumentation,
  itemRetryDocumentation,
  enrichmentSnapshotsDocumentation,
  revenueForecastingDocumentation,
  imageDeduplicationDocumentation,
  domainRegistrationDocumentation,
  sourcingAgentDocumentation,
  webhookManagementDocumentation,
  dataExportDocumentation,
  notificationPreferencesDocumentation,
};

// Re-export types
export * from './types';

/**
 * Get documentation by module ID
 */
export function getDocumentationById(id: string): ModuleDocumentation | undefined {
  return ALL_DOCUMENTATION.find(doc => doc.id === id);
}

/**
 * Get documentation by slug
 */
export function getDocumentationBySlug(slug: string): ModuleDocumentation | undefined {
  return ALL_DOCUMENTATION.find(doc => doc.slug === slug);
}

/**
 * Get all documentation for a specific plan
 */
export function getDocumentationForPlan(plan: PlanType): ModuleDocumentation[] {
  const planHierarchy: Record<PlanType, PlanType[]> = {
    standard: ['standard'],
    pro: ['standard', 'pro'],
    ultra_pro: ['standard', 'pro', 'ultra_pro'],
  };
  
  const allowedPlans = planHierarchy[plan];
  return ALL_DOCUMENTATION.filter(doc => allowedPlans.includes(doc.minPlan));
}

/**
 * Get documentation by user level
 */
export function getDocumentationForLevel(level: UserLevel): ModuleDocumentation[] {
  return ALL_DOCUMENTATION.filter(doc => doc.targetLevels.includes(level));
}

/**
 * Search across all documentation
 */
export function searchDocumentation(query: string): DocumentationSearchResult[] {
  const results: DocumentationSearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  
  ALL_DOCUMENTATION.forEach(doc => {
    // Search in title and description
    if (doc.title.toLowerCase().includes(lowerQuery) || 
        doc.description.toLowerCase().includes(lowerQuery)) {
      results.push({
        moduleId: doc.id,
        moduleTitle: doc.title,
        sectionType: 'overview',
        title: doc.title,
        excerpt: doc.description.slice(0, 150) + '...',
        relevance: 100,
      });
    }
    
    // Search in use cases
    doc.useCases.forEach(useCase => {
      if (useCase.title.toLowerCase().includes(lowerQuery) ||
          useCase.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          moduleId: doc.id,
          moduleTitle: doc.title,
          sectionType: 'useCase',
          title: useCase.title,
          excerpt: useCase.description.slice(0, 150) + '...',
          relevance: 80,
        });
      }
    });
    
    // Search in troubleshooting
    doc.troubleshooting.forEach(item => {
      if (item.symptom.toLowerCase().includes(lowerQuery) ||
          item.solution.toLowerCase().includes(lowerQuery)) {
        results.push({
          moduleId: doc.id,
          moduleTitle: doc.title,
          sectionType: 'troubleshooting',
          title: item.symptom,
          excerpt: item.solution.slice(0, 150) + '...',
          relevance: 90,
        });
      }
    });
    
    // Search in FAQs
    doc.faqs.forEach(faq => {
      if (faq.question.toLowerCase().includes(lowerQuery) ||
          faq.answer.toLowerCase().includes(lowerQuery)) {
        results.push({
          moduleId: doc.id,
          moduleTitle: doc.title,
          sectionType: 'faq',
          title: faq.question,
          excerpt: faq.answer.slice(0, 150) + '...',
          relevance: 85,
        });
      }
    });
  });
  
  return results.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Get related documentation
 */
export function getRelatedDocumentation(moduleId: string): ModuleDocumentation[] {
  const doc = getDocumentationById(moduleId);
  if (!doc) return [];
  
  return doc.relatedModules
    .map(id => getDocumentationById(id))
    .filter((d): d is ModuleDocumentation => d !== undefined);
}

/**
 * Get documentation stats
 */
export function getDocumentationStats() {
  return {
    totalModules: ALL_DOCUMENTATION.length,
    totalUseCases: ALL_DOCUMENTATION.reduce((sum, doc) => sum + doc.useCases.length, 0),
    totalSteps: ALL_DOCUMENTATION.reduce((sum, doc) => sum + doc.stepByStep.length, 0),
    totalFAQs: ALL_DOCUMENTATION.reduce((sum, doc) => sum + doc.faqs.length, 0),
    totalTroubleshooting: ALL_DOCUMENTATION.reduce((sum, doc) => sum + doc.troubleshooting.length, 0),
    estimatedReadTime: ALL_DOCUMENTATION.reduce((sum, doc) => sum + doc.estimatedReadTime, 0),
  };
}
