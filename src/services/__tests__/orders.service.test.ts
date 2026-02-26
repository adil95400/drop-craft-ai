import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase with chainable methods
const mockData = vi.fn()
const mockSingle = vi.fn()
const mockLimit = vi.fn()
const mockOrder = vi.fn()
const mockEq = vi.fn()
const mockOr = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

const chain = () => ({
  select: mockSelect.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  or: mockOr.mockReturnThis(),
  order: mockOrder.mockReturnThis(),
  limit: mockLimit,
  single: mockSingle,
  gte: mockGte.mockReturnThis(),
  lte: mockLte.mockReturnThis(),
  insert: mockInsert.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  delete: mockDelete.mockReturnThis(),
})

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => chain())
  }
}))

import { OrdersService } from '../orders.service'

describe('OrdersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrders', () => {
    it('returns orders array on success', async () => {
      const mockOrders = [
        { id: '1', status: 'pending', total_amount: 50 },
        { id: '2', status: 'shipped', total_amount: 120 }
      ]
      mockLimit.mockResolvedValue({ data: mockOrders, error: null })

      const result = await OrdersService.getOrders('user-123')
      expect(result).toEqual(mockOrders)
    })

    it('returns empty array on error', async () => {
      mockLimit.mockResolvedValue({ data: null, error: new Error('DB error') })

      const result = await OrdersService.getOrders('user-123')
      expect(result).toEqual([])
    })
  })

  describe('getOrder', () => {
    it('returns single order', async () => {
      const mockOrder = { id: '1', status: 'pending', total_amount: 50, order_items: [] }
      mockSingle.mockResolvedValue({ data: mockOrder, error: null })

      const result = await OrdersService.getOrder('1', 'user-123')
      expect(result).toEqual(mockOrder)
    })

    it('throws on error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error('Not found') })

      await expect(OrdersService.getOrder('999', 'user-123')).rejects.toThrow()
    })
  })

  describe('getOrderStats', () => {
    it('computes stats from orders', async () => {
      const mockOrders = [
        { status: 'pending', total_amount: 50, payment_status: 'unpaid' },
        { status: 'shipped', total_amount: 100, payment_status: 'paid' },
        { status: 'delivered', total_amount: 75, payment_status: 'paid' },
        { status: 'cancelled', total_amount: 30, payment_status: 'refunded' },
      ]
      mockEq.mockResolvedValue({ data: mockOrders, error: null })

      const stats = await OrdersService.getOrderStats('user-123')
      expect(stats.total).toBe(4)
      expect(stats.pending).toBe(1)
      expect(stats.shipped).toBe(1)
      expect(stats.delivered).toBe(1)
      expect(stats.cancelled).toBe(1)
      expect(stats.revenue).toBe(255)
    })

    it('returns zeroed stats on error', async () => {
      mockEq.mockResolvedValue({ data: null, error: new Error('Fail') })

      const stats = await OrdersService.getOrderStats('user-123')
      expect(stats.total).toBe(0)
      expect(stats.revenue).toBe(0)
    })
  })

  describe('searchOrders', () => {
    it('returns matching orders', async () => {
      const mockOrders = [{ id: '1', order_number: 'ORD-001' }]
      mockLimit.mockResolvedValue({ data: mockOrders, error: null })

      const result = await OrdersService.searchOrders('user-123', 'ORD-001')
      expect(result).toEqual(mockOrders)
    })

    it('returns empty array when no match', async () => {
      mockLimit.mockResolvedValue({ data: null, error: new Error('err') })

      const result = await OrdersService.searchOrders('user-123', 'nonexistent')
      expect(result).toEqual([])
    })
  })

  describe('filterByStatus', () => {
    it('returns filtered orders', async () => {
      const mockOrders = [{ id: '1', status: 'shipped' }]
      mockLimit.mockResolvedValue({ data: mockOrders, error: null })

      const result = await OrdersService.filterByStatus('user-123', 'shipped')
      expect(result).toEqual(mockOrders)
    })
  })
})
