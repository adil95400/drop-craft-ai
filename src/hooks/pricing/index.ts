/**
 * Pricing Hooks - Export centralisé
 */

// Price Rules AI
export { 
  usePriceRulesAIStats, 
  useRuleImpactPreview, 
  useApplyAIRecommendation,
  type AIRuleRecommendation,
  type RuleImpactPreview,
  type PriceRulesAIStats,
} from './usePriceRulesAI';

// Unified pipeline hooks (P&L, confidence, batch)
export {
  useApplyPricingRules,
  useSyncStockAlerts,
  useAutoRepriceFromCompetitors,
  useCalculatePnL,
  useBatchPnL,
} from '../useCrossModuleSync';
