/**
 * Database Helper Functions
 * Ensures proper search_path and tenant isolation
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

/**
 * Execute RPC with proper search_path and tenant isolation
 */
export async function secureRpc<T>(
  supabase: SupabaseClient,
  functionName: string,
  params: Record<string, any>,
  userId: string
): Promise<T> {
  // All RPC functions should have SET search_path TO 'public'
  // and verify user_id within the function
  const { data, error } = await supabase.rpc(functionName, {
    ...params,
    _user_id: userId // Always pass user_id for tenant isolation
  })

  if (error) {
    console.error(`RPC Error [${functionName}]:`, error)
    throw error
  }

  return data as T
}

/**
 * Execute query with tenant isolation
 */
export async function secureQuery<T>(
  supabase: SupabaseClient,
  table: string,
  userId: string
) {
  return supabase
    .from(table)
    .select('*')
    .eq('user_id', userId) // Enforce tenant isolation at query level
}

/**
 * Batch insert with tenant isolation
 */
export async function secureBatchInsert<T>(
  supabase: SupabaseClient,
  table: string,
  records: T[],
  userId: string
) {
  // Add user_id to all records
  const recordsWithUserId = records.map(record => ({
    ...record,
    user_id: userId
  }))

  const { data, error } = await supabase
    .from(table)
    .insert(recordsWithUserId)
    .select()

  if (error) {
    console.error(`Batch insert error [${table}]:`, error)
    throw error
  }

  return data
}

/**
 * Update with tenant isolation check
 */
export async function secureUpdate<T>(
  supabase: SupabaseClient,
  table: string,
  recordId: string,
  updates: Partial<T>,
  userId: string
) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', recordId)
    .eq('user_id', userId) // Ensure user owns the record
    .select()
    .single()

  if (error) {
    console.error(`Update error [${table}]:`, error)
    throw error
  }

  return data
}

/**
 * Delete with tenant isolation check
 */
export async function secureDelete(
  supabase: SupabaseClient,
  table: string,
  recordId: string,
  userId: string
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', recordId)
    .eq('user_id', userId) // Ensure user owns the record

  if (error) {
    console.error(`Delete error [${table}]:`, error)
    throw error
  }

  return true
}
