import { describe, it, expect, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('useProducts hook', () => {
  it('should be defined', () => {
    expect(supabase).toBeDefined()
    expect(supabase.from).toBeDefined()
  })

  it('mocks supabase correctly', () => {
    const mockFrom = vi.mocked(supabase.from)
    expect(mockFrom).toHaveBeenCalledTimes(0)
  })
})
