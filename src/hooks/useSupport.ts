/**
 * useSupport — Unified support hook (delegates to real Supabase implementation)
 * @deprecated Legacy mock version removed. Now uses useRealSupport internally.
 */
export { useRealSupport as useSupport, type SupportTicket, type SupportMessage, type FAQItem } from './useRealSupport'
