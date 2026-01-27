/**
 * Command Center V3 - Exports
 * Hub de pilotage business prescriptif
 * Phase 1 + Phase 2 (AI Brain) + Phase 3 (Predictive) + Phase 4 (Prescriptive)
 * Sprint 4: Badges décisionnels & Filtres IA
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

// Sprint 4: Decision Badges
export { 
  DecisionBadge, 
  DecisionBadgeInline, 
  DecisionBadgeWithAction 
} from './DecisionBadge'
export type { DecisionType } from './DecisionBadge'

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

// Phase 4: Prescriptive - 100% Actionnable
export { PrescriptiveCommandCenterV3 } from './PrescriptiveCommandCenterV3'
export { PrescriptiveHeader } from './PrescriptiveHeader'
export { CollapsibleKPIBar } from './CollapsibleKPIBar'
export { ActionCelebrationModal } from './ActionCelebrationModal'
export type { ActionResult } from './ActionCelebrationModal'

// Components
export { PriorityActionCard, PriorityCardsGrid } from './PriorityActionCard'
export { CommandCenterHeaderV3 } from './CommandCenterHeaderV3'
export { KPIFeedbackBar } from './KPIFeedbackBar'
export { CommandCenterV3 } from './CommandCenterV3'
