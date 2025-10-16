/**
 * Centralized Store Index
 * Single point of entry for all Zustand stores
 */

// Core stores
export { useSyncStore, syncManager } from './syncStore';
export { 
  useUserPreferences, 
  usePerformanceStore, 
  useCacheStore 
} from './globalStore';

// Plan store - re-export from unified system
export { useUnifiedPlan as usePlanStore } from '@/lib/unified-plan-system';