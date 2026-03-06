import { describe, it, expect } from 'vitest'

// Test the sanitizeBody function logic independently
function sanitizeBody(body: any): any {
  if (body === null || body === undefined) return body
  if (typeof body === 'string') {
    return body
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript\s*:/gi, '')
  }
  if (Array.isArray(body)) return body.map(sanitizeBody)
  if (typeof body === 'object') {
    const clean: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      clean[k] = sanitizeBody(v)
    }
    return clean
  }
  return body
}

describe('API Client Sanitization', () => {
  it('strips script tags from strings', () => {
    const input = 'Hello <script>alert("xss")</script> World'
    expect(sanitizeBody(input)).toBe('Hello  World')
  })

  it('strips event handlers', () => {
    const input = '<img src="x" onerror="alert(1)" />'
    expect(sanitizeBody(input)).not.toContain('onerror')
  })

  it('strips javascript: protocol', () => {
    const input = 'javascript:alert(1)'
    expect(sanitizeBody(input)).not.toContain('javascript:')
  })

  it('sanitizes nested objects recursively', () => {
    const input = {
      name: 'Safe',
      nested: {
        value: '<script>bad</script>',
        deep: { url: 'javascript:void(0)' },
      },
    }
    const result = sanitizeBody(input)
    expect(result.nested.value).toBe('')
    expect(result.nested.deep.url).not.toContain('javascript:')
  })

  it('sanitizes arrays', () => {
    const input = ['safe', '<script>bad</script>', 'also safe']
    const result = sanitizeBody(input)
    expect(result[0]).toBe('safe')
    expect(result[1]).toBe('')
    expect(result[2]).toBe('also safe')
  })

  it('handles null and undefined', () => {
    expect(sanitizeBody(null)).toBeNull()
    expect(sanitizeBody(undefined)).toBeUndefined()
  })

  it('passes through numbers and booleans', () => {
    expect(sanitizeBody(42)).toBe(42)
    expect(sanitizeBody(true)).toBe(true)
  })

  it('handles complex XSS vectors', () => {
    const input = '<div onmouseover="steal()" onclick="hack()">Content</div>'
    const result = sanitizeBody(input)
    expect(result).not.toContain('onmouseover')
    expect(result).not.toContain('onclick')
    expect(result).toContain('Content')
  })
})
