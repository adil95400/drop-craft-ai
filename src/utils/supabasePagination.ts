/**
 * Utility for paginated Supabase queries to handle large datasets
 * Bypasses the 1000 row limit by fetching in batches
 */
import { supabase } from '@/integrations/supabase/client';

export interface PaginationOptions {
  pageSize?: number;
  orderBy?: string;
  ascending?: boolean;
  onProgress?: (loaded: number, total?: number) => void;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

/**
 * Fetches ALL rows from a table, bypassing the 1000 row limit
 * Uses cursor-based pagination for efficiency
 */
export async function fetchAllRows<T>(
  tableName: string,
  userId: string,
  options: PaginationOptions = {}
): Promise<T[]> {
  const { 
    pageSize = 500, 
    orderBy = 'created_at', 
    ascending = false,
    onProgress 
  } = options;
  
  const allData: T[] = [];
  let lastValue: any = null;
  let lastId: string | null = null;
  let hasMore = true;
  let iteration = 0;
  const maxIterations = 200; // Safety limit (100,000 products max)

  console.log(`📦 Starting paginated fetch for ${tableName}...`);

  while (hasMore && iteration < maxIterations) {
    iteration++;
    
    let query = supabase
      .from(tableName as any)
      .select('*')
      .eq('user_id', userId)
      .order(orderBy, { ascending })
      .order('id', { ascending: true }) // Secondary sort for consistency
      .limit(pageSize);

    // Apply cursor pagination
    if (lastValue !== null && lastId !== null) {
      if (ascending) {
        query = query.or(`${orderBy}.gt.${lastValue},and(${orderBy}.eq.${lastValue},id.gt.${lastId})`);
      } else {
        query = query.or(`${orderBy}.lt.${lastValue},and(${orderBy}.eq.${lastValue},id.gt.${lastId})`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${tableName} page ${iteration}:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    allData.push(...(data as T[]));
    
    // Update cursor for next page
    const lastRow = data[data.length - 1] as any;
    lastValue = lastRow[orderBy];
    lastId = lastRow.id;
    
    // Check if we got less than pageSize (meaning no more data)
    hasMore = data.length === pageSize;

    // Report progress
    if (onProgress) {
      onProgress(allData.length);
    }

    console.log(`✅ Page ${iteration}: fetched ${data.length} rows (total: ${allData.length})`);
  }

  console.log(`🎉 Completed fetch: ${allData.length} total rows from ${tableName}`);
  return allData;
}

/**
 * Fetches a page of data with total count
 */
export async function fetchPage<T>(
  tableName: string,
  userId: string,
  page: number = 0,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const { pageSize = 50, orderBy = 'created_at', ascending = false } = options;
  const offset = page * pageSize;

  // Get count first
  const { count, error: countError } = await supabase
    .from(tableName as any)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw countError;
  }

  // Then get page data
  const { data, error } = await supabase
    .from(tableName as any)
    .select('*')
    .eq('user_id', userId)
    .order(orderBy, { ascending })
    .range(offset, offset + pageSize - 1);

  if (error) {
    throw error;
  }

  return {
    data: (data || []) as T[],
    total: count || 0,
    hasMore: offset + (data?.length || 0) < (count || 0)
  };
}

/**
 * Streams data in batches, useful for processing large datasets
 */
export async function* streamRows<T>(
  tableName: string,
  userId: string,
  options: PaginationOptions = {}
): AsyncGenerator<T[], void, unknown> {
  const { pageSize = 500, orderBy = 'created_at', ascending = false } = options;
  
  let lastValue: any = null;
  let lastId: string | null = null;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from(tableName as any)
      .select('*')
      .eq('user_id', userId)
      .order(orderBy, { ascending })
      .order('id', { ascending: true })
      .limit(pageSize);

    if (lastValue !== null && lastId !== null) {
      if (ascending) {
        query = query.or(`${orderBy}.gt.${lastValue},and(${orderBy}.eq.${lastValue},id.gt.${lastId})`);
      } else {
        query = query.or(`${orderBy}.lt.${lastValue},and(${orderBy}.eq.${lastValue},id.gt.${lastId})`);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    const lastRow = data[data.length - 1] as any;
    lastValue = lastRow[orderBy];
    lastId = lastRow.id;
    hasMore = data.length === pageSize;

    yield data as T[];
  }
}

/**
 * Batch insert with retry logic for large datasets
 */
export async function batchInsert<T extends Record<string, any>>(
  tableName: string,
  items: T[],
  options: { batchSize?: number; onProgress?: (inserted: number, total: number) => void } = {}
): Promise<{ success: number; failed: number; errors: string[] }> {
  const { batchSize = 100, onProgress } = options;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  console.log(`📤 Starting batch insert of ${items.length} items to ${tableName}...`);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      const { error } = await supabase
        .from(tableName as any)
        .insert(batch);

      if (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error);
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        success += batch.length;
      }
    } catch (err: any) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} exception:`, err);
      failed += batch.length;
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err.message}`);
    }

    if (onProgress) {
      onProgress(success + failed, items.length);
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log(`✅ Batch insert complete: ${success} success, ${failed} failed`);
  return { success, failed, errors };
}

/**
 * Batch upsert with conflict handling
 */
export async function batchUpsert<T extends Record<string, any>>(
  tableName: string,
  items: T[],
  conflictColumns: string[],
  options: { batchSize?: number; onProgress?: (processed: number, total: number) => void } = {}
): Promise<{ success: number; failed: number; errors: string[] }> {
  const { batchSize = 50, onProgress } = options;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  console.log(`📤 Starting batch upsert of ${items.length} items to ${tableName}...`);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      const { error } = await supabase
        .from(tableName as any)
        .upsert(batch, { 
          onConflict: conflictColumns.join(','),
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Upsert batch ${Math.floor(i / batchSize) + 1} error:`, error);
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        success += batch.length;
      }
    } catch (err: any) {
      console.error(`Upsert batch ${Math.floor(i / batchSize) + 1} exception:`, err);
      failed += batch.length;
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err.message}`);
    }

    if (onProgress) {
      onProgress(success + failed, items.length);
    }

    // Small delay between batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`✅ Batch upsert complete: ${success} success, ${failed} failed`);
  return { success, failed, errors };
}
