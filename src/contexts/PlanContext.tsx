// TEMPORARY WRAPPER - Redirect to unified system
// This file provides backward compatibility for components still using PlanContext

export { 
  useUnifiedPlan as usePlan,
  usePlanSystem as usePlanContext
} from '@/lib/unified-plan-system';

export type { PlanType } from '@/lib/unified-plan-system';
