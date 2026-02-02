/**
 * Common Components - Exports centralisés
 */

export { ContextualEmptyState } from './ContextualEmptyState';

// UI Components réutilisables
export { ImportSuccessAnimation } from '@/components/ui/import-success-animation';
export { 
  CardSkeleton,
  WidgetSkeleton,
  TableSkeleton,
  TableRowSkeleton,
  StatsGridSkeleton,
  ProductCardSkeleton,
  ListItemSkeleton,
  DashboardSkeleton,
  FormSkeleton,
  TimelineSkeleton,
} from '@/components/ui/consistent-skeleton';
export { 
  SecurityBadge,
  EncryptedFieldIndicator,
  TrustIndicators,
  SecurityFooterBar,
} from '@/components/ui/security-badge';
export { 
  FeatureTooltip,
  QuickTooltip,
  HelpTooltip,
  ShortcutBadge,
  FeatureFlagBadge,
} from '@/components/ui/feature-tooltip';
export {
  TabletOptimizedGrid,
  TabletWidgetWrapper,
  TabletStatsRow,
  TabletSidebarLayout,
  TabletCard,
  TabletActionBar,
  ResponsiveText,
  useTabletLayout,
} from '@/components/dashboard/TabletOptimizedDashboard';
