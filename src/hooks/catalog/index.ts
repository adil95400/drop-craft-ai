/**
 * Catalog Hooks - Export centralisé
 * Hooks pour le hub d'exécution catalogue
 */

export { useCatalogHealth, type CatalogHealthMetrics, type HealthEvolutionPoint } from './useCatalogHealth'
export { useProductBacklog, type BacklogItem, type BacklogCounts, type BacklogCategory, type BacklogPriority } from './useProductBacklog'
export { useMediaAudit, type MediaIssue, type MediaStats } from './useMediaAudit'
export { useAttributeAnalysis, type AttributeIssue, type AttributeStats, type MarketplaceRequirement, type AttributeSuggestion } from './useAttributeAnalysis'
export { useCategoryClassification, type ClassificationIssue, type ClassificationMetrics, type CategoryStats, type BrandStats } from './useCategoryClassification'
export { useVariantAnalysis, type VariantIssue, type VariantStats } from './useVariantAnalysis'

// Phase 2: AI Hooks - Attributes
export { 
  useAttributesAIStats, 
  useAttributeRecommendations, 
  useMarketplaceReadiness,
  useApplyAttributeRecommendation,
  type AttributeAIStats,
  type AttributeRecommendation,
  type MarketplaceReadiness
} from './useAttributesAI'

// Phase 2: AI Hooks - Category Mapping
export {
  useCategoryMappingAIStats,
  useCategorySuggestions,
  useMappingRecommendations,
  useApplyCategorySuggestion,
  useApplyAllSuggestions,
  type CategoryMappingAIStats,
  type CategorySuggestion,
  type MappingRecommendation
} from './useCategoryMappingAI'

// Phase 2: AI Hooks - Media
export {
  useMediaAIStats,
  useMediaRecommendations,
  useApplyMediaRecommendation,
  type MediaAIStats,
  type MediaRecommendation
} from './useMediaAI'

// Phase 2: AI Hooks - Variants
export {
  useVariantsAIStats,
  useVariantRecommendations,
  useApplyVariantRecommendation,
  type VariantsAIStats,
  type VariantRecommendation
} from './useVariantsAI'
