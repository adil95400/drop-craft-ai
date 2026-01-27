/**
 * Command Center - Exports
 * Phase 1, 2, 3, 4 & V3 (Premium) Components
 * Sprint 4: Badges décisionnels & Filtres IA
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

// V3 - Command Center Premium (Phase 1 + 2 + 3 + 4 + Sprint 4)
export * from './v3'

// Sprint 4: AI Decision Filters (from products)
export { AIDecisionFilters, AIDecisionFilterBar } from '../AIDecisionFilters'
export type { AIFilterType } from '../AIDecisionFilters'

// Types
export * from './types'
