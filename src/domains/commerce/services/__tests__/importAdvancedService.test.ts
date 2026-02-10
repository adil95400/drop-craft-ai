import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the API client
vi.mock('@/services/api/client', () => ({
  importJobsApi: {
    create: vi.fn().mockResolvedValue({ job_id: 'job-123', status: 'pending' }),
    list: vi.fn().mockResolvedValue({ items: [], meta: { page: 1, per_page: 20, total: 0 } }),
    get: vi.fn().mockResolvedValue({ id: 'job-123', status: 'completed' }),
    getItems: vi.fn().mockResolvedValue({ items: [], meta: { page: 1, per_page: 20, total: 0 } }),
    retry: vi.fn().mockResolvedValue({ job_id: 'job-123', status: 'pending' }),
    cancel: vi.fn().mockResolvedValue({ job_id: 'job-123', status: 'cancelled' }),
  },
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))

import { importAdvancedService } from '../importAdvancedService'
import { importJobsApi } from '@/services/api/client'

describe('importAdvancedService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('importFromUrl', () => {
    it('creates a job with source url_list', async () => {
      await importAdvancedService.importFromUrl({ url: 'https://example.com/product' })
      expect(importJobsApi.create).toHaveBeenCalledWith({
        source: 'url_list',
        urls: ['https://example.com/product'],
        settings: {},
      })
    })

    it('passes config as settings', async () => {
      await importAdvancedService.importFromUrl({
        url: 'https://example.com',
        config: { auto_optimize: true, extract_images: true }
      })
      expect(importJobsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: { auto_optimize: true, extract_images: true }
        })
      )
    })
  })

  describe('importFromXml', () => {
    it('creates a job with source xml', async () => {
      await importAdvancedService.importFromXml({ xmlUrl: 'https://example.com/feed.xml' })
      expect(importJobsApi.create).toHaveBeenCalledWith({
        source: 'xml',
        urls: ['https://example.com/feed.xml'],
        settings: { mapping: {} },
      })
    })
  })

  describe('importFromFtp', () => {
    it('creates a job with source ftp', async () => {
      await importAdvancedService.importFromFtp({
        ftpUrl: 'ftp://example.com',
        username: 'user',
        password: 'pass',
        filePath: '/products.csv',
        fileType: 'csv'
      })
      expect(importJobsApi.create).toHaveBeenCalledWith({
        source: 'ftp',
        settings: expect.objectContaining({
          ftp_url: 'ftp://example.com',
          username: 'user',
          file_type: 'csv'
        })
      })
    })
  })

  describe('getImportHistory', () => {
    it('calls list with pagination params', async () => {
      await importAdvancedService.getImportHistory({ page: 2, per_page: 10 })
      expect(importJobsApi.list).toHaveBeenCalledWith({ page: 2, per_page: 10 })
    })
  })

  describe('retryJob', () => {
    it('calls retry with onlyFailed=true by default', async () => {
      await importAdvancedService.retryJob('job-456')
      expect(importJobsApi.retry).toHaveBeenCalledWith('job-456', true)
    })

    it('calls retry with onlyFailed=false when specified', async () => {
      await importAdvancedService.retryJob('job-456', false)
      expect(importJobsApi.retry).toHaveBeenCalledWith('job-456', false)
    })
  })

  describe('cancelJob', () => {
    it('calls cancel with job id', async () => {
      await importAdvancedService.cancelJob('job-789')
      expect(importJobsApi.cancel).toHaveBeenCalledWith('job-789')
    })
  })
})
