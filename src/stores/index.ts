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

// New unified plan store  
export { usePlanStore, type PlanStore } from './planStore';