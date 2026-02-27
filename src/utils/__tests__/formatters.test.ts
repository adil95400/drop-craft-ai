import { describe, it, expect } from 'vitest'

// Test formatNumber utility used across widgets
function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function calculateMargin(price?: number, costPrice?: number): number {
  if (!price || !costPrice || price === 0) return 0
  return ((price - costPrice) / price) * 100
}

describe('formatNumber', () => {
  it('should format millions', () => {
    expect(formatNumber(1500000)).toBe('1.5M')
    expect(formatNumber(1000000)).toBe('1.0M')
  })

  it('should format thousands', () => {
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(1000)).toBe('1.0K')
  })

  it('should keep small numbers as-is', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(0)).toBe('0')
  })
})

describe('calculateMargin', () => {
  it('should calculate margin correctly', () => {
    expect(calculateMargin(100, 60)).toBeCloseTo(40)
    expect(calculateMargin(50, 25)).toBeCloseTo(50)
  })

  it('should return 0 for invalid inputs', () => {
    expect(calculateMargin(0, 0)).toBe(0)
    expect(calculateMargin(undefined, 50)).toBe(0)
    expect(calculateMargin(100, undefined)).toBe(0)
  })
})
