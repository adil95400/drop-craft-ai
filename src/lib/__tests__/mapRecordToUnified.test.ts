/**
 * Tests for product record mapping logic
 */
import { describe, it, expect, vi } from 'vitest'

// Mock API client before importing service
vi.mock('@/services/api/client', () => ({
  productsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkUpdate: vi.fn(),
    stats: vi.fn(),
  },
}))

describe('UnifiedProduct mapping', () => {
  it('maps status to valid enum or defaults to draft', async () => {
    const { ProductsUnifiedService } = await import('@/services/ProductsUnifiedService')
    const { productsApi } = await import('@/services/api/client')
    
    ;(productsApi.get as any).mockResolvedValue({
      id: 'p1',
      name: 'Test',
      price: 10,
      status: 'invalid_status',
      images: [],
      variants: [],
      tags: [],
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })

    const product = await ProductsUnifiedService.getProduct('p1')
    expect(product.status).toBe('draft') // fallback
  })

  it('extracts first image as image_url', async () => {
    const { ProductsUnifiedService } = await import('@/services/ProductsUnifiedService')
    const { productsApi } = await import('@/services/api/client')
    
    ;(productsApi.get as any).mockResolvedValue({
      id: 'p2',
      name: 'Multi Image',
      price: 20,
      status: 'active',
      images: ['img1.jpg', 'img2.jpg'],
      variants: [],
      tags: [],
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })

    const product = await ProductsUnifiedService.getProduct('p2')
    expect(product.image_url).toBe('img1.jpg')
    expect(product.images).toEqual(['img1.jpg', 'img2.jpg'])
  })

  it('handles null/missing optional fields gracefully', async () => {
    const { ProductsUnifiedService } = await import('@/services/ProductsUnifiedService')
    const { productsApi } = await import('@/services/api/client')
    
    ;(productsApi.get as any).mockResolvedValue({
      id: 'p3',
      name: 'Minimal',
      price: 5,
      status: 'draft',
      images: null,
      variants: null,
      tags: null,
      cost_price: null,
      brand: null,
      seo_title: null,
      seo_description: null,
      barcode: null,
      weight: null,
      weight_unit: null,
      vendor: null,
      product_type: null,
      compare_at_price: null,
      profit_margin: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })

    const product = await ProductsUnifiedService.getProduct('p3')
    expect(product.image_url).toBeUndefined()
    expect(product.images).toEqual([])
    expect(product.variants).toEqual([])
    expect(product.cost_price).toBeUndefined()
    expect(product.brand).toBeUndefined()
  })
})
