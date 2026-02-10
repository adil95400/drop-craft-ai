import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { job_id: 'bulk-job-1' }, error: null })
    }
  }
}))

vi.mock('@/services/api/client', () => ({
  importJobsApi: {
    get: vi.fn().mockResolvedValue({ status: 'completed', progress: { processed: 10, total: 10, success: 10, failed: 0 } }),
    cancel: vi.fn().mockResolvedValue({ job_id: 'bulk-job-1', status: 'cancelled' })
  }
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }
}))

import { useBulkImport } from '../useBulkImport'
import { toast } from 'sonner'

describe('useBulkImport', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useBulkImport())
    expect(result.current.isImporting).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.currentJobId).toBeNull()
  })

  it('shows error toast when products array is empty', async () => {
    const { result } = renderHook(() => useBulkImport())
    
    await act(async () => {
      const jobId = await result.current.startBulkImport([], 'csv')
      expect(jobId).toBeNull()
    })
    
    expect(toast.error).toHaveBeenCalledWith('Aucun produit à importer')
  })

  it('exports cancelImport function', () => {
    const { result } = renderHook(() => useBulkImport())
    expect(typeof result.current.cancelImport).toBe('function')
  })

  it('exports startBulkImport function', () => {
    const { result } = renderHook(() => useBulkImport())
    expect(typeof result.current.startBulkImport).toBe('function')
  })
})
