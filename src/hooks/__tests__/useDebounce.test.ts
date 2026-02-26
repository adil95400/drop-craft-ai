import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce, useThrottle } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } }
    )

    expect(result.current).toBe('hello')

    rerender({ value: 'world', delay: 300 })
    // Before timeout, still old value
    expect(result.current).toBe('hello')

    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('world')
  })

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(200) })
    // Changed again before timeout
    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(200) })
    // Still not resolved
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('c')
  })

  it('handles zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'start' } }
    )

    rerender({ value: 'end' })
    act(() => { vi.advanceTimersByTime(0) })
    expect(result.current).toBe('end')
  })
})

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('hello', 500))
    expect(result.current).toBe('hello')
  })

  it('throttles rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })
    // Should not immediately update if within interval
    act(() => { vi.advanceTimersByTime(100) })

    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(500) })
    // After interval, should have latest value
    expect(['b', 'c']).toContain(result.current)
  })
})
