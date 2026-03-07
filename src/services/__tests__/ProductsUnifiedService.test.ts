/**
 * Tests for ProductsUnifiedService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductsUnifiedService } from '@/services/ProductsUnifiedService'

// Mock the API client
vi.mock('@/services/api/client', () => {
  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: 29.99,
    cost_price: 12.50,
    status: 'active',
    stock_quantity: 50,
    sku: 'TEST-001',
    category: 'electronics',
    images: ['https://example.com/img.jpg'],
    variants: [],
    brand: 'TestBrand',
    tags: ['test'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    profit_margin: 58,
    seo_title: null,
    seo_description: null,
    barcode: null,
    weight: null,
    weight_unit: null,
    vendor: null,
    product_type: null,
    is_published: true,
    view_count: 0,
    compare_at_price: null,
  }

  return {
    productsApi: {
      list: vi.fn().mockResolvedValue({ items: [mockProduct], total: 1, page: 1, per_page: 100 }),
      get: vi.fn().mockResolvedValue(mockProduct),
      create: vi.fn().mockResolvedValue({ id: 'prod-new' }),
      update: vi.fn().mockResolvedValue(mockProduct),
      delete: vi.fn().mockResolvedValue(undefined),
      bulkUpdate: vi.fn().mockResolvedValue({ updated: 3 }),
      stats: vi.fn().mockResolvedValue({ total: 10, active: 8, draft: 2 }),
    },
  }
})

describe('ProductsUnifiedService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllProducts', () => {
    it('returns mapped products', async () => {
      const products = await ProductsUnifiedService.getAllProducts('user-1')
      expect(products).toHaveLength(1)
      expect(products[0].name).toBe('Test Product')
      expect(products[0].price).toBe(29.99)
      expect(products[0].source).toBe('products')
    })

    it('passes filters to API', async () => {
      const { productsApi } = await import('@/services/api/client')
      await ProductsUnifiedService.getAllProducts('user-1', { search: 'phone', status: 'active' })
      expect(productsApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'phone', status: 'active' })
      )
    })

    it('handles pagination options', async () => {
      const { productsApi } = await import('@/services/api/client')
      await ProductsUnifiedService.getAllProducts('user-1', undefined, { page: 2, perPage: 25 })
      expect(productsApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, per_page: 25 })
      )
    })
  })

  describe('getProduct', () => {
    it('returns a single mapped product', async () => {
      const product = await ProductsUnifiedService.getProduct('prod-1')
      expect(product.id).toBe('prod-1')
      expect(product.image_url).toBe('https://example.com/img.jpg')
    })
  })

  describe('upsertProduct', () => {
    it('creates a new product when no id', async () => {
      const { productsApi } = await import('@/services/api/client')
      await ProductsUnifiedService.upsertProduct('user-1', { name: 'New', price: 10 })
      expect(productsApi.create).toHaveBeenCalled()
      expect(productsApi.get).toHaveBeenCalledWith('prod-new')
    })

    it('updates existing product when id provided', async () => {
      const { productsApi } = await import('@/services/api/client')
      await ProductsUnifiedService.upsertProduct('user-1', { id: 'prod-1', name: 'Updated', price: 20 })
      expect(productsApi.update).toHaveBeenCalledWith('prod-1', expect.objectContaining({ name: 'Updated' }))
    })

    it('strips undefined fields from body', async () => {
      const { productsApi } = await import('@/services/api/client')
      await ProductsUnifiedService.upsertProduct('user-1', { name: 'Clean', price: 5 })
      const callArg = (productsApi.create as any).mock.calls[0][0]
      expect(callArg).not.toHaveProperty('barcode')
      expect(callArg).not.toHaveProperty('weight')
    })
  })

  describe('deleteProduct', () => {
    it('calls API delete', async () => {
      const { productsApi } = await import('@/services/api/client')
      await ProductsUnifiedService.deleteProduct('user-1', 'prod-1')
      expect(productsApi.delete).toHaveBeenCalledWith('prod-1')
    })
  })

  describe('bulkUpdate', () => {
    it('returns updated count', async () => {
      const count = await ProductsUnifiedService.bulkUpdate(['p1', 'p2', 'p3'], { status: 'archived' } as any)
      expect(count).toBe(3)
    })
  })

  describe('getStats', () => {
    it('returns stats from API', async () => {
      const stats = await ProductsUnifiedService.getStats()
      expect(stats).toEqual({ total: 10, active: 8, draft: 2 })
    })
  })

  describe('consolidateProducts (deprecated)', () => {
    it('returns 0 (no-op)', async () => {
      const result = await ProductsUnifiedService.consolidateProducts('user-1')
      expect(result).toBe(0)
    })
  })
})
