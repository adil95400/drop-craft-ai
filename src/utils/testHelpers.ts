// Test helpers and utilities for comprehensive testing

import { supabase } from '@/integrations/supabase/client'

/**
 * Verify database connection is working
 */
export async function verifyDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Verify edge function is deployed and responding
 */
export async function verifyEdgeFunction(functionName: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
  const startTime = Date.now()
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { test: true }
    })
    const responseTime = Date.now() - startTime
    
    if (error) throw error
    return { success: true, responseTime }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Verify authentication is configured
 */
export async function verifyAuth(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Test data creation helpers
 */
export const testDataHelpers = {
  createTestProduct: (userId: string) => ({
    user_id: userId,
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    price: 29.99,
    status: 'active' as const,
    sku: `TEST-${Date.now()}`,
    stock_quantity: 100
  }),

  createTestCustomer: (userId: string) => ({
    user_id: userId,
    email: `test-${Date.now()}@example.com`,
    first_name: 'Test',
    last_name: 'Customer',
    status: 'active' as const,
    total_orders: 0,
    total_spent: 0
  }),

  createTestOrder: (userId: string) => ({
    user_id: userId,
    order_number: `ORD-${Date.now()}`,
    status: 'pending' as const,
    total_amount: 99.99,
    currency: 'EUR',
    payment_status: 'pending' as const
  })
}

/**
 * Performance measurement utility
 */
export function measurePerformance<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      resolve({ result, duration })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Batch operation tester
 */
export async function testBatchOperation<T>(
  operation: (items: T[]) => Promise<any>,
  items: T[],
  batchSize: number = 10
): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
  const errors: string[] = []
  let processedCount = 0

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    try {
      await operation(batch)
      processedCount += batch.length
    } catch (error) {
      errors.push(`Batch ${i / batchSize + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    success: errors.length === 0,
    processedCount,
    errors
  }
}
