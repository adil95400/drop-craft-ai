/**
 * Supabase Unlimited Query Utility
 * Fetches ALL records without pagination limits
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TableNames = keyof Database['public']['Tables'];

const BATCH_SIZE = 1000;

/**
 * Fetch all records from a table without pagination limits
 * Uses batch fetching to overcome Supabase's 1000 row default limit
 */
export async function fetchAllRecords<T = any>(
  table: TableNames,
  options: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    userId?: string;
  } = {}
): Promise<{ data: T[] | null; error: any; count: number }> {
  const { select = '*', filters = {}, orderBy, userId } = options;
  
  let allRecords: T[] = [];
  let hasMore = true;
  let offset = 0;
  let totalError: any = null;

  while (hasMore) {
    // Build query with proper typing
    let query = (supabase.from(table) as any).select(select, { count: 'exact' });

    // Apply user filter
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    }

    // Apply pagination
    query = query.range(offset, offset + BATCH_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      totalError = error;
      break;
    }

    if (data && data.length > 0) {
      allRecords = [...allRecords, ...(data as T[])];
      offset += BATCH_SIZE;
      
      // Check if we've fetched all records
      if (data.length < BATCH_SIZE) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return {
    data: allRecords.length > 0 ? allRecords : null,
    error: totalError,
    count: allRecords.length
  };
}

/**
 * Fetch all records with a custom query builder
 * For more complex queries
 */
export async function fetchAllWithQuery<T = any>(
  buildQuery: (offset: number, limit: number) => Promise<{ data: T[] | null; error: any }>
): Promise<{ data: T[] | null; error: any; count: number }> {
  let allRecords: T[] = [];
  let hasMore = true;
  let offset = 0;
  let totalError: any = null;

  while (hasMore) {
    const { data, error } = await buildQuery(offset, BATCH_SIZE);

    if (error) {
      totalError = error;
      break;
    }

    if (data && data.length > 0) {
      allRecords = [...allRecords, ...(data as T[])];
      offset += BATCH_SIZE;
      
      if (data.length < BATCH_SIZE) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return {
    data: allRecords.length > 0 ? allRecords : null,
    error: totalError,
    count: allRecords.length
  };
}

/**
 * Hook-compatible function for fetching unlimited records
 */
export function createUnlimitedQuery(table: TableNames) {
  return {
    async fetchAll<T = any>(options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      userId?: string;
    } = {}) {
      return fetchAllRecords<T>(table, options);
    },

    async fetchByUser<T = any>(userId: string, options: Omit<Parameters<typeof fetchAllRecords>[1], 'userId'> = {}) {
      return fetchAllRecords<T>(table, { ...options, userId });
    }
  };
}

// Pre-configured queries for common tables
export const unlimitedQueries = {
  products: createUnlimitedQuery('products'),
  orders: createUnlimitedQuery('orders'),
  customers: createUnlimitedQuery('customers'),
  suppliers: createUnlimitedQuery('suppliers'),
  importJobs: createUnlimitedQuery('jobs'),
  importedProducts: createUnlimitedQuery('imported_products'),
  catalogProducts: createUnlimitedQuery('catalog_products'),
  priceHistory: createUnlimitedQuery('price_history'),
  notifications: createUnlimitedQuery('notifications'),
  activityLogs: createUnlimitedQuery('activity_logs')
};
