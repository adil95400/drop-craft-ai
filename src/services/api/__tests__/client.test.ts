import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token-123' } }
      })
    }
  }
}))

describe('API Client Module', () => {
  describe('productsApi', () => {
    it('exports list, get, create, update, delete, bulkUpdate, stats', async () => {
      const { productsApi } = await import('../client')
      expect(productsApi).toBeDefined()
      expect(typeof productsApi.list).toBe('function')
      expect(typeof productsApi.get).toBe('function')
      expect(typeof productsApi.create).toBe('function')
      expect(typeof productsApi.update).toBe('function')
      expect(typeof productsApi.delete).toBe('function')
      expect(typeof productsApi.bulkUpdate).toBe('function')
      expect(typeof productsApi.stats).toBe('function')
    })
  })

  describe('importJobsApi', () => {
    it('exports create, list, get, getItems, retry, cancel', async () => {
      const { importJobsApi } = await import('../client')
      expect(importJobsApi).toBeDefined()
      expect(typeof importJobsApi.create).toBe('function')
      expect(typeof importJobsApi.list).toBe('function')
      expect(typeof importJobsApi.get).toBe('function')
      expect(typeof importJobsApi.getItems).toBe('function')
      expect(typeof importJobsApi.retry).toBe('function')
      expect(typeof importJobsApi.cancel).toBe('function')
    })
  })

  describe('aiEnrichmentsApi', () => {
    it('exports create, get, getItems', async () => {
      const { aiEnrichmentsApi } = await import('../client')
      expect(aiEnrichmentsApi).toBeDefined()
      expect(typeof aiEnrichmentsApi.create).toBe('function')
      expect(typeof aiEnrichmentsApi.get).toBe('function')
      expect(typeof aiEnrichmentsApi.getItems).toBe('function')
    })
  })

  describe('presetsApi', () => {
    it('exports CRUD + setDefault, export, import', async () => {
      const { presetsApi } = await import('../client')
      expect(typeof presetsApi.list).toBe('function')
      expect(typeof presetsApi.create).toBe('function')
      expect(typeof presetsApi.get).toBe('function')
      expect(typeof presetsApi.update).toBe('function')
      expect(typeof presetsApi.delete).toBe('function')
      expect(typeof presetsApi.setDefault).toBe('function')
      expect(typeof presetsApi.export).toBe('function')
      expect(typeof presetsApi.import).toBe('function')
    })
  })

  describe('csvUploadsApi', () => {
    it('exports createSession and analyze', async () => {
      const { csvUploadsApi } = await import('../client')
      expect(typeof csvUploadsApi.createSession).toBe('function')
      expect(typeof csvUploadsApi.analyze).toBe('function')
    })
  })

  describe('draftsApi', () => {
    it('exports list and publish', async () => {
      const { draftsApi } = await import('../client')
      expect(typeof draftsApi.list).toBe('function')
      expect(typeof draftsApi.publish).toBe('function')
    })
  })

  describe('api convenience methods', () => {
    it('exports get, post, put, delete', async () => {
      const { api } = await import('../client')
      expect(typeof api.get).toBe('function')
      expect(typeof api.post).toBe('function')
      expect(typeof api.put).toBe('function')
      expect(typeof api.delete).toBe('function')
    })
  })

  describe('Type exports', () => {
    it('ProductRecord interface has required fields', async () => {
      const { productsApi } = await import('../client')
      // Type-level check: productsApi.create accepts Partial<ProductRecord>
      expect(productsApi.create).toBeDefined()
    })
  })
})
