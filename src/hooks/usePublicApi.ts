import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UsePublicApiOptions {
  apiKey?: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function usePublicApi(options: UsePublicApiOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const baseUrl = 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/public-api'

  const request = useCallback(
    async <T = any>(
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
      body?: any
    ): Promise<{ data: T | null; error: string | null }> => {
      setLoading(true)
      setError(null)

      try {
        const apiKey = options.apiKey
        
        if (!apiKey) {
          throw new Error('API key is required')
        }

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          body: body ? JSON.stringify(body) : undefined
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error ${response.status}`)
        }

        const data = method === 'DELETE' ? null : await response.json()
        
        options.onSuccess?.(data)
        return { data, error: null }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        options.onError?.(errorMessage)
        
        toast({
          title: 'Erreur API',
          description: errorMessage,
          variant: 'destructive'
        })
        
        return { data: null, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [options, toast]
  )

  return {
    loading,
    error,
    
    // Product endpoints
    getProducts: useCallback(
      (params?: { limit?: number; offset?: number; category?: string }) => {
        const query = new URLSearchParams()
        if (params?.limit) query.set('limit', params.limit.toString())
        if (params?.offset) query.set('offset', params.offset.toString())
        if (params?.category) query.set('category', params.category)
        
        return request(`/products?${query}`, 'GET')
      },
      [request]
    ),
    
    getProduct: useCallback(
      (id: string) => request(`/products/${id}`, 'GET'),
      [request]
    ),
    
    createProduct: useCallback(
      (data: any) => request('/products', 'POST', data),
      [request]
    ),
    
    updateProduct: useCallback(
      (id: string, data: any) => request(`/products/${id}`, 'PUT', data),
      [request]
    ),
    
    deleteProduct: useCallback(
      (id: string) => request(`/products/${id}`, 'DELETE'),
      [request]
    ),
    
    // Order endpoints
    getOrders: useCallback(
      (params?: { limit?: number; status?: string }) => {
        const query = new URLSearchParams()
        if (params?.limit) query.set('limit', params.limit.toString())
        if (params?.status) query.set('status', params.status)
        
        return request(`/orders?${query}`, 'GET')
      },
      [request]
    ),
    
    // Customer endpoints
    getCustomers: useCallback(
      () => request('/customers', 'GET'),
      [request]
    ),
    
    // Generic request method
    request
  }
}
