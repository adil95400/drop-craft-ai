import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
