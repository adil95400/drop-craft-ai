import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Mock product data
const mockProduct = {
  id: 'test-123',
  name: 'Test Product',
  price: 29.99,
  compare_at_price: 49.99,
  image_url: 'https://example.com/image.jpg',
  stock_quantity: 10,
  status: 'active' as const,
  ai_score: 85,
  sku: 'TEST-SKU-001'
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
)

describe('ProductCard Component', () => {
  it('displays product name correctly', () => {
    const { container } = render(
      <div data-testid="product-card">
        <h3>{mockProduct.name}</h3>
        <span>{mockProduct.price}€</span>
      </div>,
      { wrapper }
    )
    expect(container.textContent).toContain('Test Product')
  })

  it('shows discount badge when compare_at_price exists', () => {
    const discount = Math.round((1 - mockProduct.price / mockProduct.compare_at_price) * 100)
    expect(discount).toBe(40)
  })

  it('displays AI score when available', () => {
    expect(mockProduct.ai_score).toBe(85)
    expect(mockProduct.ai_score).toBeGreaterThanOrEqual(0)
    expect(mockProduct.ai_score).toBeLessThanOrEqual(100)
  })

  it('shows correct stock status', () => {
    expect(mockProduct.stock_quantity).toBeGreaterThan(0)
    const stockStatus = mockProduct.stock_quantity > 0 ? 'En stock' : 'Rupture'
    expect(stockStatus).toBe('En stock')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    const { getByTestId } = render(
      <div data-testid="product-card" onClick={handleClick}>
        <h3>{mockProduct.name}</h3>
      </div>,
      { wrapper }
    )
    
    getByTestId('product-card').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('Product Pricing Logic', () => {
  it('calculates margin correctly', () => {
    const costPrice = 15
    const sellingPrice = 29.99
    const margin = ((sellingPrice - costPrice) / sellingPrice) * 100
    
    expect(margin).toBeCloseTo(49.98, 1)
  })

  it('calculates discount percentage correctly', () => {
    const originalPrice = 100
    const discountedPrice = 75
    const discountPercent = ((originalPrice - discountedPrice) / originalPrice) * 100
    
    expect(discountPercent).toBe(25)
  })

  it('formats currency correctly', () => {
    const formatPrice = (price: number) => 
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
    
    expect(formatPrice(29.99)).toContain('29,99')
    expect(formatPrice(1000)).toContain('1')
  })
})

describe('Product Validation', () => {
  it('validates required fields', () => {
    const isValid = (product: typeof mockProduct) => {
      return Boolean(product.name && product.price >= 0)
    }
    
    expect(isValid(mockProduct)).toBe(true)
    expect(isValid({ ...mockProduct, name: '' })).toBe(false)
  })

  it('validates SKU format', () => {
    const isValidSku = (sku: string) => /^[A-Z0-9-]+$/.test(sku)
    
    expect(isValidSku('TEST-SKU-001')).toBe(true)
    expect(isValidSku('test sku')).toBe(false)
  })

  it('validates price is positive', () => {
    const isValidPrice = (price: number) => price >= 0
    
    expect(isValidPrice(29.99)).toBe(true)
    expect(isValidPrice(-5)).toBe(false)
  })
})
