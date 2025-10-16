// TEMPORARY COMPATIBILITY WRAPPER
// This file provides backward compatibility during migration
// All imports from this file are redirected to unified-plan-system

export { 
  useUnifiedPlan as usePlanContext,
  usePlanSystem as usePlan,
  usePlanSystem as useLegacyPlan, // Alias for backward compat
  PLAN_FEATURES,
  PLAN_QUOTAS
} from '@/lib/unified-plan-system';

export type { PlanType, UserRole, AdminMode } from '@/lib/unified-plan-system';
