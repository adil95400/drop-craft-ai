import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockList = vi.fn()
const mockGet = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDel = vi.fn()
const mockStats = vi.fn()

vi.mock('@/services/api/client', () => ({
  customersApi: {
    list: mockList,
    get: mockGet,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDel,
    stats: mockStats,
  }
}))

import { CustomersService } from '../customers.service'

describe('CustomersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCustomers', () => {
    it('returns customer list', async () => {
      const customers = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]
      mockList.mockResolvedValue({ items: customers })

      const result = await CustomersService.getCustomers('user-123')
      expect(result).toEqual(customers)
      expect(mockList).toHaveBeenCalledWith({ per_page: 100 })
    })

    it('returns empty array when items is null', async () => {
      mockList.mockResolvedValue({ items: null })

      const result = await CustomersService.getCustomers('user-123')
      expect(result).toEqual([])
    })
  })

  describe('searchCustomers', () => {
    it('passes search term to API', async () => {
      mockList.mockResolvedValue({ items: [{ id: '1', name: 'Alice' }] })

      const result = await CustomersService.searchCustomers('user-123', 'Alice')
      expect(mockList).toHaveBeenCalledWith({ q: 'Alice', per_page: 100 })
      expect(result).toHaveLength(1)
    })
  })

  describe('segmentCustomers', () => {
    it('segments customers by spending', async () => {
      const customers = [
        { id: '1', total_spent: 2000, total_orders: 10 },  // VIP
        { id: '2', total_spent: 500, total_orders: 5 },     // Regular
        { id: '3', total_spent: 10, total_orders: 1 },      // New
        { id: '4', total_spent: 0, total_orders: 0 },       // Inactive
      ]
      mockList.mockResolvedValue({ items: customers })

      const segments = await CustomersService.segmentCustomers('user-123')
      expect(segments.vip).toHaveLength(1)
      expect(segments.vip[0].id).toBe('1')
      expect(segments.regular).toHaveLength(1)
      expect(segments.regular[0].id).toBe('2')
      expect(segments.new).toHaveLength(2) // id 3 and 4 both have < 2 orders
      expect(segments.inactive).toHaveLength(1)
      expect(segments.inactive[0].id).toBe('4')
    })
  })

  describe('CRUD operations', () => {
    it('creates a customer', async () => {
      const newCustomer = { name: 'Charlie', email: 'charlie@example.com' }
      mockCreate.mockResolvedValue({ id: '3', ...newCustomer })

      const result = await CustomersService.createCustomer(newCustomer)
      expect(result.id).toBe('3')
      expect(mockCreate).toHaveBeenCalledWith(newCustomer)
    })

    it('updates a customer', async () => {
      mockUpdate.mockResolvedValue({ id: '1', name: 'Alice Updated' })

      const result = await CustomersService.updateCustomer('1', 'user-123', { name: 'Alice Updated' })
      expect(result.name).toBe('Alice Updated')
    })

    it('deletes a customer', async () => {
      mockDel.mockResolvedValue(undefined)

      await expect(CustomersService.deleteCustomer('1', 'user-123')).resolves.not.toThrow()
      expect(mockDel).toHaveBeenCalledWith('1')
    })
  })
})
