import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom'
import ShopifyStoreImportPage from '@/pages/ShopifyStoreImportPage'

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

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(() => Promise.resolve({
        data: { success: true, imported: 10, variants: 5 },
        error: null
      }))
    }
  }
}))

describe('ShopifyStoreImportPage', () => {
  it('renders the page correctly', () => {
    const { container } = render(<ShopifyStoreImportPage />, { wrapper })
    expect(container).toBeTruthy()
  })

  it('component is defined', () => {
    expect(ShopifyStoreImportPage).toBeDefined()
  })
})
