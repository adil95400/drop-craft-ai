// Analytics Components - Complete exports
export * from './AdvancedAnalyticsDashboard';
export { RealDataAnalyticsDashboard } from './RealDataAnalyticsDashboard';

// Advanced Analytics Components
export { CohortAnalysis } from './CohortAnalysis';

// Re-export hooks
export { useAnalytics as useRealAnalytics } from '@/hooks/useAnalytics';
export type { Analytics as RealAnalytics } from '@/hooks/useAnalytics';
