/**
 * useSecurityEvents — Clean re-export (replaces useRealSecurityEvents)
 */
export { useRealSecurityEvents as useSecurityEvents } from './useRealSecurityEvents'
export type { SecurityEvent as SecurityEventItem, SecurityMetric, SecurityStats } from './useRealSecurityEvents'
