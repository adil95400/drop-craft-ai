/**
 * Tests for UnifiedAuthContext
 * Validates auth state management, sign-in, sign-out, role checks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'

// ── Mock Supabase ────────────────────────────────────────────────────────────

const mockSession = {
  access_token: 'test-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: 'user-1', email: 'test@test.com' },
}

const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn((cb: any) => {
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    refreshSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
  rpc: vi.fn().mockResolvedValue({ data: false }),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: { plan: 'pro' }, error: null }),
  },
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe('UnifiedAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports provider and hook', async () => {
    const mod = await import('@/contexts/UnifiedAuthContext')
    expect(mod.UnifiedAuthProvider).toBeDefined()
    expect(mod.useUnifiedAuth).toBeDefined()
  })

  it('starts in loading state with no user', async () => {
    const { UnifiedAuthProvider, useUnifiedAuth } = await import('@/contexts/UnifiedAuthContext')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(UnifiedAuthProvider, null, children)

    const { result } = renderHook(() => useUnifiedAuth(), { wrapper })

    // Before auth resolves, user should be null
    expect(result.current.user).toBeNull()
  })

  it('signIn calls supabase auth', async () => {
    const { UnifiedAuthProvider, useUnifiedAuth } = await import('@/contexts/UnifiedAuthContext')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(UnifiedAuthProvider, null, children)

    const { result } = renderHook(() => useUnifiedAuth(), { wrapper })

    await act(async () => {
      await result.current.signIn('test@test.com', 'password123')
    })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    })
  })

  it('signOut calls supabase auth', async () => {
    const { UnifiedAuthProvider, useUnifiedAuth } = await import('@/contexts/UnifiedAuthContext')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(UnifiedAuthProvider, null, children)

    const { result } = renderHook(() => useUnifiedAuth(), { wrapper })

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('hasRole returns false when no profile', async () => {
    const { UnifiedAuthProvider, useUnifiedAuth } = await import('@/contexts/UnifiedAuthContext')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(UnifiedAuthProvider, null, children)

    const { result } = renderHook(() => useUnifiedAuth(), { wrapper })

    expect(result.current.hasRole('admin')).toBe(false)
    expect(result.current.isAdmin).toBe(false)
  })

  it('canAccess returns false when no profile', async () => {
    const { UnifiedAuthProvider, useUnifiedAuth } = await import('@/contexts/UnifiedAuthContext')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(UnifiedAuthProvider, null, children)

    const { result } = renderHook(() => useUnifiedAuth(), { wrapper })

    expect(result.current.canAccess('dashboard')).toBe(false)
  })

  it('resetPassword calls supabase', async () => {
    const { UnifiedAuthProvider, useUnifiedAuth } = await import('@/contexts/UnifiedAuthContext')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(UnifiedAuthProvider, null, children)

    const { result } = renderHook(() => useUnifiedAuth(), { wrapper })

    await act(async () => {
      await result.current.resetPassword('test@test.com')
    })

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalled()
  })
})
