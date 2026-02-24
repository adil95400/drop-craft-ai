/**
 * Tests for useAttributeAnalysis hook
 * Validates attribute completeness scoring, marketplace readiness, and issue detection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const completeProduct = {
  id: 'p1', name: 'Nike Air Max', description: 'A great shoe for running and training, with excellent cushioning and support.',
  category: 'Shoes', sku: 'NIKE-AM-001', image_url: 'http://img/1.jpg',
  brand: 'Nike', barcode: '1234567890123', price: 120, stock_quantity: 50,
  supplier_name: 'Nike Corp', supplier: null, status: 'active', user_id: 'u1', created_at: '', updated_at: '',
}

const incompleteProduct = {
  id: 'p2', name: 'Mystery Item', description: 'Short',
  category: null, sku: null, image_url: null,
  brand: null, barcode: null, price: 0, stock_quantity: 0,
  supplier_name: null, supplier: null, status: 'draft', user_id: 'u1', created_at: '', updated_at: '',
}

vi.mock('@/hooks/unified', () => ({
  useProductsUnified: () => ({
    products: [completeProduct, incompleteProduct],
    isLoading: false,
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }) },
  },
}))

describe('useAttributeAnalysis', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('computes attribute stats correctly', async () => {
    const { useAttributeAnalysis } = await import('../useAttributeAnalysis')
    const { result } = renderHook(() => useAttributeAnalysis())

    expect(result.current.stats.total).toBe(2)
    expect(result.current.stats.complete).toBe(1)
    expect(result.current.stats.incomplete).toBe(1)
  })

  it('detects missing attributes on incomplete products', async () => {
    const { useAttributeAnalysis } = await import('../useAttributeAnalysis')
    const { result } = renderHook(() => useAttributeAnalysis())

    const issues = result.current.productIssues
    expect(issues.length).toBe(1)
    expect(issues[0].product.id).toBe('p2')
    expect(issues[0].missingAttributes).toContain('Catégorie')
    expect(issues[0].missingAttributes).toContain('SKU')
    expect(issues[0].missingAttributes).toContain('Image')
  })

  it('assigns high criticality for many missing attributes', async () => {
    const { useAttributeAnalysis } = await import('../useAttributeAnalysis')
    const { result } = renderHook(() => useAttributeAnalysis())

    const issue = result.current.productIssues.find(i => i.product.id === 'p2')
    expect(issue?.criticality).toBe('high')
  })

  it('computes completeness score between 0 and 100', async () => {
    const { useAttributeAnalysis } = await import('../useAttributeAnalysis')
    const { result } = renderHook(() => useAttributeAnalysis())

    expect(result.current.stats.completenessScore).toBeGreaterThanOrEqual(0)
    expect(result.current.stats.completenessScore).toBeLessThanOrEqual(100)
  })

  it('generates marketplace readiness analysis for all marketplaces', async () => {
    const { useAttributeAnalysis } = await import('../useAttributeAnalysis')
    const { result } = renderHook(() => useAttributeAnalysis())

    expect(result.current.marketplaceAnalysis.length).toBeGreaterThan(0)
    const google = result.current.marketplaceAnalysis.find(m => m.marketplace === 'Google Shopping')
    expect(google).toBeDefined()
    expect(google!.readinessScore).toBeGreaterThanOrEqual(0)
    expect(google!.readinessScore).toBeLessThanOrEqual(100)
  })

  it('identifies enrichable products (missing Description, Catégorie, or Marque)', async () => {
    const { useAttributeAnalysis } = await import('../useAttributeAnalysis')
    const { result } = renderHook(() => useAttributeAnalysis())

    expect(result.current.enrichableProducts.length).toBeGreaterThan(0)
  })

  it('provides AI suggestions for incomplete products', async () => {
    const { useAttributeAnalysis } = await import('../useAttributeAnalysis')
    const { result } = renderHook(() => useAttributeAnalysis())

    const suggestions = result.current.aiSuggestions
    const categorySugg = suggestions.find(s => s.attribute === 'Catégorie')
    expect(categorySugg).toBeDefined()
  })

  it('exposes enrichProduct and bulkEnrich actions', async () => {
    const { useAttributeAnalysis } = await import('../useAttributeAnalysis')
    const { result } = renderHook(() => useAttributeAnalysis())

    expect(typeof result.current.enrichProduct).toBe('function')
    expect(typeof result.current.bulkEnrich).toBe('function')
  })
})
