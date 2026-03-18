import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockList, mockGet, mockCreate, mockUpdate, mockDel, mockStats, mockBulkUpdate } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockGet: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDel: vi.fn(),
  mockStats: vi.fn(),
  mockBulkUpdate: vi.fn(),
}))

vi.mock('@/services/api/client', () => ({
  productsApi: {
    list: mockList,
    get: mockGet,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDel,
    stats: mockStats,
    bulkUpdate: mockBulkUpdate,
  }
}))

import { ProductsService } from '../products.service'

describe('ProductsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProducts', () => {
    it('returns product list', async () => {
      const products = [{ id: '1', title: 'Widget' }]
      mockList.mockResolvedValue({ items: products })

      const result = await ProductsService.getProducts('user-123')
      expect(result).toEqual(products)
      expect(mockList).toHaveBeenCalledWith({ per_page: 30 })
    })

    it('returns empty array when null', async () => {
      mockList.mockResolvedValue({ items: null })
      const result = await ProductsService.getProducts('user-123')
      expect(result).toEqual([])
    })
  })

  describe('getProductsPage', () => {
    it('returns paginated results', async () => {
      mockList.mockResolvedValue({ items: [{ id: '1' }], meta: { total: 100 } })

      const result = await ProductsService.getProductsPage('user-123', 0, 30)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(100)
      expect(result.totalPages).toBe(4)
      expect(result.page).toBe(0)
      expect(result.pageSize).toBe(30)
    })

    it('handles missing meta', async () => {
      mockList.mockResolvedValue({ items: [], meta: null })

      const result = await ProductsService.getProductsPage('user-123', 0, 50)
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('searchProducts', () => {
    it('passes search term', async () => {
      mockList.mockResolvedValue({ items: [{ id: '1', title: 'Blue Widget' }] })

      const result = await ProductsService.searchProducts('user-123', 'blue')
      expect(mockList).toHaveBeenCalledWith({ q: 'blue', per_page: 50 })
      expect(result).toHaveLength(1)
    })
  })

  describe('CRUD operations', () => {
    it('creates a product', async () => {
      mockCreate.mockResolvedValue({ id: '2', title: 'New' })
      const result = await ProductsService.createProduct({ title: 'New' } as any)
      expect(result.id).toBe('2')
    })

    it('updates a product', async () => {
      mockUpdate.mockResolvedValue({ id: '1', title: 'Updated', status: 'active', updated_at: new Date().toISOString() })
      const result = await ProductsService.updateProduct('1', 'user-123', { title: 'Updated' } as any)
      expect(result.id).toBe('1')
    })

    it('deletes a product', async () => {
      mockDel.mockResolvedValue(undefined)
      await expect(ProductsService.deleteProduct('1', 'user-123')).resolves.not.toThrow()
    })
  })

  describe('bulk operations', () => {
    it('bulk deletes by archiving', async () => {
      mockBulkUpdate.mockResolvedValue({ success: true })
      await ProductsService.bulkDelete(['1', '2'], 'user-123')
      expect(mockBulkUpdate).toHaveBeenCalledWith(['1', '2'], { status: 'archived' })
    })

    it('bulk updates status', async () => {
      mockBulkUpdate.mockResolvedValue({ success: true })
      await ProductsService.bulkUpdateStatus(['1', '2'], 'user-123', 'active')
      expect(mockBulkUpdate).toHaveBeenCalledWith(['1', '2'], { status: 'active' })
    })
  })
})
