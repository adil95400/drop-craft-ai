import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ data: [], count: 0 }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null })
          }),
        }),
        lt: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
      }),
    }),
  },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/contexts/UnifiedAuthContext', () => ({
  useUnifiedAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
  }),
}))

describe('useDashboardData', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)

  it('should return default structure', async () => {
    const { useDashboardData } = await import('../useDashboardData')
    const { result } = renderHook(() => useDashboardData(), { wrapper })

    expect(result.current.stats).toBeDefined()
    expect(result.current.activityEvents).toBeDefined()
    expect(result.current.healthMetrics).toBeDefined()
    expect(Array.isArray(result.current.healthMetrics)).toBe(true)
  })

  it('should include all health metric categories', async () => {
    const { useDashboardData } = await import('../useDashboardData')
    const { result } = renderHook(() => useDashboardData(), { wrapper })

    const metrics = result.current.healthMetrics
    const ids = metrics.map(m => m.id)
    expect(ids).toContain('catalog')
    expect(ids).toContain('orders')
    expect(ids).toContain('alerts')
    expect(ids).toContain('performance')
  })
})

describe('Dashboard Data Logic (pure functions)', () => {
  it('revenue calculation sums order amounts', () => {
    const orders = [
      { total_amount: 50 },
      { total_amount: 100 },
      { total_amount: 75.5 },
    ]
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    expect(revenue).toBe(225.5)
  })

  it('handles null total_amount gracefully', () => {
    const orders = [
      { total_amount: null },
      { total_amount: 100 },
      { total_amount: undefined },
    ]
    const revenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
    expect(revenue).toBe(100)
  })

  it('resolved alerts are filtered correctly', () => {
    const alerts = [
      { status: 'active' },
      { status: 'resolved' },
      { status: 'resolved' },
      { status: 'active' },
    ]
    const resolved = alerts.filter(a => a.status === 'resolved').length
    expect(alerts.length - resolved).toBe(2)
  })
})
