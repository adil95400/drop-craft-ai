/**
 * Command Center V3 - Exports
 * Phase 1 + Phase 2 (AI Brain) + Phase 3 (Predictive) + Optimizations
 */

// Utilities (shared calculations)
export * from './utils'

// Labels & Types
export * from './labels'

// AI Priority Engine
export { 
  useAIPriorityEngine, 
  useProductAIBadge,
  AI_PRIORITY_WEIGHTS,
  AI_THRESHOLDS 
} from './useAIPriorityEngine'
export type { 
  PriorityCard, 
  ProductAIBadge, 
  AIPriorityEngineResult 
} from './useAIPriorityEngine'

// Phase 2: AI Brain - Sorting & Badges
export { 
  useAISortedProducts,
  AI_SORT_MODE_LABELS
} from './useAISortedProducts'
export type { AISortMode } from './useAISortedProducts'

export { 
  ProductAIBadgeComponent,
  ProductAIBadgeMinimal,
  ProductAIPriorityIndicator
} from './ProductAIBadge'

export { AISortSelector } from './AISortSelector'
export { AIContextPanel } from './AIContextPanel'

// Phase 3: Predictive Insights
export { usePredictiveInsights } from './usePredictiveInsights'
export type { 
  PredictiveAlert, 
  ROIMetrics, 
  TrendAnalysis 
} from './usePredictiveInsights'

export { PredictiveAlertsPanel } from './PredictiveAlertsPanel'
export { ROIDashboardPanel } from './ROIDashboardPanel'
export { TrendAnalysisPanel } from './TrendAnalysisPanel'
export { PredictiveCommandCenter } from './PredictiveCommandCenter'

// Components
export { PriorityActionCard, PriorityCardsGrid } from './PriorityActionCard'
export { CommandCenterHeaderV3 } from './CommandCenterHeaderV3'
export { KPIFeedbackBar } from './KPIFeedbackBar'
export { CommandCenterV3 } from './CommandCenterV3'
