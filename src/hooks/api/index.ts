/**
 * API Hooks - Barrel export
 * All business logic actions route through FastAPI via these hooks
 * Reads can still use Supabase directly for realtime
 */

export { useApiProducts } from './useApiProducts'
export { useApiJobs, useApiJobDetail, type Job } from './useApiJobs'
export { useApiSync } from './useApiSync'
export { useApiAI } from './useApiAI'
export { useApiImports } from './useApiImports'
export { useApiOrders } from './useApiOrders'
export { useApiHealth } from './useApiHealth'
export { useApiStores } from './useApiStores'

// shopOptiApi removed — all hooks now use Supabase directly
