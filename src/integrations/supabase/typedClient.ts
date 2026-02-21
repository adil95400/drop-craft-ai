/**
 * Typed Supabase client helpers for tables not yet in auto-generated types.
 * 
 * Instead of: (supabase.from('my_table') as any).select(...)
 * Use:        fromTable('my_table').select(...)
 * 
 * This provides a single point to audit all untyped table access
 * and makes it easy to remove once types are regenerated.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Access a Supabase table that isn't in the auto-generated types.
 * Returns a properly typed query builder without needing `as any` everywhere.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(table: string): ReturnType<typeof supabase.from> & any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.from(table as any) as any;
}

/**
 * Type helper for Supabase insert payloads on untyped tables.
 * Avoids `as never` / `as any` on insert data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UntypedRow = Record<string, any>;
