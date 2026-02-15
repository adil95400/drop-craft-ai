/**
 * Centralized Supabase environment variables with fallbacks.
 * Use these instead of import.meta.env.VITE_SUPABASE_* directly.
 */

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://jsmwckzrmqecwwrswwrz.supabase.co'

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I'

/**
 * Build a full URL to a Supabase Edge Function.
 * @example edgeFunctionUrl('enrich-product') => 'https://xxx.supabase.co/functions/v1/enrich-product'
 */
export function edgeFunctionUrl(functionName: string): string {
  return `${SUPABASE_URL}/functions/v1/${functionName}`
}
