/**
 * Tests for useCatalogHealth hook
 * Validates catalog health scoring, trend calculation, and edge cases
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockProducts = [
  {
    id: '1', name: 'Complete Product', image_url: 'http://img.com/1.jpg',
    category: 'Electronics', price: 99, stock_quantity: 50,
    profit_margin: 30, supplier_name: 'Supplier A', sku: 'SKU-1',
    status: 'active', user_id: 'u1', created_at: '', updated_at: '',
  },
  {
    id: '2', name: 'Missing Image', image_url: null,
    category: 'Fashion', price: 49, stock_quantity: 0,
    profit_margin: 5, supplier_name: null, sku: null,
    status: 'draft', user_id: 'u1', created_at: '', updated_at: '',
  },
  {
    id: '3', name: 'Low Stock', image_url: 'http://img.com/3.jpg',
    category: null, price: 0, stock_quantity: 2,
    profit_margin: 8, supplier_name: 'Supplier B', sku: 'SKU-3',
    status: 'active', user_id: 'u1', created_at: '', updated_at: '',
  },
]

vi.mock('@/hooks/unified', () => ({
  useProductsUnified: () => ({
    products: mockProducts,
    isLoading: false,
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }),
  },
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCatalogHealth', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('computes correct totals', async () => {
    const { useCatalogHealth } = await import('../useCatalogHealth')
    const { result } = renderHook(() => useCatalogHealth(), { wrapper: createWrapper() })

    // useMemo runs synchronously with the mocked products
    expect(result.current.metrics).not.toBeNull()
    expect(result.current.metrics!.total).toBe(3)
  })

  it('identifies optimized products (image + category + price + stock)', async () => {
    const { useCatalogHealth } = await import('../useCatalogHealth')
    const { result } = renderHook(() => useCatalogHealth(), { wrapper: createWrapper() })

    // Only product #1 has all four
    expect(result.current.metrics!.optimizedCount).toBe(1)
  })

  it('identifies blocking products (no image OR stock=0 OR price=0)', async () => {
    const { useCatalogHealth } = await import('../useCatalogHealth')
    const { result } = renderHook(() => useCatalogHealth(), { wrapper: createWrapper() })

    // #2 missing image + stock=0, #3 price=0 → 2 blocking
    expect(result.current.metrics!.blockingCount).toBe(2)
  })

  it('computes global score between 0 and 100', async () => {
    const { useCatalogHealth } = await import('../useCatalogHealth')
    const { result } = renderHook(() => useCatalogHealth(), { wrapper: createWrapper() })

    const score = result.current.metrics!.globalScore
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns trend 0 when no snapshots', async () => {
    const { useCatalogHealth } = await import('../useCatalogHealth')
    const { result } = renderHook(() => useCatalogHealth(), { wrapper: createWrapper() })

    expect(result.current.metrics!.trend).toBe(0)
  })

  it('generates evolution array with date and score', async () => {
    const { useCatalogHealth } = await import('../useCatalogHealth')
    const { result } = renderHook(() => useCatalogHealth(), { wrapper: createWrapper() })

    expect(result.current.evolution.length).toBeGreaterThan(0)
    expect(result.current.evolution[0]).toHaveProperty('date')
    expect(result.current.evolution[0]).toHaveProperty('score')
  })

  it('computes detail counts', async () => {
    const { useCatalogHealth } = await import('../useCatalogHealth')
    const { result } = renderHook(() => useCatalogHealth(), { wrapper: createWrapper() })

    const d = result.current.metrics!.details
    expect(d.withImages).toBe(2) // #1 and #3
    expect(d.withPrice).toBe(2)  // #1 and #2
    expect(d.withStock).toBe(2)  // #1 and #3
  })
})
