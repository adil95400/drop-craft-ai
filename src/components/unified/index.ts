// Export central du système unifié
export { useUnifiedPlan, usePlanSystem, PLAN_FEATURES, PLAN_QUOTAS } from '@/lib/unified-plan-system'
export type { PlanType, UserRole, AdminMode, UserProfile } from '@/lib/unified-plan-system'

export { UnifiedFeatureGate, ProFeature, UltraProFeature, useFeatureAccess } from './UnifiedFeatureGate'
export { UnifiedComponent, usePlanConditionalRender, ConditionalFeature } from './UnifiedComponent'