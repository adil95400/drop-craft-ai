/**
 * Command Center - Exports
 * Phase 1, 2 & 3 Components
 */

// Phase 1 - Core
export { CommandCenterSection } from './CommandCenterSection'
export { ActionCard } from './ActionCard'
export { SmartFiltersBar } from './SmartFiltersBar'
export { BusinessKPIGrid } from './BusinessKPIGrid'
export { useCommandCenterData, useSmartFilteredProducts } from './useCommandCenterData'

// Phase 2 - Premium
export { ProductStatusBadges, calculateProductStatus } from './ProductStatusBadges'
export type { ProductStatusData } from './ProductStatusBadges'
export { ProductMicroInfo } from './ProductMicroInfo'
export { ViewModeSelector, useViewModePreference } from './ViewModeSelector'
export type { ViewMode } from './ViewModeSelector'

// Phase 3 - AI Prédictive & ROI
export { AIRecommendationsPanel } from './AIRecommendationsPanel'
export { ROIMiniDashboard } from './ROIMiniDashboard'
export { StockPredictionsAlert } from './StockPredictionsAlert'

// Types
export * from './types'
