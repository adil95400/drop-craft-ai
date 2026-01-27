/**
 * Command Center - Exports
 * Phase 1, 2, 3 & 4 (Premium) Components
 */

// Phase 1 - Core
export { CommandCenterSection } from './CommandCenterSection'
export { ActionCard } from './ActionCard'
export { SmartFiltersBar } from './SmartFiltersBar'
export { BusinessKPIGrid } from './BusinessKPIGrid'
export { useCommandCenterData, useSmartFilteredProducts } from './useCommandCenterData'

// Phase 2 - Premium Views
export { ProductStatusBadges, calculateProductStatus } from './ProductStatusBadges'
export type { ProductStatusData } from './ProductStatusBadges'
export { ProductMicroInfo } from './ProductMicroInfo'
export { ViewModeSelector, useViewModePreference } from './ViewModeSelector'
export type { ViewMode } from './ViewModeSelector'

// Phase 3 - AI Prédictive & ROI
export { AIRecommendationsPanel } from './AIRecommendationsPanel'
export { ROIMiniDashboard } from './ROIMiniDashboard'
export { StockPredictionsAlert } from './StockPredictionsAlert'

// Phase 4 - Premium Enhancements
export { BulkActionsBar } from './BulkActionsBar'
export { RealTimeIndicator } from './RealTimeIndicator'

// Types
export * from './types'
