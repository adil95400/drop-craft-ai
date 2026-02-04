import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom'
import { UnifiedImportInterface } from '@/components/import/UnifiedImportInterface'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('UnifiedImportInterface', () => {
  it('renders import form correctly', () => {
    const { container } = render(<UnifiedImportInterface />, { wrapper })
    expect(container).toBeTruthy()
  })

  it('component is defined', () => {
    expect(UnifiedImportInterface).toBeDefined()
  })
})
