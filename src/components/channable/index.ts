/**
 * Channable Design System - Export centralisé
 * Composants réutilisables pour un design cohérent sur toutes les pages
 */

// Layout & Structure
export { ChannablePageLayout } from './ChannablePageLayout'
export { ChannableHeroSection } from './ChannableHeroSection'
export { ChannablePageHero, type HeroCategory, type ChannablePageHeroProps } from './ChannablePageHero'
export { ChannablePageWrapper, heroImageKeys, type HeroImageKey } from './ChannablePageWrapper'
export { ChannableCard } from './ChannableCard'

// Data Display
export { ChannableStatsGrid } from './ChannableStatsGrid'
export { ChannableDataTable } from './ChannableDataTable'
export { ChannableSyncTimeline, type SyncEvent } from './ChannableSyncTimeline'
export { ChannableActivityFeed, DEMO_ACTIVITY_EVENTS, type ActivityEvent } from './ChannableActivityFeed'
export { ChannableChannelHealth, DEFAULT_CHANNEL_HEALTH_METRICS } from './ChannableChannelHealth'

// Filters & Search
export { ChannableCategoryFilter } from './ChannableCategoryFilter'
export { ChannableSearchBar } from './ChannableSearchBar'
export { ChannableAdvancedFilters, type FilterConfig } from './ChannableAdvancedFilters'

// Actions
export { ChannableQuickActions } from './ChannableQuickActions'
export { ChannableBulkActions, type BulkAction } from './ChannableBulkActions'

// Visual
export { ChannableHexagons } from './ChannableHexagons'
export { ChannableEmptyState } from './ChannableEmptyState'

// Types
export type { ChannableCategory, ChannableStat, ChannableQuickAction } from './types'
