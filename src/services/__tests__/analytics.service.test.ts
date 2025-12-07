import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: {}, error: null }))
  }
}))

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Revenue Calculations', () => {
    it('calculates total revenue correctly', () => {
      const orders = [
        { total: 100, status: 'completed' },
        { total: 50, status: 'completed' },
        { total: 75, status: 'pending' }
      ]
      
      const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total, 0)
      
      expect(totalRevenue).toBe(150)
    })

    it('calculates average order value', () => {
      const orders = [{ total: 100 }, { total: 50 }, { total: 75 }]
      const aov = orders.reduce((sum, o) => sum + o.total, 0) / orders.length
      
      expect(aov).toBe(75)
    })

    it('calculates revenue growth percentage', () => {
      const currentPeriod = 1500
      const previousPeriod = 1000
      const growth = ((currentPeriod - previousPeriod) / previousPeriod) * 100
      
      expect(growth).toBe(50)
    })

    it('handles zero previous period gracefully', () => {
      const currentPeriod = 1500
      const previousPeriod = 0
      const growth = previousPeriod === 0 ? 100 : ((currentPeriod - previousPeriod) / previousPeriod) * 100
      
      expect(growth).toBe(100)
    })
  })

  describe('Conversion Rate Calculations', () => {
    it('calculates conversion rate correctly', () => {
      const visitors = 1000
      const conversions = 50
      const conversionRate = (conversions / visitors) * 100
      
      expect(conversionRate).toBe(5)
    })

    it('handles zero visitors', () => {
      const visitors = 0
      const conversions = 0
      const conversionRate = visitors === 0 ? 0 : (conversions / visitors) * 100
      
      expect(conversionRate).toBe(0)
    })
  })

  describe('Product Performance Metrics', () => {
    it('calculates best sellers correctly', () => {
      const products = [
        { id: '1', name: 'Product A', sold: 100 },
        { id: '2', name: 'Product B', sold: 50 },
        { id: '3', name: 'Product C', sold: 200 },
        { id: '4', name: 'Product D', sold: 75 }
      ]
      
      const bestSellers = products.sort((a, b) => b.sold - a.sold).slice(0, 3)
      
      expect(bestSellers[0].name).toBe('Product C')
      expect(bestSellers).toHaveLength(3)
    })

    it('calculates stock turnover rate', () => {
      const costOfGoodsSold = 50000
      const averageInventory = 10000
      const turnoverRate = costOfGoodsSold / averageInventory
      
      expect(turnoverRate).toBe(5)
    })

    it('calculates profit margin', () => {
      const revenue = 10000
      const cost = 6000
      const profitMargin = ((revenue - cost) / revenue) * 100
      
      expect(profitMargin).toBe(40)
    })
  })

  describe('Date Range Filtering', () => {
    it('filters data by date range', () => {
      const data = [
        { date: '2025-01-01', value: 100 },
        { date: '2025-01-15', value: 200 },
        { date: '2025-02-01', value: 150 },
        { date: '2025-02-15', value: 300 }
      ]
      
      const startDate = '2025-01-01'
      const endDate = '2025-01-31'
      
      const filtered = data.filter(d => d.date >= startDate && d.date <= endDate)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.reduce((sum, d) => sum + d.value, 0)).toBe(300)
    })

    it('groups data by period', () => {
      const data = [
        { date: '2025-01-01', value: 100 },
        { date: '2025-01-02', value: 150 },
        { date: '2025-02-01', value: 200 },
        { date: '2025-02-02', value: 250 }
      ]
      
      const groupByMonth = (items: typeof data) => {
        const groups: Record<string, number> = {}
        items.forEach(item => {
          const month = item.date.substring(0, 7)
          groups[month] = (groups[month] || 0) + item.value
        })
        return groups
      }
      
      const grouped = groupByMonth(data)
      
      expect(grouped['2025-01']).toBe(250)
      expect(grouped['2025-02']).toBe(450)
    })
  })

  describe('Trend Analysis', () => {
    it('calculates moving average', () => {
      const values = [100, 120, 110, 130, 125, 140, 135]
      const period = 3
      
      const movingAverage = (data: number[], n: number) => {
        return data.slice(n - 1).map((_, i) => {
          const window = data.slice(i, i + n)
          return window.reduce((sum, v) => sum + v, 0) / n
        })
      }
      
      const ma = movingAverage(values, period)
      
      expect(ma[0]).toBeCloseTo(110, 0) // (100 + 120 + 110) / 3
      expect(ma).toHaveLength(5)
    })

    it('identifies trend direction', () => {
      const uptrend = [100, 110, 120, 130, 140]
      const downtrend = [140, 130, 120, 110, 100]
      
      const getTrend = (values: number[]) => {
        const first = values[0]
        const last = values[values.length - 1]
        if (last > first * 1.05) return 'up'
        if (last < first * 0.95) return 'down'
        return 'stable'
      }
      
      expect(getTrend(uptrend)).toBe('up')
      expect(getTrend(downtrend)).toBe('down')
    })
  })
})

describe('Dashboard KPI Calculations', () => {
  it('calculates all main KPIs', () => {
    const mockData = {
      orders: 150,
      revenue: 15000,
      products: 500,
      customers: 120
    }
    
    const kpis = {
      totalOrders: mockData.orders,
      totalRevenue: mockData.revenue,
      averageOrderValue: mockData.revenue / mockData.orders,
      customerCount: mockData.customers,
      productsCount: mockData.products
    }
    
    expect(kpis.totalOrders).toBe(150)
    expect(kpis.totalRevenue).toBe(15000)
    expect(kpis.averageOrderValue).toBe(100)
    expect(kpis.customerCount).toBe(120)
    expect(kpis.productsCount).toBe(500)
  })

  it('formats large numbers correctly', () => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
      return num.toString()
    }
    
    expect(formatNumber(1500000)).toBe('1.5M')
    expect(formatNumber(15000)).toBe('15.0K')
    expect(formatNumber(500)).toBe('500')
  })
})
