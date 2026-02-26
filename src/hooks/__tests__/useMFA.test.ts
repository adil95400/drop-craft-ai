import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase
const mockListFactors = vi.fn()
const mockEnroll = vi.fn()
const mockChallengeAndVerify = vi.fn()
const mockUnenroll = vi.fn()
const mockChallenge = vi.fn()
const mockVerify = vi.fn()
const mockGetAAL = vi.fn()

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: mockListFactors,
        enroll: mockEnroll,
        challengeAndVerify: mockChallengeAndVerify,
        unenroll: mockUnenroll,
        challenge: mockChallenge,
        verify: mockVerify,
        getAuthenticatorAssuranceLevel: mockGetAAL,
      }
    }
  }
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}))

import { renderHook, act } from '@testing-library/react'
import { useMFA } from '../useMFA'

describe('useMFA', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with MFA disabled', () => {
    const { result } = renderHook(() => useMFA())
    expect(result.current.isEnabled).toBe(false)
    expect(result.current.factors).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.qrCode).toBeNull()
  })

  it('checkMFAStatus detects verified factors', async () => {
    mockListFactors.mockResolvedValue({
      data: {
        totp: [
          { id: 'f1', factor_type: 'totp', friendly_name: 'My App', status: 'verified' }
        ]
      },
      error: null
    })

    const { result } = renderHook(() => useMFA())
    
    await act(async () => {
      const enabled = await result.current.checkMFAStatus()
      expect(enabled).toBe(true)
    })

    expect(result.current.isEnabled).toBe(true)
    expect(result.current.factors).toHaveLength(1)
  })

  it('checkMFAStatus handles no factors', async () => {
    mockListFactors.mockResolvedValue({
      data: { totp: [] },
      error: null
    })

    const { result } = renderHook(() => useMFA())
    
    await act(async () => {
      const enabled = await result.current.checkMFAStatus()
      expect(enabled).toBe(false)
    })

    expect(result.current.isEnabled).toBe(false)
  })

  it('checkMFAStatus handles errors gracefully', async () => {
    mockListFactors.mockResolvedValue({
      data: null,
      error: new Error('Network error')
    })

    const { result } = renderHook(() => useMFA())
    
    await act(async () => {
      const enabled = await result.current.checkMFAStatus()
      expect(enabled).toBe(false)
    })
  })

  it('enrollMFA returns QR code and secret', async () => {
    mockEnroll.mockResolvedValue({
      data: {
        id: 'factor-123',
        totp: { qr_code: 'data:image/png;base64,...', secret: 'ABCDEF123456' }
      },
      error: null
    })

    const { result } = renderHook(() => useMFA())
    
    let enrollResult: any
    await act(async () => {
      enrollResult = await result.current.enrollMFA('Test App')
    })

    expect(enrollResult).toBeTruthy()
    expect(enrollResult.qrCode).toContain('data:image')
    expect(enrollResult.secret).toBe('ABCDEF123456')
    expect(result.current.qrCode).toContain('data:image')
  })

  it('enrollMFA handles errors', async () => {
    mockEnroll.mockResolvedValue({ data: null, error: new Error('Enroll failed') })

    const { result } = renderHook(() => useMFA())
    
    let enrollResult: any
    await act(async () => {
      enrollResult = await result.current.enrollMFA()
    })

    expect(enrollResult).toBeNull()
  })

  it('createChallenge returns challenge ID', async () => {
    mockChallenge.mockResolvedValue({
      data: { id: 'challenge-123' },
      error: null
    })

    const { result } = renderHook(() => useMFA())
    
    let challengeId: any
    await act(async () => {
      challengeId = await result.current.createChallenge('factor-123')
    })

    expect(challengeId).toBe('challenge-123')
  })
})
